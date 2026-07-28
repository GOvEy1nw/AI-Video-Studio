# Phase 10 — Dependency Automation, Policy, and CI Enforcement

## Objective

Prevent AiVS from drifting back into a multi-major dependency gap by adding:

- a clear dependency ownership policy;
- grouped, low-noise Renovate proposals;
- deterministic frontend/toolchain CI;
- checks that protect the curated WanGP/Python runtime from generic update automation;
- contributor documentation that matches the now-modern stack.

Automation must propose and verify changes; it must not silently merge risky runtime upgrades.

## Phase inputs

- Phase 9: `PASSED`
- Clean worktree
- Starting SHA recorded in `STATUS.md`
- Final intended dependency graph established
- All local release gates passing
- Exact supported Node and pnpm versions known
- Direct-package decision table complete

## Non-goals

This phase must not:

- perform another dependency refresh;
- enable blind major-version automerge;
- allow Renovate to update Python/Torch/CUDA/WanGP;
- introduce a cloud build dependency into the shipped app;
- require a GPU for the basic JavaScript dependency checks;
- rewrite existing CI without first understanding it;
- duplicate Dependabot and Renovate for the same package ecosystem;
- add brittle UI screenshot automation unless the repository already has a stable harness.

## Step 1 — Inventory existing automation

Inspect:

```powershell
Get-ChildItem -Force .github
Get-ChildItem -Recurse -Force .github/workflows
Get-ChildItem -Force | Where-Object {
  $_.Name -match 'renovate|dependabot|node-version|nvmrc|tool-versions'
}
```

Search:

```powershell
rg -n --hidden --glob '!node_modules/**' `
  "dependabot|renovate|setup-node|pnpm/action-setup|corepack|pnpm install|typecheck|test:frontend|build:frontend|backend:test" `
  .github package.json README.md AGENTS.md docs
```

For every existing workflow, record:

- triggers;
- target branches;
- operating systems;
- Node/pnpm versions;
- commands;
- cache configuration;
- permissions;
- secrets;
- artifact publishing;
- whether it is required by branch protection.

Do not overwrite an existing release workflow or signing flow.

## Step 2 — Define the dependency ownership policy

Create or update:

```text
docs/DEPENDENCY_POLICY.md
```

It must define at least three ownership classes.

### Class A — Desktop application/runtime

Examples:

```text
electron
electron-updater
electron-builder
```

Policy:

- manual review required;
- no automerge;
- Electron majors require breaking-change audit and packaged tests;
- must test file import, preload, dialogs, updater, unpacked build, and installer;
- keep Electron on a supported major line;
- do not combine Electron major updates with Vite/Tailwind/React majors.

### Class B — Frontend/build/test ecosystem

Examples:

```text
react
react-dom
@types/react
@types/react-dom
vite
@vitejs/plugin-react
vite-plugin-electron
vitest
jsdom
@testing-library/*
tailwindcss
@tailwindcss/vite
tailwind-merge
typescript
```

Policy:

- update in compatibility groups;
- majors are manual;
- patches/minors require CI and review;
- visual changes require a parity check;
- TypeScript 7 remains separately governed until explicitly adopted.

### Class C — Curated AI runtime

Protected examples:

```text
backend/pyproject.toml
backend/uv.lock
scripts/wangp-stacks.json
scripts/wangp-source.json
scripts/install-wangp-stack.ps1
Wan2GP/
Torch/CUDA/kernel wheels
Transformers/Diffusers/PEFT compatibility pins
```

Policy:

- disabled in generic dependency bots;
- moved only as a coordinated, manually tested runtime release;
- requires hardware compatibility testing;
- no automated PR may alter these files.

Also document:

- Node version support;
- exact pnpm version;
- review cadence;
- minimum validation commands;
- security advisory process;
- override policy;
- how to record intentionally deferred versions.

## Step 3 — Select one dependency bot

Preferred choice for this plan: **Renovate**, because package grouping and manager scoping are central requirements.

Before adding it:

- check whether Dependabot already manages npm;
- if it exists, either migrate it deliberately or leave it and do not add duplicate npm Renovate rules;
- record the chosen single source of update PRs.

Do not run two bots against the same npm lockfile.

## Step 4 — Add a conservative Renovate configuration

Preferred file:

```text
renovate.json
```

Use the official schema and validate the final file.

Recommended baseline shape:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "baseBranches": ["dev"],
  "enabledManagers": ["npm", "github-actions"],
  "dependencyDashboard": true,
  "timezone": "Europe/London",
  "schedule": ["before 6am on Monday"],
  "minimumReleaseAge": "7 days",
  "prConcurrentLimit": 5,
  "branchConcurrentLimit": 5,
  "rebaseWhen": "behind-base-branch",
  "semanticCommits": "enabled",
  "rangeStrategy": "replace",
  "automerge": false,
  "labels": ["dependencies"],
  "lockFileMaintenance": {
    "enabled": true,
    "schedule": ["before 6am on the first day of the month"]
  },
  "packageRules": []
}
```

Treat this as a starting shape, not copy-paste authority. Check the current Renovate schema at implementation time.

### Required package groups

Create package rules for:

#### Electron runtime

```text
electron
```

- separate group;
- majors, minors, and patches all manual;
- high review priority because supported-major windows are short;
- never automerge.

#### Electron packaging/update support

```text
electron-builder
electron-updater
```

- one packaging group;
- never automerge;
- require installer/unpacked evidence.

#### Vite build cluster

```text
vite
@vitejs/plugin-react
vite-plugin-electron
vite-plugin-electron-renderer, only if still present
```

- grouped so peer-compatible changes are reviewed together;
- never automerge majors;
- avoid widening to the next major automatically.

#### React cluster

```text
react
react-dom
@types/react
@types/react-dom
```

- one group;
- runtime and types move together;
- never automerge majors.

#### Tailwind cluster

```text
tailwindcss
@tailwindcss/vite
tailwind-merge
```

- one group;
- require build and visual review;
- never automerge majors.

#### Test cluster

```text
vitest
jsdom
@testing-library/react
@testing-library/user-event
```

- one group;
- full suite required.

#### TypeScript

```text
typescript
```

- separate;
- majors manual;
- block or ignore TypeScript 7 updates until the follow-up evaluation has explicitly approved adoption;
- do not let a generic bot turn the compiler into a native preview/evaluation unexpectedly.

#### Routine application utilities

Examples:

```text
clsx
class-variance-authority
js-yaml
react-dropzone
lucide-react
```

- group compatible patch/minor updates;
- keep majors manual;
- consider keeping `lucide-react` separate because `0.x` minor versions can contain breaking export changes.

#### Development helpers

```text
concurrently
cross-env
wait-on
@resvg/resvg-js
```

- group only when compatibility and native-artifact risks permit;
- keep Resvg separate if its binary support warrants it.

### Required manager protection

Generic automation must not manage the Python/runtime stack.

Use both:

- `enabledManagers` limited to the intended npm and GitHub Actions managers; and
- `ignorePaths` for protected or vendored locations where appropriate.

Example protected patterns to evaluate:

```json
[
  "backend/**",
  "Wan2GP/**",
  "scripts/wangp-stacks.json",
  "scripts/wangp-source.json"
]
```

Confirm current Renovate matching semantics. Do not assume a path rule works without a dry-run/validator result.

### Automerge policy

Initial policy:

```text
automerge: false for every package
```

After several months of reliable CI, the maintainer may separately approve automerge for low-risk patch-only dev dependencies. That is not part of this phase.

## Step 5 — Validate Renovate configuration

Use a current official validator or the Renovate config validation command available at execution time.

Record:

- validator command;
- validator version;
- result;
- resolved package groups;
- managers enabled;
- proof that Python/runtime managers are not enabled.

Where possible, run a local dry-run against the repository and inspect proposed updates. No dry-run proposal should touch:

```text
backend/pyproject.toml
backend/uv.lock
scripts/wangp-stacks.json
scripts/wangp-source.json
Wan2GP/
```

If local validation requires temporary tooling, use an ephemeral `pnpm dlx`/container command rather than adding Renovate as a shipped app dependency.

## Step 6 — Establish deterministic Node/pnpm CI

Use the Node baseline introduced in Phase 1:

```text
current tested Node 24 LTS patch
pnpm 10.30.3
```

The workflow must verify rather than assume those versions.

Create or update a dedicated workflow, for example:

```text
.github/workflows/frontend-toolchain.yml
```

Recommended triggers:

```yaml
on:
  pull_request:
    branches: [dev]
  push:
    branches: [dev]
  workflow_dispatch:
```

Use only the permissions required to read the repository:

```yaml
permissions:
  contents: read
```

Use concurrency cancellation so stale runs do not waste resources:

```yaml
concurrency:
  group: frontend-toolchain-${{ github.ref }}
  cancel-in-progress: true
```

### Required Windows job

Windows is the primary supported desktop platform. The job must:

1. check out the repository, including any required submodule/vendor handling already used by the project;
2. install the reviewed Node 24 LTS patch;
3. activate exactly `pnpm@10.30.3`;
4. restore pnpm's store cache through the supported setup action;
5. install with `pnpm install --frozen-lockfile`;
6. verify versions;
7. ensure the Electron binary is available;
8. run strict TypeScript;
9. run the complete frontend suite;
10. run the Vite/Electron frontend bundle.

Command sequence:

```powershell
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm exec electron --version
pnpm typecheck:ts
pnpm test:frontend
pnpm build:frontend
```

Use currently supported major versions of official GitHub actions and record them in `STATUS.md`. Do not copy an obsolete action version from this document.

### Optional second OS job

A lightweight Linux job can catch path/case and package-graph issues:

```text
install
typecheck:ts
test:frontend
build:frontend
```

However:

- Windows remains mandatory;
- do not let Linux success substitute for packaged Windows validation;
- do not invoke GPU runtime installation.

### Backend CI

First preserve and understand any existing backend workflow.

The backend dependency set includes large, hardware-specific packages. Do not casually make a generic GitHub-hosted runner install the complete CUDA stack merely to satisfy this phase.

Choose one of these based on existing repository support:

1. preserve a working existing backend CI job;
2. use an established CPU/fake-service backend test path already documented in the repo;
3. keep `pnpm backend:test` as a mandatory local/release gate and document why hosted CI cannot safely reproduce the curated GPU environment.

Do not alter backend dependency pins to make CI cheaper.

## Step 7 — Add dependency-change path enforcement

Create a small script or CI step that detects changes to protected runtime paths in generic dependency PRs.

A simple policy check may:

- compare changed files;
- fail when a PR carrying the `dependencies` label changes a protected runtime path; or
- always emit a high-visibility failure requiring the dedicated runtime-upgrade process.

Prefer a simple repository-owned script, for example:

```text
scripts/check-dependency-boundaries.mjs
```

Responsibilities:

- receive a base ref or changed-file list;
- normalise `/` and `\`;
- compare against explicit protected path prefixes;
- return non-zero with a clear message;
- include unit tests for Windows-style and POSIX-style paths.

Do not rely only on a label if forks or local validation cannot supply it. A safer default is to make the script report protected changes in all dependency-update workflows.

Run it in Renovate-generated PR CI.

## Step 8 — Add or standardise a frontend validation script

To keep local and CI commands identical, consider adding:

```json
{
  "scripts": {
    "validate:frontend": "pnpm typecheck:ts && pnpm test:frontend && pnpm build:frontend"
  }
}
```

Before adding it:

- confirm cross-platform shell behaviour under supported Windows and Linux runners;
- do not replace existing granular scripts;
- use the same command locally and in CI.

Then validate:

```powershell
pnpm validate:frontend
```

Do not hide command output behind a custom wrapper.

## Step 9 — Keep lockfile generation deterministic

CI must use:

```text
pnpm install --frozen-lockfile
```

The dependency policy must state:

- lockfile changes are mandatory with package changes;
- contributors must use `pnpm@10.30.3`;
- no npm/yarn lockfiles are accepted;
- lockfile-only maintenance PRs are still reviewed and tested;
- package-store cache is not a substitute for the committed lockfile.

Add a CI check or review guard that rejects accidental:

```text
package-lock.json
yarn.lock
bun.lock
bun.lockb
```

unless the project formally changes package managers.

## Step 10 — Update contributor and agent documentation

At minimum, audit:

- `README.md`
- `AGENTS.md`
- `.projectmem/PROJECT_MAP.md` through its normal update process
- development setup docs
- any docs that say React 18, Electron 31, Vite 5, Tailwind 3, or “no frontend tests”

Correct stale facts.

`AGENTS.md` should state:

- current stack families;
- frontend tests exist;
- mandatory validation commands;
- dependency phase/grouping rules;
- protected runtime files;
- preload remains CommonJS;
- all Electron communication remains through `window.electronAPI`.

Do not edit product requirements beyond factual stack maintenance.

## Step 11 — Test CI locally where practical

Run every repository command used by the workflow:

```powershell
pnpm install --frozen-lockfile
pnpm exec electron --version
pnpm typecheck:ts
pnpm test:frontend
pnpm build:frontend
```

Validate policy/boundary scripts and Renovate config.

If a workflow supports `workflow_dispatch`, push only after the phase commit and inspect the real run. Do not mark Phase 10 passed based solely on YAML appearance.

Record:

- workflow run URL/ID;
- runner OS;
- Node/pnpm exact versions;
- all step results;
- cache behaviour;
- any limitation.

## Step 12 — Review permissions and supply-chain surface

Inspect every new action:

- publisher;
- pinned major or commit policy;
- permissions;
- whether it executes arbitrary pull-request code with secrets;
- whether `pull_request_target` is used.

Rules:

- do not use `pull_request_target` for untrusted dependency code;
- do not expose signing or publishing secrets in validation CI;
- keep permissions read-only;
- do not publish artifacts/releases from dependency PR CI;
- use official or well-established actions only;
- follow the repository's existing action pinning policy.

Renovate installation/authentication is a repository-owner action. The committed config must be useful whether Renovate runs as the GitHub App or a self-hosted bot.

## Step 13 — Full phase validation

Run:

```powershell
pnpm validate:frontend
pnpm typecheck
pnpm test:frontend
pnpm backend:test
pnpm build:frontend
pnpm build:fast:win
pnpm start:unpacked:win
```

If `validate:frontend` was not added, run its three constituent commands directly.

Also run:

- Renovate config validation;
- dependency-boundary tests;
- lockfile/package-manager guard;
- actual GitHub Actions workflow where possible.

Perform a concise manual smoke of the unpacked app to prove CI/policy edits did not alter packaging.

## Step 14 — Commit

Suggested commits:

```text
docs(deps): define dependency maintenance policy
ci: add deterministic frontend toolchain checks
chore(deps): add grouped Renovate configuration
test(ci): enforce dependency runtime boundaries
docs: update contributor stack guidance
```

Keep policy, CI, and bot configuration reviewable. Squashing is not required within the phase.

Update `STATUS.md` with:

- exact files;
- validator output;
- workflow evidence;
- protected-manager evidence;
- owner-side setup still required.

## Exit gate

Phase 10 passes only when:

- one dependency bot strategy is selected;
- grouped Renovate config validates;
- Renovate cannot generically update the curated Python/WanGP runtime;
- all core package families have explicit grouping;
- automerge remains disabled;
- deterministic Windows Node/pnpm CI exists;
- `--frozen-lockfile` is enforced;
- TypeScript, frontend tests, and frontend build run in CI;
- dependency-boundary and package-manager guards pass;
- workflow permissions are minimal;
- contributor/agent docs match the actual stack;
- a real workflow run passes where repository access permits;
- all local full gates pass;
- the phase is committed;
- `STATUS.md` is complete.

Do not begin Phase 11 until this gate is complete.

## Owner-side follow-up after merge

Some settings cannot be committed as code. Record these in the final PR:

- install/enable the Renovate GitHub App if not already enabled;
- make the frontend toolchain workflow required for `dev` pull requests;
- preserve any required backend checks;
- enable branch protection against direct pushes where appropriate;
- confirm the Dependency Dashboard issue is created;
- review the first Renovate dry-run PRs before allowing routine operation.

These are not excuses to omit the repository configuration.

## Recovery procedure

If Renovate proposes protected runtime changes:

1. disable the affected manager/rule immediately;
2. capture the proposal and matched manager;
3. correct `enabledManagers`, `ignorePaths`, or package rules;
4. rerun validation/dry-run;
5. add a regression check for the path.

If CI passes locally but fails on GitHub:

1. inspect Node/pnpm/action versions;
2. reproduce with a clean install;
3. inspect Windows path/shell differences;
4. fix the workflow or repository command rather than weakening tests;
5. record hosted-runner-only limitations.

Do not move to final validation with flaky or knowingly bypassed dependency CI.
