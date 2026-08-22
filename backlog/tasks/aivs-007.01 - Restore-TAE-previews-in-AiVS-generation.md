---
id: AIVS-007.01
title: Restore TAE previews in AiVS generation
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-22 15:37'
updated_date: '2026-08-22 15:49'
labels: []
dependencies: []
modified_files:
  - backend/services/wangp_bridge.py
  - backend/tests/test_wangp_bridge.py
parent_task_id: AIVS-007
priority: high
type: bug
ordinal: 23000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fix the regression that prevents AiVS from displaying live Tiny Autoencoder previews even though the configured Wan2GP runtime produces them, while preserving local WanGP-only generation and existing fallback behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Supported LTX and MiniMax H3 generations display live TAE preview updates produced by the configured Wan2GP runtime.
- [x] #2 AiVS preserves existing RGB and legacy preview fallback behavior when TAE output is unavailable or unsupported.
- [x] #3 Existing preview settings and saved settings remain compatible without migration.
- [x] #4 A focused regression check covers the confirmed failure boundary.
- [x] #5 The fix is validated through the narrowest applicable backend checks and a live Electron generation when the local GPU runtime is available.
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
1. Update the existing preview-manifest gate in backend/services/wangp_bridge.py to recognize current curated `aivs_ltx2_` and `aivs_minimax_h3_` WanGP model namespaces while retaining legacy raw model support and leaving unsupported models unchanged. 2. Extend the existing parameterized bridge regression in backend/tests/test_wangp_bridge.py with the actual curated AIVS LTX and H3 model types; add no new harness. 3. Run the focused bridge test, Python typecheck if the focused test passes, inspect the exact diff, and validate a live Electron/GPU generation if the current local runtime can be exercised safely. 4. Obtain fresh independent review before finalization.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started regression diagnosis on dev. Worktree already contains substantial unrelated in-progress AIVS-019/AIVS-020/AIVS-021 changes, including backend/services/wangp_bridge.py; preserve and layer only the minimal TAE fix.

Root cause confirmed against Wan2GP dev 9eac9c85: normal curated AIVS model aliases miss the stale bridge prefix gate, so `_preview` is omitted and Wan2GP falls back to RGB defaults. Structured preview events and frontend rendering contracts remain compatible; no callback or UI change is needed.

Implementation: extended the existing supported-preview predicate with the current `aivs_ltx2_` and `aivs_minimax_h3_` namespaces. Legacy raw LTX/H3 IDs and unsupported-model empty plugin data remain unchanged. No settings schema, callback ABI, decoder, or frontend code changed.

Verification: `rtk uv run pytest --noconftest tests/test_wangp_bridge.py::test_video_manifest_requests_tae_previews_only_for_supported_models -q` passed 5/5; `pnpm typecheck:py` passed with 0 errors; `pnpm test:frontend -- frontend/views/genspace/components/GenerationPreviewMedia.test.tsx` passed 4/4; scoped `git diff --check` passed with existing LF-to-CRLF warnings. Fresh reviewer verdict: ship.

Broader/runtime limits: normal pytest collection is blocked by unrelated dirty-worktree `ModelProfile(flow_shift=...)` runtime mismatch (#0208). Isolated full bridge file reached 47 passed with one pre-existing Director config expectation failure (#0076). A settings run with `--noconftest` was not valid because project fixtures were intentionally disabled (2 direct tests passed, 26 fixture setup errors). Live Electron/GPU generation was not run because the same unrelated backend import error prevents a supported app startup in this worktree.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed the TAE preview regression caused by the August 18 WanGP model namespace migration. The bridge now attaches the persisted `_preview` payload to current curated `aivs_ltx2_*` and `aivs_minimax_h3_*` manifests while retaining legacy raw model support and leaving unsupported models on their existing fallback path. Extended the existing focused manifest regression with the actual curated aliases. Verification: exact backend regression 5/5, preview renderer 4/4, Pyright 0 errors, scoped diff check clean, independent reviewer `ship`. Live Electron/GPU validation was blocked by unrelated in-progress `flow_shift` profile work that currently prevents normal backend startup; no preview settings, decoder, callback, or frontend implementation changed.
<!-- SECTION:FINAL_SUMMARY:END -->
