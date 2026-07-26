# 00 — Master Execution Runbook

## 1. Mission

Modernise AiVS's desktop application dependency stack in a controlled sequence while preserving:

- current user-facing behaviour and visual appearance;
- project, gallery, generation, Director, editor, setup, and settings workflows;
- Electron security boundaries;
- packaged Windows behaviour;
- local-only WanGP operation;
- the curated Python/Torch/CUDA/WanGP runtime;
- reproducible `pnpm` and `uv` installs.

This is a maintenance migration, not a redesign and not a feature-development branch.

## 2. Authoritative repository context

Before changing code, read:

1. `AGENTS_PRD.md`
2. `AGENTS.md`
3. `.projectmem/summary.md`
4. `.projectmem/PROJECT_MAP.md`
5. this document;
6. `STATUS.md`;
7. only the current phase document.

The inherited-foundation rule in `AGENTS_PRD.md` applies: preserve existing working systems and make the smallest changes needed for compatibility.

## 3. Required branch model

All mandatory phases run on one dedicated branch created from an up-to-date `dev`:

```powershell
git fetch origin
git switch dev
git pull --ff-only origin dev
git status --short
git switch -c chore/dependency-modernisation-2026
```

If that branch already exists locally, do not recreate or reset it blindly. Confirm its upstream, baseline SHA, and phase status in `STATUS.md`.

### Branch rules

- Never implement these upgrades directly on `dev` or `main`.
- Never mix unrelated feature work into the branch.
- Do not merge another feature branch into this branch.
- Do not rebase midway through a phase.
- Synchronise with `dev` only:
  - before Phase 1 begins; and
  - once more immediately before final validation, if required.
- If synchronising with `dev` introduces conflicts, resolve them in a dedicated commit and rerun the previous completed phase's validation gate.


## 3.1 Plan freshness rule

This runbook was authored on 26 July 2026 against the then-current stable package families.

At the start of every phase:

- confirm the target family is still supported;
- review any security advisory published since this runbook;
- record the check date and source in `STATUS.md`;
- stay within the approved family;
- do not silently reinterpret the plan to mean “whatever is latest now.”

If an approved target family has become unsupported before implementation—especially Electron—stop the phase as `BLOCKED` and prepare a concise delta review for the maintainer. Crossing to a newer major requires an amended phase plan and its breaking-change audit.

## 4. Sequential execution protocol

The agent must follow this loop for every numbered phase:

1. Read the current phase document in full.
2. Mark the phase `IN PROGRESS` in `STATUS.md`.
3. Record the starting commit SHA.
4. Run the phase's preflight searches and commands.
5. Make only the phase-scoped changes.
6. Run the phase's fast automated gate.
7. Run the phase-specific manual smoke checks.
8. Run the phase's full gate when required.
9. Review the entire diff, not only files intentionally edited.
10. Update documentation and `STATUS.md`.
11. Commit the phase.
12. Record the completed commit SHA and evidence.
13. Mark the phase `PASSED`.
14. Only then read the next numbered phase document.

A phase may be marked `BLOCKED`, but it may not be marked `PASSED` with known failing required checks.

## 5. No blanket upgrades

Forbidden commands and behaviours include:

```text
pnpm update --latest
pnpm up -L
npm-check-updates -u followed by an unreviewed install
bulk replacing all package ranges
accepting every Renovate/Dependabot update in one commit
editing the lockfile by hand
deleting tests to make a phase pass
weakening TypeScript strictness
turning on skip flags to conceal migration errors
```

Upgrade one compatibility family at a time using explicit package names and target families.

Examples:

```powershell
pnpm add -D electron@<EXACT_REVIEWED_43_PATCH>
pnpm add -D vite@<EXACT_REVIEWED_8_1_PATCH> @vitejs/plugin-react@<EXACT_REVIEWED_6_PATCH> vite-plugin-electron@<EXACT_REVIEWED_1_PATCH>
pnpm add -D vitest@<EXACT_REVIEWED_4_1_PATCH>
```

Before committing, inspect the exact resolved versions:

```powershell
pnpm list --depth 0
pnpm why <package>
git diff -- package.json pnpm-lock.yaml
```

## 6. Global scope lock

### Permitted primary areas

- `package.json`
- `pnpm-lock.yaml`
- `.node-version`, `.nvmrc`, or equivalent development-runtime files
- `vite.config.ts`
- `vitest.config.ts`
- `tailwind.config.js`
- `postcss.config.js`
- `frontend/**`
- `electron/**`
- `.github/workflows/**`
- dependency automation config
- relevant documentation

### Protected runtime areas

The following must remain unchanged unless Saxon explicitly approves a separately explained exception:

```text
backend/pyproject.toml
backend/uv.lock
backend/.python-version
scripts/wangp-stacks.json
scripts/wangp-source.json
scripts/install-wangp-stack.ps1
Wan2GP/**
```

Use this guard after every phase:

```powershell
$protected = @(
  '^backend/pyproject\.toml$',
  '^backend/uv\.lock$',
  '^backend/\.python-version$',
  '^scripts/wangp-stacks\.json$',
  '^scripts/wangp-source\.json$',
  '^scripts/install-wangp-stack\.ps1$',
  '^Wan2GP/'
)

git diff --name-only "${env:AIVS_UPGRADE_BASE}...HEAD" |
  Where-Object {
    $path = $_
    $protected | Where-Object { $path -match $_ }
  }
```

Expected result: no output.

If the baseline variable is unavailable, use the baseline SHA recorded in `STATUS.md`.

## 7. Behavioural invariants

The migration must not change these product contracts:

- AiVS remains local-only and WanGP-powered.
- `window.electronAPI` remains the only renderer-to-Electron bridge.
- `contextIsolation` remains enabled.
- `nodeIntegration` remains disabled.
- Production `webSecurity` remains enabled.
- The preload output remains CommonJS and loads successfully.
- Production renderer assets continue to work from `file://`.
- Vite's relative `base: './'` behaviour is preserved.
- Project storage locations and file URLs remain compatible.
- Existing project JSON remains loadable.
- Existing gallery assets remain visible.
- File import duplicate handling retains `reuse`, `suffix`, and `cancel`.
- Generation requests and backend APIs are not redesigned.
- No new cloud service, telemetry, or API-key dependency is introduced.
- The UI does not receive an intentional redesign during Tailwind or React migration.
- Windows installer identity, app ID, product name, and existing data folders remain unchanged.

## 8. Package classification policy

### A. Desktop runtime packages

Examples:

- `electron`
- `electron-updater`
- `electron-builder`

Requirements:

- dedicated or tightly scoped commits;
- packaged-app testing;
- installer testing;
- no automerge for majors.

### B. Build/test compatibility clusters

Examples:

- Vite + React plugin + Electron Vite plugin;
- Vitest + jsdom + Testing Library;
- Tailwind + Tailwind Vite plugin + tailwind-merge;
- React + React DOM + React type packages.

Requirements:

- upgrade together only when their peer requirements are coupled;
- keep different clusters in different phases.

### C. Routine frontend libraries

Examples:

- `clsx`
- `class-variance-authority`
- `lucide-react`
- `react-dropzone`
- `js-yaml`
- `wait-on`
- `concurrently`

Requirements:

- update in small groups;
- split packages with large API/icon churn into their own commit.

### D. Curated AI runtime

Examples:

- Torch;
- CUDA wheel stack;
- Transformers;
- Diffusers;
- PEFT;
- Nunchaku;
- SageAttention;
- Flash Attention;
- WanGP.

Requirements:

- excluded from this branch;
- never automated.

## 9. Validation tiers

### Tier A — fast gate

Run after every meaningful change and before every phase commit:

```powershell
git diff --check
pnpm typecheck:ts
pnpm test:frontend
pnpm build:frontend
```

All must pass.

### Tier B — application gate

Run at the end of Phases 2, 3, 5, 7, 8, 9, and 10:

```powershell
pnpm typecheck:py
pnpm backend:test
pnpm build:fast:win
```

The backend commands are regression guards; they do not authorise backend dependency changes.

### Tier C — release gate

Run in Phase 1 to establish the baseline and in Phase 11 for final acceptance:

```powershell
pnpm typecheck:ts
pnpm typecheck:py
pnpm test:frontend
pnpm backend:test
pnpm build:frontend
pnpm build:fast:win
pnpm build:win
```

The final full Windows installer build is mandatory.

If macOS infrastructure is available, additionally run:

```bash
pnpm build:fast:mac
pnpm build:mac
```

A lack of macOS hardware must be recorded as an unverified platform, not silently claimed as passed.

## 10. Manual smoke-test tiers

### Core renderer smoke

- Home/projects opens.
- Existing project opens.
- New project can be created.
- GenSpace switches among Image, Video, and Music.
- Gallery grid/list/filter/bin controls render and respond.
- Settings opens and closes.
- Director opens and existing recipe state is retained.
- Video Editor opens without a blank renderer.

### Electron/file smoke

- Select image through native file dialog.
- Select video through native file dialog.
- Select audio through native file dialog.
- Drag an OS file into the gallery.
- Drag an OS file into a media input.
- Duplicate import offers the established decision flow.
- Imported file is copied into the correct project path.
- `Show in folder` and parent-folder actions work.
- Save/export dialog opens in a sensible remembered directory.
- Close and reopen app; project data remains intact.

### Backend/generation smoke

Use already-installed models where possible; do not change the curated stack merely to satisfy smoke testing.

- Backend health reaches ready.
- Model Manager opens and reports state.
- At least one image request can be submitted and progresses.
- At least one video or music request can be submitted if the required local model is already available.
- Cancel behaviour remains functional.
- Generated output is registered into the project gallery.

### Packaged-app smoke

- `win-unpacked/AiVS.exe` starts.
- Preload API is present.
- Backend starts.
- No blank window.
- Production `file://` assets load.
- Native file dialogs and import work.
- The NSIS installer completes.
- Installed app launches.
- Uninstaller does not delete project data outside the install directory.

## 11. Visual parity rule

The Tailwind migration must preserve appearance unless a change is required to reproduce the old appearance under Tailwind 4.

Before Phase 5, capture baseline screenshots at a consistent window size, ideally 1400×900:

1. Home/project selection.
2. GenSpace Image.
3. GenSpace Video.
4. GenSpace Music.
5. Gallery list view.
6. Settings general/output section.
7. Model Manager.
8. Director.
9. Video Editor.
10. First-run/setup screen where practical.
11. Any modal/popover/dropdown with borders, rings, shadows, or forms.

After each Tailwind sub-step, capture the same views and compare:

- spacing;
- font size/weight/line height;
- borders;
- radii;
- focus rings;
- shadows;
- placeholder text;
- disabled states;
- hover states;
- scrollbar behaviour;
- dialog centring;
- overflow and container-query behaviour.

Do not accept “the build passes” as visual validation.

## 12. Security rules

The migration must not weaken Electron security to make development easier.

Forbidden:

- setting `nodeIntegration: true`;
- setting `contextIsolation: false`;
- exposing `ipcRenderer` wholesale;
- exposing arbitrary filesystem primitives to the renderer;
- disabling `webSecurity` in production;
- adding broad IPC channels without path validation;
- restoring `File.path` through unsafe renderer hacks;
- using `remote`.

For `webUtils.getPathForFile`, expose only the narrow operation required by the existing media-import workflow.

## 13. Commit policy

Each phase should end with one or more clear commits. Suggested pattern:

```text
chore(deps): establish modernisation baseline
fix(electron): centralise native file path resolution
chore(electron): upgrade runtime to Electron 43
chore(build): migrate Vite toolchain to Vite 8
chore(test): migrate frontend tests to Vitest 4
chore(styles): migrate Tailwind integration to v4
refactor(styles): move AiVS theme tokens to Tailwind v4 CSS
chore(react): upgrade renderer to React 19
chore(types): migrate to TypeScript 6
chore(deps): refresh remaining frontend packages
chore(ci): add dependency update policy and upgrade gates
docs: record dependency modernisation validation
```

Do not squash intermediate checkpoint commits while actively executing later phases. They are rollback points. Squashing can be decided during PR review.

## 14. Stop conditions

Stop the current phase and mark it `BLOCKED` when any of the following is true:

- the baseline was not green and the failure is not understood;
- a protected runtime file changed unexpectedly;
- a package requires a newer major outside the phase scope;
- peer dependency warnings cannot be resolved without another planned phase;
- packaged Electron cannot load its preload;
- imports no longer return native paths;
- the production renderer is blank;
- a Tailwind change causes broad visual drift without a bounded fix;
- React migration requires redesigning core state architecture;
- tests only pass after weakening assertions or strictness;
- a migration introduces data-loss risk;
- there is uncertainty whether existing project data remains compatible.

When blocked:

1. Preserve logs.
2. Record the exact failing command and error in `STATUS.md`.
3. Record attempted fixes.
4. Reset only to the phase starting commit if rollback is necessary.
5. Do not continue to later phases.
6. Do not conceal the issue with a downgrade or workaround outside scope.

## 15. Recovery procedure

Every phase must record its starting SHA and passing SHA.

To abandon only the uncommitted work in the current phase:

```powershell
git status --short
git diff > .upgrade-phase-backup.patch
git restore --staged .
git restore .
git clean -nd
```

Review `git clean -nd` before deleting untracked files.

To return to a committed phase checkpoint:

```powershell
git reset --hard <recorded-passing-sha>
```

Never run a hard reset without confirming that all valuable work is committed or backed up.

## 16. Definition of done

The main modernisation branch is complete only when:

- every mandatory phase is marked `PASSED`;
- exact resolved versions are recorded;
- Tier C validation passes;
- Windows unpacked and installed builds pass the smoke matrix;
- visual parity has been reviewed;
- the protected runtime diff guard is clean;
- `pnpm install --frozen-lockfile` succeeds from a clean checkout;
- documentation reflects the new stack;
- dependency automation cannot alter the curated AI runtime;
- the PR clearly separates known limitations from passed checks;
- TypeScript 7 is left to its separate follow-up document/branch.
