---
suggested_backlog_id: AIVS-025
title: Remove dormant Video Editor residue and finish structural decomposition
status: Draft
priority: medium
type: refactor
baseline_commit: c405f8224a8a510140591a9b76a568f3a78b49ad
dependencies:
  - AIVS-024
---

# PR 10 — Remove dormant Video Editor residue and finish structural decomposition

## Pull request intent

Reduce maintenance and review cost in `VideoEditor.tsx` after its hot paths are optimised. Remove unreachable UI/plumbing while preserving persisted-data compatibility, then extract coherent visible sections.

This is not a behaviour redesign and should not produce a new giant controller hook.

## Current hotspot

`frontend/views/VideoEditor.tsx` is more than 5,000 lines and combines:

- route/container orchestration;
- layout state;
- asset library wiring;
- timeline state and operations;
- playback;
- source/preview monitor;
- toolbar;
- overlays/modals/context menus;
- export;
- regeneration/retake;
- dormant/hidden Effects and IC-LoRA plumbing.

Several feature blocks are marked as hidden while state, imports, props, or handlers remain.

Large file size alone is not a bug. The problem is overlapping ownership and unreachable code that makes every change harder to reason about.

## Design rules

- Extract by ownership, not by line quota.
- Prefer 6–10 substantial modules over dozens of one-use wrappers.
- Do not create one-file `components/`, `hooks/`, and `lib/` subfolders at every level.
- Keep current timeline schema and legacy effect fields readable.
- Remove unreachable UI implementation; preserve migration/serialization compatibility.
- Do not add automated tests for component placement after extraction.
- Use direct imports while the editor architecture is still evolving.

## Phase 1 — prove and remove dead/dormant code

### Inventory

Codex must produce a table before deletion:

| Symbol/block | Reachable render path? | Persisted schema dependency? | External import? | Decision |
|---|---|---|---|---|

Search for:

- comments such as `EFFECTS HIDDEN`, `IC-LORA HIDDEN`;
- props prefixed `_` only to suppress unused warnings;
- state setters never reachable from visible UI;
- imported icons/components with no render path;
- commented-out JSX/handlers;
- duplicate lasso/selection state replaced by shared Asset Library;
- legacy local thumbnail/waveform code replaced by PRs 07–09;
- stale test IDs used by no retained critical test.

### Compatibility rule

If a field exists in persisted `TimelineClip`, `Project`, or generation metadata:

- keep the type and load/save pass-through;
- move compatibility normalisation to a pure migration/normaliser;
- remove only the unreachable editing UI and transient state.

Do not silently strip existing saved effect data.

### Deletion requirement

Delete dead code rather than moving it to `legacy.ts`.

If future work is planned, record it in Backlog; source control already preserves deleted code.

## Phase 2 — define the route-level composition

Target `VideoEditor.tsx` responsibility:

- obtain project/editor domain contexts;
- invoke a small number of editor hooks/controllers;
- compose the visible top-level regions;
- own cross-region commands that truly span the editor;
- render explicit overlays.

Illustrative composition:

```text
VideoEditor
├─ useEditorDocument
├─ useEditorSelection
├─ usePlaybackEngine
├─ useEditorLayout
├─ EditorToolbar
├─ LeftPanel
├─ EditorPreviewWorkspace
├─ EditorInspector
├─ EditorTimelinePanel
└─ EditorOverlays
```

Do not make `useVideoEditorController` a dump for every existing line. If a controller is used, split it by domain and return small contracts.

## Phase 3 — extract coherent modules

### A. `useEditorLayout`

Own:

- layout load/save;
- resize start/move/stop;
- limits;
- panel sizes.

Existing pure layout helpers remain in `video-editor-utils.ts` or move to a focused `editor-layout.ts`.

### B. `EditorToolbar`

Own:

- visible tool controls;
- undo/redo;
- snapping;
- zoom/playback controls if toolbar-owned;
- command callbacks supplied by container.

It must not read ProjectContext.

### C. `EditorPreviewWorkspace`

Own:

- source/preview monitor layout;
- selected source details;
- monitor-specific controls;
- compositor surface.

Playback state arrives through a typed contract.

### D. `EditorTimelinePanel`

Own:

- timeline tabs/header;
- track/clip presentation;
- playhead/cut/drag surfaces;
- timeline add menu.

Pure operations remain hooks/helpers, not embedded in JSX.

### E. `EditorOverlays`

Own visible conditionals:

- export;
- delete confirmation;
- import timeline;
- context menus;
- trim/crop/retake/regeneration dialogs;
- error/status surfaces.

Split into a few meaningful overlay groups if one file becomes too large.

### F. selectors/commands

Move repeated pure lookups/calculations into:

- `editor-selectors.ts`;
- existing timeline operations;
- playback index from PR 09.

Examples:

- selected clip/asset;
- ordered visible tracks;
- cut points;
- context-menu targets;
- active timeline;
- export payload preparation.

Do not create an object-oriented editor model.

## Phase 4 — stabilise boundaries without blanket memoisation

Use typed contracts for major children. Keep only fields each child needs.

Apply `memo` where:

- the child is expensive;
- its props can be stable;
- profiler evidence shows unrelated parent updates.

Do not use custom comparators to hide unstable or stale props.

Avoid inline arrays/objects passed to memoised heavy children when a stable derivation is easy. Do not wrap every click handler in `useCallback` by default.

## Phase 5 — remove compatibility adapter debt

After PR 04, Video Editor should use asset/timeline contexts directly.

After PRs 07–09, remove:

- local thumbnail maps;
- local waveform/decode ownership;
- broad project object props;
- obsolete media probes;
- duplicate asset-selection/lasso ownership now handled by shared library.

## Suggested target files

New/extracted files should be based on real ownership, likely:

- `frontend/views/editor/EditorToolbar.tsx`
- `frontend/views/editor/EditorPreviewWorkspace.tsx`
- `frontend/views/editor/EditorTimelinePanel.tsx`
- `frontend/views/editor/EditorOverlays.tsx`
- `frontend/views/editor/useEditorLayout.ts`
- `frontend/views/editor/editor-selectors.ts`

Existing:

- `frontend/views/VideoEditor.tsx`
- `frontend/views/editor/LeftPanel.tsx`
- current timeline components/hooks
- `frontend/types/project.ts` only for compatibility normalisation comments/types
- editor architecture documentation

Do not create empty index barrels.

## File-size guidance

The goal is comprehensibility, not gaming line counts.

A reasonable review target:

- route/container under roughly 1,200 lines;
- no new extracted module over roughly 1,500 lines without an explicit ownership justification;
- no tiny wrapper extracted solely to meet the target;
- total production line count should fall after dead-code removal, even if extraction adds interfaces/imports.

Record before/after:

- `VideoEditor.tsx` lines;
- total editor production lines;
- removed dead lines;
- number of top-level responsibilities.

## Commit plan

### Commit 1 — `chore(editor): remove unreachable hidden feature residue`

- inventory;
- delete unreachable UI/state/imports/tests;
- preserve persisted compatibility.

### Commit 2 — `refactor(editor): extract layout toolbar and preview ownership`

- layout hook;
- toolbar;
- preview workspace.

### Commit 3 — `refactor(editor): extract timeline panel and overlays`

- timeline composition;
- overlays;
- pure selectors.

### Commit 4 — `docs(editor): record final ownership and extension rules`

- update project map/editor architecture;
- remove stale references.

Each commit should typecheck/build. If extraction is too intertwined, use two commits but keep dead-code deletion first and independently reviewable.

## Validation

Automated:

- existing critical pure timeline tests;
- playback index tests from PR 09;
- one editor smoke that opens an existing timeline and invokes a critical command;
- typecheck/build.

Manual:

- open/create/switch/rename/delete timeline;
- import assets;
- drag/select/cut/trim clips;
- play/pause/seek;
- audio;
- export;
- retake/regeneration paths currently enabled;
- context menus;
- tab switch state preservation.

Do not create tests for extracted component positions, child order, class names, or widths.

## Acceptance criteria

- [ ] Dead/dormant inventory is attached to the Backlog task/PR.
- [ ] Provably unreachable UI/state/imports are deleted, not archived in source.
- [ ] Existing saved project/timeline/effect data still loads and saves without destructive loss.
- [ ] `VideoEditor.tsx` becomes a route/container rather than the owner of every editor concern.
- [ ] Extracted modules have clear, non-overlapping ownership.
- [ ] No new monolithic `useVideoEditorController`.
- [ ] No broad barrel exports or one-file folder trees.
- [ ] Total production line count falls after cleanup.
- [ ] Existing editor behaviour and performance from PR 09 are preserved.
- [ ] Critical tests, typecheck, production build, and manual editor smoke pass.
- [ ] No layout/presentation tests are added.

## Non-goals

- Do not redesign editor UX.
- Do not implement hidden Effects/IC-LoRA features.
- Do not remove persisted compatibility fields.
- Do not replace editor architecture with a plugin framework.
- Do not refactor backend/export unless required to preserve an interface.
- Do not combine with new product features.
