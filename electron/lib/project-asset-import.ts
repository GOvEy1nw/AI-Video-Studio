import fs from 'fs'
import path from 'path'
import { canonicalizeForContainment } from '../path-validation'

export type DuplicateStrategy = 'reuse' | 'suffix' | 'overwrite' | 'prompt'
export type TransferMode = 'copy' | 'move'

export const PROJECT_ASSET_SUBFOLDERS = {
  uploads: 'uploads',
  generated: 'generated',
} as const

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

export function findAvailableFileName(destDir: string, fileName: string): string {
  let candidate = fileName
  let suffix = 2
  while (fs.existsSync(path.join(destDir, candidate))) {
    candidate = buildSuffixedFileName(fileName, suffix)
    suffix += 1
  }
  return candidate
}

export function resolveImportDestPlan(
  destDir: string,
  srcPath: string,
  fileName: string,
  strategy: DuplicateStrategy,
): ResolveImportPlan {
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

  if (!fs.existsSync(initialDestPath)) {
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
      const availableName = findAvailableFileName(destDir, fileName)
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

function transferFile(src: string, dest: string, mode: TransferMode): void {
  if (mode === 'copy') {
    fs.copyFileSync(src, dest)
    return
  }

  if (fs.existsSync(dest)) {
    fs.unlinkSync(dest)
  }

  try {
    fs.renameSync(src, dest)
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === 'EXDEV') {
      fs.copyFileSync(src, dest)
      fs.unlinkSync(src)
      return
    }
    throw error
  }
}

export function importProjectAsset(
  resolvedSrc: string,
  destDir: string,
  strategy: DuplicateStrategy,
  transferMode: TransferMode = 'copy',
): ImportProjectAssetResult {
  const resolvedDestDir = canonicalizeForContainment(destDir)
  const resolvedSrcPath = canonicalizeForContainment(resolvedSrc)
  fs.mkdirSync(resolvedDestDir, { recursive: true })
  const fileName = path.basename(resolvedSrcPath)
  const plan = resolveImportDestPlan(resolvedDestDir, resolvedSrcPath, fileName, strategy)
  const safeDestPath = canonicalizeForContainment(plan.destPath)
  if (!isPathWithin(safeDestPath, resolvedDestDir)) {
    throw new Error('Project asset destination is outside the project root')
  }
  const safePlan = { ...plan, destPath: safeDestPath }

  if (safePlan.action === 'needs-choice') {
    return {
      destPath: safePlan.destPath,
      url: pathToFileUrl(safePlan.destPath),
      fileName: safePlan.fileName,
      alreadyExisted: true,
      reusedExisting: false,
      needsDuplicateChoice: true,
    }
  }

  if (safePlan.action === 'reuse') {
    return {
      destPath: safePlan.destPath,
      url: pathToFileUrl(safePlan.destPath),
      fileName: safePlan.fileName,
      alreadyExisted: true,
      reusedExisting: true,
      needsDuplicateChoice: false,
    }
  }

  transferFile(resolvedSrc, safePlan.destPath, transferMode)
  return {
    destPath: safePlan.destPath,
    url: pathToFileUrl(safePlan.destPath),
    fileName: safePlan.fileName,
    alreadyExisted: safePlan.alreadyExisted,
    reusedExisting: false,
    needsDuplicateChoice: false,
  }
}
