---
id: AIVS-029
title: Compact project memory and refresh current-state documentation
status: Done
assignee:
  - '@codex'
created_date: '2026-08-05 08:37'
updated_date: '2026-08-06 08:39'
labels:
  - audit
dependencies:
  - AIVS-018
documentation:
  - >-
    docs/AiVS-Code-Health-Performance-Audit/12_PR_PROJECT_MEMORY_AND_DOCS_HYGIENE.md
priority: low
type: docs
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit PR 12. Reduce Codex/search/diff noise and make current-state documents trustworthy.

This PR does **not** claim an end-user runtime or installer-size improvement. Electron Builder already excludes repository docs/tests/development state from the packaged app. Revalidate cited baseline assumptions against current dev when task starts; keep delivery to one focused PR.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every retained `.projectmem/issues` file meets the documented rubric.
- [x] #2 Routine shell/search/patch/sandbox attempts are not permanent project issues.
- [x] #3 `summary.md` is current-state, not chronological.
- [x] #4 `PROJECT_MAP.md` matches `package.json` and current code ownership.
- [x] #5 Backlog remains the actionable-work source of truth.
- [x] #6 Architecture docs do not duplicate full Backlog task narratives.
- [x] #7 Transient agent notes have an ignored local location if needed.
- [x] #8 No product code or packaged resources change.
- [x] #9 No automated tests are added for this documentation cleanup.
- [x] #10 Markdown links/paths referenced by AGENTS and current docs are valid.
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
1. Back up complete ProjectMem event/issue state and produce deterministic retention manifest from documented rubric. 2. Rewrite ProjectMem history to durable current-state decisions, notes, unresolved constraints, and retained high-value issues; regenerate summary and verify issue/event referential integrity. 3. Refresh PROJECT_MAP stack/ownership, clarify Backlog versus ProjectMem ownership, ignore .projectmem/runtime/, and update audit outcome. 4. Validate retained-record rubric, summary size/current-state shape, package/map parity, Markdown paths, docs-only diff, and Git whitespace. 5. Obtain independent migration review, finalize AIVS-029, commit/push feature branch, merge/push dev, and auto-approve Done.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Research baseline: 694 tracked issue files; generated summary is 1,547 lines / 383,153 bytes; PROJECT_MAP is 571 lines and still lists React 18.3.1, TypeScript 5.9.3, Vite 5.4.21, Tailwind 3.4.19, Vitest 2.1.9, Electron 31.7.7. Current package declares React 19.2.8, TypeScript 6.0.3, Vite 8.1.5, Tailwind 4.3.3, Vitest 4.1.10, Electron 43.2.0.

Blocker: current ProjectMem MCP and `pjm --help` expose append/query/regenerate operations only. No selective issue delete/archive/prune, summary compaction, or PROJECT_MAP write operation exists. `pjm regenerate` was run through the supported CLI and reproduced the same 1,547-line / 383,153-byte summary despite configured 20 KB limit. Direct `.projectmem` edits/deletes are forbidden because they bypass event logging and break audit replay.

Blocker resolved 2026-08-06: user explicitly approved one-time direct .projectmem migration and history rewrite. Migration must preserve durable constraints/decisions, use a pre-migration backup, regenerate derived output, and retain Git rollback.

Migration completed from hash-verified backup C:\tmp\aivs-029-projectmem-pre-migration-20260806.zip (SHA-256 F13DB7219B06EDD1F075421826906A863B05BA0070F940FF950F2AE8444D94D2). Ignored inventory classified 697 issue files: retained 4 durable open records and deleted 693 transient/resolved/superseded records. Current memory has 43 parseable events (39 decisions, 4 issues), four matching issue files, zero attempt/fix/note chronology, and a 79-line summary. `pjm regenerate` and post-migration MCP `add_decision` writes succeeded. AIVS-031/AIVS-032/AIVS-033 now track retained actionable signing/updater/icon defects; native automation remains a durable constraint.

Verification: `C:\tmp\aivs029_validate.py` passed backup hash, inventory/event/issue referential integrity, summary budget/noise, package/map parity (React 19.2.8, TypeScript 6.0.3, Vite 8.1.5, Tailwind 4.3.3, Vitest 4.1.10, Electron 43.2.0), WanGP revision/version, six ownership paths, 12 current Markdown documents/links, docs-only scope, and zero test changes. `git check-ignore -v` passed for `.projectmem/runtime/` and `.projectmem/local/`. `git diff --check` passed with line-ending notices only. No automated tests, type checks, builds, or app smoke were run because no executable/configuration/product behavior changed. Independent reviewer verdict: ship, no findings or material verification gaps. Two locked untracked AIVS-028 `.asar` artifacts and stat-only `electron/main.ts` remain excluded from AIVS-029 staging.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @codex
created: 2026-08-06 08:39
---
Auto-approved per explicit user instruction after independent ship review and recorded verification.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Compacted ProjectMem into 39 current decisions and four durable open issues, reducing summary from 1,547 to 79 lines. Refreshed stack/ownership/runtime pins, defined Backlog/ProjectMem retention ownership, added ignored transient-memory paths, and condensed audit documentation. Created AIVS-031 through AIVS-033 for actionable retained defects. Verified migration integrity, rollback backup, current-doc links, package/map parity, docs-only scope, and whitespace; independent review verdict ship.
<!-- SECTION:FINAL_SUMMARY:END -->
