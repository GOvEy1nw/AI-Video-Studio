import * as fsPromises from 'fs/promises'
import path from 'path'
import { canonicalizeForContainment } from '../path-validation'

export type DuplicateStrategy = 'reuse' | 'suffix' | 'overwrite' | 'prompt'
export type TransferMode = 'copy' | 'move'

export const PROJECT_ASSET_SUBFOLDERS = {
  uploads: 'uploads',
  generated: 'generated',
} as const

const importOperationsByDirectory = new Map<string, Promise<void>>()
const TRANSIENT_TRANSFER_ERROR_CODES = new Set(['EACCES', 'EBUSY', 'EPERM'])

export type ProjectAssetCategory = keyof typeof PROJECT_ASSET_SUBFOLDERS

function isPathWithin(candidate: string, root: string): boolean {
  const relative = path.relative(root, candidate)
  return relative !== '' && !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative)
}

export function validateProjectId(projectId: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(projectId)) {
    throw new Error('Invalid project ID')
  }
  return projectId
}

export function projectAssetCategoryDir(
  assetsRoot: string,
  projectId: string,
  category: ProjectAssetCategory,
): string {
  const root = canonicalizeForContainment(assetsRoot)
  const safeProjectId = validateProjectId(projectId)
  const projectDir = canonicalizeForContainment(path.join(root, safeProjectId))
  const categoryDir = canonicalizeForContainment(path.join(projectDir, PROJECT_ASSET_SUBFOLDERS[category]))
  if (!isPathWithin(projectDir, root) || !isPathWithin(categoryDir, projectDir)) {
    throw new Error('Project asset destination is outside the project root')
  }
  return categoryDir
}

export type ResolveImportPlan =
  | { action: 'copy'; destPath: string; fileName: string; alreadyExisted: boolean }
  | { action: 'reuse'; destPath: string; fileName: string; alreadyExisted: true }
  | { action: 'needs-choice'; destPath: string; fileName: string; alreadyExisted: true }

export type ImportProjectAssetResult = {
  destPath: string
  url: string
  fileName: string
  alreadyExisted: boolean
  reusedExisting: boolean
  needsDuplicateChoice: boolean
}

export function pathToFileUrl(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/')
  return normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`
}

export function buildSuffixedFileName(fileName: string, suffix: number): string {
  const ext = path.extname(fileName)
  const stem = path.basename(fileName, ext)
  return `${stem} (${suffix})${ext}`
}

export async function findAvailableFileName(destDir: string, fileName: string): Promise<string> {
  let candidate = fileName
  let suffix = 2
  while (await fileExists(path.join(destDir, candidate))) {
    candidate = buildSuffixedFileName(fileName, suffix)
    suffix += 1
  }
  return candidate
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fsPromises.access(filePath)
    return true
  } catch {
    return false
  }
}

export async function resolveImportDestPlan(
  destDir: string,
  srcPath: string,
  fileName: string,
  strategy: DuplicateStrategy,
): Promise<ResolveImportPlan> {
  const initialDestPath = path.join(destDir, fileName)
  const srcResolved = path.resolve(srcPath)
  const initialDestResolved = path.resolve(initialDestPath)

  if (srcResolved === initialDestResolved) {
    return {
      action: 'reuse',
      destPath: initialDestResolved,
      fileName,
      alreadyExisted: true,
    }
  }

  if (!await fileExists(initialDestPath)) {
    return {
      action: 'copy',
      destPath: initialDestPath,
      fileName,
      alreadyExisted: false,
    }
  }

  switch (strategy) {
    case 'reuse':
      return {
        action: 'reuse',
        destPath: initialDestPath,
        fileName,
        alreadyExisted: true,
      }
    case 'overwrite':
      return {
        action: 'copy',
        destPath: initialDestPath,
        fileName,
        alreadyExisted: true,
      }
    case 'suffix': {
      const availableName = await findAvailableFileName(destDir, fileName)
      return {
        action: 'copy',
        destPath: path.join(destDir, availableName),
        fileName: availableName,
        alreadyExisted: false,
      }
    }
    case 'prompt':
      return {
        action: 'needs-choice',
        destPath: initialDestPath,
        fileName,
        alreadyExisted: true,
      }
  }
}

export async function transferFile(
  src: string,
  dest: string,
  mode: TransferMode,
  operations: Pick<typeof fsPromises, 'copyFile' | 'rename' | 'unlink'> = fsPromises,
): Promise<void> {
  const retryTransientTransfer = async (operation: () => Promise<void>): Promise<void> => {
    for (let attempt = 0; ; attempt += 1) {
      try {
        await operation()
        return
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code
        if (attempt >= 2 || !code || !TRANSIENT_TRANSFER_ERROR_CODES.has(code)) throw error
        await new Promise<void>((resolve) => setTimeout(resolve, 25 * (attempt + 1)))
      }
    }
  }

  if (mode === 'copy') {
    await retryTransientTransfer(() => operations.copyFile(src, dest))
    return
  }

  let replacedDestBackup: string | null = null
  if (await fileExists(dest)) {
    const backupName = await findAvailableFileName(
      path.dirname(dest),
      `${path.basename(dest)}.aivs-backup`,
    )
    replacedDestBackup = path.join(path.dirname(dest), backupName)
    await retryTransientTransfer(() => operations.rename(dest, replacedDestBackup!))
  }

  try {
    try {
      await retryTransientTransfer(() => operations.rename(src, dest))
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code !== 'EXDEV') throw error
      await retryTransientTransfer(() => operations.copyFile(src, dest))
      await retryTransientTransfer(() => operations.unlink(src))
    }
  } catch (error) {
    if (replacedDestBackup) {
      if (await fileExists(dest)) {
        await retryTransientTransfer(() => operations.unlink(dest))
      }
      try {
        await retryTransientTransfer(() => operations.rename(replacedDestBackup!, dest))
      } catch (restoreError) {
        try {
          await retryTransientTransfer(() => operations.copyFile(replacedDestBackup!, dest))
        } catch (restoreCopyError) {
          throw new AggregateError(
            [error, restoreError, restoreCopyError],
            `Project asset move failed and the previous file could not be restored; backup preserved at ${replacedDestBackup}`,
          )
        }
      }
    }
    throw error
  }

  if (replacedDestBackup) {
    try {
      await retryTransientTransfer(() => operations.unlink(replacedDestBackup!))
    } catch (error) {
      console.warn(`Project asset move succeeded but backup cleanup failed: ${replacedDestBackup}`, error)
    }
  }
}

export async function importProjectAsset(
  resolvedSrc: string,
  destDir: string,
  strategy: DuplicateStrategy,
  transferMode: TransferMode = 'copy',
): Promise<ImportProjectAssetResult> {
  const resolvedDestDir = canonicalizeForContainment(destDir)
  const resolvedSrcPath = canonicalizeForContainment(resolvedSrc)
  const previous = importOperationsByDirectory.get(resolvedDestDir) ?? Promise.resolve()
  const operation = previous.then(
    () => importProjectAssetIntoDirectory(resolvedSrcPath, resolvedDestDir, strategy, transferMode),
    () => importProjectAssetIntoDirectory(resolvedSrcPath, resolvedDestDir, strategy, transferMode),
  )
  const settled = operation.then(() => undefined, () => undefined)
  importOperationsByDirectory.set(resolvedDestDir, settled)
  void settled.then(() => {
    if (importOperationsByDirectory.get(resolvedDestDir) === settled) {
      importOperationsByDirectory.delete(resolvedDestDir)
    }
  })
  return await operation
}

async function importProjectAssetIntoDirectory(
  resolvedSrcPath: string,
  resolvedDestDir: string,
  strategy: DuplicateStrategy,
  transferMode: TransferMode,
): Promise<ImportProjectAssetResult> {
  await fsPromises.mkdir(resolvedDestDir, { recursive: true })
  const fileName = path.basename(resolvedSrcPath)
  const plan = await resolveImportDestPlan(resolvedDestDir, resolvedSrcPath, fileName, strategy)
  const safeDestPath = canonicalizeForContainment(plan.destPath)
  if (!isPathWithin(safeDestPath, resolvedDestDir)) {
    throw new Error('Project asset destination is outside the project root')
  }
  const safePlan = { ...plan, destPath: safeDestPath }

  if (safePlan.action === 'needs-choice') {
    return { destPath: safePlan.destPath, url: pathToFileUrl(safePlan.destPath), fileName: safePlan.fileName, alreadyExisted: true, reusedExisting: false, needsDuplicateChoice: true }
  }
  if (safePlan.action === 'reuse') {
    return { destPath: safePlan.destPath, url: pathToFileUrl(safePlan.destPath), fileName: safePlan.fileName, alreadyExisted: true, reusedExisting: true, needsDuplicateChoice: false }
  }

  await transferFile(resolvedSrcPath, safePlan.destPath, transferMode)
  return { destPath: safePlan.destPath, url: pathToFileUrl(safePlan.destPath), fileName: safePlan.fileName, alreadyExisted: safePlan.alreadyExisted, reusedExisting: false, needsDuplicateChoice: false }
}
