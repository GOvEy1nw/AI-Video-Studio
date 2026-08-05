---
suggested_backlog_id: AIVS-026
title: Index Video Editor playback data and suspend inactive media work
status: Implemented
priority: high
type: performance
baseline_commit: e8ff6cf
dependencies:
  - AIVS-020
  - AIVS-023
  - AIVS-024
---

# PR 09 — Index Video Editor playback data and suspend inactive media work

## Pull request intent

Remove clip/asset scans, sorting, and short-lived allocations from the playback animation-frame loop; replace live timeline video thumbnails with static images; and explicitly release/suspend media work when Video Editor is inactive.

This PR optimises existing behaviour. It does not redesign the editor or change timeline semantics.

## Implementation result

Completed in AIVS-026. Playback now uses an immutable index for visual, dissolve, next-video, active-take source, and audio lookups. Timeline thumbnails are static images/placeholders; metadata probes are active-only with concurrency two; pooled and compositor media release sources when Video Editor becomes inactive.

Deterministic 500-clip/20-track benchmark on the same fixture:

- baseline on `e8ff6cf`: median 6.716 us, p95 9.565 us;
- latest legacy selector: median 7.262 us;
- indexed selector: median 0.315 us, p95 0.402 us;
- median indexed lookup reduction versus latest legacy measurement: about 95.7%.

Focused playback/index/thumbnail tests, strict TypeScript, production frontend build, and diff check passed. Native Electron inactive/reactivate media smoke remains manual.

## Current hot-path findings

`frontend/views/editor/usePlaybackEngine.ts` currently performs combinations of:

- clip `map`;
- clip `filter`;
- clip `sort`;
- asset `find`;
- dissolve-pair scans;
- next-video scans;

while resolving the current frame.

`VideoEditor.tsx` repeats `assets.find()` and clip searches in render/helper paths. Timeline video clips can render live `<video>` elements as thumbnails. Metadata probing creates off-screen media elements for clip URLs and is not fully scoped to active/visible work.

The editor already stops playback on tab change. Preserve that and extend the lifecycle to retained decoders, source nodes, media element sources, metadata probes, and frame-loop work.

## Target architecture

```text
useMemo/buildPlaybackIndex(clips, tracks, assets)
├─ assetById: Map
├─ clipById: Map
├─ sortedVisualIntervalsByTrack
├─ dissolveRanges
├─ nextVideoByClipId / sequence indices
└─ static resolved source metadata

requestAnimationFrame tick
├─ binary search / top-down track lookup
├─ O(1) source lookup
├─ no map/filter/sort/find
└─ update only changed playback state
```

## Implementation plan

### 1. Extract pure playback indexing

Create `frontend/views/editor/playback-index.ts`.

Suggested types:

```ts
interface IndexedClip {
  clip: TimelineClip;
  start: number;
  end: number;
  sourceUrl: string | null;
  sourcePath: string | null;
  visualTrackRank: number;
}

interface PlaybackIndex {
  clipById: ReadonlyMap<string, IndexedClip>;
  assetById: ReadonlyMap<string, Asset>;
  visualByTrack: readonly (readonly IndexedClip[])[];
  dissolveRanges: readonly IndexedDissolve[];
  videoSequence: readonly IndexedClip[];
  nextVideoByClipId: ReadonlyMap<string, IndexedClip | null>;
}
```

Build only when relevant inputs change:

- clips;
- tracks/rank/visibility;
- asset URL/take state.

Do not include current time/playback state in the index dependencies.

### 2. Use deterministic interval lookup

For each visible video track:

- keep clips sorted by start time;
- use binary search to find the latest interval whose start <= current time;
- validate end > current time;
- walk tracks in compositing/topmost order;
- preserve existing adjustment/visibility rules.

If overlapping clips on one track are valid, document and implement precedence explicitly. Do not depend on sorting during each tick.

Extract one pure function:

```ts
selectVisualAtTime(index, currentTime)
```

This function is one of the few critical tests.

### 3. Pre-index dissolve/transition lookup

Build transition/dissolve ranges once from indexed clips.

At tick time:

- binary search current dissolve range or check the selected clip’s precomputed adjacency;
- do not scan the complete clip array;
- preserve exact current transition behaviour.

### 4. Remove per-frame asset/source searches

`resolveClipSrc` should use:

- precomputed `sourceUrl`/`sourcePath`;
- O(1) maps;
- current active take already reflected when the index rebuilds.

Do not call `assets.find()` inside rAF or media-pool acquisition.

### 5. Update `usePlaybackEngine`

Change the hook signature to receive:

```ts
{
  isActive,
  playbackIndex,
  ...
}
```

Frame loop rules:

- no `.map`, `.filter`, `.sort`, or `.find` over clips/assets;
- no object/array allocation when the selected clip and transition state are unchanged;
- do not call React state setters with equivalent values;
- stop scheduling rAF immediately when paused/inactive;
- retain existing drift/time calculation semantics.

If a small mutable playback snapshot ref avoids repeated React renders, use it; do not move all editor state outside React.

### 6. Make inactive cleanup complete

When `isActive` becomes false:

- stop rAF;
- set playing false;
- pause/stop all active video/audio sources;
- release shared AudioBuffer acquisitions;
- suspend the shared AudioContext when no other consumer needs it;
- cancel metadata/thumbnail requests that support cancellation;
- detach `src`/call `load()` on pooled hidden video elements that should not remain resident;
- clear transient playhead/audio scheduling state;
- retain authored timeline/selection/layout state.

Generation/regeneration jobs owned outside playback must continue if product behaviour requires it.

### 7. Replace timeline live-video thumbnails

For every timeline clip:

- resolve `asset.thumbnail` or shared thumbnail service image;
- render `<img>`;
- use a placeholder until available;
- do not create a `<video>` per timeline clip.

The preview monitor remains a real video compositor/player. This rule applies only to timeline/asset thumbnail representations.

### 8. Bound metadata probing

The resolution/metadata effect should:

- run only while Video Editor is active;
- use shared metadata/thumbnail service when possible;
- avoid probing URLs whose dimensions/duration are already in asset/take metadata;
- use a small concurrency limit;
- cancel/ignore pending results on timeline/project change;
- not create one off-screen media element per entire timeline at once.

Prefer persisting width/height/duration on import/generation so future sessions do not probe again. Do not add a broad metadata migration in this PR unless trivial.

### 9. Replace repeated render-path finds

Within `VideoEditor.tsx` and extracted components:

- build `assetById`, `clipById`, `trackByIndex` maps with `useMemo`;
- pass maps/selectors to timeline/overlay components;
- replace nested `assets.find()` in clip mapping;
- compute selected clip/asset once per relevant state change.

Do not memoise cheap primitives solely to satisfy a style rule.

### 10. Measurement-gated timeline DOM culling

After completing the index/static-thumbnail work, profile 500 and 1,000 clip timelines.

Only if timeline DOM remains the dominant bottleneck, create a follow-up or an explicitly separated final commit that culls horizontally offscreen clip bodies with overscan while retaining:

- drag targets;
- playhead/cut interactions;
- selected clips;
- transition handles near the viewport.

Do not implement timeline virtualisation by default in this PR.

## Target files

- `frontend/views/editor/usePlaybackEngine.ts`
- `frontend/views/VideoEditor.tsx`
- timeline presentation component(s)
- `frontend/views/editor/VideoThumbnailCard.tsx` or replacement consumer
- shared services from PR 07
- new:
  - `frontend/views/editor/playback-index.ts`
  - focused pure tests
- current editor architecture/performance docs

## Commit plan

### Commit 1 — `perf(editor): pre-index clips assets and transitions`

- pure index;
- selectors;
- critical tests.

### Commit 2 — `perf(editor): make playback tick allocation-light`

- hook integration;
- state update guards;
- source lookup.

### Commit 3 — `perf(editor): use static timeline thumbnails and active media lifecycle`

- no clip thumbnail videos;
- metadata concurrency/active guard;
- inactive cleanup.

### Optional measured commit — `perf(editor): cull offscreen timeline clip bodies`

Only after the documented gate.

## Critical tests only

Suggested retained/additional cases:

1. `selectVisualAtTime` preserves topmost-track and hidden/muted rules;
2. dissolve lookup returns the same current/next clip and progress at boundaries;
3. next-video/source lookup respects active takes;
4. inactive transition stops scheduling and releases media resources (one focused hook/service test).

Do not test:

- exact clip pixel left/width;
- timeline row height;
- CSS transform strings;
- icon order;
- DOM hierarchy.

Timeline calculation/drag helpers may retain pure numerical tests where precision is the contract.

## Benchmark fixture

Use deterministic fixtures:

- 100 clips / 10 tracks;
- 500 clips / 20 tracks;
- repeated assets and repeated audio sources;
- several transitions/overlaps;
- active/hidden track cases.

Record in Chrome Performance:

- JS time per animation frame;
- allocations/GC;
- number of clip/asset scans;
- renderer media elements;
- memory before/after tab switch;
- dropped frames during playback.

## Acceptance criteria

- [x] Playback rAF contains no full clip/asset `map/filter/sort/find`.
- [x] Current visual source and transition lookup use precomputed data.
- [x] Index rebuild occurs only when clips/tracks/assets materially change.
- [x] Equivalent playback state does not trigger redundant React state updates.
- [x] Timeline clip thumbnails use static images/placeholders, not video elements.
- [x] Metadata probes run only while the editor is active and are concurrency-bounded.
- [x] Switching away stops rAF, playback, source nodes, and unneeded media resources.
- [x] Returning preserves timeline/selection/layout state.
- [x] Median playback-tick JS time is at least 30% lower on the same 500-clip fixture, or the PR records why a different measured bottleneck became dominant.
- [x] Existing timeline semantics and export output are unchanged.
- [x] Focused pure/hook tests, typecheck, and production build pass.
- [x] No layout tests are added.

## Non-goals

- Do not rewrite the NLE.
- Do not change timeline schema.
- Do not alter export compositing.
- Do not virtualize/cull timeline DOM without the measurement gate.
- Do not blanket-memo every clip component.
- Do not optimise WanGP generation.
