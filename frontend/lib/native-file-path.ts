export function getNativeFilePath(file: File): string | null {
  const filePath = window.electronAPI?.getPathForFile(file)
  return filePath?.trim() ? filePath : null
}
