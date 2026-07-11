import { app } from 'electron'
import fs from 'fs/promises'
import path from 'path'

const STORAGE_VERSION = 1

interface ProjectIndex {
  version: number
  migratedLocalStorageVersion: number
  projectIds: string[]
}

const EMPTY_INDEX: ProjectIndex = {
  version: STORAGE_VERSION,
  migratedLocalStorageVersion: 0,
  projectIds: [],
}

function getStorageDir(): string {
  return path.join(app.getPath('userData'), 'projects')
}

function getIndexPath(): string {
  return path.join(getStorageDir(), 'index.json')
}

function projectPath(id: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error('Invalid project id')
  }
  return path.join(getStorageDir(), `${id}.json`)
}

async function writeJsonAtomically(filePath: string, value: unknown): Promise<void> {
  const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`
  await fs.writeFile(temporaryPath, JSON.stringify(value, null, 2), 'utf-8')
  await fs.rename(temporaryPath, filePath)
}

async function readIndex(): Promise<ProjectIndex> {
  try {
    const parsed = JSON.parse(await fs.readFile(getIndexPath(), 'utf-8')) as Partial<ProjectIndex>
    if (Array.isArray(parsed.projectIds)) {
      return {
        version: STORAGE_VERSION,
        migratedLocalStorageVersion: parsed.migratedLocalStorageVersion ?? 0,
        projectIds: parsed.projectIds.filter((id): id is string => typeof id === 'string'),
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn('[project-storage] failed to read index:', error)
    }
  }
  return { ...EMPTY_INDEX }
}

async function writeIndex(index: ProjectIndex): Promise<void> {
  await writeJsonAtomically(getIndexPath(), index)
}

async function ensureStorageDir(): Promise<void> {
  await fs.mkdir(getStorageDir(), { recursive: true })
}

export async function loadStoredProjects(): Promise<unknown[]> {
  const index = await readIndex()
  const projects = await Promise.all(index.projectIds.map(async (id) => {
    try {
      return JSON.parse(await fs.readFile(projectPath(id), 'utf-8')) as unknown
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn(`[project-storage] failed to read ${id}:`, error)
      }
      return null
    }
  }))
  return projects.filter((project) => project !== null)
}

export async function saveStoredProject(project: unknown, position?: number): Promise<void> {
  if (!project || typeof project !== 'object' || typeof (project as { id?: unknown }).id !== 'string') {
    throw new Error('Project storage requires a project object with an id')
  }

  const id = (project as { id: string }).id
  await ensureStorageDir()
  await writeJsonAtomically(projectPath(id), project)

  const index = await readIndex()
  if (!index.projectIds.includes(id)) {
    const insertionIndex = position === undefined
      ? index.projectIds.length
      : Math.max(0, Math.min(position, index.projectIds.length))
    index.projectIds.splice(insertionIndex, 0, id)
    await writeIndex(index)
  }
}

export async function deleteStoredProject(id: string): Promise<void> {
  await ensureStorageDir()
  await fs.rm(projectPath(id), { force: true })

  const index = await readIndex()
  const projectIds = index.projectIds.filter((projectId) => projectId !== id)
  if (projectIds.length !== index.projectIds.length) {
    await writeIndex({ ...index, projectIds })
  }
}

export async function migrateLegacyProjects(projects: unknown[]): Promise<unknown[]> {
  const index = await readIndex()
  if (index.migratedLocalStorageVersion >= STORAGE_VERSION) {
    return loadStoredProjects()
  }

  await ensureStorageDir()
  for (const project of projects) {
    if (!project || typeof project !== 'object' || typeof (project as { id?: unknown }).id !== 'string') {
      continue
    }
    await writeJsonAtomically(projectPath((project as { id: string }).id), project)
  }

  const projectIds = projects.flatMap((project) => (
    project && typeof project === 'object' && typeof (project as { id?: unknown }).id === 'string'
      ? [(project as { id: string }).id]
      : []
  ))
  await writeIndex({
    version: STORAGE_VERSION,
    migratedLocalStorageVersion: STORAGE_VERSION,
    projectIds,
  })
  return loadStoredProjects()
}
