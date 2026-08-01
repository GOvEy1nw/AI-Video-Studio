---
id: AIVS-002
title: 'Gen Space: Make Prompt & Asset Library Sidebar widths resizable'
status: Done
assignee:
  - '@codex'
created_date: '2026-08-01 13:13'
updated_date: '2026-08-01 15:04'
labels: []
dependencies: []
type: enhancement
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Please make the widths of the Prompt & Asset library sidebars in gen space resizable, with a default width (maybe better to be via vw/percent than by set pixels for a more responsive design?).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 GenSpace prompt and Asset Library sidebars have independent draggable resize handles.
- [ ] #2 Sidebar widths start responsive and remain bounded at narrow and wide viewport sizes.
- [ ] #3 Resize handles support keyboard operation and expose accessible values.
- [ ] #4 Focused tests cover width constraints and user interaction.
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
1. Trace GenSpace pane composition and existing sizing contracts; verify: single owner for pane widths identified.\n2. Add bounded responsive width state and accessible pointer/keyboard resize handles; verify: focused interaction tests.\n3. Run strict TypeScript, focused frontend tests, production build, and diff check; record evidence.
<!-- SECTION:PLAN:END -->
