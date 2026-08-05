---
suggested_backlog_id: AIVS-027
title: Compact project memory and refresh current-state documentation
status: Draft
priority: low
type: documentation
baseline_commit: c405f8224a8a510140591a9b76a568f3a78b49ad
dependencies:
  - AIVS-016
---

# PR 12 — Compact project memory and refresh current-state documentation

## Pull request intent

Reduce Codex/search/diff noise and make current-state documents trustworthy.

This PR does **not** claim an end-user runtime or installer-size improvement. Electron Builder already excludes repository docs/tests/development state from the packaged app.

## Current issues

- `.projectmem/issues/` contains many records for:
  - shell quoting;
  - failed ripgrep patterns;
  - patch-context misses;
  - unavailable package-manager shims;
  - sandbox permissions;
  - expected first-attempt test failures.
- `.projectmem/summary.md` accumulates chronological attempt logs.
- `.projectmem/PROJECT_MAP.md` is labelled current-state but still lists an older React/Electron/Vite stack than `package.json`.
- Backlog tasks, `.projectmem` issues, summary notes, and architecture docs can duplicate the same implementation history.

The result is more repository context but less signal.

## Target ownership

```text
backlog/tasks/
└─ source of truth for actionable work, acceptance, status, implementation summary

.projectmem/PROJECT_MAP.md
└─ concise current code navigation and ownership

.projectmem/summary.md
└─ concise current product/architecture state and active known constraints

.projectmem/issues/
└─ unresolved product/code issues or durable architectural gotchas only

docs/
└─ stable contracts/architecture/operations; not transient task diaries
```

Routine command/tool failures should be local execution logs, not permanent product-memory records.

## Implementation plan

### 1. Define a retention rubric

Keep a `.projectmem/issues` record only when it captures at least one:

- unresolved user-visible product defect;
- data-loss/security risk;
- durable platform/environment constraint that future agents must know;
- architectural gotcha with a non-obvious failure mode;
- validated baseline limitation affecting multiple tasks;
- external dependency/upstream incompatibility requiring follow-up.

Do not keep permanent issue files for:

- quoting/escaping mistakes;
- a patch anchor mismatch;
- an incorrect guessed file path;
- a command typo;
- one sandbox permission denial that does not affect the repository/product;
- a red test added deliberately before its fix;
- a stale UI assertion already removed;
- a failed search that produced no code change.

### 2. Inventory and classify existing records

Create a temporary machine-generated inventory:

```text
path | status | category | referenced by current docs/task? | keep/archive/delete
```

Categories:

- product defect;
- architecture;
- platform/toolchain;
- test baseline;
- transient agent/tool failure;
- superseded/completed.

Do not commit the temporary inventory unless useful as the PR summary.

### 3. Delete or compact transient records

Preferred order:

1. delete transient command/patch/search failures;
2. merge repeated records about the same durable toolchain constraint;
3. remove resolved stale-test records after PR 01 makes the baseline green;
4. retain durable gotchas in a concise named document or current summary.

Do not create an `archive/` containing all the same noise. Git history is the archive.

If ProjectMem requires historical files for its own operation, configure a bounded retention/ignored runtime location rather than committing everything indefinitely.

### 4. Rewrite `.projectmem/summary.md` as current state

Target sections:

- product principles;
- current integration baseline;
- implemented surfaces;
- active limitations;
- current architecture decisions;
- active high-severity issues;
- durable gotchas;
- key files/docs.

Remove:

- timestamped command attempts;
- completed-task narratives;
- repeated validation counts;
- obsolete phase references;
- long “recent issues” chronology.

Set a practical size budget, for example under 500–700 lines unless a specific current-state need justifies more.

### 5. Refresh `.projectmem/PROJECT_MAP.md`

Update from actual files/package:

- React 19;
- Electron 43;
- Vite 8;
- Vitest 4;
- TypeScript 6;
- Tailwind 4;
- current GenSpace tools/modes;
- current shared lifecycle/profile/context architecture after preceding PRs;
- current Asset Library/media/editor ownership;
- current project storage.

The map should navigate; it should not explain every historical implementation phase.

### 6. Update AGENTS/Backlog workflow

Add guidance:

- Backlog is the work/status owner.
- Record failed attempts in the active Backlog task only when they materially affect implementation.
- Promote an issue to project memory only when it meets the retention rubric.
- Do not duplicate full acceptance/validation notes in summary, issue, task, and architecture docs.
- After completing a task, update current-state docs only if architecture/product state changed.

### 7. Add ignored local execution log location

If agents need transient notes, use a path such as:

```text
.projectmem/runtime/
.projectmem/local/
```

Add it to `.gitignore`.

Do not put secrets, user data, or huge logs there. This is an optional local scratch area, not a new source of truth.

### 8. Add a lightweight hygiene check only if necessary

Because the user wants fewer tests, do not add pytest/Vitest cases for docs.

Optional script:

- warns when summary/project map exceed agreed soft line budgets;
- warns when issue filenames/categories are malformed;
- never blocks a UI/code PR because a prose line count changed slightly.

Prefer review policy over another mandatory gate.

## Target files

- `.projectmem/issues/*`
- `.projectmem/summary.md`
- `.projectmem/PROJECT_MAP.md`
- `AGENTS.md`
- `AGENTS_PRD.md` if duplicated/outdated
- `.gitignore`
- `docs/GENSPACE_ARCHITECTURE.md`
- new/updated editor/project-state/storage architecture docs after preceding PRs
- Backlog workflow documentation

## Commit plan

### Commit 1 — `chore(projectmem): remove transient and superseded issue records`

- inventory;
- delete/merge;
- no architecture rewrite yet.

### Commit 2 — `docs(project): refresh concise current-state summary and map`

- actual stack/ownership;
- active limitations only.

### Commit 3 — `docs(agents): define Backlog and project-memory retention ownership`

- workflow;
- optional ignored runtime path.

## Acceptance criteria

- [ ] Every retained `.projectmem/issues` file meets the documented rubric.
- [ ] Routine shell/search/patch/sandbox attempts are not permanent project issues.
- [ ] `summary.md` is current-state, not chronological.
- [ ] `PROJECT_MAP.md` matches `package.json` and current code ownership.
- [ ] Backlog remains the actionable-work source of truth.
- [ ] Architecture docs do not duplicate full Backlog task narratives.
- [ ] Transient agent notes have an ignored local location if needed.
- [ ] No product code or packaged resources change.
- [ ] No automated tests are added for this documentation cleanup.
- [ ] Markdown links/paths referenced by AGENTS and current docs are valid.

## Non-goals

- Do not delete useful architecture contracts.
- Do not rewrite git history.
- Do not claim installer/startup gains.
- Do not create a giant archive of deleted noise.
- Do not add a hard documentation line-count test.
