export function getNativeFilePath(file: File): string | null {
  const bridged = window.electronAPI?.getPathForFile?.(file)
  if (bridged?.trim()) return bridged

  // Electron 31 compatibility only. Remove after the Electron 43 runtime bump.
  const legacy = (file as File & { path?: string }).path
  return legacy?.trim() ? legacy : null
}
