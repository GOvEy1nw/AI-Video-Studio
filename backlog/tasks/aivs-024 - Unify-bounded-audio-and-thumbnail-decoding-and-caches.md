---
id: AIVS-024
title: Unify bounded audio and thumbnail decoding and caches
status: Done
assignee:
  - '@codex'
created_date: '2026-08-05 08:37'
updated_date: '2026-08-05 17:14'
labels:
  - audit
dependencies:
  - AIVS-023
documentation:
  - >-
    docs/AiVS-Code-Health-Performance-Audit/07_PR_SHARED_MEDIA_DECODE_AND_CACHE.md
modified_files:
  - frontend/lib/audio-decode-service.ts
  - frontend/lib/audio-decode-service.test.ts
  - frontend/lib/video-thumbnail-service.ts
  - frontend/lib/video-thumbnail-service.test.ts
  - frontend/components/AudioWaveform.tsx
  - frontend/components/GalleryAssetLibrary.tsx
  - frontend/components/GalleryAssetList.tsx
  - frontend/views/editor/usePlaybackEngine.ts
  - frontend/views/editor/VideoThumbnailCard.tsx
  - frontend/views/editor/VideoThumbnailCard.test.tsx
  - frontend/views/editor/LeftPanel.tsx
  - frontend/views/director/DirectorSidebar.tsx
  - frontend/views/VideoEditor.tsx
  - frontend/views/Home.tsx
  - frontend/lib/thumbnails.ts
  - >-
    docs/AiVS-Code-Health-Performance-Audit/07_PR_SHARED_MEDIA_DECODE_AND_CACHE.md
priority: high
type: enhancement
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit PR 07. Ensure one media URL is read/decoded once for the required representation, keep caches bounded, stop redrawing static waveform pixels for a moving playhead, and revoke thumbnail resources when they leave the cache.

Create two direct services—audio and thumbnails—not a general resource/cache framework. Revalidate cited baseline assumptions against current dev when task starts; keep delivery to one focused PR.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 One URL requested by waveform and playback is read/decoded once concurrently.
- [x] #2 AudioBuffer and waveform caches have explicit entry/byte bounds.
- [x] #3 Thumbnail cache has explicit bounds and revokes evicted blob URLs.
- [x] #4 No polling loop waits for pending decodes.
- [x] #5 No new AudioContext is created per waveform.
- [x] #6 Static waveform pixels are not redrawn every playback animation frame.
- [x] #7 Inactive/offscreen consumers do not initiate new decode work.
- [x] #8 Director and Video Editor no longer maintain independent full-project thumbnail maps.
- [x] #9 Home project cards do not mount video elements.
- [x] #10 Hero video pauses when hidden and respects reduced motion.
- [x] #11 Focused service tests, typecheck, and production build pass.
- [x] #12 No pixel/layout tests are added.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria are satisfied
- [x] #2 Relevant automated tests pass
- [x] #3 Lint, type-check, and build checks pass where applicable
- [x] #4 Documentation is updated where required
- [x] #5 Implementation summary and verification evidence are recorded
- [x] #6 No unrelated changes are included
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add direct bounded audio decode/waveform service with one lazy AudioContext, promise dedupe, concurrency cap, LRU entry/byte budgets, canonical envelope/downsampling, and lifecycle controls; verify focused service tests. 2. Migrate playback and waveform consumers to shared service, gate inactive/offscreen work, and separate static waveform drawing from progress/playhead updates; verify focused interaction/pure tests. 3. Replace thumbnail utility with bounded promise-deduplicated concurrency-limited service that revokes evicted blob URLs; migrate Director, Video Editor, gallery, and Home to enabled static thumbnails without project-wide maps or card video elements. 4. Add Home hero visibility/reduced-motion lifecycle and static project-card image behavior. 5. Run focused tests, strict TypeScript, production frontend build, inspect diff, independent review, then finalize Backlog evidence.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Baseline revalidated on dev 94abf44: AudioWaveform polls pending decodes, creates AudioContext per waveform, redraws full canvas during playback; playback owns a separate unbounded buffer cache; thumbnails retain blob URLs and Director/Video Editor own local maps; Home cards can mount video elements and hero lacks visibility/reduced-motion lifecycle.

Implemented direct bounded audio and thumbnail services; migrated playback, waveform, Asset Library, Director, Video Editor, and Home consumers. Reviewer correction passes added exception-safe audio start ownership, disabled hover cleanup, leased blob URL revocation, stale-hook reset, and offscreen take-card gating. Verification: 9 focused Vitest cases passed; pnpm typecheck:ts passed; pnpm build:frontend passed; git diff --check passed. Independent review verdict: ship. Native Electron decoding, hover scrub, and hero video smoke not run; retained as manual residual risk.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @codex
created: 2026-08-05 17:14
---
Auto-approved under user's explicit instruction to approve, publish, and merge each completed AIVS-024 through AIVS-029 task.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
AIVS-024 now shares bounded promise-deduplicated audio decoding and waveform data across playback/UI, uses bounded lease-safe static thumbnail generation, gates inactive/offscreen media work, removes project-wide thumbnail maps, and makes Home cards image-only with visibility/reduced-motion hero lifecycle. Verified by 9 focused tests, strict TypeScript, production renderer/Electron/preload build, diff check, and ship review.
<!-- SECTION:FINAL_SUMMARY:END -->
