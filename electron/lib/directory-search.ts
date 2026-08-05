import * as fs from 'fs/promises'
import path from 'path'

export async function searchDirectoryForFiles(
  directory: string,
  filenames: string[],
): Promise<Record<string, string>> {
  const results: Record<string, string> = {}
  const remaining = new Set(filenames.map((filename) => filename.toLowerCase()))

  const walk = async (currentDirectory: string, depth: number): Promise<void> => {
    if (remaining.size === 0 || depth > 10) return
    try {
      const entries = await fs.readdir(currentDirectory, { withFileTypes: true })
      for (const entry of entries) {
        if (remaining.size === 0) break
        const fullPath = path.join(currentDirectory, entry.name)
        if (entry.isFile()) {
          const lower = entry.name.toLowerCase()
          if (remaining.has(lower)) {
            results[lower] = fullPath
            remaining.delete(lower)
          }
        } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
          await walk(fullPath, depth + 1)
        }
      }
    } catch {
      // Skip directories we can't read (permissions, etc.)
    }
  }

  await walk(directory, 0)
  return results
}
