# Phase 9 — Remaining JavaScript Package Refresh

## Objective

Review and refresh the remaining JavaScript dependencies that were not intentionally migrated in Phases 2–8, using small compatibility groups and a complete validation gate after each group.

This phase is not a blanket “update everything” operation. It exists to:

- remove avoidable age from routine packages;
- address supported security fixes;
- bring package declarations closer to the resolved lockfile;
- eliminate clearly unused dependencies;
- document intentionally retained versions;
- keep every change attributable and reversible.

Do **not** update the curated Python/Torch/CUDA/WanGP runtime.

## Phase inputs

- Phase 8: `PASSED`
- Clean worktree
- Starting SHA recorded in `STATUS.md`
- Electron 43, Vite 8, Vitest 4, Tailwind 4, React 19, and TypeScript 6 working
- Full automated baseline passing
- Development and unpacked app smoke-tested
- Protected-path diff clean

## Non-goals

Do not:

- run `pnpm update --latest`;
- run an interactive bulk updater and accept all choices;
- change pnpm from `10.30.3`;
- jump any core package beyond the target family approved in earlier phases;
- update backend `pyproject.toml` or `uv.lock`;
- update WanGP;
- add packages merely because they are fashionable;
- replace working libraries without a concrete maintenance reason;
- combine unrelated source refactors with dependency bumps.

## Step 1 — Produce an accurate inventory

Run:

```powershell
pnpm list --depth 0
pnpm outdated
pnpm why class-variance-authority
pnpm why clsx
pnpm why electron-updater
pnpm why js-yaml
pnpm why lucide-react
pnpm why react-dropzone
pnpm why @resvg/resvg-js
pnpm why concurrently
pnpm why cross-env
pnpm why electron-builder
pnpm why wait-on
```

Also inspect:

```powershell
git diff <PHASE_1_BASELINE_SHA>...HEAD -- package.json pnpm-lock.yaml
```

Create a package decision table in `STATUS.md`:

| Package | Current exact | Candidate exact | Direct/transitive | Used where | Risk | Decision | Reason |
|---|---:|---:|---|---|---|---|---|

Every direct package must receive one explicit decision:

```text
UPDATE
KEEP
REMOVE
ALREADY HANDLED
DEFER
```

“Not noticed” is not an acceptable outcome.

## Step 2 — Check actual package usage

Search direct imports before updating or removing:

```powershell
rg -n --hidden --glob '!node_modules/**' --glob '!release/**' `
  "class-variance-authority|from ['""]clsx['""]|require\(['""]clsx['""]\)" frontend electron

rg -n --hidden --glob '!node_modules/**' --glob '!release/**' `
  "electron-updater|js-yaml|lucide-react|react-dropzone|@resvg/resvg-js" frontend electron scripts

rg -n --hidden --glob '!node_modules/**' --glob '!release/**' `
  "concurrently|cross-env|wait-on|electron-builder" package.json scripts .github
```

Do not assume a package is unused merely because repository code search returns nothing:

- build tools may be invoked by script;
- Electron Builder may be configured through YAML;
- a package may be loaded dynamically;
- a binary may be invoked by name.

Record proof before removal.

## Step 3 — Run security and integrity audits

Run:

```powershell
pnpm audit --prod
pnpm audit
pnpm install --frozen-lockfile
```

For each advisory:

1. identify the vulnerable package and installed path;
2. determine whether it is production or development-only;
3. confirm whether the affected code path is reachable in AiVS;
4. find the first patched compatible release;
5. prefer a direct dependency update;
6. prefer an upstream parent update over a transitive override;
7. record the decision and evidence.

Rules for overrides:

- Use a `pnpm.overrides` entry only when the normal graph cannot obtain a patched version.
- Pin the minimum safe compatible range, not an unrelated newest major.
- Add a comment in the plan/status or repository maintenance doc explaining why it exists.
- Verify the overridden package's API compatibility.
- Create a follow-up issue/reminder to remove the override once the parent dependency catches up.
- Never use a security override to alter Torch, Python, WanGP, CUDA kernels, or packaged model runtime components.

Do not use `pnpm audit --fix --force`.

## Step 4 — Refresh Group A: tiny pure utility packages

Candidate packages:

```text
class-variance-authority
clsx
js-yaml
```

`tailwind-merge` was handled in Phase 5 and must not be casually moved to a new major here.

Before updating, review release notes and engine/peer requirements. Apply only compatible stable releases:

```powershell
pnpm add class-variance-authority@<exact> clsx@<exact> js-yaml@<exact>
```

Then run the fast gate:

```powershell
pnpm typecheck:ts
pnpm test:frontend
pnpm build:frontend
```

Test YAML-loading paths if `js-yaml` is used for runtime/config data.

Commit this group separately if it creates any source compatibility edits:

```text
chore(deps): refresh utility packages
```

If every package is already current or the only available update offers no meaningful benefit, record `KEEP` rather than creating churn.

## Step 5 — Refresh Group B: renderer interaction packages

Candidate packages:

```text
react-dropzone
lucide-react
```

These require separate attention.

### `react-dropzone`

Validate:

- React 19 peer support;
- accepted file type syntax;
- drag-enter/leave behaviour;
- file-dialog cancellation;
- Electron `File` path resolution through `getPathForFile`;
- keyboard accessibility;
- multiple-file behaviour.

After updating:

```powershell
pnpm typecheck:ts
pnpm test:frontend
pnpm build:frontend
```

Manually test:

- gallery OS drag/drop;
- media input drop;
- click-to-open file picker;
- duplicate-file prompt;
- cancel picker;
- unsupported file handling.

### `lucide-react`

The current declaration began on an old `0.400` line, and icon libraries may rename, add, or remove exports while remaining `0.x`. Treat this as a source-affecting update rather than a trivial patch.

Before updating:

```powershell
rg -n --glob 'frontend/**/*.{ts,tsx}' "from ['""]lucide-react['""]" frontend
```

Save the full imported icon-name inventory.

After updating:

- run strict TypeScript immediately;
- replace only genuinely renamed/removed icons with the closest semantically identical icon;
- do not redesign icons;
- preserve sizes, strokes, labels, and accessible names;
- compare visual screenshots for all icon-dense views.

Prefer a dedicated commit:

```text
chore(deps): refresh renderer interaction packages
```

Do not bundle a mass icon restyle into this phase.

## Step 6 — Refresh Group C: Electron application support

Candidate packages:

```text
electron-updater
electron-builder
```

Electron itself was completed in Phase 2 and must remain on the approved Electron 43 family.

### `electron-updater`

Review:

- compatibility with the installed Electron and Electron Builder versions;
- update event types;
- channel/prerelease behaviour;
- `checkForUpdatesAndNotify`;
- `quitAndInstall` semantics;
- GitHub publisher metadata.

Inspect `electron/updater.ts`. Preserve current behaviour unless an API migration requires a change.

### `electron-builder`

Review:

- Windows NSIS changes;
- macOS DMG changes;
- ASAR defaults;
- file pattern semantics;
- publishing metadata;
- code-signing changes;
- native dependency rebuild behaviour;
- Node 24 compatibility.

After updating:

```powershell
pnpm typecheck:ts
pnpm test:frontend
pnpm build:frontend
pnpm build:fast:win
pnpm start:unpacked:win
```

Then build the real installer:

```powershell
pnpm build:win
```

Validate:

- NSIS installer starts;
- custom installer include still works;
- install directory can be selected;
- shortcuts are created as configured;
- packaged resources are present;
- backend and WanGP resources are not pruned;
- uninstall works in the disposable test environment;
- artifact naming remains correct.

Auto-update cannot be proven solely through a local unpacked build. At minimum, verify event registration and that development-mode update failures are handled without crashing. Record what remains release-environment-only.

Prefer a dedicated commit:

```text
chore(deps): refresh Electron packaging support
```

## Step 7 — Refresh Group D: native/image tooling

Candidate package:

```text
@resvg/resvg-js
```

Because this package includes platform-specific/native artifacts:

- review supported Node/Electron platforms;
- check Windows x64 artifact availability;
- check macOS arm64 if macOS remains supported;
- locate all call sites;
- test the exact SVG/render path;
- ensure Electron Builder includes the required package/native artifact;
- run an unpacked and installer build.

Commands:

```powershell
pnpm add -D @resvg/resvg-js@<exact>
pnpm typecheck:ts
pnpm test:frontend
pnpm build:frontend
pnpm build:fast:win
pnpm start:unpacked:win
```

Exercise whichever app operation uses Resvg. Do not approve based only on installation.

Commit separately if updated:

```text
chore(deps): refresh resvg tooling
```

## Step 8 — Refresh Group E: command-line development helpers

Candidate packages:

```text
concurrently
cross-env
wait-on
```

Review:

- Node engine requirements;
- signal forwarding;
- Windows command quoting;
- process exit-code behaviour;
- whether setup/build scripts actually use `wait-on`.

Update only stable compatible releases:

```powershell
pnpm add -D concurrently@<exact> cross-env@<exact> wait-on@<exact>
```

Validate the actual scripts, not only unit tests:

```powershell
pnpm typecheck:ts
pnpm test:frontend
pnpm build:frontend
pnpm dev
pnpm dev:debug
```

Confirm:

- Ctrl+C or normal app close does not leave avoidable Vite/Electron child processes;
- environment variables reach Electron and backend as expected;
- debug ports/options still apply;
- Windows quoting remains valid.

If `wait-on` is truly unused, remove it rather than updating it. Prove removal by searching scripts and successfully running the full build/dev paths.

Commit:

```text
chore(deps): refresh development helpers
```

## Step 9 — Review test packages not already handled

Phase 4 should have handled:

```text
vitest
jsdom
@testing-library/react
@testing-library/user-event
```

Do not move these again unless:

- a critical patched version was released during the branch;
- a React 19 compatibility blocker was documented in Phase 7;
- a security advisory requires it.

Any additional movement must be:

- within the already approved major family;
- release-note reviewed;
- separately recorded;
- followed by the complete frontend suite.

## Step 10 — Normalise direct version declarations

Compare `package.json` ranges with the resolved lockfile.

Goals:

- direct dependencies should declare a sensible current compatible range;
- exact pins should remain exact where deterministic behaviour is intentional;
- do not widen ranges across an unreviewed major;
- do not change all caret/exact conventions globally;
- keep `pnpm@10.30.3` exact.

For build-critical core families, prefer reviewed bounded-major declarations, for example:

```json
"vite": "^8.1.0"
```

provided the exact lockfile has been tested. Do not set `"*"` or `"latest"`.

Run a clean deterministic install after edits:

```powershell
Remove-Item -Recurse -Force node_modules
pnpm install --frozen-lockfile
```

Only do this once all package groups are settled and only after ensuring no local uncommitted artifact lives under `node_modules`.

## Step 11 — Inspect the final graph

Run:

```powershell
pnpm list --depth 0
pnpm list react react-dom electron vite vitest tailwindcss typescript --depth 20
pnpm outdated
pnpm audit --prod
pnpm audit
pnpm install --frozen-lockfile
```

Interpret `pnpm outdated` rather than treating any remaining entry as failure. Valid reasons to remain behind include:

- newer major outside approved scope;
- package lacks React 19/Electron 43 support;
- upstream regression;
- native binary not available;
- deliberate runtime pin.

Every remaining direct outdated item needs a written `KEEP` or `DEFER` reason in `STATUS.md`.

## Step 12 — Full phase validation

Run:

```powershell
pnpm typecheck
pnpm test:frontend
pnpm backend:test
pnpm build:frontend
pnpm build:fast:win
pnpm start:unpacked:win
```

Then perform the full manual smoke matrix from `00_MASTER_RUNBOOK.md`, with emphasis on:

- all file import routes;
- YAML-backed configuration;
- icon rendering;
- React dropzones;
- SVG/Resvg feature;
- update initialization;
- project save/reload;
- image/video/music generation;
- Director;
- editor/export;
- clean shutdown.

Run the real Windows installer build if Electron Builder or native tooling changed.

## Step 13 — Protected-path and accidental-change audit

Run:

```powershell
git diff --name-status <PHASE_8_COMMIT>...HEAD
git diff <PHASE_8_COMMIT>...HEAD -- `
  backend/pyproject.toml backend/uv.lock `
  scripts/wangp-stacks.json scripts/wangp-source.json `
  scripts/install-wangp-stack.ps1 Wan2GP
```

The protected diff must be empty.

Inspect `pnpm-lock.yaml` for unexpectedly introduced package families and duplicate major versions.

## Step 14 — Documentation and commits

Update:

- `STATUS.md` decision table;
- exact version matrix;
- test evidence;
- intentionally deferred packages;
- temporary override rationale;
- stack references in contributor docs when stale.

Keep package-group commits intact. A final documentation-only commit is acceptable.

Suggested commit sequence:

```text
chore(deps): refresh utility packages
chore(deps): refresh renderer interaction packages
chore(deps): refresh Electron packaging support
chore(deps): refresh native rendering tooling
chore(deps): refresh development helpers
docs(deps): record retained package decisions
```

Create only the commits corresponding to actual changes.

## Exit gate

Phase 9 passes only when:

- every direct package has an explicit decision;
- no unreviewed bulk update occurred;
- no unresolved production security advisory remains without a documented owner decision;
- all updated groups passed their focused gates;
- full TypeScript, frontend test, backend test, frontend build, and Windows unpacked gates pass;
- the installer was tested where packaging/native dependencies changed;
- all important workflows pass manual smoke testing;
- remaining outdated direct packages have defensible written reasons;
- no inappropriate override was added;
- the curated runtime is untouched;
- the final graph is deterministic under `--frozen-lockfile`;
- all changes are committed;
- `STATUS.md` is complete.

Do not begin Phase 10 before this gate is complete.

## Recovery procedure

When a group fails:

1. stop before updating the next group;
2. capture the first deterministic failure;
3. identify whether it is API, peer, engine, native binary, build, or runtime;
4. repair only that package group;
5. rerun the group's complete gate;
6. revert the group commit if no safe fix exists;
7. record `DEFER` and the exact reason.

Do not compensate for one failing package by upgrading unrelated packages.
