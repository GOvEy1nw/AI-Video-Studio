# Phase 11 — Final Release-Grade Validation and Pull Request

## Objective

Prove that the complete dependency-modernisation branch is reproducible, behaviourally compatible, visually stable, safe for existing users, and ready for review against `dev`.

This phase must not contain another broad migration. It is for:

- synchronisation with the current `dev`;
- final defect correction;
- clean-install verification;
- full automated and manual regression testing;
- installer and existing-user-data testing;
- final documentation;
- pull-request preparation.

A green TypeScript command is not enough. AiVS is an Electron desktop app that packages a Python/WanGP runtime and handles valuable local project media; final validation must reflect that.

## Phase inputs

- Phases 1–10: `PASSED`
- Every completed phase has a commit SHA in `STATUS.md`
- Clean worktree
- Full version matrix available
- Baseline and final screenshots available
- Renovate/CI configuration validated
- Existing project and app-state backups available
- A Windows test environment suitable for install/uninstall

## Prohibited work

Do not:

- add new product features;
- redesign UI;
- adopt TypeScript 7;
- jump to newer major package families;
- update the Python/Torch/CUDA/WanGP stack;
- squash away evidence before review unless the maintainer explicitly asks;
- force-push over unreviewed remote work;
- dismiss failures as “probably dependency noise”;
- mark tests passed when they were skipped or could not run.

## Step 1 — Freeze the candidate

Record:

```powershell
git status --short
git branch --show-current
git rev-parse HEAD
git log --oneline --decorate --max-count=30
```

Required branch:

```text
chore/dependency-modernisation-2026
```

Ensure `STATUS.md` has no incomplete mandatory phase except Phase 11.

Create a temporary candidate tag locally if useful:

```powershell
git tag -f dependency-modernisation-candidate-1 HEAD
```

Do not push the temporary tag unless the maintainer requests it.

## Step 2 — Check whether `dev` moved

Fetch without modifying the branch:

```powershell
git fetch origin
git rev-list --left-right --count origin/dev...HEAD
git log --oneline --left-right origin/dev...HEAD
```

Interpret:

- first count: commits only on `origin/dev`;
- second count: commits only on this branch.

### If the branch is not behind

Continue.

### If `origin/dev` has new commits

Inspect them before integration:

```powershell
git log --stat HEAD..origin/dev
git diff --name-status HEAD...origin/dev
```

Determine which completed phases they overlap.

Use a normal merge rather than silently rebasing the full audited series:

```powershell
git merge --no-ff origin/dev
```

Rules:

- resolve conflicts by preserving current `dev` product behaviour plus the dependency compatibility work;
- do not accept “ours” or “theirs” across whole files without inspection;
- record every conflict in `STATUS.md`;
- rerun the exit gate for each affected earlier phase;
- always rerun the entire Phase 10/full gate;
- commit the merge resolution;
- do not continue while conflict fallout remains.

If project policy explicitly requires rebase instead, stop and obtain maintainer approval because it rewrites every recorded phase SHA.

## Step 3 — Generate the final version matrix

Record exact installed versions:

```powershell
node --version
pnpm --version
pnpm exec electron --version
pnpm exec vite --version
pnpm exec vitest --version
node -p "require('./node_modules/tailwindcss/package.json').version"
pnpm exec tsc --version
pnpm list react react-dom @types/react @types/react-dom --depth 0
pnpm list --depth 0
```

Where a package has no useful CLI version, obtain it from:

```powershell
node -p "require('./node_modules/<package>/package.json').version"
```

Create a final table in `STATUS.md` and the pull request:

| Component | Baseline | Final | Approved family | Evidence |
|---|---:|---:|---|---|
| Node | | | 24 LTS | |
| pnpm | 10.30.3 | 10.30.3 | exact | |
| Electron | 31.7.7 resolved | | 43.x | |
| Vite | 5.4.21 resolved | | 8.1.x | |
| Vitest | 2.1.9 | | 4.1.x | |
| Tailwind | 3.4.19 resolved | | 4.3.x | |
| React | 18.3.1 | | 19.2.x | |
| TypeScript | 5.9.3 resolved | | 6.0.x | |

Use actual final values; do not copy placeholders.

Also list every other direct package changed in Phase 9.

## Step 4 — Final repository-diff audit

Run:

```powershell
git diff --stat origin/dev...HEAD
git diff --name-status origin/dev...HEAD
git diff --check origin/dev...HEAD
git log --reverse --format="%h %s" origin/dev..HEAD
```

Review every changed file.

Classify changes:

```text
Expected dependency manifest/lockfile
Electron compatibility
Vite/toolchain compatibility
Vitest/test coverage
Tailwind compatibility/theme
React compatibility
TypeScript compatibility
Routine package refresh
CI/automation
Documentation/evidence
Unexpected
```

No file may remain in `Unexpected`.

### Protected runtime audit

Run:

```powershell
git diff --name-status origin/dev...HEAD -- `
  backend/pyproject.toml backend/uv.lock `
  scripts/wangp-stacks.json scripts/wangp-source.json `
  scripts/install-wangp-stack.ps1 Wan2GP
```

Expected result: empty, except a separately approved and fully explained change that is not a version/runtime alteration. The default outcome is no change.

### Unwanted artifact audit

Search for:

```text
node_modules/
release/
dist/
dist-electron/
coverage/
*.log
temporary screenshots outside the approved evidence directory
package-lock.json
yarn.lock
bun.lock
bun.lockb
temporary tsconfig dumps
environment/secrets files
```

Use:

```powershell
git status --ignored --short
git ls-files | rg "(node_modules|^release/|^dist/|^dist-electron/|coverage|\.log$|package-lock\.json|yarn\.lock|bun\.lock)"
```

Remove accidental committed artifacts without deleting required product resources.

## Step 5 — Dependency-graph and security review

Run:

```powershell
pnpm install --frozen-lockfile
pnpm list --depth 0
pnpm list react react-dom electron vite vitest tailwindcss typescript --depth 20
pnpm outdated
pnpm audit --prod
pnpm audit
```

Requirements:

- no unexplained peer warning;
- no duplicate incompatible React runtime;
- no unexpected old Vite/Electron core copy driving the root;
- no unresolved production advisory without a written owner decision;
- every remaining direct outdated package has a `KEEP`/`DEFER` rationale;
- every override has a documented reason and removal condition.

Do not run forced audit fixes.

## Step 6 — Clean-install reproducibility test

Create a separate clean worktree or fresh clone. A worktree example:

```powershell
git worktree add ..\aivs-dependency-validation HEAD
Set-Location ..\aivs-dependency-validation
```

In that clean tree:

```powershell
corepack enable
corepack prepare pnpm@10.30.3 --activate
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm exec electron --version
pnpm typecheck:ts
pnpm test:frontend
pnpm build:frontend
```

Rules:

- do not copy `node_modules`;
- do not regenerate the lockfile;
- do not use `--no-frozen-lockfile`;
- do not rely on an uncommitted local config;
- record command output and exact SHA.

Where practical, run `pnpm build:fast:win` in the clean tree after required packaged resources are prepared according to repository instructions.

Return to the main worktree and remove the temporary worktree safely:

```powershell
Set-Location <original-repository>
git worktree remove ..\aivs-dependency-validation
git worktree prune
```

Do not remove a worktree containing unrecorded changes.

## Step 7 — Full automated gate in the primary environment

Run from the primary branch worktree:

```powershell
pnpm typecheck
pnpm test:frontend
pnpm backend:test
pnpm build:frontend
pnpm build:fast:win
```

Also run any new repository validation commands:

```powershell
pnpm validate:frontend
```

if added, plus:

- Renovate config validation;
- dependency-boundary tests;
- package-manager/lockfile guard;
- existing repository-specific test scripts;
- `pnpm wangp:check`, if this is a safe non-mutating baseline validation already required by project practice.

Do not run `pnpm wangp:update`.

Record:

- start/end timestamps;
- exit codes;
- test counts;
- skipped tests and why;
- warnings;
- artifact paths;
- exact candidate SHA.

A skipped mandatory test is not a pass.

## Step 8 — Development Electron regression pass

Launch a clean single instance:

```powershell
pnpm dev
```

Ensure no stale Vite/Electron instance owns port 5173 before testing.

Validate the complete manual matrix.

### Startup and shell

- one Electron window;
- correct icon/title;
- no blank/white screen;
- renderer and backend readiness indicators behave;
- no new terminal/DevTools error;
- refresh/restart path works;
- app closes without leaving avoidable child processes.

### Setup and runtime management

Using a safe existing installation/test profile:

- setup state is recognised;
- licence/notices load;
- Python readiness checks work;
- backend starts/restarts;
- Model Manager opens;
- model-pack status and progress UI load;
- no runtime reinstall is triggered by the JavaScript upgrade.

Do not redownload large model packs unnecessarily.

### Projects

- create a temporary project;
- open an existing pre-upgrade project;
- project storage path remains correct;
- project list persists after restart;
- assets remain linked;
- project deletion works only on the temporary project.

### File workflows

Test all distinct routes:

- click-to-select image;
- click-to-select video;
- click-to-select audio;
- OS drag/drop into gallery;
- drag/drop into media input;
- multi-select where supported;
- duplicate basename handling: reuse/suffix/cancel;
- unsupported file path;
- save dialog;
- open-directory dialog;
- show item in folder;
- parent-folder action;
- remembered native-dialog directory behaviour;
- imported file path persists after restart.

This explicitly verifies the Electron `webUtils.getPathForFile` migration.

### GenSpace Image

- model/profile loading;
- aspect/resolution controls;
- prompt and enhance action;
- input image role selection where supported;
- seed lock;
- submit;
- progress;
- cancel;
- result persistence;
- apply/reuse generation settings;
- gallery preview.

### GenSpace Video

- Generate/Reframe/Retake visibility;
- start/end/control media inputs;
- trim UI;
- multi-shot rows if available;
- submit/progress/cancel;
- output playback and persistence.

### GenSpace Music

- model/mode controls;
- keyword strip and overflow affordance;
- lyrics modes;
- duration/BPM/key/time signature fields;
- dual audio inputs;
- generation request;
- multi-variation waveform rows;
- persistence/reuse.

### Settings and Model Manager

- every settings section opens;
- dropdowns/modals remain layered correctly;
- changes save and restore;
- model pack lists, availability, progress and cancel display;
- custom checkpoint/LoRA paths remain intact.

### Director

- open existing Director data;
- add/select/move/resize/split/delete segment where safe;
- keyframe roles;
- playhead and preview;
- generated take selection;
- undo/redo;
- persistence after navigation/restart.

### Video Editor

- open editor;
- timeline/preview render;
- import or use a safe test asset;
- playback/scrub;
- modal workflows;
- export a short disposable output;
- cancel export where safe.

### Visual/accessibility interaction

- keyboard focus visible;
- tab navigation still reaches key controls;
- menus/modals can close;
- no click interception by overlays;
- scroll/overflow behaviour is intact;
- no text clipping at common window sizes.

Record pass/fail per item rather than one generic “smoke passed.”

## Step 9 — Unpacked production regression pass

Run:

```powershell
pnpm start:unpacked:win
```

against the artifact produced by the current candidate SHA.

Repeat a reduced but representative matrix:

- existing project open;
- settings;
- file picker and OS drop;
- one image/video/music generation route where practical;
- gallery preview;
- Director;
- editor/export;
- shutdown.

Validate production-specific concerns:

- `file://` renderer loads;
- `base: './'` works;
- preload CJS artifact exists;
- `window.electronAPI` is available;
- packaged path resolution works;
- backend resources are located;
- no source-only path is assumed;
- no DevTools-only behaviour is required.

## Step 10 — Real Windows installer test

Build:

```powershell
pnpm build:win
```

Record artifact name, size, and SHA-256:

```powershell
Get-FileHash .\release\<installer-name>.exe -Algorithm SHA256
```

Use a disposable test environment or carefully controlled local test.

Test:

1. uninstall/close any disposable prior test install;
2. run installer;
3. choose a non-default install directory;
4. confirm start-menu and desktop shortcuts;
5. launch installed AiVS;
6. confirm app version/product name;
7. confirm bundled resources;
8. open existing project storage;
9. run reduced functional smoke;
10. close;
11. uninstall;
12. confirm user project/media data was not deleted;
13. confirm expected app user-data retention/removal behaviour.

Do not test uninstall against the user's only production environment without backup.

### Existing installation upgrade simulation

Where practical:

1. install the last known pre-modernisation build in a disposable VM/test profile;
2. create app state and a small test project;
3. install the modernised build over it;
4. launch;
5. verify settings, project path, projects, and media survive;
6. verify no unexpected Python/WanGP reinstall;
7. verify native dialog and file import.

Auto-updater end-to-end requires signed/published release infrastructure. Clearly distinguish:

```text
installer-over-install tested
auto-update transport not tested
```

rather than claiming full update validation.

## Step 11 — Existing user-data compatibility test

Back up:

```text
%LOCALAPPDATA%\AiVS\
configured project assets directory
custom checkpoints/LoRA location state
```

Use a copy or disposable profile where possible.

Verify:

- `app_state.json` still parses;
- new remembered-dialog keys are additive;
- old state without those keys still works;
- project records load;
- media paths resolve;
- no migration rewrites project data unnecessarily;
- settings do not reset;
- no content is deleted.

The dependency branch should not require a destructive data migration.

## Step 12 — Final visual parity approval

Use the same dimensions and application state as Phase 1.

Compare at minimum:

- Home/projects;
- GenSpace Image;
- GenSpace Video;
- GenSpace Music;
- Settings;
- Model Manager;
- Director;
- Video Editor;
- first-run/setup where practical;
- representative menu/modal/dropdown/focus states.

Check specifically:

- borders;
- ring widths;
- shadows;
- typography;
- spacing;
- colour and opacity;
- icons;
- input defaults;
- scrollbars;
- hover/focus/disabled states;
- container-query behaviour;
- overlay stacking.

Create a final screenshot index in `STATUS.md`. A difference requires one of:

```text
FIXED
APPROVED INTENTIONAL CHANGE
BASELINE WAS INCORRECT
```

The default is to fix it.

## Step 13 — Performance sanity check

This is not a performance project, but detect gross regression.

Record comparable measurements on the same machine:

- `pnpm install --frozen-lockfile` warm and clean where useful;
- `pnpm build:frontend`;
- dev cold start until window visible;
- unpacked cold start until window visible;
- renderer bundle sizes from build output;
- idle renderer memory after a stable wait;
- basic navigation responsiveness.

Do not claim precise improvements without controlled measurement. Fail only on a material unexplained regression, not trivial run-to-run noise.

## Step 14 — Final documentation

Update factual stack references throughout owned documentation.

At minimum:

- `README.md`
- `AGENTS.md`
- relevant architecture docs
- dependency policy
- this runbook `STATUS.md`

Document:

- Node 24 LTS;
- pnpm 10.30.3;
- Electron 43;
- Vite 8;
- Vitest 4;
- Tailwind 4 CSS-first configuration;
- React 19;
- TypeScript 6;
- current test commands;
- package update policy;
- protected runtime boundary;
- TypeScript 7 deferred follow-up.

Do not manually rewrite generated project-memory output outside its normal workflow.

## Step 15 — Prepare pull request evidence

Recommended title:

```text
chore(deps): modernise AiVS desktop and frontend toolchain
```

Use this PR body structure:

```markdown
## Summary

Modernises the AiVS desktop/frontend dependency stack in isolated, validated phases while preserving the curated WanGP/Python runtime.

## Base and branch

- Base: `dev`
- Branch: `chore/dependency-modernisation-2026`
- Baseline SHA:
- Final SHA:

## Version changes

| Component | Before | After |
|---|---:|---:|
| Electron | | |
| Vite | | |
| Vitest | | |
| Tailwind | | |
| React | | |
| TypeScript | | |

## Not changed

- Python 3.11.9 runtime contract
- Torch 2.10 / CUDA 13 stack
- WanGP pinned source
- hardware-specific performance kernels
- product UX or generation semantics

## Key compatibility work

- Replaced removed Electron `File.path` usage with preload-mediated `webUtils.getPathForFile`.
- Preserved CommonJS preload and `file://` relative assets under Vite 8/Rolldown.
- Migrated Tailwind in two stages and preserved visual parity.
- Upgraded React and TypeScript only after surrounding tooling stabilised.
- Added grouped dependency automation and deterministic CI.

## Automated validation

- [ ] `pnpm install --frozen-lockfile`
- [ ] `pnpm typecheck`
- [ ] `pnpm test:frontend`
- [ ] `pnpm backend:test`
- [ ] `pnpm build:frontend`
- [ ] `pnpm build:fast:win`
- [ ] real Windows installer build
- [ ] clean-worktree validation
- [ ] CI workflow

Include test counts and links.

## Manual validation

Summarise:
- development app;
- unpacked app;
- installer;
- pre-upgrade user data;
- project/media import;
- GenSpace Image/Video/Music;
- Settings/Model Manager;
- Director;
- Video Editor/export;
- visual parity.

## Security and maintenance

- Renovate groups:
- automerge:
- protected runtime paths:
- audit result:
- remaining deferred packages:

## Known limitations

State only genuine untested areas, such as signed auto-update transport or unavailable macOS hardware.

## Reviewer guide

Recommend reviewing by phase/commit rather than as one undifferentiated diff.

## Rollback

Revert the complete PR if post-merge runtime regressions occur; the runtime data format is unchanged. Individual phase commits remain available for diagnosis.
```

Do not claim checks that were not run.

## Step 16 — Push safely and open a draft PR

Before push:

```powershell
git status --short
git log --oneline origin/dev..HEAD
git diff --check origin/dev...HEAD
```

Push without force:

```powershell
git push -u origin chore/dependency-modernisation-2026
```

If the remote branch already exists:

```powershell
git fetch origin
git log --oneline --left-right origin/chore/dependency-modernisation-2026...HEAD
```

Do not overwrite unknown remote commits. Reconcile deliberately.

Open a **draft** pull request against `dev` using the prepared evidence. Keep it draft until:

- required CI passes;
- final screenshots/evidence are attached;
- known limitations are explicit;
- maintainer review is ready.

Do not target `main`.

## Step 17 — Final status ledger

Mark Phase 11 `PASSED` only after recording:

- final SHA;
- remote branch;
- PR number/link;
- CI runs;
- exact versions;
- all command evidence;
- installer hash;
- manual matrix;
- screenshot index;
- known limitations;
- owner-side follow-ups;
- no protected runtime diff.

Do not mark the separate TypeScript 7 follow-up complete.

## Final exit gate

The complete modernisation is ready for review only when all are true:

- branch is based on current `dev` or its divergence is explicitly understood;
- all 11 mandatory phases are committed and passed;
- clean worktree install/typecheck/test/build succeeds;
- primary environment full automated gate succeeds;
- frontend and backend tests succeed;
- development, unpacked, and installed Windows apps launch;
- existing project/app state survives;
- all file-import routes work;
- representative generation flows work;
- Director and Video Editor work;
- installer install/upgrade/uninstall behaviour is tested safely;
- visual parity is approved;
- no material unexplained performance regression exists;
- no unresolved peer warning or production advisory is hidden;
- generic dependency automation cannot alter the curated runtime;
- protected runtime diff is empty;
- documentation is accurate;
- CI passes;
- draft PR targets `dev`;
- `STATUS.md` contains auditable evidence.

## Recovery procedure

### Failure discovered before push

Fix in the smallest owning phase area, rerun:

1. the affected phase gate;
2. Phase 10 full gate;
3. all Phase 11 gates.

Use a clearly named fix commit; do not amend historical phase commits unless the maintainer explicitly requests a cleaned history after validation.

### Failure discovered in CI

Reproduce from a clean install, fix, and rerun local plus hosted checks. Do not bypass or mark a required check optional to obtain a green PR.

### Failure discovered after merge

- preserve user data;
- capture logs and exact released versions;
- revert the PR if the regression is severe and cannot be repaired immediately;
- do not roll back the Python/WanGP runtime, because it was not changed;
- issue a focused follow-up rather than reopening all dependency families.
