---
id: AIVS-029
title: Compact project memory and refresh current-state documentation
status: Backlog
assignee: []
created_date: '2026-08-05 08:37'
labels:
  - audit
dependencies:
  - AIVS-018
documentation:
  - >-
    docs/AiVS-Code-Health-Performance-Audit/12_PR_PROJECT_MEMORY_AND_DOCS_HYGIENE.md
priority: low
type: docs
ordinal: 33000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit PR 12. Reduce Codex/search/diff noise and make current-state documents trustworthy.

This PR does **not** claim an end-user runtime or installer-size improvement. Electron Builder already excludes repository docs/tests/development state from the packaged app. Revalidate cited baseline assumptions against current dev when task starts; keep delivery to one focused PR.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every retained `.projectmem/issues` file meets the documented rubric.
- [ ] #2 Routine shell/search/patch/sandbox attempts are not permanent project issues.
- [ ] #3 `summary.md` is current-state, not chronological.
- [ ] #4 `PROJECT_MAP.md` matches `package.json` and current code ownership.
- [ ] #5 Backlog remains the actionable-work source of truth.
- [ ] #6 Architecture docs do not duplicate full Backlog task narratives.
- [ ] #7 Transient agent notes have an ignored local location if needed.
- [ ] #8 No product code or packaged resources change.
- [ ] #9 No automated tests are added for this documentation cleanup.
- [ ] #10 Markdown links/paths referenced by AGENTS and current docs are valid.
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
