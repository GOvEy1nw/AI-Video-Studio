---
suggested_backlog_id: AIVS-026
title: Conditionally lazy-load full project documents from a summary index
status: Draft
priority: medium
type: performance
baseline_commit: c405f8224a8a510140591a9b76a568f3a78b49ad
dependencies:
  - AIVS-019
  - AIVS-020
  - AIVS-022
conditional: true
---

# PR 11 — Conditional: lazy-load full project documents from a summary index

## Pull request intent

Stop reading/parsing every historical project document before Home can show the project list.

**Do not start implementation until the measurement gate passes.** This PR adds meaningful storage/state complexity and is unnecessary for users with a small project collection.

## Measurement gate

Create a representative local fixture:

- at least 50 project summaries;
- at least 5 large projects with 500+ assets and/or several hundred timeline clips;
- realistic generation metadata;
- valid static project thumbnails.

Measure packaged/unpacked startup:

1. Electron project storage read/parse duration;
2. time from renderer start to Home project list;
3. renderer heap/working set on Home;
4. total project JSON bytes parsed;
5. Home project-card media work.

Implement this PR only if either:

- project load/parse contributes at least 250 ms median on the target Windows machine; or
- loading unopened project documents contributes at least 100 MB to Home renderer working set; or
- the project count/size is already a demonstrated user pain.

Record the gate result in Backlog. If the gate fails, close this task as `not planned` or move it to the project’s equivalent deferred state with evidence.

## Current storage model

`electron/project-storage.ts` index:

```ts
interface ProjectIndex {
  version: number;
  migratedLocalStorageVersion: number;
  projectIds: string[];
}
```

`loadStoredProjects()` reads/parses every project file with `Promise.all`.

`ProjectProvider` keeps complete `Project[]`.

Home needs primarily:

- ID;
- name;
- created/updated timestamps;
- static thumbnail;
- perhaps asset/timeline counts.

Home currently scans full asset arrays to choose a thumbnail and can mount video fallbacks.

## Target storage model

Version 2 index:

```ts
interface ProjectSummary {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
  assetCount: number;
  editorTimelineCount: number;
  directorTimelineCount: number;
}

interface ProjectIndexV2 {
  version: 2;
  migratedLocalStorageVersion: number;
  projects: ProjectSummary[];
}
```

IPC:

```text
projects-list                 -> ProjectSummary[]
project-load(id)              -> Project
projects-save(project, pos)   -> updated ProjectSummary
projects-delete(id)
projects-migrate...
```

Renderer state:

```text
projectSummaries: ProjectSummary[]
loadedProjects: Map<projectId, Project>
currentProjectId
dirty/in-flight project IDs
```

Home consumes summaries only.

## Implementation plan

### 1. Add project-summary derivation

Create one pure function shared conceptually by Electron and renderer, or keep Electron canonical:

```ts
summariseProject(project: ProjectLike): ProjectSummary
```

Thumbnail rule:

1. explicit project thumbnail that is a static image;
2. persisted asset thumbnail;
3. no thumbnail/placeholder.

Do not store a video URL as a Home thumbnail.

If a generated/imported video has no thumbnail yet, PR 07’s thumbnail service can produce one and update project/asset metadata asynchronously.

### 2. Migrate index schema safely

`readIndex()` must accept:

- missing index;
- v1 ID array;
- v2 summary array;
- malformed individual entries.

V1→V2 migration:

1. read each project once;
2. derive summary;
3. write v2 index atomically;
4. retain project files unchanged;
5. mark migration complete only after successful write.

Do not delete a project because its summary cannot be parsed. Record a recoverable placeholder and surface a load error on open.

### 3. Add list/load IPC

Expose narrow APIs through the shared Electron contract:

```ts
listProjects(): Promise<ProjectSummary[]>
loadProject(id: string): Promise<Project>
```

`loadProject`:

- validates ID;
- reads one file asynchronously;
- parses/migrates/recover URLs;
- returns a full document.

Project recovery/migration ownership should be moved out of broad Home startup and run for the loaded document. If recovery changes persisted data, enqueue a save after successful load.

### 4. Refactor Project Provider state

Keep:

- summaries ordered for Home;
- a map of loaded full documents;
- current project ID;
- persistence queue from PR 05.

Open flow:

1. set an opening/loading state;
2. return cached loaded document if present;
3. otherwise call `loadProject(id)`;
4. migrate/recover;
5. store in loaded map;
6. enter project view.

Do not render Project with `currentProject=null` as a “not found” flash during normal load; show a small project-opening state.

### 5. Handle background generation/project switching

GenSpace result persistence currently captures the submission project ID and must save to that project even if the user switches.

Rules:

- a project with an active generation/submission snapshot remains loaded/pinned;
- persistence queue may save non-active loaded projects;
- do not evict dirty, in-flight, or generation-owned project documents;
- if a result targets an unloaded project unexpectedly, load it before applying the result or retain the submission snapshot’s complete project update owner.

Start with no automatic eviction of loaded projects. The main startup win comes from not loading all projects; an LRU of loaded projects is optional only after memory measurement.

### 6. Update summary transactionally

After a successful project save:

- derive summary from the saved snapshot;
- update index under the serialized storage queue;
- return/publish the new summary;
- update Home ordering/thumbnail.

A failed document write must not advance the summary/index as though it succeeded.

Delete removes both document and summary atomically/serially.

### 7. Refactor Home

`Home.tsx` should accept/consume `ProjectSummary`.

Project cards:

- do not scan `project.assets`;
- do not mount video;
- static lazy/async image or placeholder only;
- rename/delete update summary immediately/optimistically only with rollback or after successful queue ownership.

### 8. Keep APIs simple

Do not introduce:

- a client-side database;
- entity normalisation for assets/clips;
- remote sync;
- pagination unless project counts prove it is needed;
- automatic loaded-project eviction in the first implementation.

## Target files

- `electron/project-storage.ts`
- `electron/ipc/project-storage-handlers.ts`
- `electron/preload.ts` / shared `ElectronAPI`
- project state provider/contexts from PR 04
- persistence queue from PR 05
- `frontend/views/Home.tsx`
- project types/migration helpers
- focused storage migration/lazy-load tests
- storage documentation

## Commit plan

### Commit 1 — `feat(project-storage): add v2 project summary index`

- summary type/derivation;
- migration;
- list/load IPC.

### Commit 2 — `perf(project-state): load full project documents on open`

- provider summaries/loaded map;
- opening state;
- generation/persistence pinning.

### Commit 3 — `perf(home): render project summaries with static thumbnails`

- Home/card migration;
- no full asset scans/videos.

## Critical tests only

1. v1 index migrates to v2 summaries without changing/deleting project files;
2. listing summaries does not read all full documents after v2 exists;
3. opening one project loads one full document;
4. a result/save to a non-current but loaded/pinned submission project remains correct;
5. failed document save does not advance summary.

Do not test Home card layout or exact placeholder markup.

## Acceptance criteria

- [ ] The measurement gate and before values are recorded.
- [ ] Home project list loads from summaries without parsing every full project.
- [ ] V1 storage migrates safely and atomically.
- [ ] Opening a project loads only that document unless another is pinned/active.
- [ ] Home cards use static thumbnails/placeholders and no video elements.
- [ ] Active generation/project persistence remains project-safe across navigation.
- [ ] Dirty/in-flight projects are never evicted.
- [ ] Summary updates occur only after successful document persistence.
- [ ] Startup/project-list median improves enough to justify the complexity; target at least 30% reduction in measured project-storage contribution.
- [ ] Focused storage tests, typecheck, and production build pass.
- [ ] No UI layout tests are added.

## Non-goals

- Do not add an asset database.
- Do not split one project into hundreds of files.
- Do not add loaded-project LRU eviction without separate measurement.
- Do not paginate Home by default.
- Do not proceed if the measurement gate fails.
