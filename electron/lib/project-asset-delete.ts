import fs from 'fs'
import path from 'path'
import { shell } from 'electron'

function normalizeComparable(filePath: string): string {
  const resolved = path.resolve(filePath)
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved
}

export function isPathUnderProjectAssetsDir(
  filePath: string,
  assetsRoot: string,
  projectId: string,
): boolean {
  const projectDir = normalizeComparable(path.join(assetsRoot, projectId))
  const resolved = normalizeComparable(filePath)
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
      if (!fs.existsSync(rawPath)) {
        skipped.push(rawPath)
        continue
      }
      const stat = fs.statSync(rawPath)
      if (!stat.isFile()) {
        skipped.push(rawPath)
        continue
      }
      await trashFileWithRetry(rawPath)
      deleted.push(rawPath)
    } catch (error) {
      failed.push({ path: rawPath, error: String(error) })
    }
  }

  return { deleted, skipped, failed }
}
