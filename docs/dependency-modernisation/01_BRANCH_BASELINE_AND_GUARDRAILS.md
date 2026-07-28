# Phase 1 — Create the Branch, Freeze the Baseline, and Install Guardrails

## Objective

Create a clean, reproducible starting point for the dependency migration before changing any major package.

This phase must establish:

- the dedicated work branch;
- the exact `dev` baseline SHA;
- a green automated baseline;
- a known-good packaged Windows baseline;
- a manual UI/file/generation smoke baseline;
- baseline screenshots;
- a pinned and documented Node development runtime;
- a complete dependency inventory;
- a clean rollback point.

Do not upgrade Electron, Vite, Vitest, Tailwind, React, or TypeScript during this phase.

## Starting conditions

- A clean local checkout of `GOvEy1nw/AI-Video-Studio`.
- Access to `origin/dev`.
- Windows development host with the existing AiVS environment working.
- Existing project data copied or backed up before opening it with an upgrade branch build.
- `pnpm@10.30.3` available through Corepack.
- WanGP/backend already functioning on the machine, or any unavailable smoke checks clearly identified.

## Step 1 — Read project rules

Read these files in order:

```text
AGENTS_PRD.md
AGENTS.md
.projectmem/summary.md
.projectmem/PROJECT_MAP.md
docs/GENSPACE_ARCHITECTURE.md
00_MASTER_RUNBOOK.md
STATUS.md
```

Record completion in `STATUS.md`.

Note a known documentation inconsistency: `AGENTS.md` may still say that no frontend tests exist, while `package.json` and the current tree contain Vitest tests. Do not “fix” this yet unless it is part of the final documentation sync. The executable scripts and current files are the source of truth.

## Step 2 — Verify and update `dev`

Run:

```powershell
git fetch --all --prune
git switch dev
git pull --ff-only origin dev
git status --short
```

Expected:

- no uncommitted changes;
- local `dev` matches `origin/dev`;
- no unrelated work is present.

If the worktree is dirty, stop. Commit, stash, or move unrelated work before continuing. Do not carry it into the upgrade branch.

Record:

```powershell
git rev-parse HEAD
git log -1 --oneline
```

Store the SHA in `STATUS.md` as the baseline.

Optionally set a session variable:

```powershell
$env:AIVS_UPGRADE_BASE = git rev-parse HEAD
```

## Step 3 — Create the branch

```powershell
git switch -c chore/dependency-modernisation-2026
git branch --show-current
git status --short
```

Expected branch:

```text
chore/dependency-modernisation-2026
```

Do not push until the baseline is known-good, unless an early remote backup branch is required. If pushed, set upstream explicitly:

```powershell
git push -u origin chore/dependency-modernisation-2026
```

## Step 4 — Place this runbook in the repository

Preferred destination:

```text
docs/dependency-modernisation/
```

Copy all supplied documents into that directory. The agent must use the in-repository `STATUS.md` as the live ledger.

Do not rename the numbered phase files because their ordering is intentional.

## Step 5 — Record the current toolchain

Run and capture exact outputs:

```powershell
node --version
corepack --version
pnpm --version
git --version
python --version
uv --version
```

Then:

```powershell
pnpm list --depth 0
pnpm outdated
```

`pnpm outdated` is an inventory command only. Do not apply updates.

Capture relevant lockfile resolutions:

```powershell
pnpm why electron
pnpm why vite
pnpm why @vitejs/plugin-react
pnpm why vite-plugin-electron
pnpm why vite-plugin-electron-renderer
pnpm why vitest
pnpm why tailwindcss
pnpm why tailwind-merge
pnpm why react
pnpm why react-dom
pnpm why typescript
```

Fill the baseline version table in `STATUS.md`.

## Step 6 — Standardise the development Node version

The modernised stack should use the current stable Node 24 LTS patch. At the time the plan was written, Electron 43 also embeds Node 24, making Node 24 a sensible development baseline.

Use a version manager-friendly pin without coupling the repository to one vendor. Add:

### `.nvmrc`

```text
24
```

### `.node-version`

```text
24
```

Add or update `package.json`:

```json
{
  "engines": {
    "node": ">=24 <25",
    "pnpm": "10.30.3"
  }
}
```

Keep:

```json
"packageManager": "pnpm@10.30.3"
```

Do not upgrade pnpm in this branch unless a later package explicitly requires it and the owner approves.

After switching to Node 24 LTS:

```powershell
corepack enable
corepack prepare pnpm@10.30.3 --activate
node --version
pnpm --version
```

Record the exact patch version in `STATUS.md`.

### Node pin acceptance criteria

- `pnpm install --frozen-lockfile` works under Node 24.
- Existing scripts launch.
- No lockfile changes are caused merely by changing the local Node version.
- The Node range is documented in `README.md` or development docs by the final phase.

If Node 24 exposes a pre-existing script issue, fix it in a dedicated baseline compatibility commit before any package majors are upgraded.

## Step 7 — Clean-install baseline

Do not immediately delete a working `node_modules`; first prove the existing install.

Run:

```powershell
pnpm install --frozen-lockfile
```

Then optionally verify reproducibility from a clean dependency directory:

```powershell
Rename-Item node_modules node_modules.baseline-backup
pnpm install --frozen-lockfile
```

Only remove the backup after the clean install and baseline gates pass.

Do not delete `backend/.venv`, model files, WanGP checkpoints, or user project data.

## Step 8 — Run the baseline automated gates

Run each command separately and record its result and duration.

### Frontend and TypeScript

```powershell
pnpm typecheck:ts
pnpm test:frontend
pnpm build:frontend
```

### Backend regression guard

```powershell
pnpm typecheck:py
pnpm backend:test
```

### Windows build

```powershell
pnpm build:fast:win
pnpm build:win
```

Do not accept a baseline where a required command is simply “known to fail.” Investigate it.

If a failure is environmental rather than a repository defect, record:

- exact error;
- host limitation;
- an alternate approved execution route;
- evidence that the code itself passed.

Do not weaken scripts to accommodate one agent sandbox if real local development commands already work.

## Step 9 — Baseline development-app smoke

Launch:

```powershell
pnpm dev
```

Verify:

- one Vite server owns the expected port;
- one Electron window opens;
- no second stale instance is inspected;
- renderer is visible;
- preload API is available;
- backend begins or reaches expected health state;
- console has no unexplained fatal errors.

Exercise:

1. Open an existing project copy.
2. Create a temporary new project.
3. Open GenSpace Image, Video, and Music.
4. Open Director.
5. Open Video Editor.
6. Open Settings and Model Manager.
7. Toggle gallery grid/list and filters.
8. Close and reopen the temporary project.
9. Close and restart the application.

Record any pre-existing warnings. Later phases must not be blamed for warnings already present in this baseline.

## Step 10 — Baseline file workflow smoke

Use disposable media files.

Verify all of the following:

- OS file picker imports an image.
- OS file picker imports a video.
- OS file picker imports audio.
- OS drag-and-drop into gallery works.
- OS drag-and-drop into an input slot works.
- duplicate filename flow can:
  - reuse;
  - create a suffix;
  - cancel.
- imported assets land under the expected project `uploads` path.
- generated/copy workflow uses the expected `generated` path.
- `Show in folder` works.
- parent-folder action works.
- save/export dialog opens.
- directory-selection dialog opens.

This baseline is especially important because Electron 32 removes the `File.path` behaviour currently used by `frontend/lib/media-import.ts`.

## Step 11 — Baseline generation smoke

Do not download or replace the curated runtime merely to create a baseline.

Using already-installed models:

- submit at least one image generation;
- verify progress;
- verify cancel if practical;
- verify output appears in gallery;
- submit one video or music request if the required local model is already installed;
- verify backend remains healthy after app restart.

Record which generation modes were not tested and why.

## Step 12 — Baseline packaged-app smoke

Run the unpacked executable created by the build:

```powershell
pnpm start:unpacked:win
```

Then install the generated NSIS package.

Verify:

- unpacked app starts;
- installed app starts;
- renderer assets load under `file://`;
- preload loads;
- backend starts;
- native file import works;
- settings and project storage work;
- app closes cleanly;
- uninstall does not remove external project assets.

Record installer filename and result.

## Step 13 — Capture visual baseline

At a stable 1400×900 window size, capture all views listed in the master runbook.

Store evidence outside generated application folders. Recommended options:

- attach screenshots to the eventual PR; or
- place local evidence under an ignored folder such as `.upgrade-evidence/baseline/`.

Do not commit large screenshot binaries unless the repository owner wants visual fixtures versioned.

Record paths or PR attachment names in `STATUS.md`.

## Step 14 — Security and dependency audit snapshot

Run:

```powershell
pnpm audit
pnpm audit --prod
```

Treat results as an inventory. Do not fix them by running a blanket automated command.

For each finding record:

- package;
- severity;
- direct or transitive;
- production or development-only;
- whether a planned phase naturally resolves it;
- whether an override is needed;
- whether the advisory is irrelevant to the packaged architecture.

Also record existing package overrides, if any.

## Step 15 — Create the baseline commit

Expected changes in this phase should be limited to:

- this runbook folder;
- Node version pin files;
- `package.json` engine metadata;
- documentation needed to explain the Node baseline;
- a narrowly scoped baseline compatibility fix, only if Node 24 exposed one.

Run:

```powershell
git status --short
git diff --check
git diff --stat
git diff
```

Verify protected runtime files are untouched.

Commit:

```powershell
git add .nvmrc .node-version package.json docs/dependency-modernisation
git commit -m "chore(deps): establish modernisation baseline"
```

Record the commit SHA:

```powershell
git rev-parse HEAD
```

## Exit gate

Phase 1 passes only when:

- [ ] branch exists from current `dev`;
- [ ] baseline SHA is recorded;
- [ ] Node 24 LTS and pnpm 10.30.3 are recorded;
- [ ] frozen install passes;
- [ ] TypeScript check passes;
- [ ] frontend tests pass;
- [ ] frontend build passes;
- [ ] backend typecheck and tests pass;
- [ ] fast and full Windows builds pass;
- [ ] development app smoke passes;
- [ ] file workflows pass;
- [ ] packaged app smoke passes;
- [ ] baseline screenshots are indexed;
- [ ] baseline audit findings are recorded;
- [ ] protected runtime diff guard is clean;
- [ ] baseline commit SHA is recorded;
- [ ] `STATUS.md` is marked `PASSED`.

Do not begin Phase 2 with an ambiguous or red baseline.
