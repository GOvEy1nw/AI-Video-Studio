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
