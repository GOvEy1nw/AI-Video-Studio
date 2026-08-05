---
suggested_backlog_id: AIVS-020
title: Serialize and coalesce project persistence and approve paths incrementally
status: Draft
priority: high
type: performance
baseline_commit: c405f8224a8a510140591a9b76a568f3a78b49ad
dependencies:
  - AIVS-019
---

# PR 05 — Serialize/coalesce project persistence and approve paths incrementally

## Pull request intent

Make project writes ordered, latest-state-wins, retryable, and cheap to schedule. Remove the full-project/full-asset path scan that currently runs on every project-state change.

This PR protects data while reducing renderer work and disk/index churn.

## Current behaviour and risks

The current `ProjectProvider` persistence effect:

1. compares project object references;
2. adds changed IDs to mutable sets;
3. updates the persisted-project map immediately;
4. starts a 500 ms timer;
5. clears pending IDs before awaiting writes;
6. saves/deletes several projects concurrently.

If a save fails, the error is reported but the cleared snapshot is not automatically restored to the queue.

A second effect walks all projects, assets, and takes after every `projects` change to discover new paths. Existing refs prevent repeated IPC calls for the same path, but not repeated O(all-assets) scans.

Electron project files are written atomically, but concurrent save/delete calls can still race around index read/modify/write.

## Target behaviour

```text
Project mutation
└─ enqueue latest immutable snapshot immediately
   └─ one global persistence drain
      ├─ coalesces repeated updates per project
      ├─ serializes index-affecting operations
      ├─ retries/requeues on failure
      ├─ delete supersedes pending save
      └─ marks snapshot persisted only after success
```

Path approval becomes event-driven:

- project load/migration;
- imported/generated asset creation;
- take creation;
- explicit file selection.

Timeline edits must not scan all asset paths.

## Implementation plan

### 1. Extract a small coalescing persistence queue

Create `frontend/contexts/project/project-persistence-queue.ts` as a focused class or closure—not a generic job framework.

Suggested internal records:

```ts
type PendingSave = {
  project: Project;
  position: number;
  revision: number;
};

type PendingDelete = {
  id: string;
  revision: number;
};
```

Queue invariants:

- one drain loop at a time;
- at most one latest save snapshot per project ID;
- enqueueing v2 replaces pending v1 before v1 starts;
- if v1 is in flight and v2 arrives, v2 remains pending and runs next;
- delete removes pending saves and executes after any in-flight operation for that ID;
- a failed operation is requeued with bounded retry/backoff;
- persisted revision advances only after IPC success;
- fatal/repeated failure is surfaced once but pending state remains observable/retryable.

Do not create a general scheduler package.

### 2. Move change detection to the state mutation boundary

Preferred approach:

- every persisted project mutation uses a shared `commitProjectUpdate` helper;
- the helper updates React state and enqueues the returned project snapshot;
- no later effect has to compare every project reference.

If migrating every mutation in one step is too risky, keep a narrow effect temporarily, but it must enqueue snapshots without marking them persisted and must be removed before PR completion.

New project creation, rename, asset updates, timeline updates, Director updates, and GenSpace seed changes all use the same enqueue path.

### 3. Serialize Electron project storage operations

Update the renderer queue to call saves/deletes sequentially. Also harden `electron/project-storage.ts` so index mutations are protected even if another caller appears later.

A module-local promise chain/mutex is sufficient:

```ts
let storageOperation = Promise.resolve();

function enqueueStorageOperation<T>(operation: () => Promise<T>): Promise<T> {
  const result = storageOperation.then(operation, operation);
  storageOperation = result.then(() => undefined, () => undefined);
  return result;
}
```

Apply it to save/delete/migration operations that can modify `index.json`.

Do not serialize read-only project loads behind long file copies.

### 4. Reduce project JSON write cost safely

`writeJsonAtomically` currently pretty-prints complete project JSON.

Change to compact JSON unless human-readable project files are an explicit supported feature:

```ts
JSON.stringify(value)
```

Record before/after file size for the benchmark fixture.

Keep:

- temporary file;
- atomic rename;
- valid-path checks;
- storage version.

Optional: add a trailing newline only if desired.

### 5. Remove the repeated path-discovery effect

Delete the effect that walks every project/asset/take whenever `projects` changes.

Add a batch preload API:

```ts
approveLocalPaths(filePaths: string[]): Promise<void>
```

or keep the existing single-path API behind a frontend helper that deduplicates and batches calls. One IPC call is preferable for loading a project with many paths.

Approval boundaries:

- after `loadProjects` / migration: collect each loaded document’s unique asset/take paths once;
- after import/copy/generated persistence: approve the returned destination path immediately;
- when adding a take: approve that take path;
- file dialogs already approve selected paths in Electron;
- saved timeline edits do nothing.

Do not weaken `validatePath` or permitted roots.

### 6. Failure and status handling

Expose persistence state for diagnostics, not normal UI noise:

```ts
type ProjectPersistenceStatus = {
  pendingCount: number;
  saving: boolean;
  lastError: string | null;
  retry(): void;
};
```

The existing once-only alert can remain for a hard failure, but:

- it must not imply the data was saved;
- retry must be possible;
- later successful persistence should clear error state.

Log project ID/revision, never complete project JSON.

### 7. Flush boundaries

Because snapshots enter the queue at mutation time, normal navigation does not lose the latest state.

Add explicit `flush()` calls where practical:

- before destructive project deletion;
- before replacing/migrating storage;
- in a controlled app-close handshake if the existing Electron lifecycle supports it cleanly.

Do not introduce synchronous renderer IPC or block the window for every tab switch.

If a full close handshake is beyond this PR, document the remaining abrupt-process-termination window honestly.

## Target files

- `frontend/contexts/project/ProjectProvider.tsx`
- new `frontend/contexts/project/project-persistence-queue.ts`
- `electron/project-storage.ts`
- `electron/ipc/project-storage-handlers.ts`
- `electron/ipc/file-handlers.ts` (batch approval only)
- `electron/preload.ts`
- current media import/result persistence owners
- focused queue/storage tests
- `docs/PROJECT_STORAGE.md` or current storage documentation

## Commit plan

### Commit 1 — `refactor(project-storage): add latest-snapshot persistence queue`

- Pure queue.
- Provider enqueue integration.
- failure/retry state.

### Commit 2 — `fix(project-storage): serialize atomic project index operations`

- Electron storage mutex/chain.
- compact writes.
- migration/delete ordering.

### Commit 3 — `perf(paths): approve asset paths at load and creation boundaries`

- batch API/helper.
- remove full-library effect.
- wire import/take/generation paths.

## Critical tests only

Keep/add focused pure/integration cases:

1. rapid v1→v2→v3 updates persist v1 if already in flight, then only v3;
2. failed latest save remains pending and succeeds after retry;
3. delete supersedes pending save and leaves the index/file deleted;
4. timeline-only update does not invoke path approval.

Four tests are sufficient. Do not test timers by sleeping; use injected queue/deferred promises or fake timers.

## Measurement

Fixture:

- one project;
- 1,000 assets/takes;
- a Video Editor timeline receiving 50 quick edits.

Record:

- number of save IPC calls;
- number of project JSON writes;
- path-approval calls;
- JSON byte size;
- main/renderer long tasks during edits.

## Acceptance criteria

- [ ] Only one project storage mutation is in flight at a time.
- [ ] The latest project snapshot cannot be silently lost after a failed write.
- [ ] Repeated updates coalesce.
- [ ] Delete wins over pending save for the same project.
- [ ] Index read/modify/write is serialized in Electron.
- [ ] Persisted revision advances only after success.
- [ ] Timeline edits no longer scan all project asset/take paths.
- [ ] Project load approves unique stored paths once.
- [ ] Import/generation/take creation approves only the returned new path.
- [ ] Path validation/security rules are unchanged.
- [ ] Project files remain atomically written and reload correctly.
- [ ] Focused queue/storage tests, typecheck, and build pass.
- [ ] No UI layout tests are added.

## Non-goals

- Do not split project JSON into per-asset/per-timeline files.
- Do not implement the summary/lazy project index from PR 11.
- Do not add a database.
- Do not send full project JSON to logs.
- Do not use synchronous IPC to “guarantee” every save.
