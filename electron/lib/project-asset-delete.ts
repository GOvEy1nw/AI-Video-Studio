import * as fs from 'fs/promises'
import path from 'path'
import { shell } from 'electron'
import { projectAssetCategoryDir, validateProjectId } from './project-asset-import'
import { canonicalizeForContainment } from '../path-validation'

function normalizeComparable(filePath: string): string {
  const resolved = path.resolve(filePath)
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved
}

export function isPathUnderProjectAssetsDir(
  filePath: string,
  assetsRoot: string,
  projectId: string,
): boolean {
  validateProjectId(projectId)
  const projectDir = normalizeComparable(path.dirname(projectAssetCategoryDir(assetsRoot, projectId, 'uploads')))
  const resolved = normalizeComparable(canonicalizeForContainment(filePath))
  return resolved === projectDir || resolved.startsWith(`${projectDir}${path.sep}`)
}

export type DeleteProjectAssetFilesResult = {
  deleted: string[]
  skipped: string[]
  failed: { path: string; error: string }[]
}

async function trashFileWithRetry(filePath: string, maxAttempts = 5): Promise<void> {
  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      await shell.trashItem(filePath)
      return
    } catch (error) {
      lastError = error
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => {
          setTimeout(resolve, 100 * (attempt + 1))
        })
      }
    }
  }
  throw lastError
}

export async function deleteProjectAssetFiles(
  assetsRoot: string,
  projectId: string,
  filePaths: string[],
): Promise<DeleteProjectAssetFilesResult> {
  const deleted: string[] = []
  const skipped: string[] = []
  const failed: { path: string; error: string }[] = []
  const seen = new Set<string>()

  for (const rawPath of filePaths) {
    if (!rawPath || seen.has(rawPath)) continue
    seen.add(rawPath)

    if (!isPathUnderProjectAssetsDir(rawPath, assetsRoot, projectId)) {
      skipped.push(rawPath)
      continue
    }

    try {
      const stat = await fs.stat(rawPath)
      if (!stat.isFile()) {
        skipped.push(rawPath)
        continue
      }
      await trashFileWithRetry(rawPath)
      deleted.push(rawPath)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        skipped.push(rawPath)
        continue
      }
      failed.push({ path: rawPath, error: String(error) })
    }
  }

  return { deleted, skipped, failed }
}
