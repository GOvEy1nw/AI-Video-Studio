---
suggested_backlog_id: AIVS-017
title: Split the renderer bundle and mount workspaces on first visit
status: Draft
priority: high
type: performance
baseline_commit: c405f8224a8a510140591a9b76a568f3a78b49ad
dependencies:
  - AIVS-016
---

# PR 02 — Split the renderer bundle and mount workspaces on first visit

## Pull request intent

Reduce renderer startup, parse/evaluation work, and initial project memory without sacrificing workspace state or allowing tab switches to cancel an active generation.

The core rule is:

> Load and mount a workspace when it is first needed; after it has been visited, keep it mounted and explicitly inactive.

This is a conservative intermediate step. It removes the largest eager cost while preserving the current state-retention contract.

## Current behaviour

`frontend/App.tsx` statically imports `Project`, `PythonSetup`, `SettingsModal`, and `LogViewer`. `SettingsModal` imports `ModelPackManager`.

`frontend/views/Project.tsx` statically imports `GenSpace`, `DirectorEditor`, and `VideoEditor`, then renders all three immediately under `hidden` wrappers.

Consequences:

- the Home renderer entry includes unopened project/editor/modal code;
- opening a project loads/evaluates the whole editor graph;
- Director and Video Editor mount before the user visits them;
- Director may create its initial timeline during a normal project open;
- each hidden workspace creates local state and effects.

## Target architecture

```text
App
├─ Home (eager: initial route)
├─ Project (dynamic route chunk)
│  ├─ Quick Gen (dynamic; mounted for initial project tab)
│  ├─ Director (dynamic; mounted on first visit)
│  └─ Video Editor (dynamic; mounted on first visit)
├─ Python Setup (dynamic; only when required)
├─ Settings (dynamic; only when opened)
└─ Logs (dynamic; only when opened)
```

After first visit:

```text
visitedTabs = {"gen-space", "director"}

Quick Gen      mounted, active/inactive by currentTab
Director       mounted, active/inactive by currentTab
Video Editor   not imported and not mounted
```

## Implementation plan

### 1. Establish reusable module loaders

In `frontend/App.tsx` or a small `frontend/lazy-modules.ts` file, define loaders separately from `React.lazy` so tab hover/focus can prefetch them:

```ts
const loadProject = () => import("./views/Project");
const LazyProject = lazy(() =>
  loadProject().then(({ Project }) => ({ default: Project })),
);
```

Repeat for:

- `Project`
- `PythonSetup`
- `SettingsModal`
- `LogViewer`

Keep `Home` eager because it is the normal first render.

Do not create a general route framework.

### 2. Render closed modal modules only when requested

Current code renders `SettingsModal` and `LogViewer` on every App render, even though the components later return `null`.

Change the shell to:

```tsx
{isSettingsOpen ? (
  <Suspense fallback={<SmallModalFallback />}>
    <LazySettingsModal ... />
  </Suspense>
) : null}
```

Apply the same rule to Logs and Python Setup.

`SettingsModal`’s import of `ModelPackManager` then remains inside the Settings chunk.

### 3. Dynamically import workspaces

In `frontend/views/Project.tsx`:

- replace static workspace imports with loader/lazy pairs;
- keep the project header/tabs in the project-shell chunk;
- initialise `visitedTabs` with the active tab;
- add the current tab to `visitedTabs` when selected;
- render a workspace wrapper only when its tab has been visited;
- continue using `hidden` (or equivalent) for visited but inactive workspaces.

Suggested state helper:

```ts
function addVisitedTab(current: ReadonlySet<ProjectTab>, tab: ProjectTab) {
  if (current.has(tab)) return current;
  const next = new Set(current);
  next.add(tab);
  return next;
}
```

Use a small pure test for this helper only if retained under the new test policy.

### 4. Prefetch on intent, not at startup

On each project tab:

- `onPointerEnter`
- `onFocus`

call the corresponding loader without mounting the workspace.

This makes the first deliberate tab switch feel fast while still avoiding eager startup work.

Do not prefetch all tabs in an idle callback; that recreates the original problem.

### 5. Make active state explicit

Each workspace should receive or derive a clear `isActive` value.

- `DirectorEditor` already passes active state to children.
- Video Editor already checks `currentTab` for playback/shortcuts.
- GenSpace already uses `currentTab` for preview behaviour.

Standardise the contract:

```ts
type WorkspaceProps = { isActive: boolean };
```

Do not unmount a visited workspace when it becomes inactive. An active generation must continue and persisted UI state must remain.

### 6. Prevent unused Director initialisation

Guard Director’s initial-timeline creation with `isActive`/visited state.

Even with lazy mounting, keep the guard so future shell changes cannot recreate a Director document merely by mounting a hidden component.

Acceptance behaviour:

- opening a new project in Quick Gen does not add a Director timeline;
- first opening Director creates the initial timeline if none exists.

### 7. Add bundle evidence, not bundle folklore

In `vite.config.ts`:

```ts
build: {
  outDir: "dist",
  manifest: true,
}
```

Vite will create dynamic chunks from dynamic imports. Do **not** add `manualChunks` in this PR.

Create `scripts/check-renderer-bundle.mjs` that:

1. reads `dist/.vite/manifest.json`;
2. locates the renderer entry;
3. confirms Director, Video Editor, Settings/ModelPackManager are dynamic entries or descendants of dynamic entries;
4. outputs raw and gzip/brotli sizes for:
   - initial entry and its static imports;
   - Quick Gen chunk;
   - Director chunk;
   - Video Editor chunk;
   - Settings chunk;
5. writes a human-readable table to stdout;
6. exits non-zero only for structural regressions, not an uncalibrated byte threshold.

After the first successful build, record a starting budget in `docs/PERFORMANCE_BASELINES.md`. Future budgets should be based on measured output rather than guessed numbers.

### 8. Use minimal fallbacks

Suspense fallbacks must be small and local:

- Home→Project: existing app background + compact spinner;
- workspace: panel-sized spinner/status;
- Settings/Logs: simple modal shell.

Do not import shared heavy components into the fallback.

## Target files

- `frontend/App.tsx`
- `frontend/views/Project.tsx`
- `frontend/views/DirectorEditor.tsx`
- `frontend/views/VideoEditor.tsx` (active prop wiring only)
- `frontend/views/GenSpace.tsx` / `GenSpaceWorkspace.tsx` (active prop only if required)
- `vite.config.ts`
- `package.json`
- `scripts/check-renderer-bundle.mjs` (new)
- `docs/PERFORMANCE_BASELINES.md` (new or update)
- one small focused test file only if needed

## Commit plan

### Commit 1 — `perf(renderer): lazy-load routes and closed modals`

- App-level dynamic imports.
- Conditional modal mounting.
- Small Suspense fallbacks.

### Commit 2 — `perf(project): mount workspaces on first visit`

- Dynamic workspace imports.
- `visitedTabs`.
- intent prefetch.
- explicit active wiring.
- Director initialisation guard.

### Commit 3 — `build(perf): record renderer chunk boundaries`

- Vite manifest.
- bundle report/check script.
- baseline documentation.

## Measurement procedure

Before and after, use `references/BENCHMARK_PROTOCOL.md` to record:

- initial renderer entry static bytes and gzip bytes;
- project-shell entry static bytes;
- first Home interactive mark;
- first Quick Gen interactive mark;
- renderer working set:
  - Home;
  - project opened with only Quick Gen visited;
  - after visiting all three workspaces.

Use the same build, machine, project fixture, and warm/cold definition.

## Acceptance criteria

- [ ] Production manifest shows Project outside the initial Home entry.
- [ ] Director, Video Editor, Settings, and ModelPackManager are absent from the initial Home static import graph.
- [ ] On project open, only the selected initial workspace is mounted.
- [ ] First tab hover/focus prefetches the relevant chunk without mounting it.
- [ ] First tab activation mounts it.
- [ ] Returning to a visited workspace preserves authored state.
- [ ] Switching away from Quick Gen does not cancel an active generation.
- [ ] Opening a project does not create a Director timeline until Director is visited.
- [ ] Inactive visited workspaces receive `isActive=false`.
- [ ] Bundle-report script passes and records the new chunk table.
- [ ] Typecheck and production renderer/Electron/preload builds pass.
- [ ] Only one small behavioural test is added/retained for visited-state semantics; no tests assert chunk filenames, spinner markup, or wrapper placement.

## Non-goals

- Do not unmount visited workspaces.
- Do not migrate workspace state into a new global store.
- Do not add React Router.
- Do not add manual chunks/vendor chunks without measured need.
- Do not lazy-load every tiny control.
- Do not treat development Strict Mode double-effects as a packaged-app regression.
- Do not add screenshot tests for loading fallbacks.

## Rollback boundary

If generation or timeline state is lost after tab switching, revert only the visited-workspace mounting commit. App/modal code splitting and bundle reporting can remain independently.
