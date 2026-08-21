import { describe, expect, it, vi } from 'vitest'
import type { Project } from '../types/project'
import { ProjectPersistenceQueue } from './project-persistence-queue'

function project(id: string, name: string): Project {
  return { id, name, createdAt: 1, updatedAt: 1, assets: [], timelines: [] }
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })
  return { promise, resolve, reject }
}

describe('ProjectPersistenceQueue', () => {
  it('persists one in-flight snapshot then coalesces to latest replacement', async () => {
    const first = deferred<void>()
    const save = vi.fn().mockReturnValueOnce(first.promise).mockResolvedValue(undefined)
    const queue = new ProjectPersistenceQueue({ save, remove: vi.fn(), onError: vi.fn(), maxAutomaticRetries: 0 })

    queue.enqueueSave(project('p', 'v1'), 0)
    queue.enqueueSave(project('p', 'v2'), 0)
    queue.enqueueSave(project('p', 'v3'), 0)
    first.resolve()
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(2))

    expect(save.mock.calls.map(([snapshot]) => snapshot.name)).toEqual(['v1', 'v3'])
    expect(queue.getPersistedRevision('p')).toBe(3)
  })

  it('retains failed latest snapshot until manual retry succeeds', async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error('disk full')).mockResolvedValue(undefined)
    const queue = new ProjectPersistenceQueue({ save, remove: vi.fn(), onError: vi.fn(), maxAutomaticRetries: 0 })

    queue.enqueueSave(project('p', 'latest'), 0)
    await vi.waitFor(() => expect(queue.pendingCount).toBe(1))
    expect(queue.getPersistedRevision('p')).toBeUndefined()

    queue.retry()
    await vi.waitFor(() => expect(queue.getPersistedRevision('p')).toBe(1))
    expect(save).toHaveBeenCalledTimes(2)
  })

  it('lets delete supersede a queued save', async () => {
    const first = deferred<void>()
    const save = vi.fn().mockReturnValueOnce(first.promise)
    const remove = vi.fn().mockResolvedValue(undefined)
    const queue = new ProjectPersistenceQueue({ save, remove, onError: vi.fn(), maxAutomaticRetries: 0 })

    queue.enqueueSave(project('p', 'v1'), 0)
    queue.enqueueSave(project('p', 'v2'), 0)
    queue.enqueueDelete('p')
    first.resolve()
    await vi.waitFor(() => expect(remove).toHaveBeenCalledWith('p'))

    expect(save).toHaveBeenCalledTimes(1)
    expect(queue.getPersistedRevision('p')).toBe(3)
  })

  it('settles an exact revision waiter when a newer coalesced save covers it', async () => {
    const first = deferred<void>()
    const save = vi.fn().mockReturnValueOnce(first.promise).mockResolvedValue(undefined)
    const queue = new ProjectPersistenceQueue({ save, remove: vi.fn(), onError: vi.fn(), maxAutomaticRetries: 0 })

    const revision = queue.enqueueSave(project('p', 'first'), 0)
    const persisted = queue.waitForPersistedRevision('p', revision)
    queue.enqueueSave(project('p', 'latest'), 0)
    first.resolve()

    await expect(persisted).resolves.toBeUndefined()
    expect(queue.getPersistedRevision('p')).toBe(2)
  })

  it('rejects an exact revision waiter after its final save failure', async () => {
    const queue = new ProjectPersistenceQueue({ save: vi.fn().mockRejectedValue(new Error('disk full')), remove: vi.fn(), onError: vi.fn(), maxAutomaticRetries: 0 })
    const revision = queue.enqueueSave(project('p', 'latest'), 0)

    await expect(queue.waitForPersistedRevision('p', revision)).rejects.toThrow('disk full')
  })
})
