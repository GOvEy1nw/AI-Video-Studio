import React from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Project } from '../types/project'
import { ProjectProvider, recoverPersistedMediaBatches, useProjects } from './ProjectContext'

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
