import path from 'path'
import fs from 'fs'

const isWindows = process.platform === 'win32'

function normalize(p: string): string {
  return isWindows ? path.resolve(p).toLowerCase() : path.resolve(p)
}

function stripFileUrl(fileUrl: string): string {
  let raw = fileUrl
  if (raw.startsWith('file:///')) raw = raw.slice(8)
  else if (raw.startsWith('file://')) raw = raw.slice(7)
  return decodeURIComponent(raw).replace(/\//g, path.sep)
}

const approvedPaths = new Set<string>()
const approvedDirectories = new Set<string>()
const approvedWritePaths = new Set<string>()

function realpathNative(filePath: string): string {
  return fs.realpathSync.native(filePath)
}

function hasFilesystemEntry(filePath: string): boolean {
  try {
    fs.lstatSync(filePath)
    return true
  } catch {
    return false
  }
}

export function canonicalizeForContainment(filePath: string): string {
  const resolved = canonicalizePath(filePath)
  const missing: string[] = []
  let ancestor = resolved
  while (!hasFilesystemEntry(ancestor)) {
    const parent = path.dirname(ancestor)
    if (parent === ancestor) return resolved
    missing.unshift(path.basename(ancestor))
    ancestor = parent
  }
  try {
    return path.join(realpathNative(ancestor), ...missing)
  } catch {
    throw new Error(`Unable to resolve filesystem path: ${filePath}`)
  }
}

export function canonicalizePath(filePath: string): string {
  const cleaned = filePath.startsWith('file://') ? stripFileUrl(filePath) : filePath
  return path.resolve(cleaned)
}

export function approveExactFilePath(filePath: string): string {
  const resolved = canonicalizeForContainment(filePath)
  approvedPaths.add(normalize(resolved))
  return resolved
}

export function loadApprovedExactFilePaths(filePaths: string[]): void {
  for (const filePath of filePaths) approveExactFilePath(filePath)
}

export function approveDirectorySubtree(directoryPath: string): string {
  const resolved = canonicalizeForContainment(directoryPath)
  approvedDirectories.add(normalize(resolved))
  return resolved
}

export function validatePath(inputPath: string, allowedRoots: string[]): string {
  const resolved = canonicalizeForContainment(inputPath)
  const norm = normalize(resolved)

  for (const root of allowedRoots.map(canonicalizeForContainment).map(normalize)) {
    if (norm === root || norm.startsWith(root + path.sep)) return resolved
  }

  let found = false
  approvedPaths.forEach((approved) => {
    if (norm === approved) found = true
  })
  if (found) return resolved

  for (const directory of approvedDirectories) {
    if (norm === directory || norm.startsWith(directory + path.sep)) return resolved
  }

  throw new Error(`Path not allowed: ${inputPath}`)
}

export function approveExactWritePath(filePath: string): string {
  const resolved = canonicalizeForContainment(filePath)
  approvedWritePaths.add(normalize(resolved))
  return resolved
}

export function validateExactWritePath(filePath: string): string {
  const resolved = canonicalizeForContainment(filePath)
  if (!approvedWritePaths.has(normalize(resolved))) throw new Error(`Path not approved for writing: ${filePath}`)
  return resolved
}

export function filterMatchingCanonicalPaths(candidates: string[], selectedPaths: string[]): string[] {
  const normalizeCandidate = (filePath: string): string | null => {
    try {
      const canonical = canonicalizeForContainment(filePath)
      return isWindows ? canonical.toLowerCase() : canonical
    } catch {
      return null
    }
  }
  const knownCandidates = new Set(candidates.map(normalizeCandidate).filter((candidate): candidate is string => candidate !== null))
  return selectedPaths.filter((selected) => {
    const candidate = normalizeCandidate(selected)
    return candidate !== null && knownCandidates.has(candidate)
  })
}
