# AiVS Dependency Modernisation Runbook

This folder is a sequential, AI-agent-targeted implementation plan for modernising the application/tooling dependencies in:

- Repository: `GOvEy1nw/AI-Video-Studio`
- Baseline branch: `dev`
- Required work branch: `chore/dependency-modernisation-2026`
- Primary platform: Windows
- Package manager: `pnpm@10.30.3`

The plan deliberately separates each upgrade family into its own document so that an implementation agent can complete, verify, commit, and record one phase before reading the next.

## Mandatory reading order

1. `00_MASTER_RUNBOOK.md`
2. `STATUS.md`
3. The current numbered phase document only
4. `REFERENCES.md` when checking upstream migration notes

`AGENT_START_PROMPT.md` contains a copy/paste task prompt that enforces this sequence.

Do not begin a later phase until the current phase's exit gate is fully satisfied and recorded in `STATUS.md`.

## Main upgrade sequence

| Phase | Document | Purpose |
|---:|---|---|
| 1 | `01_BRANCH_BASELINE_AND_GUARDRAILS.md` | Create the branch, freeze a reproducible baseline, pin the development runtime, and record evidence |
| 2 | `02_ELECTRON_43_MIGRATION.md` | Upgrade Electron 31 → 43 and migrate removed/changed desktop APIs |
| 3 | `03_VITE_8_TOOLCHAIN_MIGRATION.md` | Upgrade Vite and the Electron/Vite integration without changing React or Tailwind |
| 4 | `04_VITEST_4_TEST_STACK_MIGRATION.md` | Upgrade the frontend test stack and add focused regression coverage |
| 5 | `05_TAILWIND_4_COMPATIBILITY_MIGRATION.md` | Move Tailwind 3 → 4 while preserving the existing visual system |
| 6 | `06_TAILWIND_CSS_FIRST_THEME_CONSOLIDATION.md` | Consolidate the small Tailwind config into CSS-first v4 theme tokens |
| 7 | `07_REACT_19_MIGRATION.md` | Upgrade React 18.3 → React 19 with strict type and runtime checks |
| 8 | `08_TYPESCRIPT_6_BRIDGE_MIGRATION.md` | Move to the stable TypeScript 6 bridge release and remove 7.0 blockers |
| 9 | `09_LOW_RISK_PACKAGE_REFRESH.md` | Refresh remaining packages in small, reviewable groups |
| 10 | `10_DEPENDENCY_AUTOMATION_AND_CI.md` | Add sustainable update policy, Renovate grouping, and CI enforcement |
| 11 | `11_FINAL_VALIDATION_AND_PULL_REQUEST.md` | Run full release-grade validation and prepare the pull request |

`12_FOLLOW_UP_TYPESCRIPT_7_EVALUATION.md` is explicitly **not part of the main branch**. It describes a later, separate follow-up branch after this modernisation PR has merged.

## Planned target families

These are the intended target families at the time this plan was written, not permission to jump to a newer major if one appears during implementation:

- Node.js: current Node 24 LTS patch
- pnpm: retain `10.30.3`
- Electron: `43.x`
- Vite: `8.1.x`
- `@vitejs/plugin-react`: `6.x`
- `vite-plugin-electron`: `1.x`
- Vitest: `4.1.x`
- Tailwind CSS: `4.3.x`
- `@tailwindcss/vite`: matching Tailwind version
- `tailwind-merge`: Tailwind-4-compatible `3.x`
- React / React DOM: current patched `19.2.x`
- TypeScript: `6.0.x` for the main PR

At the start of each phase, resolve the newest stable patch **within the stated target family**, read its release notes, record the exact resolved version in `STATUS.md`, and keep the lockfile deterministic.


## Plan freshness

This plan was prepared on **26 July 2026**. Every phase begins by checking current official release notes and support status. A newer major appearing does not authorise the agent to jump to it. If an approved family has become unsupported, the agent must stop and amend the relevant phase rather than improvise.

## Hard scope boundary

This runbook modernises the desktop application and frontend build/test stack. It does **not** authorise routine upgrades to the curated AI runtime.

Do not alter versions or compatibility rules in:

- `backend/pyproject.toml`
- `backend/uv.lock`
- `scripts/wangp-stacks.json`
- `scripts/wangp-source.json`
- `scripts/install-wangp-stack.ps1`
- hardware-specific kernel URLs or package versions
- `Wan2GP/` runtime code, except if a genuine unrelated baseline defect is separately approved

The Torch/CUDA/WanGP stack is a coordinated runtime and must remain manually curated.

## How to hand this to an implementation agent

Give the agent:

1. The repository with a clean `dev` worktree.
2. This entire folder, preferably placed at `docs/dependency-modernisation/`.
3. The instruction:
   **“Read `00_MASTER_RUNBOOK.md` and `STATUS.md`, then execute only the first incomplete numbered phase. Stop at every exit gate.”**

The agent must update `STATUS.md` throughout the work rather than reconstructing progress from memory.


## Files in this delivery

```text
README.md
AGENT_START_PROMPT.md
00_MASTER_RUNBOOK.md
STATUS.md
01_BRANCH_BASELINE_AND_GUARDRAILS.md
02_ELECTRON_43_MIGRATION.md
03_VITE_8_TOOLCHAIN_MIGRATION.md
04_VITEST_4_TEST_STACK_MIGRATION.md
05_TAILWIND_4_COMPATIBILITY_MIGRATION.md
06_TAILWIND_CSS_FIRST_THEME_CONSOLIDATION.md
07_REACT_19_MIGRATION.md
08_TYPESCRIPT_6_BRIDGE_MIGRATION.md
09_LOW_RISK_PACKAGE_REFRESH.md
10_DEPENDENCY_AUTOMATION_AND_CI.md
11_FINAL_VALIDATION_AND_PULL_REQUEST.md
12_FOLLOW_UP_TYPESCRIPT_7_EVALUATION.md
REFERENCES.md
```

The ZIP preserves this folder structure so it can be copied directly into
`docs/dependency-modernisation/`.
