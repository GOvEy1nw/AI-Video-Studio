---
suggested_backlog_id: AIVS-025
title: Virtualize the Asset Library and eliminate eager media elements
status: Implemented
priority: high
type: performance
baseline_commit: c952bd7
dependencies:
  - AIVS-024
---

# PR 08 — Virtualize the Asset Library and eliminate eager media elements

## Implementation result

Implemented by AIVS-025 with Asset Library-specific fixed-row virtualization and three-row overscan; no dependency or general virtual-scroll framework was added. Grid and list ranges use scroll positions relative to their asset bodies so Quick Gen leading content and the sticky list header remain outside virtual-row coordinates. Marquee geometry now updates through one animation-frame DOM write and commits selection only on pointer-up.

The deterministic 1,000-asset grid fixture mounts 44 cards in the standard sidebar calculation, and grid/list component probes remain below 200 mounted cards. Seven focused Vitest cases, strict TypeScript, production renderer/Electron/preload build, diff check, and independent `ship` review passed. Native Electron scroll/resize and leading-content visual smoke remains a manual validation boundary.

## Pull request intent

Make Asset Library CPU, DOM, image decode, video metadata, waveform, and pointer-selection cost depend on the visible viewport rather than the full filtered project library.

The shared component is used by Quick Gen, Director, and Video Editor, so one focused change benefits all three.

## Current behaviour

`GalleryAssetLibrary`:

- maps every `displayAsset` in grid mode;
- delegates to `GalleryAssetList`, which maps every asset in list mode;
- mounts a `ClipWaveform` for every audio card/take;
- can mount `<video preload="metadata">` fallbacks for video cards;
- creates card-local hover state;
- rerenders the full library on every marquee pointer move;
- measures every rendered card on pointer-up;
- is not virtualized.

Because multiple workspaces can remain mounted after first visit, more than one library instance may retain a full card tree.

## Dependency decision

Use a proven headless virtualizer such as `@tanstack/react-virtual` **only after** checking the current lockfile/license/compatibility. A small fixed-row implementation is acceptable if it is materially simpler for this exact grid.

Do not write a general virtual-scroll framework.

The key abstraction is virtual **rows**, not individual grid cells:

```text
assets -> rows of gridColumns -> virtual row list -> cards within row
```

This keeps square-card layout and variable column count predictable.

## Implementation plan

### 1. Extract pure display derivation

Create or reuse pure helpers for:

- final filtering;
- favourites;
- selected bin;
- sort;
- chunking into grid rows.

Give favourites filtering one owner. At the baseline, GenSpace and the library can both apply favourites filtering.

Suggested:

```ts
function buildDisplayAssets(input): Asset[]
function chunkAssetsIntoRows(assets, columns): Asset[][]
```

Do not test UI markup for filter behaviour; retain pure filter tests.

### 2. Create a virtual grid

Create `VirtualAssetGrid.tsx` (or keep it inside `GalleryAssetLibrary.tsx` if concise).

Inputs:

- `assets`;
- `columns`;
- card render callback;
- scroll element;
- overscan.

For each virtual row:

- absolute/translated row position;
- inner CSS grid with `columns`;
- stable row key based on contained asset IDs;
- estimate height from available width, column count, and gap;
- remeasure on width/column change;
- overscan 2–4 rows after local measurement.

Do not hardcode a 360 px sidebar width.

### 3. Create a virtual list

`GalleryAssetList` should virtualize fixed-height rows.

Keep the sticky header outside the virtual content.

Row actions and selection remain accessible. The list should not create a new default `Set()` on every render; use a module-level empty set or required prop.

### 4. Memoize leaf cards/rows with stable inputs

Make `GalleryAssetCard` and list row a `memo` boundary only after props are stabilised.

Pass:

- asset object;
- selected boolean;
- thumbnail string;
- stable callbacks that accept asset ID/index.

Avoid creating action closures for every card in the parent map when a stable ID-based handler can be used.

Do not add a custom comparator that ignores meaningful asset changes.

### 5. Remove live media from cards

Grid/list video representation:

1. `asset.thumbnail`;
2. shared thumbnail service result;
3. static placeholder icon.

Do not render a `<video>` as a grid/list fallback.

Image representation:

```tsx
<img loading="lazy" decoding="async" ... />
```

The virtualizer already bounds DOM, but lazy/async decoding still helps overscan/project-card consumers.

Audio representation:

- request waveform only for mounted virtual rows;
- use the shared service;
- placeholder while pending;
- stacked takes may request visible take waveforms only.

### 6. Make visibility ownership explicit

Remove duplicated document-visibility listeners from individual library/controller layers.

Use one application/document-visibility hook or pass:

```ts
mediaPreviewEnabled = workspaceActive && documentVisible
```

A hidden workspace’s virtual rows may remain mounted, but new thumbnail/waveform requests must be disabled.

### 7. Move marquee visual updates out of React

Keep selection data in React, but not the box’s per-pointer pixels.

Recommended structure:

- pointer start/current stored in refs;
- one overlay DOM ref;
- pointer move schedules one `requestAnimationFrame`;
- rAF writes `style.transform/width/height` directly;
- no `setSelectionBox` per move;
- pointer-up computes selected visible cards and commits one Set update;
- pointer cancel hides overlay and clears refs.

Only physically visible/mounted cards can intersect the marquee, which matches pointer interaction. Shift-range selection remains able to operate over the complete logical asset list.

Do not query/measure the full logical library.

### 8. Preserve selection semantics

Required:

- normal controlled selection outside dedicated multi-select mode;
- Ctrl/Cmd toggle;
- Shift range;
- dedicated multi-select click/keyboard;
- marquee with Shift additive behaviour;
- clear;
- bulk delete through `useAssetDeletion`;
- context menu selection;
- grid/list switch.

When filtering/virtualisation removes a selected card from view, follow the current product rule: dedicated multi-select should prune hidden IDs unless a deliberate cross-filter selection contract is introduced. Do not change silently.

### 9. Keep empty/leading content outside asset row assumptions

Quick Gen’s active-generation and importing cards currently use `leadingContent`.

Represent them as one of:

- a fixed non-virtual section above the asset virtualizer; or
- explicit synthetic rows with stable IDs.

Prefer the fixed section; it avoids teaching the asset virtualizer about non-assets.

### 10. Add a development-only DOM diagnostic

A small helper or manual console check may report:

- total logical assets;
- rendered cards;
- rendered rows;
- overscan.

Do not ship telemetry or a permanent debug overlay.

## Target files

- `frontend/components/GalleryAssetLibrary.tsx`
- `frontend/components/GalleryAssetList.tsx`
- `frontend/components/GalleryAssetLibrary.test.tsx`
- `frontend/views/genspace/GenSpaceGallery.tsx`
- `frontend/views/genspace/hooks/useGenSpaceGallery.ts`
- `frontend/views/director/DirectorSidebar.tsx`
- `frontend/views/editor/LeftPanel.tsx`
- shared media thumbnail/waveform hooks from PR 07
- optional new:
  - `frontend/components/VirtualAssetGrid.tsx`
  - `frontend/components/VirtualAssetList.tsx`
  - `frontend/lib/gallery-display.ts`
- package/lock file only if adding a virtualizer dependency

## Commit plan

### Commit 1 — `refactor(asset-library): centralize display derivation and card props`

- pure filtering/favourites ownership;
- dead props removed;
- stable handlers/memo-ready cards.

### Commit 2 — `perf(asset-library): virtualize grid and list rows`

- virtual row implementations;
- sticky list header;
- bounded DOM.

### Commit 3 — `perf(asset-library): defer media and throttle marquee rendering`

- static media only;
- visibility gates;
- ref/rAF marquee overlay;
- critical interaction verification.

## Critical tests only

Retain/add:

1. pure display filtering semantics;
2. one multi-select click/keyboard/clear/delete test;
3. one marquee selection regression;
4. one virtual-row helper test proving the complete logical list maps to rows and only requested range renders in a probe.

Delete/avoid:

- exact column widths;
- slider markup;
- `aspect-square`/`object-cover` class assertions;
- exact card action markup;
- exact scrollbar classes;
- exact DOM count in a normal small component test.

The large-library DOM bound belongs in the manual/performance verification, not a fragile jsdom layout simulation.

## Benchmark fixture

Create a development-only fixture or script that produces:

- 1,000 assets:
  - 400 images;
  - 400 videos;
  - 200 audio;
- representative bins/favourites/takes;
- both grid and list scenarios.

Measure:

- rendered `[data-asset-card]` count;
- DOM nodes;
- renderer memory;
- scroll long tasks/frame rate;
- marquee pointer-move React commits;
- media elements and decode requests.

## Acceptance criteria

- [ ] Grid and list render a bounded viewport/overscan subset for 1,000 logical assets.
- [ ] Target rendered card count remains below 200 in the standard sidebar fixture unless measured row geometry justifies another documented bound.
- [ ] No `<video>` elements are created for Asset Library grid/list cards.
- [ ] Offscreen/unmounted audio cards do not request waveforms.
- [ ] Images use lazy/async decoding.
- [ ] Marquee pointer movement does not rerender every card on each event.
- [ ] Selection/filter/bin/favourite/take/delete/context-menu behaviour remains correct.
- [ ] Quick Gen leading generation/import content renders correctly outside virtual assets.
- [ ] Hidden/inactive workspaces do not start new card media work.
- [ ] Focused critical tests, typecheck, and production build pass.
- [ ] No tests assert card layout/classes/pixel positions.

## Non-goals

- Do not virtualize the Video Editor timeline in this PR.
- Do not redesign Asset Library UX.
- Do not persist scroll position across app restarts unless already supported.
- Do not create a universal virtualizer abstraction.
- Do not preload all thumbnails “for smoother scrolling.”
