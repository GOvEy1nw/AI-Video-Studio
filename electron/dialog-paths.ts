import path from 'path'

export function firstUsableDirectory(
  candidates: readonly unknown[],
  isDirectory: (candidate: string) => boolean,
): string | null {
  for (const candidate of candidates) {
    if (typeof candidate !== 'string' || !candidate.trim()) continue
    try {
      if (isDirectory(candidate)) return candidate
    } catch {
      // Ignore unavailable paths and continue to the next fallback.
    }
  }
  return null
}

export function directoryForDialogSelection(
  selectedPath: string,
  selectionType: 'file' | 'directory',
): string {
  return selectionType === 'directory' ? selectedPath : path.dirname(selectedPath)
}
