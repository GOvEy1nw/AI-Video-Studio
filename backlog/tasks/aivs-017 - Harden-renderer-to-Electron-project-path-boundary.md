---
id: AIVS-017
title: Harden renderer-to-Electron project path boundary
status: Done
assignee:
  - '@codex'
created_date: '2026-08-04 13:20'
updated_date: '2026-08-04 16:34'
labels:
  - security
  - electron
  - filesystem
  - project-safety
dependencies: []
references:
  - 'projectmem issues #0525, #0526, #0530, #0532'
documentation:
  - >-
    docs/AiVS-Code-Health-Performance-Audit/00_PR_ELECTRON_PATH_BOUNDARY_HARDENING.md
  - docs/AiVS-Code-Health-Performance-Audit/00_AUDIT_REPORT.md
priority: high
type: bug
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Restore the intended context-isolated filesystem boundary before performance work. Renderer-controlled values must not approve arbitrary paths, broaden allowed roots, or escape project-scoped asset directories. Preserve valid project roots, in-place media workflows, folder layout, project data, and generation behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Renderer input cannot directly approve an arbitrary filesystem path.
- [x] #2 Project asset root changes require canonical user-mediated native selection, and untrusted persisted custom roots recover through non-destructive re-selection.
- [x] #3 Every privileged Electron file operation validates its source and destination before filesystem access.
- [x] #4 Project IDs are safe single path segments and derived upload, generated, and deletion targets remain beneath the canonical project directory.
- [x] #5 Existing valid project roots, imports, in-place media references, reveal operations, and project-scoped deletion continue to work.
- [x] #6 Focused traversal, unapproved-path, persisted-root, and containment tests pass.
- [x] #7 TypeScript/build gates and relevant native Electron smoke checks complete with exact results recorded.
- [x] #8 No generation, project schema, asset folder layout, or WanGP behavior changes.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria are satisfied
- [x] #2 Relevant automated tests pass
- [ ] #3 Lint, type-check, and build checks pass where applicable
- [x] #4 Documentation is updated where required
- [x] #5 Implementation summary and verification evidence are recorded
- [x] #6 No unrelated changes are included
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Replace renderer string authority with Electron-main project-root picker; persist trust provenance and surface legacy-root re-selection state without moving/deleting assets.
2. Replace arbitrary approveLocalPath with preload-owned File approval; persist exact user-selected external file approvals for reopen compatibility.
3. Validate reveal/search/existence/read/write/import/move/delete inputs before access; use canonical returned paths.
4. Add shared safe project-ID and derived-path containment helper used by import/copy/delete.
5. Add focused pure/native-boundary regressions; update affected renderer tests and types.
6. Run focused tests, TypeScript, full frontend tests, production build, git diff checks, and feasible native Electron smoke; obtain independent security review.

Resolve independent-review findings and rerun focused security regressions.

Request fresh independent review after corrections.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Architecture preserves drag/drop and Video Editor in-place references through a narrow preload File capability: preload derives native path via webUtils, main records exact-file approval, renderer cannot submit a path string. Legacy projectAssetsPath values lacking trust version remain stored as recovery context but do not enter allowed roots; native re-selection promotes chosen canonical directory.

Independent review verdict fix-first: broad saveFile access to userData lets renderer forge app-state trust; lexical containment permits symlink/junction escape; pre-change in-place references need native re-selection recovery; canonical directory picker must return canonical path.

Correction design: exact native-dialog-approved write paths only; main-owned temporary-file write; canonical realpath/nearest-existing-ancestor containment; matched native re-selection for legacy external paths.

Fresh independent review verdict fix-first: persisted-media recovery retires all candidates before native picker outcome, so cancellation/partial selection can suppress retries and multi-directory references cannot all reconnect. Correction assigned: explicit outcome, current-project scoping, approve-only retirement, bounded sequential batches, deferred retry on project reopen/switch.

Final implementation: replaced renderer path-string authority with preload File capabilities and main-owned native selection; added canonical exact/subtree approvals, provenance-gated persisted trust, realpath containment, safe project IDs, project-scoped derived paths, protected model folders, restricted temp authority, and retryable external-media recovery. Main areas: electron app-state/config/path-validation/preload; file/export/app/video IPC; project asset/model folder helpers; renderer uploaders/settings/project context/media import/editor consumers; focused boundary tests. Verification: pnpm test:frontend -- electron/app-state.test.ts electron/config.test.ts electron/path-validation.test.ts electron/lib/project-asset-import.test.ts electron/lib/model-folder-selection.test.ts electron/ipc/video-processing-handlers.test.ts frontend/lib/media-import.test.ts frontend/lib/native-file-path.test.ts frontend/contexts/ProjectContext.test.ts passed 9 files/37 tests; pnpm build:frontend passed renderer/main/preload with existing chunk warnings; git diff --check -- electron frontend passed with EOL warnings; pnpm typecheck:ts failed only 12 pre-existing unused-symbol diagnostics in GalleryAssetLibrary.tsx, ReframePanel.tsx, and VideoGenPanel.tsx. Earlier full frontend run: 47 files/210 tests passed and 6 files/11 tests failed on known baseline failures plus one jsdom media error. Fresh independent reviewer verdict: ship, no findings. Deferred gaps: native Electron dialog/recovery/reveal smoke; AC5 native continuity and AC7 therefore remain unchecked. Residual risk: local filesystem replacement after canonicalization (TOCTOU). No stage, commit, push, or PR; unrelated dirty worktree changes preserved.

Native Windows Electron smoke completed and accepted by user on 2026-08-04 using isolated LOCALAPPDATA/APPDATA and dev port 5173; real AiVS profile untouched. PASS: legacy project-assets warning appeared; native folder picker returned canonical selected-project-root and warning cleared; untrusted external media opened native recovery picker; cancellation left project usable; Home/reopen retried picker; exact external icon selection persisted with provenance; recovered asset loaded; Show in Explorer opened correct folder with icon.png selected (user-confirmed); restart preserved project root and exact-file approval with no recovery prompt. Smoke Electron, Vite, and backend processes stopped; isolated fixtures removed. Existing pnpm typecheck:ts result remains 12 unrelated unused-symbol diagnostics; production frontend/main/preload build previously passed. An unpacked build retry was deliberately stopped when user requested port-5173 smoke, so no new packaging claim is made.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Completed and user-accepted renderer-to-Electron filesystem hardening. Focused boundary suite passed 37/37, renderer/main/preload production build passed, fresh security review returned ship, and isolated native Windows Electron smoke passed project-root reselection, external-media cancel/retry, exact approval/load, Show in Explorer, and restart persistence. TypeScript command still exits on 12 unrelated pre-existing unused-symbol diagnostics, recorded as the sole unchecked DoD gate; no AIVS-017 source failure remains.
<!-- SECTION:FINAL_SUMMARY:END -->
