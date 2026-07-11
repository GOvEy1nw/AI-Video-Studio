import { app } from 'electron'
import fs from 'fs'
import path from 'path'

export interface AppState {
  projectAssetsPath?: string
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

export function getProjectAssetsPath(): string {
  if (cachedProjectAssetsPath) return cachedProjectAssetsPath
  const state = readAppState()
  if (state.projectAssetsPath) {
    cachedProjectAssetsPath = state.projectAssetsPath
    return cachedProjectAssetsPath
  }
  const defaultPath = path.join(app.getPath('documents'), 'AiVS')
  cachedProjectAssetsPath = defaultPath
  return defaultPath
}

export function setProjectAssetsPath(p: string): void {
  cachedProjectAssetsPath = p
  const state = readAppState()
  state.projectAssetsPath = p
  writeAppState(state)
}
