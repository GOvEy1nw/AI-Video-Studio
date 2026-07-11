import { ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { getAllowedRoots } from '../config'
import { logger } from '../logger'
import { getMainWindow } from '../window'
import { validatePath, approvePath } from '../path-validation'
import { getProjectAssetsPath, setProjectAssetsPath } from '../app-state'
import { importProjectAsset, projectAssetCategoryDir, type DuplicateStrategy } from '../lib/project-asset-import'
import { deleteProjectAssetFiles } from '../lib/project-asset-delete'

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
  '.m4a': 'audio/mp4',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.mov': 'video/quicktime',
}

function readLocalFileAsBase64(filePath: string): { data: string; mimeType: string } {
  const data = fs.readFileSync(filePath)
  const base64 = data.toString('base64')
  const ext = path.extname(filePath).toLowerCase()
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream'
  return { data: base64, mimeType }
}

function searchDirectoryForFiles(dir: string, filenames: string[]): Record<string, string> {
  const results: Record<string, string> = {}
  const remaining = new Set(filenames.map(f => f.toLowerCase()))

  const walk = (currentDir: string, depth: number) => {
    if (remaining.size === 0 || depth > 10) return // max depth to avoid infinite loops
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true })
      for (const entry of entries) {
        if (remaining.size === 0) break
        const fullPath = path.join(currentDir, entry.name)
        if (entry.isFile()) {
          const lower = entry.name.toLowerCase()
          if (remaining.has(lower)) {
            results[lower] = fullPath
            remaining.delete(lower)
          }
        } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
          walk(fullPath, depth + 1)
        }
      }
    } catch {
      // Skip directories we can't read (permissions, etc.)
    }
  }

  walk(dir, 0)
  return results
}


export function registerFileHandlers(): void {
  ipcMain.handle('open-parent-folder-of-file', async (_event, filePath: string) => {
    const { shell } = await import('electron')
    const normalizedPath = validatePath(filePath, getAllowedRoots())
    const parentDir = path.dirname(normalizedPath)
    if (!fs.existsSync(parentDir) || !fs.statSync(parentDir).isDirectory()) {
      throw new Error(`Parent directory not found: ${parentDir}`)
    }
    shell.openPath(parentDir)
  })

  ipcMain.handle('show-item-in-folder', async (_event, filePath: string) => {
    const { shell } = await import('electron')
    shell.showItemInFolder(filePath)
  })

  ipcMain.handle('read-local-file', async (_event, filePath: string) => {
    try {
      const normalizedPath = validatePath(filePath, getAllowedRoots())

      if (!fs.existsSync(normalizedPath)) {
        throw new Error(`File not found: ${normalizedPath}`)
      }

      return readLocalFileAsBase64(normalizedPath)
    } catch (error) {
      logger.error( `Error reading local file: ${error}`)
      throw error
    }
  })

  ipcMain.handle('approve-local-path', async (_event, filePath: string) => {
    try {
      approvePath(filePath)
      return true
    } catch (error) {
      logger.error(`Error approving local path: ${error}`)
      return false
    }
  })

  ipcMain.handle('show-save-dialog', async (_event, options: {
    title?: string
    defaultPath?: string
    filters?: { name: string; extensions: string[] }[]
  }) => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return null
    const result = await dialog.showSaveDialog(mainWindow, {
      title: options.title || 'Save File',
      defaultPath: options.defaultPath,
      filters: options.filters || [],
    })
    if (result.canceled || !result.filePath) return null
    approvePath(result.filePath)
    return result.filePath
  })

  ipcMain.handle('save-file', async (_event, filePath: string, data: string, encoding?: string) => {
    try {
      validatePath(filePath, getAllowedRoots())
      if (encoding === 'base64') {
        fs.writeFileSync(filePath, Buffer.from(data, 'base64'))
      } else {
        fs.writeFileSync(filePath, data, 'utf-8')
      }
      return { success: true, path: filePath }
    } catch (error) {
      logger.error( `Error saving file: ${error}`)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('save-binary-file', async (_event, filePath: string, data: ArrayBuffer) => {
    try {
      validatePath(filePath, getAllowedRoots())
      fs.writeFileSync(filePath, Buffer.from(data))
      return { success: true, path: filePath }
    } catch (error) {
      logger.error( `Error saving binary file: ${error}`)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('show-open-directory-dialog', async (_event, options: { title?: string }) => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      title: options.title || 'Select Folder',
      properties: ['openDirectory', 'createDirectory'],
    })
    if (result.canceled || result.filePaths.length === 0) return null
    approvePath(result.filePaths[0])
    return result.filePaths[0]
  })

  ipcMain.handle('search-directory-for-files', async (_event, dir: string, filenames: string[]) => {
    return searchDirectoryForFiles(dir, filenames)
  })

  ipcMain.handle('copy-to-project-assets', async (_event, srcPath: string, projectId: string) => {
    try {
      const resolvedSrc = validatePath(srcPath, getAllowedRoots())
      const assetsRoot = getProjectAssetsPath()
      const destDir = projectAssetCategoryDir(assetsRoot, projectId, 'generated')
      const imported = importProjectAsset(resolvedSrc, destDir, 'overwrite', 'move')
      return {
        success: true,
        path: imported.destPath,
        url: imported.url,
        fileName: imported.fileName,
        alreadyExisted: imported.alreadyExisted,
        reusedExisting: imported.reusedExisting,
        needsDuplicateChoice: imported.needsDuplicateChoice,
      }
    } catch (error) {
      logger.error(`Error copying to project assets: ${error}`)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('import-to-project-assets', async (_event, options: {
    srcPath: string
    projectId: string
    onDuplicate?: DuplicateStrategy
  }) => {
    try {
      const resolvedSrc = validatePath(options.srcPath, getAllowedRoots())
      const assetsRoot = getProjectAssetsPath()
      const destDir = projectAssetCategoryDir(assetsRoot, options.projectId, 'uploads')
      const strategy: DuplicateStrategy = options.onDuplicate ?? 'suffix'
      const imported = importProjectAsset(resolvedSrc, destDir, strategy, 'copy')
      return {
        success: true,
        path: imported.destPath,
        url: imported.url,
        fileName: imported.fileName,
        alreadyExisted: imported.alreadyExisted,
        reusedExisting: imported.reusedExisting,
        needsDuplicateChoice: imported.needsDuplicateChoice,
      }
    } catch (error) {
      logger.error(`Error importing to project assets: ${error}`)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('delete-project-asset-files', async (_event, options: {
    projectId: string
    filePaths: string[]
  }) => {
    try {
      const assetsRoot = getProjectAssetsPath()
      const validatedPaths: string[] = []
      for (const filePath of options.filePaths) {
        try {
          validatedPaths.push(validatePath(filePath, getAllowedRoots()))
        } catch (error) {
          logger.warn(`Skipping delete for disallowed path ${filePath}: ${error}`)
        }
      }
      const result = await deleteProjectAssetFiles(assetsRoot, options.projectId, validatedPaths)
      return {
        success: result.failed.length === 0,
        ...result,
      }
    } catch (error) {
      logger.error(`Error deleting project asset files: ${error}`)
      return {
        success: false,
        deleted: [],
        skipped: [],
        failed: [{ path: '', error: String(error) }],
      }
    }
  })

  ipcMain.handle('get-project-assets-path', async () => {
    return getProjectAssetsPath()
  })

  ipcMain.handle('set-project-assets-path', async (_event, newPath: string) => {
    try {
      setProjectAssetsPath(newPath)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('check-files-exist', async (_event, filePaths: string[]) => {
    const results: Record<string, boolean> = {}
    for (const p of filePaths) {
      try {
        results[p] = fs.existsSync(p)
      } catch {
        results[p] = false
      }
    }
    return results
  })

  ipcMain.handle('show-open-file-dialog', async (_event, options: {
    title?: string
    filters?: { name: string; extensions: string[] }[]
    properties?: string[]
  }) => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return null
    const props: any[] = ['openFile']
    if (options.properties?.includes('multiSelections')) props.push('multiSelections')
    const result = await dialog.showOpenDialog(mainWindow, {
      title: options.title || 'Select File',
      filters: options.filters || [],
      properties: props,
    })
    if (result.canceled || result.filePaths.length === 0) return null
    for (const fp of result.filePaths) {
      approvePath(fp)
    }
    return result.filePaths
  })

}
