import { logger } from './logger'

/**
 * Move a generated file into the project's generated/ assets subfolder via IPC.
 * Backend writes to AppData/outputs first; this moves (not copies) into the project folder.
 * Returns the new { path, url } if successful, or null on failure — callers handle fallback.
 */
export async function copyToAssetFolder(
  srcPath: string,
  projectId: string,
): Promise<{ path: string; url: string } | null> {
  if (!srcPath || !projectId || !window.electronAPI) return null
  try {
    const result = await window.electronAPI.copyToProjectAssets(srcPath, projectId)
    if (result.success && result.path && result.url) {
      return { path: result.path, url: result.url }
    }
    if (result.error) {
      logger.warn(`Failed to copy asset to project folder: ${result.error}`)
    }
  } catch (e) {
    logger.warn(`Failed to copy asset to project folder: ${e}`)
  }
  return null
}
