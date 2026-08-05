---
suggested_backlog_id: AIVS-019
title: Isolate project-state domains and consumer renders
status: Draft
priority: high
type: refactor
baseline_commit: c405f8224a8a510140591a9b76a568f3a78b49ad
dependencies:
  - AIVS-017
  - AIVS-018
---

# PR 04 — Isolate project-state domains and consumer renders

## Pull request intent

Prevent an update in one project domain from invalidating every project consumer. Keep the current data model and mutation semantics, but expose stable, narrower context values.

This is a render-isolation refactor, not a move to Redux/Zustand and not a project-schema rewrite.

## Current problem

`frontend/contexts/ProjectContext.tsx` owns and exposes in one value:

- app navigation;
- project list/current project;
- asset CRUD, takes, favourites, bins;
- Video Editor timelines;
- Director timelines;
- GenSpace seed;
- editor→GenSpace hand-offs;
- retake updates.

The Provider value is written inline. Any provider render creates a new object. Because the project workspaces are or can be kept mounted after first visit, unrelated consumers can rerender on every asset/timeline/navigation mutation.

The existing mutation functions already preserve many unrelated array references, which allows a low-risk split.

## Design constraints

- Keep one internal `projects` state owner.
- Do not add a state-management package.
- Do not create one file per tiny context.
- Preserve current project schema and action semantics.
- Preserve submission-project result persistence even after the user switches projects.
- Keep a temporary `useProjects()` compatibility adapter during migration, but remove it from hot consumers.

## Target structure

Recommended folder:

```text
frontend/contexts/project/
├─ ProjectProvider.tsx
├─ ProjectContexts.ts
├─ project-mutations.ts
└─ project-selectors.ts
```

Keep the number of files small and ownership obvious.

Recommended public hooks:

```text
useProjectNavigation()
useProjectList()
useProjectMeta()
useProjectAssets()
useEditorTimelines()
useDirectorTimelines()
useGenSpaceHandoffs()
```

The exact names may follow existing conventions; the domain split is the contract.

## Context domains

### 1. Navigation

Value:

- `currentView`
- `currentProjectId`
- `currentTab`
- setters/helpers: `openProject`, `goHome`, `setCurrentTab`

Must not include projects/assets/timelines.

### 2. Project list and metadata

Value:

- ordered project list (full documents for now);
- create/delete/rename;
- lightweight current-project metadata:
  - ID
  - name
  - created/updated
  - thumbnail
  - GenSpace seed fields.

Do not include asset arrays in a metadata-only context.

### 3. Current project assets

Value:

- `assets`
- `assetBins`
- `assetBinColors`
- asset/take/bin actions.

The value must be memoised from the active project’s asset references and stable action callbacks.

A Video Editor timeline update must not change this context value if assets/bins are unchanged.

### 4. Video Editor timelines

Value:

- timelines;
- active timeline ID;
- timeline CRUD/update/get helpers.

An asset favourite/bin update must not change this context value.

### 5. Director timelines

Value:

- Director timeline documents;
- active Director timeline ID;
- Director CRUD/update/get helpers.

### 6. Cross-workspace hand-offs

Value:

- GenSpace edit image/mode/audio;
- retake source;
- pending retake update.

These change rarely and should not invalidate project asset/timeline consumers.

## Implementation plan

### Phase 1 — extract pure mutations/selectors

Move repetitive `setProjects(prev => prev.map(...))` logic into pure functions where that improves reference preservation and reviewability.

Examples:

```ts
updateProjectAssets(project, updater)
updateProjectTimeline(project, timelineId, updater)
updateDirectorTimelineDocument(project, timelineId, updater)
```

Rules:

- return the original project when no semantic change occurs;
- preserve unchanged arrays/objects;
- update `updatedAt` only for real persisted changes;
- do not introduce a reducer containing every app action unless it materially simplifies the current code.

Add no test for trivial object spreading. Retain tests for reference preservation where it controls rerenders.

### Phase 2 — build domain contexts inside one provider

`ProjectProvider` keeps:

```ts
const [projects, setProjects] = useState<Project[]>(...)
```

and constructs separately memoised values:

```ts
const assetsValue = useMemo(
  () => ({
    assets: currentProject?.assets ?? EMPTY_ASSETS,
    bins: currentProject?.assetBins ?? EMPTY_BINS,
    ...
  }),
  [
    currentProjectId,
    currentProject?.assets,
    currentProject?.assetBins,
    currentProject?.assetBinColors,
    stableAssetActions,
  ],
);
```

Use module-level frozen empty arrays/objects to avoid new fallbacks on each render.

All action functions must remain `useCallback`-stable and must use functional state updates where possible so they do not depend on the entire `projects` array.

### Phase 3 — migrate hot consumers first

Migrate in this order:

1. `Project.tsx` — navigation/meta;
2. `GenSpace` controller/gallery — assets, navigation, hand-offs;
3. `DirectorEditor` and Director children — assets + Director timelines;
4. `VideoEditor` and left panel — assets + Editor timelines;
5. `Home` — project list/navigation;
6. remaining components.

The temporary `useProjects()` adapter may compose all contexts, but every remaining use must be listed. It is acceptable for low-frequency legacy surfaces during this PR; it is not acceptable in GenSpace, Director, Video Editor, Home, or Project.

### Phase 4 — remove broad currentProject props where possible

Do not pass a full `Project` object to a component that needs only `assets` or `name`.

Examples:

- `useGenSpaceGallery` should receive `assets`, bins, and colours rather than full `currentProject`.
- Director should receive its timeline slice and assets separately.
- Video Editor should not subscribe to Director timeline changes.

Do not prop-drill actions through five layers when the domain context is already the correct owner. Conversely, do not call context separately in every tiny leaf; keep container ownership sensible.

### Phase 5 — verify render isolation

Add a single focused test with probe consumers:

1. mount Provider with one project;
2. record Asset consumer render count;
3. update an Editor timeline;
4. assert Asset consumer did not rerender;
5. record Editor timeline consumer count;
6. toggle an asset favourite;
7. assert Editor timeline consumer did not rerender.

This is a stable performance contract. It does not assert component markup.

Use React DevTools Profiler manually for the real workspaces.

## Target files

- `frontend/contexts/ProjectContext.tsx` (replace/compatibility exports)
- new `frontend/contexts/project/*` files listed above
- `frontend/App.tsx`
- `frontend/views/Home.tsx`
- `frontend/views/Project.tsx`
- `frontend/views/genspace/hooks/useGenSpaceController.tsx`
- `frontend/views/genspace/hooks/useGenSpaceGallery.ts`
- `frontend/views/DirectorEditor.tsx`
- `frontend/views/director/*` containers
- `frontend/views/VideoEditor.tsx`
- `frontend/views/editor/LeftPanel.tsx`
- other direct `useProjects()` consumers discovered by Codex
- one focused render-isolation test

## Commit plan

### Commit 1 — `refactor(project-state): extract reference-preserving mutations`

- Pure helpers/selectors.
- No consumer migration yet.
- Existing behaviour unchanged.

### Commit 2 — `refactor(project-state): expose stable domain contexts`

- Provider/context modules.
- Compatibility `useProjects`.

### Commit 3 — `perf(renderer): migrate workspace consumers to project slices`

- Project, GenSpace, Director, Video Editor, Home.
- Remove full-project props from hot paths.

### Commit 4 — `test(project-state): guard cross-domain render isolation`

- One focused test.
- Documentation update.

## Manual profiler scenarios

Use a project with at least:

- 200 assets;
- one Director timeline;
- one Video Editor timeline with 100 clips.

Record React commits for:

1. typing 20 characters in Quick Gen prompt;
2. toggling one asset favourite;
3. dragging one Video Editor clip;
4. editing a Director prompt;
5. switching active project tab.

Compare which top-level workspaces and Asset Libraries commit before/after.

## Acceptance criteria

- [ ] No new runtime state-management dependency.
- [ ] Provider values are memoised per domain.
- [ ] Asset-only consumers do not rerender on Editor/Director timeline changes.
- [ ] Editor timeline consumers do not rerender on asset favourite/bin changes.
- [ ] Director timeline consumers do not rerender on Video Editor timeline changes.
- [ ] Navigation/tab changes do not recreate asset/timeline action callbacks.
- [ ] GenSpace, Director, Video Editor, Home, and Project no longer use the broad compatibility `useProjects()` hook.
- [ ] Unchanged arrays/objects retain reference identity.
- [ ] Existing project schema and persisted JSON remain unchanged.
- [ ] Submission results still save to the submission project if the user switches projects during generation.
- [ ] One render-isolation test passes.
- [ ] Existing critical project/persistence tests, typecheck, and production build pass.
- [ ] No tests inspect component layout or class names.

## Non-goals

- Do not normalise projects into an entity database.
- Do not implement lazy project-document loading here; that is PR 11 and is conditional.
- Do not move transient workspace UI state into project JSON.
- Do not make one context per action.
- Do not wrap every component in `memo`.
- Do not replace current action names purely for style.
