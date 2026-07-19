import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { Project, Asset, AssetTake, ViewType, ProjectTab, Timeline, DirectorTimelineDocument } from '../types/project'
import { createDefaultTimeline } from '../types/project'
import { recoverGenerationParamsMedia } from '../lib/apply-generation-params'
import { cloneDirectorSequence, normalizeDirectorSequence } from '../lib/director-timeline'
import type { DirectorSequenceV1 } from '../types/director'
import { logger } from '../lib/logger'

function createProjectId(name: string, createdAt: number, existingIds: Set<string>): string {
  const date = new Date(createdAt)
  const pad = (value: number) => value.toString().padStart(2, '0')
  const safeName = name.replace(/[^a-zA-Z0-9_-]+/g, '') || 'Project'
  const timestamp = `${date.getFullYear()}${pad(date.getDate())}${pad(date.getMonth() + 1)}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  const baseId = `${safeName}_${timestamp}`
  let id = baseId
  let suffix = 2
  while (existingIds.has(id)) {
    id = `${baseId}_${suffix}`
    suffix += 1
  }
  return id
}

interface ProjectContextType {
  // Navigation
  currentView: ViewType
  setCurrentView: (view: ViewType) => void
  currentProjectId: string | null
  setCurrentProjectId: (id: string | null) => void
  currentTab: ProjectTab
  setCurrentTab: (tab: ProjectTab) => void
  
  // Projects
  projects: Project[]
  currentProject: Project | null
  createProject: (name: string) => Project
  deleteProject: (id: string) => void
  renameProject: (id: string, name: string) => void
  updateProjectGenSpaceSeed: (
    id: string,
    seed: { seedLocked: boolean; lockedSeed: number },
  ) => void
  
  // Assets
  addAsset: (projectId: string, asset: Omit<Asset, 'id' | 'createdAt'>) => Asset
  deleteAsset: (projectId: string, assetId: string) => void
  updateAsset: (projectId: string, assetId: string, updates: Partial<Asset>) => void
  addTakeToAsset: (projectId: string, assetId: string, take: AssetTake) => void
  deleteTakeFromAsset: (projectId: string, assetId: string, takeIndex: number) => void
  setAssetActiveTake: (projectId: string, assetId: string, takeIndex: number) => void
  toggleFavorite: (projectId: string, assetId: string) => void
  createAssetBin: (projectId: string, name: string) => void
  renameAssetBin: (projectId: string, oldName: string, newName: string) => void
  deleteAssetBin: (projectId: string, name: string) => void
  setAssetBinColor: (projectId: string, name: string, colorLabel?: string) => void
  
  // Timelines
  addTimeline: (projectId: string, name?: string) => Timeline
  deleteTimeline: (projectId: string, timelineId: string) => void
  renameTimeline: (projectId: string, timelineId: string, name: string) => void
  duplicateTimeline: (projectId: string, timelineId: string) => Timeline | null
  setActiveTimeline: (projectId: string, timelineId: string) => void
  updateTimeline: (projectId: string, timelineId: string, updates: Partial<Pick<Timeline, 'tracks' | 'clips' | 'subtitles' | 'director'>>) => void
  getActiveTimeline: (projectId: string) => Timeline | null

  // Director timelines
  addDirectorTimeline: (projectId: string, sequence: DirectorSequenceV1, name?: string) => DirectorTimelineDocument
  deleteDirectorTimeline: (projectId: string, timelineId: string) => void
  renameDirectorTimeline: (projectId: string, timelineId: string, name: string) => void
  duplicateDirectorTimeline: (projectId: string, timelineId: string) => DirectorTimelineDocument | null
  setActiveDirectorTimeline: (projectId: string, timelineId: string) => void
  updateDirectorTimeline: (projectId: string, timelineId: string, sequence: DirectorSequenceV1) => void
  getActiveDirectorTimeline: (projectId: string) => DirectorTimelineDocument | null
  
  // Navigation helpers
  openProject: (id: string) => void
  goHome: () => void
  
  // Cross-view communication (editor → gen space)
  genSpaceEditImageUrl: string | null
  setGenSpaceEditImageUrl: (url: string | null) => void
  genSpaceEditMode: 'image' | 'video' | null
  setGenSpaceEditMode: (mode: 'image' | 'video' | null) => void
  genSpaceAudioUrl: string | null
  setGenSpaceAudioUrl: (url: string | null) => void
  genSpaceRetakeSource: GenSpaceRetakeSource | null
  setGenSpaceRetakeSource: (source: GenSpaceRetakeSource | null) => void
  pendingRetakeUpdate: PendingRetakeUpdate | null
  setPendingRetakeUpdate: (update: PendingRetakeUpdate | null) => void
}

export interface GenSpaceRetakeSource {
  videoUrl: string
  videoPath: string
  clipId?: string
  assetId?: string
  linkedClipIds?: string[]
  duration?: number
}

export interface PendingRetakeUpdate {
  assetId: string
  clipIds: string[]
  newTakeIndex: number
}

const ProjectContext = createContext<ProjectContextType | null>(null)

const STORAGE_KEY = 'ltx-projects'

// Migrate old projects that don't have timelines
function migrateProject(project: Project): Project {
  const sourceTimelines = project.timelines || [createDefaultTimeline('Timeline 1')]
  const migratedFromEditor = sourceTimelines.flatMap((timeline) => {
    const sequence = normalizeDirectorSequence(timeline.director)
    return sequence ? [{
      id: timeline.id,
      name: `${timeline.name} Director`,
      createdAt: timeline.createdAt,
      updatedAt: sequence.updatedAt,
      sequence,
    }] : []
  })
  const directorTimelines = (project.directorTimelines ?? migratedFromEditor).flatMap((timeline) => {
    const sequence = normalizeDirectorSequence(timeline.sequence)
    return sequence ? [{ ...timeline, sequence }] : []
  })
  return {
    ...project,
    assetBins: Array.from(new Set([
      ...(project.assetBins || []),
      ...project.assets.flatMap((asset) => asset.bin ? [asset.bin] : []),
    ])).sort((a, b) => a.localeCompare(b)),
    assetBinColors: project.assetBinColors || {},
    timelines: sourceTimelines.map((timeline) => ({
      ...timeline,
      director: undefined,
    })),
    directorTimelines,
    activeDirectorTimelineId: directorTimelines.some((timeline) => timeline.id === project.activeDirectorTimelineId)
      ? project.activeDirectorTimelineId
      : directorTimelines[0]?.id,
  }
}

// Rebuild a file:// URL from a filesystem path
function pathToFileUrl(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/')
  return normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`
}

// Check if a path looks like a real filesystem path (not just a filename)
function isRealPath(p: string): boolean {
  if (!p) return false
  // Has directory separators or starts with a drive letter (Windows) or /
  return p.includes('/') || p.includes('\\') || /^[A-Za-z]:/.test(p)
}

// Recover broken blob URLs by rebuilding file:// URLs from stored paths
function recoverAssetUrls(project: Project): Project {
  let changed = false
  const fixedAssets = project.assets.map((asset) => {
    if (asset.url && asset.url.startsWith('blob:') && isRealPath(asset.path)) {
      changed = true
      const fixedUrl = pathToFileUrl(asset.path)
      const fixedTakes = asset.takes?.map((t) => ({
        ...t,
        url:
          t.url.startsWith('blob:') && isRealPath(t.path)
            ? pathToFileUrl(t.path)
            : t.url,
      }))
      return { ...asset, url: fixedUrl, takes: fixedTakes || asset.takes }
    }
    return asset
  })

  let timelinesChanged = false
  const fixedTimelines = project.timelines?.map((tl) => ({
    ...tl,
    clips:
      tl.clips?.map((clip) => {
        if (clip.asset?.url?.startsWith('blob:') && isRealPath(clip.asset.path)) {
          timelinesChanged = true
          return {
            ...clip,
            asset: { ...clip.asset, url: pathToFileUrl(clip.asset.path) },
          }
        }
        return clip
      }) || tl.clips,
  }))

  if (timelinesChanged) {
    changed = true
  }

  const assetsWithParams = fixedAssets.map((asset) => {
    if (!asset.generationParams) return asset
    const recovered = recoverGenerationParamsMedia(
      asset.generationParams,
      fixedAssets,
    )
    if (recovered === asset.generationParams) return asset
    changed = true
    return { ...asset, generationParams: recovered }
  })

  if (!changed) return project

  return {
    ...project,
    assets: assetsWithParams,
    timelines: fixedTimelines || project.timelines,
  }
}

// Load the legacy library only when migrating into Electron project storage.
function loadProjectsFromStorage(): Project[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        // Migrate any old projects, then recover broken blob URLs
        return parsed.map(migrateProject).map(recoverAssetUrls)
      }
    }
  } catch (e) {
    logger.error(`Failed to load projects: ${e}`)
  }
  return []
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewType>('home')
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [currentTab, setCurrentTab] = useState<ProjectTab>('gen-space')
  const [genSpaceEditImageUrl, setGenSpaceEditImageUrl] = useState<string | null>(null)
  const [genSpaceEditMode, setGenSpaceEditMode] = useState<'image' | 'video' | null>(null)
  const [genSpaceAudioUrl, setGenSpaceAudioUrl] = useState<string | null>(null)
  const [genSpaceRetakeSource, setGenSpaceRetakeSource] = useState<GenSpaceRetakeSource | null>(null)
  const [pendingRetakeUpdate, setPendingRetakeUpdate] = useState<PendingRetakeUpdate | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const storageReadyRef = useRef(false)
  const persistedProjectsRef = useRef<Map<string, Project>>(new Map())
  const pendingProjectIdsRef = useRef(new Set<string>())
  const pendingDeletedProjectIdsRef = useRef(new Set<string>())
  const approvedPathsRef = useRef(new Set<string>())
  const approvingPathsRef = useRef(new Set<string>())
  const persistenceFailureReportedRef = useRef(false)

  const reportPersistenceFailure = useCallback((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    logger.error(`Project storage failed: ${message}`)
    if (!persistenceFailureReportedRef.current) {
      persistenceFailureReportedRef.current = true
      window.alert(`AiVS could not save project changes. ${message}`)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadProjects = async () => {
      try {
        if (!window.electronAPI?.loadProjects) {
          const legacyProjects = loadProjectsFromStorage()
          persistedProjectsRef.current = new Map(legacyProjects.map((project) => [project.id, project]))
          if (!cancelled) setProjects(legacyProjects)
          return
        }

        let storedProjects = await window.electronAPI.loadProjects() as Project[]
        if (storedProjects.length === 0) {
          const legacyProjects = loadProjectsFromStorage()
          if (legacyProjects.length > 0) {
            storedProjects = await window.electronAPI.migrateProjectsFromLocalStorage(legacyProjects) as Project[]
          }
        }

        const recoveredProjects = storedProjects.map(migrateProject).map(recoverAssetUrls)
        persistedProjectsRef.current = new Map(recoveredProjects.map((project) => [project.id, project]))
        if (!cancelled) {
          setProjects((currentProjects) => currentProjects.length === 0
            ? recoveredProjects
            : [
                ...currentProjects,
                ...recoveredProjects.filter((project) => !currentProjects.some((current) => current.id === project.id)),
              ])
        }
      } catch (error) {
        reportPersistenceFailure(error)
      } finally {
        storageReadyRef.current = true
      }
    }

    void loadProjects()
    return () => { cancelled = true }
  }, [reportPersistenceFailure])

  useEffect(() => {
    if (!storageReadyRef.current) return

    const previousProjects = persistedProjectsRef.current
    const currentProjects = new Map(projects.map((project) => [project.id, project]))
    for (const project of projects) {
      if (previousProjects.get(project.id) !== project) {
        pendingProjectIdsRef.current.add(project.id)
      }
    }
    for (const id of previousProjects.keys()) {
      if (!currentProjects.has(id)) {
        pendingDeletedProjectIdsRef.current.add(id)
      }
    }
    persistedProjectsRef.current = currentProjects

    if (pendingProjectIdsRef.current.size === 0 && pendingDeletedProjectIdsRef.current.size === 0) return

    const saveTimer = window.setTimeout(() => {
      const projectsById = new Map(projects.map((project) => [project.id, project]))
      const changedIds = [...pendingProjectIdsRef.current]
      const deletedIds = [...pendingDeletedProjectIdsRef.current]
      pendingProjectIdsRef.current.clear()
      pendingDeletedProjectIdsRef.current.clear()

      void (async () => {
        try {
          if (!window.electronAPI?.saveProject) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
            return
          }
          await Promise.all(deletedIds.map((id) => window.electronAPI.deleteProject(id)))
          await Promise.all(changedIds.flatMap((id) => {
            const project = projectsById.get(id)
            return project ? [window.electronAPI.saveProject(project, projects.indexOf(project))] : []
          }))
        } catch (error) {
          reportPersistenceFailure(error)
        }
      })()
    }, 500)

    return () => window.clearTimeout(saveTimer)
  }, [projects, reportPersistenceFailure])

  useEffect(() => {
    const approveProjectPaths = async () => {
      const paths = new Set<string>()
      for (const project of projects) {
        for (const asset of project.assets) {
          if (isRealPath(asset.path)) {
            paths.add(asset.path)
          }
          for (const take of asset.takes || []) {
            if (isRealPath(take.path)) {
              paths.add(take.path)
            }
          }
        }
      }
      const newPaths = [...paths].filter((filePath) => (
        !approvedPathsRef.current.has(filePath) && !approvingPathsRef.current.has(filePath)
      ))
      await Promise.all(newPaths.map(async (filePath) => {
        approvingPathsRef.current.add(filePath)
        try {
          await window.electronAPI?.approveLocalPath?.(filePath)
          approvedPathsRef.current.add(filePath)
        } catch (e) {
          logger.warn(`Failed to approve stored asset path: ${filePath} ${e}`)
        } finally {
          approvingPathsRef.current.delete(filePath)
        }
      }))
    }
    void approveProjectPaths()
  }, [projects])
  
  const currentProject = projects.find(p => p.id === currentProjectId) || null
  
  const createProject = useCallback((name: string): Project => {
    const createdAt = Date.now()
    const defaultTimeline = createDefaultTimeline('Timeline 1')
    const newProject: Project = {
      id: createProjectId(name, createdAt, new Set(projects.map(project => project.id))),
      name,
      createdAt,
      updatedAt: createdAt,
      assets: [],
      assetBins: [],
      assetBinColors: {},
      timelines: [defaultTimeline],
      activeTimelineId: defaultTimeline.id,
      directorTimelines: [],
    }
    setProjects(prev => [newProject, ...prev])
    return newProject
  }, [projects])
  
  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id))
    if (currentProjectId === id) {
      setCurrentProjectId(null)
      setCurrentView('home')
    }
  }, [currentProjectId])
  
  const renameProject = useCallback((id: string, name: string) => {
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, name, updatedAt: Date.now() } : p
    ))
  }, [])

  const updateProjectGenSpaceSeed = useCallback((
    id: string,
    seed: { seedLocked: boolean; lockedSeed: number },
  ) => {
    setProjects(prev => prev.map(p =>
      p.id === id
        ? {
            ...p,
            genSpaceSeedLocked: seed.seedLocked,
            genSpaceLockedSeed: seed.lockedSeed,
            updatedAt: Date.now(),
          }
        : p,
    ))
  }, [])

  const addAsset = useCallback((projectId: string, assetData: Omit<Asset, 'id' | 'createdAt'>): Asset => {
    const newAsset: Asset = {
      ...assetData,
      id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    }
    setProjects(prev => prev.map(p => 
      p.id === projectId 
        ? { 
            ...p, 
            assets: [newAsset, ...p.assets],
            updatedAt: Date.now(),
            thumbnail: p.thumbnail || newAsset.thumbnail || newAsset.url,
          } 
        : p
    ))
    return newAsset
  }, [])
  
  const deleteAsset = useCallback((projectId: string, assetId: string) => {
    setProjects(prev => prev.map(p => 
      p.id === projectId 
        ? { ...p, assets: p.assets.filter(a => a.id !== assetId), updatedAt: Date.now() } 
        : p
    ))
  }, [])
  
  const updateAsset = useCallback((projectId: string, assetId: string, updates: Partial<Asset>) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId
        ? {
            ...p,
            assets: p.assets.map(a =>
              a.id === assetId ? { ...a, ...updates } : a
            ),
            updatedAt: Date.now(),
          }
        : p
    ))
  }, [])

  const addTakeToAsset = useCallback((projectId: string, assetId: string, take: AssetTake) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p
      return {
        ...p,
        assets: p.assets.map(a => {
          if (a.id !== assetId) return a
          // Initialize takes array if it doesn't exist (original asset becomes take 0)
          const existingTakes: AssetTake[] = a.takes || [{
            url: a.url,
            path: a.path,
            thumbnail: a.thumbnail,
            createdAt: a.createdAt,
          }]
          const newTakes = [...existingTakes, take]
          const newIndex = newTakes.length - 1
          return {
            ...a,
            takes: newTakes,
            activeTakeIndex: newIndex,
            // Update the main url/path to the new take
            url: take.url,
            path: take.path,
            thumbnail: take.thumbnail || a.thumbnail,
          }
        }),
        updatedAt: Date.now(),
      }
    }))
  }, [])

  const deleteTakeFromAsset = useCallback((projectId: string, assetId: string, takeIndex: number) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p
      return {
        ...p,
        assets: p.assets.map(a => {
          if (a.id !== assetId || !a.takes || a.takes.length <= 1) return a // Never delete the last take
          const newTakes = a.takes.filter((_, i) => i !== takeIndex)
          // Adjust activeTakeIndex
          let newActiveIdx = a.activeTakeIndex ?? newTakes.length - 1
          if (newActiveIdx >= newTakes.length) newActiveIdx = newTakes.length - 1
          if (newActiveIdx < 0) newActiveIdx = 0
          const activeTake = newTakes[newActiveIdx]
          return {
            ...a,
            takes: newTakes,
            activeTakeIndex: newActiveIdx,
            url: activeTake.url,
            path: activeTake.path,
            thumbnail: activeTake.thumbnail || a.thumbnail,
          }
        }),
        updatedAt: Date.now(),
      }
    }))
  }, [])

  const setAssetActiveTake = useCallback((projectId: string, assetId: string, takeIndex: number) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p
      return {
        ...p,
        assets: p.assets.map(a => {
          if (a.id !== assetId || !a.takes) return a
          const idx = Math.max(0, Math.min(takeIndex, a.takes.length - 1))
          const take = a.takes[idx]
          return {
            ...a,
            activeTakeIndex: idx,
            url: take.url,
            path: take.path,
            thumbnail: take.thumbnail || a.thumbnail,
          }
        }),
        updatedAt: Date.now(),
      }
    }))
  }, [])

  const toggleFavorite = useCallback((projectId: string, assetId: string) => {
    setProjects(prev => prev.map(p => 
      p.id === projectId 
        ? { 
            ...p, 
            assets: p.assets.map(a => 
              a.id === assetId ? { ...a, favorite: !a.favorite } : a
            ),
            updatedAt: Date.now(),
          } 
        : p
    ))
  }, [])
  
  // --- Timeline CRUD ---
  
  const addTimeline = useCallback((projectId: string, name?: string): Timeline => {
    const project = projects.find(p => p.id === projectId)
    const count = (project?.timelines?.length || 0) + 1
    const newTimeline = createDefaultTimeline(name || `Timeline ${count}`)
    
    setProjects(prev => prev.map(p => 
      p.id === projectId 
        ? { 
            ...p, 
            timelines: [...(p.timelines || []), newTimeline],
            activeTimelineId: newTimeline.id,
            updatedAt: Date.now(),
          } 
        : p
    ))
    return newTimeline
  }, [projects])
  
  const deleteTimeline = useCallback((projectId: string, timelineId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p
      const remaining = (p.timelines || []).filter(t => t.id !== timelineId)
      // Don't allow deleting the last timeline
      if (remaining.length === 0) return p
      return {
        ...p,
        timelines: remaining,
        // If we deleted the active timeline, switch to the first remaining
        activeTimelineId: p.activeTimelineId === timelineId ? remaining[0].id : p.activeTimelineId,
        updatedAt: Date.now(),
      }
    }))
  }, [])
  
  const renameTimeline = useCallback((projectId: string, timelineId: string, name: string) => {
    setProjects(prev => prev.map(p => 
      p.id === projectId 
        ? {
            ...p,
            timelines: (p.timelines || []).map(t => 
              t.id === timelineId ? { ...t, name } : t
            ),
            updatedAt: Date.now(),
          }
        : p
    ))
  }, [])
  
  const duplicateTimeline = useCallback((projectId: string, timelineId: string): Timeline | null => {
    const project = projects.find(p => p.id === projectId)
    const source = project?.timelines?.find(t => t.id === timelineId)
    if (!source) return null
    
    const newTimeline: Timeline = {
      ...source,
      id: `timeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${source.name} (copy)`,
      createdAt: Date.now(),
      tracks: source.tracks.map(t => ({ ...t })),
      clips: source.clips.map(c => ({ 
        ...c, 
        id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
      })),
      subtitles: source.subtitles?.map(s => ({
        ...s,
        id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      })),
    }
    
    setProjects(prev => prev.map(p => 
      p.id === projectId 
        ? { 
            ...p, 
            timelines: [...(p.timelines || []), newTimeline],
            activeTimelineId: newTimeline.id,
            updatedAt: Date.now(),
          }
        : p
    ))
    return newTimeline
  }, [projects])
  
  const setActiveTimeline = useCallback((projectId: string, timelineId: string) => {
    setProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, activeTimelineId: timelineId } : p
    ))
  }, [])
  
  const updateTimeline = useCallback((projectId: string, timelineId: string, updates: Partial<Pick<Timeline, 'tracks' | 'clips' | 'subtitles' | 'director'>>) => {
    setProjects(prev => prev.map(p => 
      p.id === projectId 
        ? {
            ...p,
            timelines: (p.timelines || []).map(t => 
              t.id === timelineId ? { ...t, ...updates } : t
            ),
            updatedAt: Date.now(),
          }
        : p
    ))
  }, [])
  
  const getActiveTimeline = useCallback((projectId: string): Timeline | null => {
    const project = projects.find(p => p.id === projectId)
    if (!project || !project.timelines || project.timelines.length === 0) return null
    
    // Find the active timeline, or fall back to the first one
    const active = project.timelines.find(t => t.id === project.activeTimelineId)
    return active || project.timelines[0]
  }, [projects])

  const addDirectorTimeline = useCallback((projectId: string, sequence: DirectorSequenceV1, name?: string): DirectorTimelineDocument => {
    const project = projects.find(p => p.id === projectId)
    const count = (project?.directorTimelines?.length || 0) + 1
    const now = Date.now()
    const timeline: DirectorTimelineDocument = {
      id: `director-${now}-${Math.random().toString(36).substr(2, 9)}`,
      name: name || `Director Timeline ${count}`,
      createdAt: now,
      updatedAt: now,
      sequence,
    }
    setProjects(prev => prev.map(p => p.id === projectId ? {
      ...p,
      directorTimelines: [...(p.directorTimelines || []), timeline],
      activeDirectorTimelineId: timeline.id,
      updatedAt: now,
    } : p))
    return timeline
  }, [projects])

  const deleteDirectorTimeline = useCallback((projectId: string, timelineId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p
      const remaining = (p.directorTimelines || []).filter(timeline => timeline.id !== timelineId)
      if (remaining.length === 0) return p
      return {
        ...p,
        directorTimelines: remaining,
        activeDirectorTimelineId: p.activeDirectorTimelineId === timelineId ? remaining[0].id : p.activeDirectorTimelineId,
        updatedAt: Date.now(),
      }
    }))
  }, [])

  const createAssetBin = useCallback((projectId: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setProjects(prev => prev.map(project => project.id === projectId ? {
      ...project,
      assetBins: Array.from(new Set([...(project.assetBins || []), trimmed])).sort((a, b) => a.localeCompare(b)),
      updatedAt: Date.now(),
    } : project))
  }, [])

  const renameAssetBin = useCallback((projectId: string, oldName: string, newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed || trimmed === oldName) return
    setProjects(prev => prev.map(project => {
      if (project.id !== projectId) return project
      const assetBinColors = { ...(project.assetBinColors || {}) }
      if (assetBinColors[oldName]) {
        assetBinColors[trimmed] = assetBinColors[oldName]
        delete assetBinColors[oldName]
      }
      return {
        ...project,
        assetBins: Array.from(new Set((project.assetBins || []).map(bin => bin === oldName ? trimmed : bin))).sort((a, b) => a.localeCompare(b)),
        assetBinColors,
        assets: project.assets.map(asset => asset.bin === oldName ? { ...asset, bin: trimmed } : asset),
        updatedAt: Date.now(),
      }
    }))
  }, [])

  const deleteAssetBin = useCallback((projectId: string, name: string) => {
    setProjects(prev => prev.map(project => {
      if (project.id !== projectId) return project
      const assetBinColors = { ...(project.assetBinColors || {}) }
      delete assetBinColors[name]
      return {
        ...project,
        assetBins: (project.assetBins || []).filter(bin => bin !== name),
        assetBinColors,
        assets: project.assets.map(asset => asset.bin === name ? { ...asset, bin: undefined } : asset),
        updatedAt: Date.now(),
      }
    }))
  }, [])

  const setAssetBinColor = useCallback((projectId: string, name: string, colorLabel?: string) => {
    setProjects(prev => prev.map(project => {
      if (project.id !== projectId) return project
      const assetBinColors = { ...(project.assetBinColors || {}) }
      if (colorLabel) assetBinColors[name] = colorLabel
      else delete assetBinColors[name]
      return { ...project, assetBinColors, updatedAt: Date.now() }
    }))
  }, [])

  const renameDirectorTimeline = useCallback((projectId: string, timelineId: string, name: string) => {
    setProjects(prev => prev.map(p => p.id === projectId ? {
      ...p,
      directorTimelines: (p.directorTimelines || []).map(timeline => timeline.id === timelineId
        ? { ...timeline, name, updatedAt: Date.now() }
        : timeline),
      updatedAt: Date.now(),
    } : p))
  }, [])

  const duplicateDirectorTimeline = useCallback((projectId: string, timelineId: string): DirectorTimelineDocument | null => {
    const project = projects.find(p => p.id === projectId)
    const source = project?.directorTimelines?.find(timeline => timeline.id === timelineId)
    if (!source) return null
    const now = Date.now()
    const duplicate: DirectorTimelineDocument = {
      ...source,
      id: `director-${now}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${source.name} (copy)`,
      createdAt: now,
      updatedAt: now,
      sequence: cloneDirectorSequence(source.sequence),
    }
    setProjects(prev => prev.map(p => p.id === projectId ? {
      ...p,
      directorTimelines: [...(p.directorTimelines || []), duplicate],
      activeDirectorTimelineId: duplicate.id,
      updatedAt: now,
    } : p))
    return duplicate
  }, [projects])

  const setActiveDirectorTimeline = useCallback((projectId: string, timelineId: string) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, activeDirectorTimelineId: timelineId } : p))
  }, [])

  const updateDirectorTimeline = useCallback((projectId: string, timelineId: string, sequence: DirectorSequenceV1) => {
    setProjects(prev => prev.map(p => p.id === projectId ? {
      ...p,
      directorTimelines: (p.directorTimelines || []).map(timeline => timeline.id === timelineId
        ? { ...timeline, sequence, updatedAt: Date.now() }
        : timeline),
      updatedAt: Date.now(),
    } : p))
  }, [])

  const getActiveDirectorTimeline = useCallback((projectId: string): DirectorTimelineDocument | null => {
    const project = projects.find(p => p.id === projectId)
    if (!project?.directorTimelines?.length) return null
    return project.directorTimelines.find(timeline => timeline.id === project.activeDirectorTimelineId)
      || project.directorTimelines[0]
  }, [projects])
  
  const openProject = useCallback((id: string) => {
    setCurrentProjectId(id)
    setCurrentView('project')
    setCurrentTab('gen-space')
  }, [])
  
  const goHome = useCallback(() => {
    setCurrentView('home')
    setCurrentProjectId(null)
  }, [])
  
  return (
    <ProjectContext.Provider value={{
      currentView,
      setCurrentView,
      currentProjectId,
      setCurrentProjectId,
      currentTab,
      setCurrentTab,
      projects,
      currentProject,
      createProject,
      deleteProject,
      renameProject,
      updateProjectGenSpaceSeed,
      addAsset,
      deleteAsset,
      updateAsset,
      addTakeToAsset,
      deleteTakeFromAsset,
      setAssetActiveTake,
      toggleFavorite,
      createAssetBin,
      renameAssetBin,
      deleteAssetBin,
      setAssetBinColor,
      addTimeline,
      deleteTimeline,
      renameTimeline,
      duplicateTimeline,
      setActiveTimeline,
      updateTimeline,
      getActiveTimeline,
      addDirectorTimeline,
      deleteDirectorTimeline,
      renameDirectorTimeline,
      duplicateDirectorTimeline,
      setActiveDirectorTimeline,
      updateDirectorTimeline,
      getActiveDirectorTimeline,
      openProject,
      goHome,
      genSpaceEditImageUrl,
      setGenSpaceEditImageUrl,
      genSpaceEditMode,
      setGenSpaceEditMode,
      genSpaceAudioUrl,
      setGenSpaceAudioUrl,
      genSpaceRetakeSource,
      setGenSpaceRetakeSource,
      pendingRetakeUpdate,
      setPendingRetakeUpdate,
    }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjects() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider')
  }
  return context
}
