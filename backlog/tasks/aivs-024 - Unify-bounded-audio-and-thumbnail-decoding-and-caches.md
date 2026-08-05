---
id: AIVS-024
title: Unify bounded audio and thumbnail decoding and caches
status: Backlog
assignee: []
created_date: '2026-08-05 08:37'
labels:
  - audit
dependencies:
  - AIVS-023
documentation:
  - >-
    docs/AiVS-Code-Health-Performance-Audit/07_PR_SHARED_MEDIA_DECODE_AND_CACHE.md
priority: high
type: enhancement
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit PR 07. Ensure one media URL is read/decoded once for the required representation, keep caches bounded, stop redrawing static waveform pixels for a moving playhead, and revoke thumbnail resources when they leave the cache.

Create two direct services—audio and thumbnails—not a general resource/cache framework. Revalidate cited baseline assumptions against current dev when task starts; keep delivery to one focused PR.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 One URL requested by waveform and playback is read/decoded once concurrently.
- [ ] #2 AudioBuffer and waveform caches have explicit entry/byte bounds.
- [ ] #3 Thumbnail cache has explicit bounds and revokes evicted blob URLs.
- [ ] #4 No polling loop waits for pending decodes.
- [ ] #5 No new AudioContext is created per waveform.
- [ ] #6 Static waveform pixels are not redrawn every playback animation frame.
- [ ] #7 Inactive/offscreen consumers do not initiate new decode work.
- [ ] #8 Director and Video Editor no longer maintain independent full-project thumbnail maps.
- [ ] #9 Home project cards do not mount video elements.
- [ ] #10 Hero video pauses when hidden and respects reduced motion.
- [ ] #11 Focused service tests, typecheck, and production build pass.
- [ ] #12 No pixel/layout tests are added.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria are satisfied
- [ ] #2 Relevant automated tests pass
- [ ] #3 Lint, type-check, and build checks pass where applicable
- [ ] #4 Documentation is updated where required
- [ ] #5 Implementation summary and verification evidence are recorded
- [ ] #6 No unrelated changes are included
<!-- DOD:END -->
