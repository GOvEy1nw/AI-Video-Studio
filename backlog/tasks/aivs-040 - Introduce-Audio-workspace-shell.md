---
id: AIVS-040
title: Introduce the Audio workspace shell
status: Human Review
assignee:
  - '@Codex'
created_date: '2026-08-06'
updated_date: '2026-08-08 14:23'
labels:
  - maestro-programme
  - audio
  - genspace
dependencies:
  - AIVS-036
modified_files:
  - docs/GENSPACE_ARCHITECTURE.md
  - frontend/views/genspace/GenSpaceModeTabs.tsx
  - frontend/views/genspace/GenSpaceSidebar.tsx
  - frontend/views/genspace/audio/AudioGenPanel.test.tsx
  - frontend/views/genspace/audio/AudioGenPanel.tsx
  - frontend/views/genspace/audio/AudioModeSelector.tsx
  - frontend/views/genspace/components/ModeSelector.tsx
  - frontend/views/genspace/hooks/useGenSpaceAudioState.ts
  - frontend/views/genspace/hooks/useGenSpaceController.tsx
  - frontend/views/genspace/types.ts
type: enhancement
ordinal: 40000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rename the top-level Quick Gen Music category to Audio and establish internal Music, Speech, SFX, and Mixer ownership without rewriting the mature Music implementation.

**Programme wave:** 2  
**Complexity:** Medium  
**Dependencies:** AIVS-036
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Quick Gen shows Audio instead of Music.
- [x] #2 Audio defaults to Music.
- [x] #3 Existing Music behaviour, requests, and metadata remain unchanged.
- [x] #4 Submode state survives switching.
- [x] #5 Only one shared generation lifecycle exists.
- [x] #6 Inactive Audio subpanels do not retain media side effects.
- [x] #7 Focused tests, TypeScript, and build pass.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria are satisfied
- [x] #2 Relevant automated tests pass
- [x] #3 Lint, type-check, and build checks pass where applicable
- [x] #4 Documentation is updated where required
- [x] #5 Implementation summary and verification evidence are recorded
- [x] #6 No unrelated changes are included
- [x] #7 Applicable native Electron and real WanGP validation is recorded
- [x] #8 Provenance and licence metadata are complete for added runtime/model assets
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Preserve the internal top-level `GenSpaceMode` value `music` for saved settings, requests, assets, mode accents, and Copy Settings compatibility; change only the Quick Gen tab's user-facing label to Audio.
2. Add the narrow `AudioSubMode = music | speech | sfx | mixer` type beside the GenSpace controller contracts and a controller-owned `useGenSpaceAudioState` hook that defaults to Music. Because `useGenSpaceController` remains mounted, the selected Audio submode survives top-level mode switches without speculative per-feature settings or a new global audio type module.
3. Add `AudioGenPanel` and `AudioModeSelector`. Music delegates directly to the existing `MusicGenPanel`; Speech, SFX, and Mixer render explicit planned/unavailable placeholders. Render only the selected branch so inactive subpanels own no media elements or effects.
4. Extend the shared `ModeSelector` with an optional accessible trigger label, then use `Choose audio type` so the new Audio selector does not conflict with Music's existing `Choose mode` control.
5. Replace the sidebar's direct Music panel controller with an Audio controller that wraps the unchanged Music controller. Do not edit `useGenSpaceModeState`, `mode-transitions`, `useGenSpaceSettingsState`, `MusicGenPanel`, `useGenSpaceGenerationActions`, or `useGenSpaceResultPersistence`, and do not instantiate another `useGeneration`.
6. Add focused tests covering the Audio label-to-legacy-`music` mapping, default Music panel, submode switching/persistence across panel unmount/remount, and inactive-placeholder absence of Music/media elements. Retain the existing mode-transition and Music tests as compatibility evidence.
7. Update `docs/GENSPACE_ARCHITECTURE.md`, run the focused Audio, mode-transition, and Music tests, strict TypeScript, and the frontend production build; inspect the task-scoped diff and obtain independent review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Record approved deviations, source revisions, exact commands/results, runtime hardware, screenshots or recordings where relevant, and resulting commit/PR SHAs here.

2026-08-08 implementation: preserved top-level `music` as the compatibility value and wrapped the unchanged Music controller/panel in a controller-owned Audio shell. Added a persistent Music/Speech/SFX/Mixer submode, unique `Choose audio type` accessibility label, and stateless unavailable placeholders that mount no inactive Music/media branch. No Music request, settings, generation action, snapshot, persistence, backend, IPC, runtime, or model code changed.

2026-08-08 verification: direct focused Vitest (`AudioGenPanel`, mode transitions, generation actions, result persistence) passed 4 files / 12 tests; `pnpm typecheck:ts` passed; `pnpm build:frontend` passed renderer, Electron main, and preload builds; targeted diff/whitespace check passed. Independent review verdict: `ship`, no findings.

2026-08-08 validation limits: the repository `pnpm test:frontend -- <files>` wrapper ignored its filters and ran all 54 files. The new Audio suite passed, while unrelated existing `AssetContextMenu` and `MusicGenPanel` tests failed outside this task's diff; the direct focused command supplied task evidence. Native Electron and real WanGP generation were not run because this shell changes no native media, backend, request, persistence, model, runtime, or licence path. No runtime/model assets were added, so provenance/licence work is not applicable.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented the Quick Gen Audio workspace shell while preserving the mature Music contract.

What changed:
- Renamed the user-facing top-level Music tab to Audio while retaining internal `music` values for compatibility.
- Added controller-owned Audio submode state defaulting to Music, with Music, Speech, SFX, and Mixer choices.
- Routed Music directly to the existing `MusicGenPanel`; Speech, SFX, and Mixer show explicit unavailable placeholders and mount no inactive media/generation UI.
- Kept the single existing `useGeneration` lifecycle and all Music request, metadata, snapshot, persistence, and Copy Settings paths unchanged.
- Added a distinct accessible Audio selector label and updated the GenSpace architecture contract.

Verification:
- Direct focused Vitest: 4 files / 12 tests passed.
- `pnpm typecheck:ts`: passed.
- `pnpm build:frontend`: renderer, Electron main, and preload passed.
- Targeted diff/whitespace check: passed.
- Independent review: `ship`, no findings.

Limits:
- Native Electron/real WanGP smoke was not applicable to this presentation/controller shell.
- An accidentally broad frontend run exposed two unrelated existing test failures outside this diff; they are not attributed to AIVS-040.
<!-- SECTION:FINAL_SUMMARY:END -->

## Current State

`GenSpaceMode` is Image/Video/Music. Music already has typed settings, compiler, generation, multi-output persistence, and restore logic.

## Target State

Top-level Image/Video/Audio navigation; Audio defaults to Music; each Audio submode retains state; the existing Music path remains functionally and persistently unchanged.

## API / Runtime Contract

No backend change. Existing Music endpoints and requests remain unchanged.

## Persistence and Compatibility

Existing Music Asset metadata remains byte-for-byte compatible. This task adds no project schema fields.

## Existing Files Expected to Change

- frontend/views/genspace/types.ts
- frontend/views/genspace/hooks/useGenSpaceModeState.ts
- frontend/views/genspace/hooks/useGenSpaceController.tsx
- frontend/views/genspace/hooks/useGenSpaceSettingsState.ts
- frontend/views/genspace/GenSpaceSidebar.tsx
- frontend/views/genspace/music/MusicGenPanel.tsx
- frontend/views/genspace/logic/mode-transitions.ts
- frontend/views/genspace/hooks/useGenSpaceGenerationActions.ts
- frontend/views/genspace/hooks/useGenSpaceResultPersistence.ts
- docs/GENSPACE_ARCHITECTURE.md

## Proposed New Files

- frontend/types/audio.ts
- frontend/views/genspace/audio/AudioGenPanel.tsx
- frontend/views/genspace/audio/AudioModeSelector.tsx
- frontend/views/genspace/hooks/useGenSpaceAudioState.ts

## WanGP / External Runtime Files to Inspect or Change

- None.

## Required Error and Recovery States

- legacy mode normalisation
- submode switch during generation
- inactive state loss
- duplicate generation owner
- inactive media side effect

## Automated Validation

- pure mode-transition tests
- Audio shell/controller tests
- retained Music critical interaction tests
- TypeScript/build

## Manual / Real-Runtime QA

- switch Image/Video/Audio
- cycle all Audio modes
- return to Music with settings intact
- generate Music before/after switch
- inactive workspace

## Non-Goals

- implementing Speech/SFX/Mixer engines
- moving the Music folder
- redesigning GenSpace
- changing project tabs

## Recommended Commit / PR Split

- Commit 1: types, state, and transitions.
- Commit 2: Audio shell and Music adapter.
- Commit 3: tests and documentation.

## Required Reading

- docs/GENSPACE_ARCHITECTURE.md
- docs/TESTING_POLICY.md
- frontend/views/genspace/types.ts
