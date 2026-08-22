import { act, renderHook } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { DEFAULT_VIDEO_SETTINGS } from '../views/genspace/constants'
import { useGeneration } from './use-generation'

const queue: { submit: ReturnType<typeof vi.fn>; active: { id: string } | null; cancel: ReturnType<typeof vi.fn> } = { submit: vi.fn(), active: null, cancel: vi.fn() }
vi.mock('../contexts/GenerationQueueContext', () => ({ useGenerationQueue: () => queue }))
vi.mock('../contexts/ProjectContext', () => ({ useProjects: () => ({ currentProjectId: 'project', currentProject: { id: 'project', assets: [] } }) }))
vi.mock('../contexts/ModelProfilesContext', () => ({ useModelProfiles: () => ({ all: [] }) }))

beforeEach(() => {
  queue.submit.mockReset()
  queue.cancel.mockReset()
  queue.active = null
})

it('blocks duplicate button submissions only while queue admission is pending', async () => {
  let resolveAdmission!: () => void
  queue.submit.mockReturnValue(new Promise((resolve) => { resolveAdmission = () => resolve({ jobId: 'job-b', duplicate: false }) }))
  const { result } = renderHook(() => useGeneration())
  let admission!: Promise<void>

  act(() => { admission = result.current.generate('scene', null, { ...DEFAULT_VIDEO_SETTINGS, cameraMotion: 'none' }) })
  expect(result.current.isGenerating).toBe(true)

  resolveAdmission()
  await act(() => admission)

  expect(result.current.isGenerating).toBe(false)
  expect(queue.submit).toHaveBeenCalledWith(expect.objectContaining({
    kind: 'video.generate',
    clientContext: expect.objectContaining({ projectId: 'project', schemaVersion: 1 }),
  }))
})

it('cancels the job submitted by this hook rather than another active job', async () => {
  queue.active = { id: 'job-a' }
  queue.submit.mockResolvedValue({ jobId: 'job-b', duplicate: false })
  const { result } = renderHook(() => useGeneration())

  await act(() => result.current.generate('scene', null, { ...DEFAULT_VIDEO_SETTINGS, cameraMotion: 'none' }))
  await act(() => result.current.cancel())

  expect(queue.cancel).toHaveBeenCalledWith('job-b')
})

it('does not cancel a prior job while a new admission is unresolved', async () => {
  queue.submit.mockResolvedValueOnce({ jobId: 'job-a', duplicate: false })
  const { result } = renderHook(() => useGeneration())
  await act(() => result.current.generate('first', null, { ...DEFAULT_VIDEO_SETTINGS, cameraMotion: 'none' }))

  let resolveAdmission!: () => void
  queue.submit.mockReturnValueOnce(new Promise((resolve) => { resolveAdmission = () => resolve({ jobId: 'job-b', duplicate: false }) }))
  let admission!: Promise<void>
  act(() => { admission = result.current.generate('second', null, { ...DEFAULT_VIDEO_SETTINGS, cameraMotion: 'none' }) })
  await act(() => result.current.cancel())

  expect(queue.cancel).not.toHaveBeenCalled()
  resolveAdmission()
  await act(() => admission)
})
