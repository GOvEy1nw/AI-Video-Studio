---
id: WGP-1
title: Merge main into AiVS and resolve conflicts
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-01 17:09'
updated_date: '2026-08-01 17:17'
labels: []
dependencies: []
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bring the latest commits from the repository's main branch into AiVS, preserving AiVS-specific behavior while integrating upstream changes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 AiVS contains all commits from origin/AiVS and origin/main
- [x] #2 All merge conflicts are resolved without conflict markers or dropped branch-specific behavior
- [x] #3 Relevant syntax and targeted regression checks pass
- [x] #4 Merge result is recorded as a commit on AiVS
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
1. Fetch origin and fast-forward local AiVS/main refs to their remote tips; verify: ancestry checks pass. 2. Merge main into AiVS and enumerate conflicts; verify: only expected unmerged paths remain. 3. Resolve each conflict using both branches' intent and stage resolutions; verify: no unmerged entries or conflict markers remain. 4. Run targeted syntax/regression checks and inspect final diff/topology. 5. Create merge commit and record exact verification evidence.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fast-forwarded AiVS to origin/AiVS 553f403 and local main to origin/main 20229c8. Resolved .gitignore and wgp.py conflicts by retaining download/status callbacks together with model_def/config_id flow. Verification: merge commit a599200 has parents 553f403 and 20229c8; both tips are ancestors; no unmerged entries or conflict markers; 19 unittest tests pass; all 12 changed Python files parse; all 6 changed JSON files parse; static AST assertions confirm combined callback/config wiring. git diff --check reports three trailing-space lines inherited unchanged from main in models/qwen/qwen_handler.py and models/wan/any2video.py; no unrelated cleanup added.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Merged latest main into AiVS as a599200. Preserved AiVS model-download progress and main selectable model configs. Targeted tests and syntax/config checks pass; ready for human review.
<!-- SECTION:FINAL_SUMMARY:END -->
