import type { Asset } from '../types/project'
import { fileUrlToPath } from './url-to-path'
import { logger } from './logger'

function normalizeAssetPath(filePath: string): string | null {
  if (!filePath) return null
  if (filePath.startsWith('file://')) {
    return fileUrlToPath(filePath)
  }
  return filePath
}

export function collectAssetFilePaths(asset: Asset): string[] {
  const paths = new Set<string>()

  const addPath = (value?: string) => {
    const normalized = value ? normalizeAssetPath(value) : null
    if (normalized) paths.add(normalized)
  }

  addPath(asset.path)
  addPath(asset.thumbnail)
  const urlPath = fileUrlToPath(asset.url)
  if (urlPath) paths.add(urlPath)

  asset.takes?.forEach((take) => {
    addPath(take.path)
    addPath(take.thumbnail)
    const takeUrlPath = fileUrlToPath(take.url)
    if (takeUrlPath) paths.add(takeUrlPath)
  })

  return [...paths]
}

/** Let React unmount <video>/<audio> elements so OS file handles are released. */
export function waitForMediaFileHandlesReleased(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(resolve, 100)
      })
    })
  })
}

export async function deleteProjectAssetFilesFromDisk(
  projectId: string,
  filePaths: string[],
): Promise<boolean> {
  if (!projectId || filePaths.length === 0 || !window.electronAPI?.deleteProjectAssetFiles) {
    return false
  }

  try {
    const result = await window.electronAPI.deleteProjectAssetFiles({
      projectId,
      filePaths,
    })
    if (result.failed?.length) {
      logger.warn(
        `Failed to move ${result.failed.length} project asset file(s) to recycle bin: ${result.failed.map((entry) => entry.path).join(', ')}`,
      )
    }
    return result.success
  } catch (error) {
    logger.warn(`Failed to delete project asset files: ${error}`)
    return false
  }
}
