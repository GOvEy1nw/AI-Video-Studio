import { app } from 'electron'
import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import { firstUsableDirectory } from './dialog-paths'

export interface AppState {
  projectAssetsPath?: string
  projectAssetsPathTrustVersion?: 1
  projectAssetsPathTrustToken?: string
  approvedExternalFilePaths?: string[]
  approvedExternalFilePathsTrustToken?: string
  checkpointsPath?: string
  checkpointsPathTrustToken?: string
  lorasPath?: string
  lorasPathTrustToken?: string
  lastOpenDirectory?: string
  lastSaveDirectory?: string
  lastDirectoryPickerPath?: string
  [key: string]: unknown
}

export function getAppStatePath(): string {
  return path.join(app.getPath('userData'), 'app_state.json')
}

export function readAppState(): AppState {
  const statePath = getAppStatePath()
  try {
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, 'utf-8')) as AppState
    }
  } catch (err) {
    console.warn('[app-state] failed to read app state:', err)
  }
  return {}
}

export function writeAppState(state: AppState): void {
  fs.writeFileSync(getAppStatePath(), JSON.stringify(state, null, 2))
}

let cachedProjectAssetsPath: string | null = null
let cachedPathTrustToken: string | null = null
const PROJECT_ASSETS_PATH_TRUST_VERSION = 1 as const

function getPathTrustToken(): string {
  if (cachedPathTrustToken) return cachedPathTrustToken
  const tokenPath = path.join(app.getPath('appData'), '.aivs-path-trust-v1.token')
  try {
    const existing = fs.readFileSync(tokenPath, 'utf8').trim()
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing)) {
      cachedPathTrustToken = existing
      return existing
    }
  } catch {
    // First hardened launch creates provenance outside legacy renderer-writable roots.
  }
  cachedPathTrustToken = randomUUID()
  fs.writeFileSync(tokenPath, cachedPathTrustToken, { encoding: 'utf8', mode: 0o600 })
  return cachedPathTrustToken
}

export type ProjectAssetsPathStatus = {
  path: string
  needsReselection: boolean
  legacyPath?: string
}

export function resolveProjectAssetsPathStatus(
  state: AppState,
  defaultPath: string,
  trustToken: string,
): ProjectAssetsPathStatus {
  const trusted = (
    state.projectAssetsPathTrustVersion === PROJECT_ASSETS_PATH_TRUST_VERSION &&
    state.projectAssetsPathTrustToken === trustToken
  )
  return {
    path: trusted && state.projectAssetsPath ? state.projectAssetsPath : defaultPath,
    needsReselection: Boolean(state.projectAssetsPath && !trusted),
    legacyPath: !trusted ? state.projectAssetsPath : undefined,
  }
}

function getDefaultProjectAssetsPath(): string {
  return path.join(app.getPath('documents'), 'AiVS')
}

export function getProjectAssetsPath(): string {
  if (cachedProjectAssetsPath) return cachedProjectAssetsPath
  const state = readAppState()
  const status = resolveProjectAssetsPathStatus(state, getDefaultProjectAssetsPath(), getPathTrustToken())
  if (!status.needsReselection && state.projectAssetsPath) {
    cachedProjectAssetsPath = status.path
    return cachedProjectAssetsPath
  }
  cachedProjectAssetsPath = status.path
  return status.path
}

export function setProjectAssetsPath(p: string): void {
  cachedProjectAssetsPath = p
  const state = readAppState()
  state.projectAssetsPath = p
  state.projectAssetsPathTrustVersion = PROJECT_ASSETS_PATH_TRUST_VERSION
  state.projectAssetsPathTrustToken = getPathTrustToken()
  writeAppState(state)
}

export function getProjectAssetsPathStatus(): ProjectAssetsPathStatus {
  return resolveProjectAssetsPathStatus(readAppState(), getProjectAssetsPath(), getPathTrustToken())
}

export function resolveApprovedExternalFilePaths(state: AppState, trustToken: string): string[] {
  if (state.approvedExternalFilePathsTrustToken !== trustToken) return []
  const paths = state.approvedExternalFilePaths
  return Array.isArray(paths) ? paths.filter((value): value is string => typeof value === 'string' && value.trim() !== '') : []
}

export function getApprovedExternalFilePaths(): string[] {
  return resolveApprovedExternalFilePaths(readAppState(), getPathTrustToken())
}

export function addApprovedExternalFilePath(filePath: string): void {
  const state = readAppState()
  const trustToken = getPathTrustToken()
  const existing = resolveApprovedExternalFilePaths(state, trustToken)
  if (existing.includes(filePath)) return
  state.approvedExternalFilePaths = [...existing, filePath]
  state.approvedExternalFilePathsTrustToken = trustToken
  writeAppState(state)
}

export function resolveTrustedCustomModelPath(
  value: unknown,
  storedTrustToken: unknown,
  trustToken: string,
): string | null {
  return storedTrustToken === trustToken && typeof value === 'string' && value.trim() ? value : null
}

export function getCustomCheckpointsPath(): string | null {
  const state = readAppState()
  return resolveTrustedCustomModelPath(state.checkpointsPath, state.checkpointsPathTrustToken, getPathTrustToken())
}

export function setCustomCheckpointsPath(value: string | null): void {
  const state = readAppState()
  if (value) {
    state.checkpointsPath = value
    state.checkpointsPathTrustToken = getPathTrustToken()
  } else {
    delete state.checkpointsPath
    delete state.checkpointsPathTrustToken
  }
  writeAppState(state)
}

export function getCustomLorasPath(): string | null {
  const state = readAppState()
  return resolveTrustedCustomModelPath(state.lorasPath, state.lorasPathTrustToken, getPathTrustToken())
}

export function setCustomLorasPath(value: string | null): void {
  const state = readAppState()
  if (value) {
    state.lorasPath = value
    state.lorasPathTrustToken = getPathTrustToken()
  } else {
    delete state.lorasPath
    delete state.lorasPathTrustToken
  }
  writeAppState(state)
}

type RememberedDirectoryKey =
  | 'lastOpenDirectory'
  | 'lastSaveDirectory'
  | 'lastDirectoryPickerPath'

function isExistingDirectory(candidate: string): boolean {
  return fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()
}

function getRememberedDirectory(key: RememberedDirectoryKey): string | null {
  return firstUsableDirectory([readAppState()[key]], isExistingDirectory)
}

function setRememberedDirectory(
  key: RememberedDirectoryKey,
  directory: string,
): void {
  const state = readAppState()
  state[key] = directory
  writeAppState(state)
}

export function getLastOpenDirectory(): string | null {
  return getRememberedDirectory('lastOpenDirectory')
}

export function setLastOpenDirectory(directory: string): void {
  setRememberedDirectory('lastOpenDirectory', directory)
}

export function getLastSaveDirectory(): string | null {
  return getRememberedDirectory('lastSaveDirectory')
}

export function setLastSaveDirectory(directory: string): void {
  setRememberedDirectory('lastSaveDirectory', directory)
}

export function getLastDirectoryPickerPath(): string | null {
  return getRememberedDirectory('lastDirectoryPickerPath')
}

export function setLastDirectoryPickerPath(directory: string): void {
  setRememberedDirectory('lastDirectoryPickerPath', directory)
}
