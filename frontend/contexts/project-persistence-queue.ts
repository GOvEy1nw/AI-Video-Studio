import type { Project } from '../types/project'

export type ProjectPersistenceOperation =
  | { kind: 'save'; project: Project; position: number; revision: number; attempts: number }
  | { kind: 'delete'; id: string; revision: number; attempts: number }

type ProjectPersistenceQueueOptions = {
  save: (project: Project, position: number) => Promise<void>
  remove: (id: string) => Promise<void>
  onError: (error: unknown, operation: ProjectPersistenceOperation) => void
  onPersisted?: (operation: ProjectPersistenceOperation) => void
  onChange?: (state: { pendingCount: number; saving: boolean }) => void
  maxAutomaticRetries?: number
  retryDelayMs?: number
}

/** One ordered latest-snapshot queue for project storage, not a general scheduler. */
export class ProjectPersistenceQueue {
  private readonly pending = new Map<string, ProjectPersistenceOperation>()
  private readonly revisions = new Map<string, number>()
  private readonly persistedRevisions = new Map<string, number>()
  private readonly maxAutomaticRetries: number
  private readonly retryDelayMs: number
  private readonly waiters = new Map<string, Map<number, { resolve: () => void; reject: (error: unknown) => void }[]>>()
  private draining = false
  private retryTimer: ReturnType<typeof setTimeout> | null = null

  constructor(private readonly options: ProjectPersistenceQueueOptions) {
    this.maxAutomaticRetries = options.maxAutomaticRetries ?? 1
    this.retryDelayMs = options.retryDelayMs ?? 500
  }

  enqueueSave(project: Project, position: number): number {
    const revision = this.nextRevision(project.id)
    this.pending.set(project.id, { kind: 'save', project, position, revision, attempts: 0 })
    void this.drain()
    this.notify()
    return revision
  }

  enqueueDelete(id: string): number {
    const revision = this.nextRevision(id)
    this.pending.set(id, { kind: 'delete', id, revision, attempts: 0 })
    void this.drain()
    this.notify()
    return revision
  }

  retry(): void {
    for (const [id, operation] of this.pending) {
      this.pending.set(id, { ...operation, attempts: 0 })
    }
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }
    void this.drain()
    this.notify()
  }

  getPersistedRevision(id: string): number | undefined {
    return this.persistedRevisions.get(id)
  }

  getRevision(id: string): number | undefined {
    return this.revisions.get(id)
  }

  waitForPersistedRevision(id: string, revision: number): Promise<void> {
    if ((this.persistedRevisions.get(id) ?? 0) >= revision) return Promise.resolve()
    return new Promise<void>((resolve, reject) => {
      const byRevision = this.waiters.get(id) ?? new Map()
      const waiters = byRevision.get(revision) ?? []
      waiters.push({ resolve, reject })
      byRevision.set(revision, waiters)
      this.waiters.set(id, byRevision)
    })
  }

  get pendingCount(): number {
    return this.pending.size
  }

  get saving(): boolean {
    return this.draining
  }

  private nextRevision(id: string): number {
    const revision = (this.revisions.get(id) ?? 0) + 1
    this.revisions.set(id, revision)
    return revision
  }

  private async drain(): Promise<void> {
    if (this.draining || this.retryTimer) return
    this.draining = true
    this.notify()
    try {
      while (this.pending.size > 0) {
        const [id, operation] = this.pending.entries().next().value as [string, ProjectPersistenceOperation]
        this.pending.delete(id)
        this.notify()
        try {
          if (operation.kind === 'save') await this.options.save(operation.project, operation.position)
          else await this.options.remove(operation.id)
          this.persistedRevisions.set(id, operation.revision)
          this.resolveWaiters(id, operation.revision)
          this.options.onPersisted?.(operation)
          this.notify()
        } catch (error) {
          const replacement = this.pending.get(id)
          if (!replacement) {
            this.pending.set(id, { ...operation, attempts: operation.attempts + 1 })
            this.notify()
          }
          this.options.onError(error, operation)
          const current = this.pending.get(id)
          if (current && current.attempts <= this.maxAutomaticRetries) {
            this.retryTimer = setTimeout(() => {
              this.retryTimer = null
              void this.drain()
            }, this.retryDelayMs)
          } else {
            this.rejectWaiters(id, operation.revision, error)
          }
          break
        }
      }
    } finally {
      this.draining = false
      this.notify()
    }
  }

  private notify(): void {
    this.options.onChange?.({ pendingCount: this.pendingCount, saving: this.saving })
  }

  private resolveWaiters(id: string, persistedRevision: number): void {
    const byRevision = this.waiters.get(id)
    if (!byRevision) return
    for (const [revision, waiters] of byRevision) {
      if (revision <= persistedRevision) {
        byRevision.delete(revision)
        waiters.forEach(({ resolve }) => resolve())
      }
    }
    if (byRevision.size === 0) this.waiters.delete(id)
  }

  private rejectWaiters(id: string, failedRevision: number, error: unknown): void {
    const byRevision = this.waiters.get(id)
    if (!byRevision) return
    for (const [revision, waiters] of byRevision) {
      if (revision <= failedRevision) {
        byRevision.delete(revision)
        waiters.forEach(({ reject }) => reject(error))
      }
    }
    if (byRevision.size === 0) this.waiters.delete(id)
  }
}
