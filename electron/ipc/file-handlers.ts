import { app, ipcMain, dialog, type OpenDialogOptions } from 'electron'
import path from 'path'
import fs from 'fs'
import * as fsPromises from 'fs/promises'
import os from 'os'
import { randomUUID } from 'crypto'
import { getAllowedRoots } from '../config'
import { logger } from '../logger'
import { getMainWindow } from '../window'
import { approveDirectorySubtree, approveExactFilePath, approveExactWritePath, canonicalizeForContainment, canonicalizePath, filterMatchingCanonicalPaths, loadApprovedExactFilePaths, validateExactWritePath, validatePath } from '../path-validation'
import {
  getLastDirectoryPickerPath,
  getLastOpenDirectory,
  getLastSaveDirectory,
  getApprovedExternalFilePaths,
  getProjectAssetsPath,
  getProjectAssetsPathStatus,
  addApprovedExternalFilePath,
  setLastDirectoryPickerPath,
  setLastOpenDirectory,
  setLastSaveDirectory,
  setProjectAssetsPath,
} from '../app-state'
import {
  directoryForDialogSelection,
  firstUsableDirectory,
  resolveSaveDialogDefaultPath,
} from '../dialog-paths'
import { importProjectAsset, projectAssetCategoryDir, type DuplicateStrategy } from '../lib/project-asset-import'
import { deleteProjectAssetFiles } from '../lib/project-asset-delete'
import { searchDirectoryForFiles } from '../lib/directory-search'

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

async function readLocalFileBytes(filePath: string): Promise<{ bytes: Uint8Array; mimeType: string }> {
  const data = await fsPromises.readFile(filePath)
  const ext = path.extname(filePath).toLowerCase()
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream'
  return { bytes: new Uint8Array(data.buffer, data.byteOffset, data.byteLength), mimeType }
}

function getDialogFallbackDirectory(): string {
  return firstUsableDirectory(
    [
      getProjectAssetsPath(),
      app.getPath('documents'),
      app.getPath('downloads'),
      app.getPath('home'),
    ],
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isDirectory(),
  ) ?? app.getPath('home')
}

function canonicalExistingFile(filePath: string): string {
  const resolved = canonicalizePath(filePath)
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    throw new Error('Selected file is unavailable')
  }
  return canonicalizeForContainment(resolved)
}

function canonicalExistingDirectory(directory: string, rejectFilesystemRoot = false): string {
  const resolved = canonicalizePath(directory)
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    throw new Error('Selected directory is unavailable')
  }
  const canonical = fs.realpathSync.native(resolved)
  if (rejectFilesystemRoot && path.parse(canonical).root === canonical) throw new Error('Filesystem root cannot be used for project assets')
  return canonical
}

export function registerFileHandlers(): void {
  loadApprovedExactFilePaths(getApprovedExternalFilePaths())
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
    shell.showItemInFolder(validatePath(filePath, getAllowedRoots()))
  })

  ipcMain.handle('read-local-file-bytes', async (_event, filePath: string) => {
    try {
      const normalizedPath = validatePath(filePath, getAllowedRoots())

      return await readLocalFileBytes(normalizedPath)
    } catch (error) {
      logger.error( `Error reading local file: ${error}`)
      throw error
    }
  })

  ipcMain.handle('approve-file-from-renderer', async (_event, filePath: string) => {
    try {
      const approved = canonicalExistingFile(filePath)
      approveExactFilePath(approved)
      addApprovedExternalFilePath(approved)
      return true
    } catch (error) {
      logger.error(`Error approving local path: ${error}`)
      return false
    }
  })

  ipcMain.handle('approve-persisted-project-files', async (_event, candidates: string[]) => {
    const approved: string[] = []
    const rejected: string[] = []
    for (const candidate of [...new Set(candidates)]) {
      try {
        validatePath(candidate, getAllowedRoots())
        approved.push(candidate)
      } catch {
        rejected.push(candidate)
      }
    }
    return { approved, rejected }
  })

  ipcMain.handle('show-save-dialog', async (_event, options: {
    title?: string
    defaultPath?: string
    filters?: { name: string; extensions: string[] }[]
  }) => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return null
    const defaultPath = resolveSaveDialogDefaultPath(
      options.defaultPath,
      getLastSaveDirectory(),
      getDialogFallbackDirectory(),
    )
    const result = await dialog.showSaveDialog(mainWindow, {
      title: options.title || 'Save File',
      defaultPath,
      filters: options.filters || [],
    })
    if (result.canceled || !result.filePath) return null
    const approvedPath = approveExactWritePath(result.filePath)
    setLastSaveDirectory(directoryForDialogSelection(result.filePath, 'file'))
    return approvedPath
  })

  ipcMain.handle('save-file', async (_event, filePath: string, data: string, encoding?: string) => {
    try {
      const normalizedPath = validateExactWritePath(filePath)
      if (encoding === 'base64') {
        await fsPromises.writeFile(normalizedPath, Buffer.from(data, 'base64'))
      } else {
        await fsPromises.writeFile(normalizedPath, data, 'utf-8')
      }
      return { success: true, path: normalizedPath }
    } catch (error) {
      logger.error( `Error saving file: ${error}`)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('save-binary-file', async (_event, filePath: string, data: ArrayBuffer) => {
    try {
      const normalizedPath = validateExactWritePath(filePath)
      await fsPromises.writeFile(normalizedPath, Buffer.from(data))
      return { success: true, path: normalizedPath }
    } catch (error) {
      logger.error( `Error saving binary file: ${error}`)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('show-open-directory-dialog', async (_event, options: {
    title?: string
    defaultPath?: string
  }) => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return null
    const defaultPath =
      options.defaultPath ||
      getLastDirectoryPickerPath() ||
      getDialogFallbackDirectory()
    const result = await dialog.showOpenDialog(mainWindow, {
      title: options.title || 'Select Folder',
      defaultPath,
      properties: ['openDirectory', 'createDirectory'],
    })
    if (result.canceled || result.filePaths.length === 0) return null
    approveDirectorySubtree(canonicalExistingDirectory(result.filePaths[0]))
    setLastDirectoryPickerPath(
      directoryForDialogSelection(result.filePaths[0], 'directory'),
    )
    return canonicalExistingDirectory(result.filePaths[0])
  })

  ipcMain.handle('search-directory-for-files', async (_event, dir: string, filenames: string[]) => {
    return await searchDirectoryForFiles(validatePath(dir, getAllowedRoots()), filenames)
  })

  ipcMain.handle('recover-persisted-project-files', async (_event, candidates: string[]) => {
    const rootStatus = getProjectAssetsPathStatus()
    const legacyRoot = rootStatus.needsReselection && rootStatus.legacyPath ? path.resolve(rootStatus.legacyPath) : null
    const pending = [...new Set(candidates)].filter((candidate) => {
      if (legacyRoot) {
        const relative = path.relative(legacyRoot, path.resolve(candidate))
        if (relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))) return false
      }
      try {
        validatePath(candidate, getAllowedRoots())
        return false
      } catch {
        return true
      }
    })
    if (pending.length === 0) return { status: 'no-pending' as const, approved: [] }
    const mainWindow = getMainWindow()
    if (!mainWindow) return { status: 'cancelled' as const, approved: [] }
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Reconnect project media files',
      properties: ['openFile', 'multiSelections'],
    })
    if (result.canceled) return { status: 'cancelled' as const, approved: [] }
    const approved: string[] = []
    for (const selected of filterMatchingCanonicalPaths(pending, result.filePaths.map(canonicalExistingFile))) {
      approveExactFilePath(selected)
      addApprovedExternalFilePath(selected)
      approved.push(selected)
    }
    return { status: approved.length > 0 ? 'approved' as const : 'cancelled' as const, approved }
  })

  ipcMain.handle('save-temporary-file', async (_event, data: string, extension: string, encoding?: 'base64' | 'utf8') => {
    const safeExtension = /^\.[a-zA-Z0-9]+$/.test(extension) ? extension : '.bin'
    const temporaryPath = path.join(os.tmpdir(), `aivs-${randomUUID()}${safeExtension}`)
    const normalizedPath = canonicalizeForContainment(temporaryPath)
    await fsPromises.writeFile(normalizedPath, encoding === 'base64' ? Buffer.from(data, 'base64') : data, encoding === 'base64' ? undefined : 'utf8')
    approveExactFilePath(normalizedPath)
    return normalizedPath
  })

  ipcMain.handle('copy-to-project-assets', async (_event, srcPath: string, projectId: string) => {
    try {
      const resolvedSrc = validatePath(srcPath, getAllowedRoots())
      const assetsRoot = getProjectAssetsPath()
      const destDir = projectAssetCategoryDir(assetsRoot, projectId, 'generated')
      const imported = await importProjectAsset(resolvedSrc, destDir, 'overwrite', 'move')
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
      const imported = await importProjectAsset(resolvedSrc, destDir, strategy, 'copy')
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

  ipcMain.handle('get-project-assets-path-status', async () => {
    return getProjectAssetsPathStatus()
  })

  ipcMain.handle('choose-project-assets-path', async () => {
    try {
      const mainWindow = getMainWindow()
      if (!mainWindow) return { success: false, error: 'Main window unavailable' }
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Choose AiVS projects folder',
        defaultPath: getProjectAssetsPath(),
        properties: ['openDirectory', 'createDirectory'],
      })
      if (result.canceled || result.filePaths.length === 0) return { success: true, cancelled: true }
      const selectedPath = canonicalExistingDirectory(result.filePaths[0], true)
      setProjectAssetsPath(selectedPath)
      return { success: true, path: selectedPath }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('check-files-exist', async (_event, filePaths: string[]) => {
    const results: Record<string, boolean> = {}
    for (const p of filePaths) {
      try {
        await fsPromises.access(validatePath(p, getAllowedRoots()))
        results[p] = true
      } catch {
        results[p] = false
      }
    }
    return results
  })

  ipcMain.handle('show-open-file-dialog', async (_event, options: {
    title?: string
    defaultPath?: string
    filters?: { name: string; extensions: string[] }[]
    properties?: string[]
  }) => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return null
    const props: NonNullable<OpenDialogOptions['properties']> = ['openFile']
    if (options.properties?.includes('multiSelections')) props.push('multiSelections')
    const defaultPath =
      options.defaultPath || getLastOpenDirectory() || getDialogFallbackDirectory()
    const result = await dialog.showOpenDialog(mainWindow, {
      title: options.title || 'Select File',
      defaultPath,
      filters: options.filters || [],
      properties: props,
    })
    if (result.canceled || result.filePaths.length === 0) return null
    for (const fp of result.filePaths) {
      const approved = canonicalExistingFile(fp)
      approveExactFilePath(approved)
      addApprovedExternalFilePath(approved)
    }
    setLastOpenDirectory(
      directoryForDialogSelection(result.filePaths[0], 'file'),
    )
    return result.filePaths.map(canonicalExistingFile)
  })

}
