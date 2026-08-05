---
suggested_backlog_id: AIVS-022
title: Unify bounded audio and thumbnail decoding and caches
status: Draft
priority: high
type: performance
baseline_commit: c405f8224a8a510140591a9b76a568f3a78b49ad
dependencies:
  - AIVS-021
---

# PR 07 — Unify bounded audio/thumbnail decoding and caches

## Pull request intent

Ensure one media URL is read/decoded once for the required representation, keep caches bounded, stop redrawing static waveform pixels for a moving playhead, and revoke thumbnail resources when they leave the cache.

Create two direct services—audio and thumbnails—not a general resource/cache framework.

## Current audio path

`frontend/components/AudioWaveform.tsx`:

- cache key is URL only although callers request 800 vs 200 buckets;
- pending decode deduplication polls a `Set` every 50 ms;
- creates/closes a new `AudioContext` per waveform;
- scans raw channel samples for every new waveform;
- resets canvas dimensions and redraws the complete waveform inside an animation loop during playback;
- each `ClipWaveform` creates its own decode effect and `ResizeObserver`.

`frontend/views/editor/usePlaybackEngine.ts` separately:

- reads the same file bytes;
- creates its own AudioContext;
- decodes and caches full AudioBuffers;
- has no shared cache byte budget.

## Current thumbnail path

`frontend/lib/thumbnails.ts`:

- caches blob URLs for the process lifetime;
- does not revoke URLs;
- uses a promise cache, which is good;
- creates off-screen videos with `preload="auto"`;
- is consumed by separate local loops/maps in Director and Video Editor.

Home project cards and several gallery/timeline fallbacks can still create live `<video>` elements instead of using one static thumbnail representation.

## Target services

```text
audio-decode-service.ts
├─ one lazy AudioContext
├─ Promise<AudioBuffer> de-duplication
├─ bounded LRU AudioBuffer cache by estimated bytes
├─ decode concurrency limit
├─ canonical envelope generation
├─ downsample-to-width/buckets
└─ suspend/clear lifecycle

video-thumbnail-service.ts
├─ Promise de-duplication
├─ bounded LRU blob URL cache
├─ generation concurrency limit
├─ revoke on eviction/clear
├─ static image result
└─ optional persisted asset.thumbnail hand-off
```

## Implementation plan

### 1. Build a specific audio decode service

Create `frontend/lib/audio-decode-service.ts`.

Responsibilities:

- read local bytes through PR 06’s binary IPC helper or fetch non-local URLs;
- own one lazily created `AudioContext`;
- de-duplicate in-flight reads/decodes by URL with `Map<string, Promise<AudioBuffer>>`;
- limit concurrent decodes (recommended 1–2);
- store completed buffers in an LRU;
- estimate memory:

```ts
estimatedBytes =
  numberOfChannels * length * Float32Array.BYTES_PER_ELEMENT;
```

- evict until under both:
  - a conservative byte budget;
  - a maximum entry count;
- never evict a buffer currently acquired by active playback if using reference counts;
- expose `suspend()`, `resume()`, and `clear()`.

Do not invent a generic `Cache<T>` package unless an existing small utility already fits exactly.

### 2. Generate one canonical waveform envelope

For each URL, derive one canonical peak envelope from the decoded buffer, for example 2,048 or 4,096 buckets.

Cache by URL and the source version/path identity. Consumers request a display resolution by downsampling the canonical peaks.

This fixes the current “URL-only cache but variable bucket count” bug without storing many full variants.

Suggested pure functions:

```ts
extractPeakEnvelope(channelData, bucketCount)
downsamplePeakEnvelope(peaks, bucketCount)
```

Handle short files where samples-per-bucket would otherwise become zero.

### 3. Separate static waveform and progress/playhead layers

`AudioWaveform` and `ClipWaveform` should draw base peaks only when:

- peaks change;
- canvas size/DPR changes;
- colour changes.

They must not reset/redraw the complete base canvas for every animation frame.

Use one of:

- static base canvas + absolutely positioned DOM playhead/progress clip;
- static base canvas + small overlay canvas;
- CSS clip-path/width overlay over a second pre-rendered waveform.

Preferred compact-card approach:

```text
base canvas: unplayed waveform
played overlay: same static waveform clipped by width
playhead: 1px absolutely positioned element
```

Playback time updates then adjust only transforms/width, not thousands of canvas points.

### 4. Decode only when a consumer is active/visible

- Full Video Editor monitor waveform: active when the editor is active and audio view is selected.
- Timeline waveform: active for visible clips.
- Asset Library waveform: active only for virtualised/in-view rows after PR 08.
- Hidden workspaces should not initiate new waveform work.

Before PR 08, add an `enabled` prop or IntersectionObserver gate so existing full lists do not eagerly decode offscreen audio.

### 5. Reuse the decode service in playback

Replace `usePlaybackEngine`’s private file read/AudioBuffer cache with the service.

Playback owns only:

- active source nodes/gain nodes;
- scheduling;
- release/acquire state.

It must not duplicate decode/cache policy.

When Video Editor becomes inactive:

- stop source nodes;
- release acquired buffers;
- suspend the shared AudioContext when no other owner is active.

### 6. Replace the thumbnail map with a bounded service

Refactor `frontend/lib/thumbnails.ts` or replace it with `video-thumbnail-service.ts`.

Required behaviour:

- promise dedupe by URL + seek/size variant;
- generation queue concurrency 2 or another measured small value;
- `preload="metadata"` initially;
- seek after metadata/data is available;
- bounded LRU;
- `URL.revokeObjectURL()` on eviction and `clear()`;
- cleanup media source and canvas references after result;
- return an error/placeholder without leaving a stuck in-flight promise.

Use one canonical card width unless a larger timeline/preview variant is demonstrably needed.

### 7. Consolidate consumers

Remove local thumbnail-generation loops/maps from:

- `DirectorSidebar`;
- `VideoEditor`;
- any other gallery owner.

Consumers use a hook such as:

```ts
useVideoThumbnail(url, {
  enabled,
  fallback: asset.thumbnail,
})
```

The hook reads the shared cache and subscribes only to its URL result.

When generation/import already produces `asset.thumbnail`, prefer it and avoid decoding.

### 8. Optimise Home media

Project cards should render a static image only:

- use stored project/asset thumbnail;
- use shared thumbnail service if a video fallback is unavoidable;
- never mount one `<video preload="metadata">` per project card;
- add `loading="lazy"` and `decoding="async"` to non-critical card images.

For the hero video:

- provide a poster;
- respect `prefers-reduced-motion`;
- pause when the document is hidden;
- delay video source attachment until after the first Home paint/idle if measurement shows benefit;
- retain the visual design unless the user explicitly chooses a static hero.

### 9. Cleanup boundaries

Clear or trim caches:

- when switching/opening a project if URLs are project-scoped and no active generation/editor needs them;
- on app memory-pressure signal if Electron exposes/implements one;
- on explicit service reset;
- on test teardown.

Do not revoke blob URLs still shown by mounted images.

## Target files

- `frontend/components/AudioWaveform.tsx`
- `frontend/views/editor/usePlaybackEngine.ts`
- `frontend/lib/thumbnails.ts`
- `frontend/views/director/DirectorSidebar.tsx`
- `frontend/views/VideoEditor.tsx`
- `frontend/views/editor/VideoThumbnailCard.tsx`
- `frontend/views/Home.tsx`
- `frontend/components/GalleryAssetLibrary.tsx` (enabled wiring only)
- new:
  - `frontend/lib/audio-decode-service.ts`
  - optional `frontend/lib/audio-waveform.ts`
  - `frontend/lib/video-thumbnail-service.ts`
  - small hooks colocated with each service
- focused pure/service tests

## Commit plan

### Commit 1 — `perf(audio): share bounded decode and waveform data`

- binary read integration;
- one AudioContext/cache;
- canonical envelopes/downsampling.

### Commit 2 — `perf(audio-ui): render static waveform layers`

- AudioWaveform/ClipWaveform;
- playback service integration;
- visibility gates.

### Commit 3 — `perf(thumbnails): share bounded thumbnail generation`

- LRU/revocation;
- consumer migration;
- Home static project thumbnails.

## Critical tests only

Maximum suggested automated cases:

1. concurrent waveform/playback requests for one URL share one read/decode Promise;
2. canonical downsampling handles shorter/longer target sizes;
3. LRU eviction revokes thumbnail blob URLs and retains in-use entries;
4. rejected generation removes the in-flight entry so retry works.

Do not test canvas pixels, exact colours, waveform height, progress-bar classes, or poster placement.

## Measurement

Fixture:

- 100 audio assets, including variations;
- 100 videos without persisted thumbnails;
- Video Editor timeline using five repeated audio sources.

Record:

- number of binary file reads;
- number of `decodeAudioData` calls;
- active AudioContexts;
- thumbnail media elements/decodes;
- cache estimated bytes/entries;
- CPU while playing with visible waveform;
- memory after project close/cache clear.

## Acceptance criteria

- [ ] One URL requested by waveform and playback is read/decoded once concurrently.
- [ ] AudioBuffer and waveform caches have explicit entry/byte bounds.
- [ ] Thumbnail cache has explicit bounds and revokes evicted blob URLs.
- [ ] No polling loop waits for pending decodes.
- [ ] No new AudioContext is created per waveform.
- [ ] Static waveform pixels are not redrawn every playback animation frame.
- [ ] Inactive/offscreen consumers do not initiate new decode work.
- [ ] Director and Video Editor no longer maintain independent full-project thumbnail maps.
- [ ] Home project cards do not mount video elements.
- [ ] Hero video pauses when hidden and respects reduced motion.
- [ ] Focused service tests, typecheck, and production build pass.
- [ ] No pixel/layout tests are added.

## Non-goals

- Do not build a media-server cache or persist every generated thumbnail in this PR.
- Do not add Web Workers/AudioWorklets without a measured need.
- Do not replace the editor audio scheduler.
- Do not create a generic cache framework.
- Do not change waveform visual design beyond what is required to remove redraw work.
