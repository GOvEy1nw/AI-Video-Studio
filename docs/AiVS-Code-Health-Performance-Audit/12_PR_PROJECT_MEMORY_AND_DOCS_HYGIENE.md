---
backlog_id: AIVS-029
title: Compact project memory and refresh current-state documentation
status: Implemented
priority: low
type: documentation
baseline_commit: 4c246b85b23f9378868d9a3df97f58801e53724e
dependencies:
  - AIVS-018
---

# Project memory and documentation hygiene

## Intent

Keep repository context small, current, and clearly owned. This maintenance changes no
product code or packaged resources and claims no runtime or installer-size improvement.

## Ownership

```text
backlog/tasks/
└─ actionable work, acceptance, status, implementation plan, completion evidence

.projectmem/PROJECT_MAP.md
└─ current code navigation, ownership, stack, and durable constraints

.projectmem/summary.md
└─ concise current product/architecture state and active known issues

.projectmem/issues/
└─ unresolved product/code issues and durable cross-task constraints only

docs/
└─ stable product, architecture, testing, runtime, and operating contracts
```

Optional transient notes belong under ignored `.projectmem/runtime/` or
`.projectmem/local/`. They are not another source of truth and must not contain secrets,
user data, or large logs.

## ProjectMem retention rubric

Retain an issue only when it captures at least one:

- unresolved user-visible product defect;
- data-loss or security risk;
- durable platform/environment constraint;
- architectural gotcha with a non-obvious failure mode;
- validated baseline limitation affecting multiple tasks;
- external dependency or upstream incompatibility requiring follow-up.

Do not retain quoting/escaping mistakes, patch-anchor misses, guessed paths, command
typos, one-off sandbox denials, expected red tests, removed stale assertions, failed
searches without product impact, completed-task publish notes, or validation transcripts.
Git and Backlog preserve historical delivery evidence.

## Migration outcome

- Classified 697 pre-migration issue files in an ignored machine-generated inventory.
- Retained four durable open records: unsigned installer, updater HTTP 406, missing
  packaged icon resource, and native Electron automation limitation.
- Tracked actionable retained defects in Backlog as AIVS-031, AIVS-032, and AIVS-033;
  native automation remains a cross-task environment constraint.
- Removed 693 transient, resolved, superseded, or task-history issue files.
- Rebuilt ProjectMem events from current architectural decisions and retained issues.
- Regenerated `summary.md` as current state instead of a chronological attempt log.
- Refreshed `PROJECT_MAP.md` for React 19, TypeScript 6, Vite 8, Tailwind 4, Vitest 4,
  Electron 43, WanGP 12.3456, and AIVS-019 through AIVS-028 ownership changes.

Migration was explicitly user-approved. Git history remains the repository rollback path;
a hash-verified pre-migration ZIP was created outside the repository before deletion.

## Maintenance rule

Update summary/map only when product state, ownership, runtime pins, constraints, or an
architectural contract changes. Keep detailed task verification in Backlog. Promote an
issue to ProjectMem only when it meets the retention rubric.

No automated documentation test was added. Review policy and focused validation remain
the enforcement mechanism.
