---
id: AIVS-043
title: Track bundled WanGP from AiVS branch head
status: In Progress
assignee:
  - Codex
created_date: '2026-08-09 16:42'
updated_date: '2026-08-09 16:45'
labels: []
dependencies: []
references:
  - 'https://github.com/GOvEy1nw/Wan2GP'
priority: medium
type: enhancement
ordinal: 43000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Remove the exact WanGP commit and wangpVersion gates so AiVS only requires the latest head of GOvEy1nw/Wan2GP's AiVS branch, while preserving the existing local source setup and update workflow.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 WanGP source requirements identify GOvEy1nw/Wan2GP and the AiVS branch without requiring an exact commit.
- [ ] #2 WanGP source validation and update paths do not require or compare a wangpVersion value.
- [ ] #3 Focused source-management checks and current documentation reflect branch-head tracking.
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Reduce scripts/wangp-source.json to the GOvEy1nw/Wan2GP repository and AiVS branch contract.
2. Update PowerShell and shell source setup/update workflows to resolve and consume the current AiVS branch head without manifest commit or WanGP version checks, preserving dirty-checkout protection and rollback.
3. Update the focused source contract test and current engineering/backend/project-memory documentation.
4. Run the focused pytest, PowerShell parser, shell syntax, manifest-reference scan, and scoped diff checks; inspect the complete diff and obtain independent review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Research found exact revision/version gates in scripts/wangp-source.json, scripts/update-wangp.ps1, both ensure-wan2gp scripts, and backend/tests/test_wangp_source.py. Current contract wording also exists in AGENTS_PRD.md, AGENTS.md, backend/WANGP_BACKEND.md, and .projectmem/PROJECT_MAP.md. Existing Wan2GP worktree changes are user-owned and must remain untouched; the user explicitly allowed replacing the current manifest edits.
<!-- SECTION:NOTES:END -->
