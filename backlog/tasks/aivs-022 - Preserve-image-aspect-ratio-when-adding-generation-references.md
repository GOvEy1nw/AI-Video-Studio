---
id: AIVS-022
title: Preserve image aspect ratio when adding generation references
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-22 17:31'
updated_date: '2026-08-22 17:35'
labels:
  - quick-gen
  - image
dependencies: []
modified_files:
  - frontend/views/genspace/logic/media-inputs.ts
  - frontend/views/genspace/logic/media-inputs.test.ts
priority: medium
type: bug
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Adding a reference image in the Image Generate workflow currently changes the selected aspect ratio to Auto. Reference-only image inputs must preserve the user's current aspect ratio; automatic ratio selection remains limited to Image Edit and video start/end frame inputs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Adding or removing a reference image in Image Generate preserves the currently selected aspect ratio.
- [x] #2 Image Edit inputs may still select Auto aspect ratio.
- [x] #3 Video start and end frame inputs may still select Auto aspect ratio.
- [x] #4 A focused regression check covers the Image Generate reference behavior without weakening the existing edit or video behavior.
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
1. Tighten the existing pure aspect-ratio lock predicates in `frontend/views/genspace/logic/media-inputs.ts`: Image Generate references remain user-sized; Image Edit stays Auto when an edit image is present except Reframe; Video Generate stays Auto only for legacy/start/end frame inputs.
2. Update the existing focused predicate regression in `frontend/views/genspace/logic/media-inputs.test.ts` to cover Image Generate references, Image Edit, video start/end frames, and non-frame video references.
3. Inspect the scoped diff, run the focused Vitest file, then run strict TypeScript checking. Broader suites and Electron visual QA are unnecessary because this changes one pure display-state predicate with direct regression coverage.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Root cause: the shared display predicate treated every visual media input as aspect-ratio-owning, so ordinary Image Generate references and non-frame video references rendered the aspect control as Auto.

Verification: `pnpm test:frontend -- frontend/views/genspace/logic/media-inputs.test.ts` passed 1 file / 10 tests. `pnpm typecheck:ts` was blocked only by pre-existing unused imports in `frontend/components/AppTitleBar.tsx` and `frontend/components/GenerationQueuePanel.tsx`; `pnpm exec tsc --noEmit --noUnusedLocals false --noUnusedParameters false` passed. Scoped `git diff --check` reported no whitespace errors (only existing LF-to-CRLF warnings).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
## Summary
- Preserve the selected image aspect ratio when ordinary Image Generate references are added or removed.
- Keep Auto aspect behavior for Image Edit source images (except Reframe) and video start/end frames only.
- Extend the existing pure media-input regression to cover reference, edit, start-frame, end-frame, legacy-frame, audio, and non-frame video cases.

## Verification
- `pnpm test:frontend -- frontend/views/genspace/logic/media-inputs.test.ts` — passed 10/10.
- `pnpm exec tsc --noEmit --noUnusedLocals false --noUnusedParameters false` — passed.
- Strict `pnpm typecheck:ts` remains blocked by two unrelated pre-existing unused imports in AppTitleBar and GenerationQueuePanel.
- Scoped diff check passed; no documentation change was required.
<!-- SECTION:FINAL_SUMMARY:END -->
