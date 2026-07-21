// Using require for Electron preload compatibility
const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Get the backend URL and auth token
  getBackend: (): Promise<{ url: string; token: string }> => ipcRenderer.invoke('get-backend'),
  
  // Get the path where models are stored
  getModelsPath: (): Promise<string> => ipcRenderer.invoke('get-models-path'),
  
  // Read a local file and return as base64
  readLocalFile: (filePath: string): Promise<{ data: string; mimeType: string }> => 
    ipcRenderer.invoke('read-local-file', filePath),
  approveLocalPath: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke('approve-local-path', filePath),
  
  // Check GPU availability
  checkGpu: (): Promise<{ available: boolean; name?: string; vram?: number }> =>
    ipcRenderer.invoke('check-gpu'),
  
  // Get app info
  getAppInfo: (): Promise<{ version: string; isPackaged: boolean; modelsPath: string; userDataPath: string }> =>
    ipcRenderer.invoke('get-app-info'),
  
  // First-run setup
  checkFirstRun: (): Promise<{ needsSetup: boolean; needsLicense: boolean }> => ipcRenderer.invoke('check-first-run'),
  acceptLicense: (): Promise<boolean> => ipcRenderer.invoke('accept-license'),
  completeSetup: (): Promise<boolean> => ipcRenderer.invoke('complete-setup'),
  fetchLicenseText: (): Promise<string> => ipcRenderer.invoke('fetch-license-text'),
  getNoticesText: (): Promise<string> => ipcRenderer.invoke('get-notices-text'),
  
  // Open specific app pages / folders
  openParentFolderOfFile: (filePath: string): Promise<void> => ipcRenderer.invoke('open-parent-folder-of-file', filePath),
  
  // Reveal a specific file in the OS file manager (Explorer/Finder)
  showItemInFolder: (filePath: string): Promise<void> => ipcRenderer.invoke('show-item-in-folder', filePath),
  
  // Log viewer
  getLogs: (): Promise<LogsResponse> => ipcRenderer.invoke('get-logs'),
  getLogPath: (): Promise<{ logPath: string; logDir: string }> => ipcRenderer.invoke('get-log-path'),
  openLogFolder: (): Promise<boolean> => ipcRenderer.invoke('open-log-folder'),
  
  // Get resources path (for video assets in production)
  getResourcePath: (): Promise<string | null> => ipcRenderer.invoke('get-resource-path'),
  
  // Paths
  getDownloadsPath: (): Promise<string> => ipcRenderer.invoke('get-downloads-path'),
  // Project assets
  copyToProjectAssets: (srcPath: string, projectId: string): Promise<{ success: boolean; path?: string; url?: string; error?: string }> =>
    ipcRenderer.invoke('copy-to-project-assets', srcPath, projectId),
  importToProjectAssets: (options: {
    srcPath: string
    projectId: string
    onDuplicate?: 'reuse' | 'suffix' | 'overwrite' | 'prompt'
  }): Promise<{
    success: boolean
    path?: string
    url?: string
    fileName?: string
    alreadyExisted?: boolean
    reusedExisting?: boolean
    needsDuplicateChoice?: boolean
    error?: string
  }> => ipcRenderer.invoke('import-to-project-assets', options),
  getProjectAssetsPath: (): Promise<string> =>
    ipcRenderer.invoke('get-project-assets-path'),
  setProjectAssetsPath: (newPath: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('set-project-assets-path', newPath),
  deleteProjectAssetFiles: (options: {
    projectId: string
    filePaths: string[]
  }): Promise<{
    success: boolean
    deleted: string[]
    skipped: string[]
    failed: { path: string; error: string }[]
  }> => ipcRenderer.invoke('delete-project-asset-files', options),
  loadProjects: (): Promise<unknown[]> => ipcRenderer.invoke('projects-load'),
  saveProject: (project: unknown, position?: number): Promise<void> =>
    ipcRenderer.invoke('projects-save', project, position),
  deleteProject: (id: string): Promise<void> => ipcRenderer.invoke('projects-delete', id),
  migrateProjectsFromLocalStorage: (projects: unknown[]): Promise<unknown[]> =>
    ipcRenderer.invoke('projects-migrate-local-storage', projects),

  // File save/export
  showSaveDialog: (options: { title?: string; defaultPath?: string; filters?: { name: string; extensions: string[] }[] }): Promise<string | null> =>
    ipcRenderer.invoke('show-save-dialog', options),
  saveFile: (filePath: string, data: string, encoding?: string): Promise<{ success: boolean; path?: string; error?: string }> =>
    ipcRenderer.invoke('save-file', filePath, data, encoding),
  saveBinaryFile: (filePath: string, data: ArrayBuffer): Promise<{ success: boolean; path?: string; error?: string }> =>
    ipcRenderer.invoke('save-binary-file', filePath, data),
  showOpenDirectoryDialog: (options: { title?: string }): Promise<string | null> =>
    ipcRenderer.invoke('show-open-directory-dialog', options),
  searchDirectoryForFiles: (dir: string, filenames: string[]): Promise<Record<string, string>> =>
    ipcRenderer.invoke('search-directory-for-files', dir, filenames),
  // Check multiple files at once
  checkFilesExist: (filePaths: string[]): Promise<Record<string, boolean>> =>
    ipcRenderer.invoke('check-files-exist', filePaths),
  
  // Show open file dialog
  showOpenFileDialog: (options: { title?: string; filters?: { name: string; extensions: string[] }[]; properties?: string[] }): Promise<string[] | null> =>
    ipcRenderer.invoke('show-open-file-dialog', options),
  
  // Video export via ffmpeg (native compositing — no canvas, no frame-by-frame)
  exportNative: (data: {
    clips: { url: string; type: string; startTime: number; duration: number; trimStart: number; speed: number; reversed: boolean; flipH: boolean; flipV: boolean; opacity: number; trackIndex: number; muted: boolean; volume: number }[];
    outputPath: string; codec: string; width: number; height: number; fps: number; quality: number;
    letterbox?: { ratio: number; color: string; opacity: number };
    subtitles?: { text: string; startTime: number; endTime: number; style: { fontSize: number; fontFamily: string; fontWeight: string; color: string; backgroundColor: string; position: string; italic: boolean } }[];
  }): Promise<{ success?: boolean; error?: string }> =>
    ipcRenderer.invoke('export-native', data),
  exportCancel: (sessionId: string): Promise<{ ok?: boolean }> =>
    ipcRenderer.invoke('export-cancel', sessionId),

  // Python setup (Windows first-launch download)
  checkPythonReady: (): Promise<{ ready: boolean }> => ipcRenderer.invoke('check-python-ready'),
  startPythonSetup: (): Promise<void> => ipcRenderer.invoke('start-python-setup'),
  getModelPacks: (): Promise<unknown[]> => ipcRenderer.invoke('get-model-packs'),
  refreshModelPacks: (): Promise<unknown[]> => ipcRenderer.invoke('refresh-model-packs'),
  getModelPackProgress: (): Promise<unknown | null> => ipcRenderer.invoke('get-model-pack-progress'),
  getCheckpointsLocation: (): Promise<{ path: string; custom: boolean; defaultPath: string }> => ipcRenderer.invoke('get-checkpoints-location'),
  setCheckpointsLocation: (value: string | null): Promise<{ path: string; custom: boolean; defaultPath: string }> => ipcRenderer.invoke('set-checkpoints-location', value),
  getLorasLocation: (): Promise<{ path: string; custom: boolean; defaultPath: string }> => ipcRenderer.invoke('get-loras-location'),
  setLorasLocation: (value: string | null): Promise<{ path: string; custom: boolean; defaultPath: string }> => ipcRenderer.invoke('set-loras-location', value),
  openWanGP: (): Promise<void> => ipcRenderer.invoke('open-wangp'),
  downloadModelPacks: (ids: string[]): Promise<boolean> => ipcRenderer.invoke('download-model-packs', ids),
  cancelModelPackDownload: (): Promise<void> => ipcRenderer.invoke('cancel-model-pack-download'),
  deleteModelPack: (id: string): Promise<void> => ipcRenderer.invoke('delete-model-pack', id),
  startPythonBackend: (): Promise<void> => ipcRenderer.invoke('start-python-backend'),
  restartPythonBackend: (): Promise<void> => ipcRenderer.invoke('restart-python-backend'),
  getBackendHealthStatus: (): Promise<BackendHealthStatus | null> => ipcRenderer.invoke('get-backend-health-status'),
  onPythonSetupProgress: (cb: (data: unknown) => void) => {
    ipcRenderer.on('python-setup-progress', (_: unknown, data: unknown) => cb(data))
  },
  removePythonSetupProgress: () => {
    ipcRenderer.removeAllListeners('python-setup-progress')
  },
  onModelPackProgress: (cb: (data: unknown) => void) => {
    ipcRenderer.on('model-pack-progress', (_: unknown, data: unknown) => cb(data))
  },
  removeModelPackProgress: () => {
    ipcRenderer.removeAllListeners('model-pack-progress')
  },
  onBackendHealthStatus: (cb: (data: BackendHealthStatus) => void) => {
    const listener = (_: unknown, data: BackendHealthStatus) => cb(data)
    ipcRenderer.on('backend-health-status', listener)
    return () => {
      ipcRenderer.removeListener('backend-health-status', listener)
    }
  },

  // Extract a single video frame via ffmpeg (returns file path + file:// URL)
  extractVideoFrame: (videoUrl: string, seekTime: number, width?: number, quality?: number): Promise<{ path: string; url: string }> =>
    ipcRenderer.invoke('extract-video-frame', videoUrl, seekTime, width, quality),

  // Write a log line to the session log file
  writeLog: (level: string, message: string): Promise<void> =>
    ipcRenderer.invoke('write-log', level, message),

  // Platform info
  platform: process.platform,
})

interface LogsResponse {
  logPath: string
  lines: string[]
  error?: string
}

interface BackendHealthStatus {
  status: 'alive' | 'restarting' | 'dead'
  exitCode?: number | null
}

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      getBackend: () => Promise<{ url: string; token: string }>
      getModelsPath: () => Promise<string>
      readLocalFile: (filePath: string) => Promise<{ data: string; mimeType: string }>
      approveLocalPath: (filePath: string) => Promise<boolean>
      checkGpu: () => Promise<{ available: boolean; name?: string; vram?: number }>
      getAppInfo: () => Promise<{ version: string; isPackaged: boolean; modelsPath: string; userDataPath: string }>
      checkFirstRun: () => Promise<{ needsSetup: boolean; needsLicense: boolean }>
      acceptLicense: () => Promise<boolean>
      completeSetup: () => Promise<boolean>
      fetchLicenseText: () => Promise<string>
      getNoticesText: () => Promise<string>
      openParentFolderOfFile: (filePath: string) => Promise<void>
      showItemInFolder: (filePath: string) => Promise<void>
      getLogs: () => Promise<LogsResponse>
      getLogPath: () => Promise<{ logPath: string; logDir: string }>
      openLogFolder: () => Promise<boolean>
      getResourcePath: () => Promise<string | null>
      getDownloadsPath: () => Promise<string>
      copyToProjectAssets: (srcPath: string, projectId: string) => Promise<{ success: boolean; path?: string; url?: string; error?: string }>
      importToProjectAssets: (options: {
        srcPath: string
        projectId: string
        onDuplicate?: 'reuse' | 'suffix' | 'overwrite' | 'prompt'
      }) => Promise<{
        success: boolean
        path?: string
        url?: string
        fileName?: string
        alreadyExisted?: boolean
        reusedExisting?: boolean
        needsDuplicateChoice?: boolean
        error?: string
      }>
      getProjectAssetsPath: () => Promise<string>
      setProjectAssetsPath: (newPath: string) => Promise<{ success: boolean; error?: string }>
      deleteProjectAssetFiles: (options: {
        projectId: string
        filePaths: string[]
      }) => Promise<{
        success: boolean
        deleted: string[]
        skipped: string[]
        failed: { path: string; error: string }[]
      }>
      loadProjects: () => Promise<unknown[]>
      saveProject: (project: unknown, position?: number) => Promise<void>
      deleteProject: (id: string) => Promise<void>
      migrateProjectsFromLocalStorage: (projects: unknown[]) => Promise<unknown[]>
      showSaveDialog: (options: { title?: string; defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) => Promise<string | null>
      saveFile: (filePath: string, data: string, encoding?: string) => Promise<{ success: boolean; path?: string; error?: string }>
      saveBinaryFile: (filePath: string, data: ArrayBuffer) => Promise<{ success: boolean; path?: string; error?: string }>
      showOpenDirectoryDialog: (options: { title?: string }) => Promise<string | null>
      searchDirectoryForFiles: (dir: string, filenames: string[]) => Promise<Record<string, string>>
      checkFilesExist: (filePaths: string[]) => Promise<Record<string, boolean>>
      showOpenFileDialog: (options: { title?: string; filters?: { name: string; extensions: string[] }[]; properties?: string[] }) => Promise<string[] | null>
      exportNative: (data: {
        clips: { url: string; type: string; startTime: number; duration: number; trimStart: number; speed: number; reversed: boolean; flipH: boolean; flipV: boolean; opacity: number; trackIndex: number; muted: boolean; volume: number }[];
        outputPath: string; codec: string; width: number; height: number; fps: number; quality: number;
        letterbox?: { ratio: number; color: string; opacity: number };
        subtitles?: { text: string; startTime: number; endTime: number; style: { fontSize: number; fontFamily: string; fontWeight: string; color: string; backgroundColor: string; position: string; italic: boolean } }[];
      }) => Promise<{ success?: boolean; error?: string }>
      exportCancel: (sessionId: string) => Promise<{ ok?: boolean }>
      checkPythonReady: () => Promise<{ ready: boolean }>
      startPythonSetup: () => Promise<void>
      getModelPacks: () => Promise<unknown[]>
      refreshModelPacks: () => Promise<unknown[]>
      getModelPackProgress: () => Promise<unknown | null>
      getCheckpointsLocation: () => Promise<{ path: string; custom: boolean; defaultPath: string }>
      setCheckpointsLocation: (value: string | null) => Promise<{ path: string; custom: boolean; defaultPath: string }>
      getLorasLocation: () => Promise<{ path: string; custom: boolean; defaultPath: string }>
      setLorasLocation: (value: string | null) => Promise<{ path: string; custom: boolean; defaultPath: string }>
      openWanGP: () => Promise<void>
      downloadModelPacks: (ids: string[]) => Promise<boolean>
      cancelModelPackDownload: () => Promise<void>
      deleteModelPack: (id: string) => Promise<void>
      startPythonBackend: () => Promise<void>
      restartPythonBackend: () => Promise<void>
      getBackendHealthStatus: () => Promise<BackendHealthStatus | null>
      onPythonSetupProgress: (cb: (data: unknown) => void) => void
      removePythonSetupProgress: () => void
      onModelPackProgress: (cb: (data: unknown) => void) => void
      removeModelPackProgress: () => void
      onBackendHealthStatus: (cb: (data: BackendHealthStatus) => void) => (() => void)
      extractVideoFrame: (videoUrl: string, seekTime: number, width?: number, quality?: number) => Promise<{ path: string; url: string }>
      writeLog: (level: string, message: string) => Promise<void>
      platform: string
    }
  }
}

export {}
