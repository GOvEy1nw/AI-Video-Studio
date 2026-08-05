import React from 'react'
import { act, render, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Project } from '../types/project'
import { createDirectorSequence } from '../lib/director-timeline'
import {
  ProjectProvider,
  recoverPersistedMediaBatches,
  useDirectorTimelines,
  useEditorTimelines,
  useProjectAssets,
  useProjectList,
  useProjectNavigation,
  useProjects,
} from './ProjectContext'

const originalElectronAPI = window.electronAPI

afterEach(() => {
  Object.defineProperty(window, 'electronAPI', {
    configurable: true,
    value: originalElectronAPI,
  })
})

function createProject(id: string, filePath: string): Project {
  return {
    id,
    name: id,
    createdAt: 1,
    updatedAt: 1,
    assets: [{
      id: `${id}-asset`,
      type: 'video',
      path: filePath,
      url: `file:///${filePath.replace(/\\/g, '/')}`,
      prompt: '',
      resolution: '1920x1080',
      createdAt: 1,
    }],
    timelines: [],
  }
}

describe('persisted media recovery', () => {
  it('retires approved paths and leaves cancelled paths retryable', async () => {
    const firstPath = 'C:\\external-a\\clip-a.mp4'
    const secondPath = 'C:\\external-b\\clip-b.mp4'
    const recover = vi.fn()
      .mockResolvedValueOnce({ status: 'approved', approved: [firstPath] })
      .mockResolvedValueOnce({ status: 'cancelled', approved: [] })

    const firstAttempt = await recoverPersistedMediaBatches([firstPath, secondPath], recover)

    expect(recover).toHaveBeenNthCalledWith(1, [firstPath, secondPath])
    expect(recover).toHaveBeenNthCalledWith(2, [secondPath])
    expect(firstAttempt).toEqual({ approved: [firstPath], deferred: [secondPath] })

    recover.mockReset()
    recover.mockResolvedValueOnce({ status: 'approved', approved: [secondPath] })

    await expect(recoverPersistedMediaBatches(firstAttempt.deferred, recover)).resolves.toEqual({
      approved: [secondPath],
      deferred: [],
    })
  })

  it('recovers the current project after an earlier project request settles', async () => {
    const firstPath = 'C:\\external-a\\clip-a.mp4'
    const secondPath = 'C:\\external-b\\clip-b.mp4'
    let resolveFirst!: (outcome: { status: 'cancelled'; approved: [] }) => void
    let firstCalls = 0
    let secondCalls = 0
    const recover = vi.fn((paths: string[]) => {
      if (paths.includes(firstPath)) {
        firstCalls += 1
        if (firstCalls === 1) {
          return new Promise<{ status: 'cancelled'; approved: [] }>((resolve) => {
            resolveFirst = resolve
          })
        }
        return Promise.resolve({ status: 'no-pending' as const, approved: [] })
      }
      secondCalls += 1
      return Promise.resolve(secondCalls === 1
        ? { status: 'cancelled' as const, approved: [] }
        : { status: 'approved' as const, approved: [secondPath] })
    })
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      value: {
        loadProjects: vi.fn().mockResolvedValue([
          createProject('project-a', firstPath),
          createProject('project-b', secondPath),
        ]),
        recoverPersistedProjectFiles: recover,
      } as unknown as Window['electronAPI'],
    })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(ProjectProvider, null, children)
    )
    const { result } = renderHook(() => useProjects(), { wrapper })
    await waitFor(() => expect(result.current.projects).toHaveLength(2))

    act(() => result.current.setCurrentProjectId('project-a'))
    await waitFor(() => expect(recover).toHaveBeenCalledWith([firstPath]))
    act(() => result.current.setCurrentProjectId('project-b'))
    act(() => resolveFirst({ status: 'cancelled', approved: [] }))
    await waitFor(() => expect(recover).toHaveBeenCalledWith([secondPath]))

    act(() => result.current.setCurrentProjectId('project-a'))
    await waitFor(() => expect(firstCalls).toBe(2))
    act(() => result.current.setCurrentProjectId('project-b'))
    await waitFor(() => expect(secondCalls).toBe(2))
  })
})

describe('incremental persisted path approval', () => {
  it('approves loaded paths once, skips timeline edits, and handles only a new asset path', async () => {
    const loadedPath = 'C:\\AiVS\\project-a\\uploads\\loaded.mp4'
    const addedPath = 'C:\\AiVS\\project-a\\generated\\added.png'
    const approvePersistedProjectFiles = vi.fn().mockResolvedValue({ approved: [loadedPath], rejected: [] })
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      value: {
        loadProjects: vi.fn().mockResolvedValue([
          createProject('project-a', loadedPath),
          createProject('project-b', loadedPath),
        ]),
        saveProject: vi.fn().mockResolvedValue(undefined),
        approvePersistedProjectFiles,
      } as unknown as Window['electronAPI'],
    })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(ProjectProvider, null, children)
    )
    const { result } = renderHook(() => useProjects(), { wrapper })
    await waitFor(() => expect(result.current.projects).toHaveLength(2))
    await waitFor(() => expect(approvePersistedProjectFiles).toHaveBeenCalledWith([loadedPath]))

    act(() => result.current.updateTimeline('project-a', 'missing', { clips: [] }))
    expect(approvePersistedProjectFiles).toHaveBeenCalledTimes(1)

    act(() => result.current.addAsset('project-a', {
      type: 'image',
      path: addedPath,
      url: 'file:///C:/AiVS/project-a/generated/added.png',
      prompt: '',
      resolution: '512x512',
    }))
    await waitFor(() => expect(approvePersistedProjectFiles).toHaveBeenLastCalledWith([addedPath]))
    expect(approvePersistedProjectFiles).toHaveBeenCalledTimes(2)
  })
})

describe('project storage startup', () => {
  it('persists a project created before async loading completes', async () => {
    let resolveLoad!: (projects: Project[]) => void
    const loadProjects = vi.fn(() => new Promise<Project[]>((resolve) => {
      resolveLoad = resolve
    }))
    const saveProject = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      value: { loadProjects, saveProject } as unknown as Window['electronAPI'],
    })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(ProjectProvider, null, children)
    )
    const { result } = renderHook(() => useProjects(), { wrapper })
    let localProject!: Project
    act(() => { localProject = result.current.createProject('Local') })
    act(() => resolveLoad([createProject('stored', 'C:\\AiVS\\stored.mp4')]))

    await waitFor(() => expect(saveProject).toHaveBeenCalledWith(
      expect.objectContaining({ id: localProject.id, name: 'Local' }),
      0,
    ))
  })

  it('only active Strict Mode load validates loaded paths', async () => {
    const loadedPath = 'C:\\AiVS\\strict\\clip.mp4'
    const approvePersistedProjectFiles = vi.fn().mockResolvedValue({ approved: [loadedPath], rejected: [] })
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      value: {
        loadProjects: vi.fn().mockResolvedValue([createProject('strict', loadedPath)]),
        approvePersistedProjectFiles,
      } as unknown as Window['electronAPI'],
    })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(React.StrictMode, null, React.createElement(ProjectProvider, null, children))
    )
    const { result } = renderHook(() => useProjects(), { wrapper })

    await waitFor(() => expect(result.current.projects).toHaveLength(1))
    expect(approvePersistedProjectFiles).toHaveBeenCalledTimes(1)
    expect(approvePersistedProjectFiles).toHaveBeenCalledWith([loadedPath])
  })
})

describe('deleted project recovery', () => {
  it('does not apply an old recovery result after same-second project ID reuse', async () => {
    const projectId = 'Reuse_20260201_030405'
    const rejectedPath = 'C:\\external\\old.mp4'
    let resolveRecovery!: (outcome: { status: 'cancelled'; approved: [] }) => void
    const recoverPersistedProjectFiles = vi.fn(() => new Promise<{ status: 'cancelled'; approved: [] }>((resolve) => {
      resolveRecovery = resolve
    }))
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      value: {
        loadProjects: vi.fn().mockResolvedValue([createProject(projectId, rejectedPath)]),
        approvePersistedProjectFiles: vi.fn().mockResolvedValue({ approved: [], rejected: [rejectedPath] }),
        recoverPersistedProjectFiles,
      } as unknown as Window['electronAPI'],
    })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(ProjectProvider, null, children)
    )
    const { result } = renderHook(() => useProjects(), { wrapper })
    await waitFor(() => expect(result.current.projects).toHaveLength(1))
    act(() => result.current.setCurrentProjectId(projectId))
    await waitFor(() => expect(recoverPersistedProjectFiles).toHaveBeenCalledWith([rejectedPath]))

    const now = vi.spyOn(Date, 'now').mockReturnValue(new Date(2026, 0, 2, 3, 4, 5).valueOf())
    act(() => {
      result.current.deleteProject(projectId)
      expect(result.current.createProject('Reuse').id).toBe(projectId)
      result.current.setCurrentProjectId(projectId)
    })
    await act(async () => {
      resolveRecovery({ status: 'cancelled', approved: [] })
      await Promise.resolve()
    })
    now.mockRestore()

    expect(recoverPersistedProjectFiles).toHaveBeenCalledTimes(1)
  })

  it('ignores a delayed approval rejection from a deleted project lifetime', async () => {
    const projectId = 'Reuse_20260201_030405'
    const oldPath = 'C:\\external\\old.mp4'
    let resolveApproval!: (outcome: { approved: string[]; rejected: string[] }) => void
    const approvePersistedProjectFiles = vi.fn(() => new Promise<{ approved: string[]; rejected: string[] }>((resolve) => {
      resolveApproval = resolve
    }))
    const recoverPersistedProjectFiles = vi.fn()
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      value: {
        loadProjects: vi.fn().mockResolvedValue([createProject(projectId, oldPath)]),
        approvePersistedProjectFiles,
        recoverPersistedProjectFiles,
      } as unknown as Window['electronAPI'],
    })
    const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(ProjectProvider, null, children)
    const { result } = renderHook(() => useProjects(), { wrapper })
    await waitFor(() => expect(approvePersistedProjectFiles).toHaveBeenCalledWith([oldPath]))

    const now = vi.spyOn(Date, 'now').mockReturnValue(new Date(2026, 0, 2, 3, 4, 5).valueOf())
    act(() => {
      result.current.deleteProject(projectId)
      expect(result.current.createProject('Reuse').id).toBe(projectId)
      result.current.openProject(projectId)
    })
    await act(async () => {
      resolveApproval({ approved: [], rejected: [oldPath] })
      await Promise.resolve()
    })
    now.mockRestore()

    expect(recoverPersistedProjectFiles).not.toHaveBeenCalled()
  })

  it('does not let an old recovery finally release a replacement recovery', async () => {
    const projectId = 'Reuse_20260201_030405'
    const oldPath = 'C:\\external\\old.mp4'
    const newPath = 'C:\\external\\new.mp4'
    let resolveOld!: (outcome: { status: 'cancelled'; approved: [] }) => void
    let resolveNew!: (outcome: { status: 'cancelled'; approved: [] }) => void
    const recoverPersistedProjectFiles = vi.fn((paths: string[]) => new Promise<{ status: 'cancelled'; approved: [] }>((resolve) => {
      if (paths[0] === oldPath) resolveOld = resolve
      else resolveNew = resolve
    }))
    const approvePersistedProjectFiles = vi.fn()
      .mockResolvedValueOnce({ approved: [], rejected: [oldPath] })
      .mockResolvedValueOnce({ approved: [], rejected: [newPath] })
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      value: {
        loadProjects: vi.fn().mockResolvedValue([createProject(projectId, oldPath)]),
        approvePersistedProjectFiles,
        recoverPersistedProjectFiles,
      } as unknown as Window['electronAPI'],
    })
    const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(ProjectProvider, null, children)
    const { result } = renderHook(() => useProjects(), { wrapper })
    await waitFor(() => expect(result.current.projects).toHaveLength(1))
    act(() => result.current.openProject(projectId))
    await waitFor(() => expect(recoverPersistedProjectFiles).toHaveBeenCalledWith([oldPath]))

    const now = vi.spyOn(Date, 'now').mockReturnValue(new Date(2026, 0, 2, 3, 4, 5).valueOf())
    act(() => {
      result.current.deleteProject(projectId)
      const replacement = result.current.createProject('Reuse')
      result.current.addAsset(replacement.id, { type: 'video', path: newPath, url: 'file:///C:/external/new.mp4', prompt: '', resolution: '1920x1080' })
      result.current.openProject(replacement.id)
    })
    await waitFor(() => expect(recoverPersistedProjectFiles).toHaveBeenCalledWith([newPath]))
    await act(async () => {
      resolveOld({ status: 'cancelled', approved: [] })
      await Promise.resolve()
    })
    expect(recoverPersistedProjectFiles).toHaveBeenCalledTimes(2)
    await act(async () => {
      resolveNew({ status: 'cancelled', approved: [] })
      await Promise.resolve()
    })
    now.mockRestore()
  })
})

describe('project persistence retry', () => {
  it('retains a failed latest snapshot until explicit retry persists it', async () => {
    vi.useFakeTimers()
    const saveProject = vi.fn()
      .mockRejectedValueOnce(new Error('disk full'))
      .mockRejectedValueOnce(new Error('disk full'))
      .mockResolvedValueOnce(undefined)
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      value: {
        loadProjects: vi.fn().mockResolvedValue([]),
        migrateProjectsFromLocalStorage: vi.fn().mockResolvedValue([]),
        saveProject,
      } as unknown as Window['electronAPI'],
    })
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => undefined)
    const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(ProjectProvider, null, children)
    const { result } = renderHook(() => useProjects(), { wrapper })
    await act(async () => { await Promise.resolve() })
    let project!: Project
    act(() => { project = result.current.createProject('Retry') })
    await act(async () => { await vi.runAllTimersAsync() })
    expect(result.current.persistenceStatus).toMatchObject({ pendingCount: 1, saving: false, lastError: 'disk full' })

    await act(async () => {
      result.current.retryProjectPersistence()
      await Promise.resolve()
    })
    expect(saveProject).toHaveBeenCalledTimes(3)
    expect(saveProject).toHaveBeenLastCalledWith(expect.objectContaining({ id: project.id, name: 'Retry' }), 0)
    expect(result.current.persistenceStatus).toEqual({ pendingCount: 0, saving: false, lastError: null })
    alert.mockRestore()
    vi.useRealTimers()
  })
})

describe('project-state render isolation', () => {
  it('keeps unrelated domain consumers and action callbacks stable', () => {
    let assetRenders = 0
    let editorRenders = 0
    let directorRenders = 0
    let observedActiveTimelineId: string | undefined
    type ControlsState = {
      createProject: ReturnType<typeof useProjectList>['createProject']
      openProject: ReturnType<typeof useProjectNavigation>['openProject']
      setCurrentTab: ReturnType<typeof useProjectNavigation>['setCurrentTab']
      addAsset: ReturnType<typeof useProjectAssets>['addAsset']
      toggleFavorite: ReturnType<typeof useProjectAssets>['toggleFavorite']
      createAssetBin: ReturnType<typeof useProjectAssets>['createAssetBin']
      addTimeline: ReturnType<typeof useEditorTimelines>['addTimeline']
      setActiveTimeline: ReturnType<typeof useEditorTimelines>['setActiveTimeline']
      updateTimeline: ReturnType<typeof useEditorTimelines>['updateTimeline']
      addDirectorTimeline: ReturnType<typeof useDirectorTimelines>['addDirectorTimeline']
      assetAction: ReturnType<typeof useProjectAssets>['addAsset']
      timelineAction: ReturnType<typeof useEditorTimelines>['updateTimeline']
    }
    const controlsRef: { current: ControlsState | null } = { current: null }

    function AssetProbe() {
      useProjectAssets()
      assetRenders += 1
      return null
    }

    function EditorProbe() {
      observedActiveTimelineId = useEditorTimelines().activeTimelineId
      editorRenders += 1
      return null
    }

    function DirectorProbe() {
      useDirectorTimelines()
      directorRenders += 1
      return null
    }

    function Controls() {
      const projectList = useProjectList()
      const navigation = useProjectNavigation()
      const assets = useProjectAssets()
      const timelines = useEditorTimelines()
      const directorTimelines = useDirectorTimelines()
      controlsRef.current = {
        createProject: projectList.createProject,
        openProject: navigation.openProject,
        setCurrentTab: navigation.setCurrentTab,
        addAsset: assets.addAsset,
        toggleFavorite: assets.toggleFavorite,
        createAssetBin: assets.createAssetBin,
        addTimeline: timelines.addTimeline,
        setActiveTimeline: timelines.setActiveTimeline,
        updateTimeline: timelines.updateTimeline,
        addDirectorTimeline: directorTimelines.addDirectorTimeline,
        assetAction: assets.addAsset,
        timelineAction: timelines.updateTimeline,
      }
      return null
    }

    render(React.createElement(
      ProjectProvider,
      null,
      React.createElement(AssetProbe),
      React.createElement(EditorProbe),
      React.createElement(DirectorProbe),
      React.createElement(Controls),
    ))

    if (!controlsRef.current) throw new Error('Project controls were not mounted')
    const project = controlsRef.current.createProject('Isolation')
    act(() => controlsRef.current?.openProject(project.id))
    let secondTimelineId = ''
    act(() => {
      secondTimelineId = controlsRef.current?.addTimeline(project.id, 'Timeline 2').id ?? ''
    })
    act(() => controlsRef.current?.setActiveTimeline(project.id, secondTimelineId))
    expect(observedActiveTimelineId).toBe(secondTimelineId)
    const initialAssetAction = controlsRef.current.assetAction
    const initialTimelineAction = controlsRef.current.timelineAction
    const assetRendersBeforeTimeline = assetRenders

    act(() => controlsRef.current?.addDirectorTimeline(
      project.id,
      createDirectorSequence('ltx2_22b_distilled', '720p', '16:9'),
    ))
    expect(assetRenders).toBe(assetRendersBeforeTimeline)
    const directorRendersAfterDirector = directorRenders

    act(() => controlsRef.current?.updateTimeline(project.id, project.timelines[0].id, { clips: [] }))
    expect(assetRenders).toBe(assetRendersBeforeTimeline)
    expect(directorRenders).toBe(directorRendersAfterDirector)
    expect(controlsRef.current?.assetAction).toBe(initialAssetAction)

    let addedAssetId = ''
    act(() => {
      addedAssetId = controlsRef.current?.addAsset(project.id, {
        type: 'image',
        path: 'C:\\asset.png',
        url: 'file:///C:/asset.png',
        prompt: '',
        resolution: '512x512',
      }).id ?? ''
    })
    const editorRendersAfterAsset = editorRenders
    act(() => controlsRef.current?.toggleFavorite(project.id, addedAssetId))
    expect(editorRenders).toBe(editorRendersAfterAsset)
    act(() => controlsRef.current?.createAssetBin(project.id, 'Favorites'))
    expect(editorRenders).toBe(editorRendersAfterAsset)

    act(() => controlsRef.current?.setCurrentTab('director'))
    expect(controlsRef.current?.assetAction).toBe(initialAssetAction)
    expect(controlsRef.current?.timelineAction).toBe(initialTimelineAction)
  })
})
