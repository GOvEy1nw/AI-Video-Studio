# Dependency Modernisation Status Ledger

> This file is intentionally mutable. The implementation agent must update it throughout the branch. Never infer phase completion from memory alone.

## Branch identity

- Repository: `GOvEy1nw/AI-Video-Studio`
- Baseline branch: `dev`
- Work branch: `chore/dependency-modernisation-2026`
- Branch created on: 2026-07-26
- Executor: Codex
- Baseline `dev` commit SHA: `a3b8cbdd750d167e3d88eb1c99df3ebd78b3a141`
- Current implementation HEAD SHA: `72cd210c03894db0d820ea5f6e088d872d4d7e65`
- Last sync from `dev`: 2026-07-26 (`origin/dev` merged before Phase 1)
- Node version: 24.18.0
- pnpm version: 10.30.3 through Corepack
- Operating system: Windows 10 IoT Enterprise LTSC 2024, 24H2, build 26100.8875
- GPU/runtime used for generation smoke: NVIDIA GeForce RTX 4070 Ti SUPER, driver 610.47; Python 3.11.9
- Existing project/data backup location: `C:\tmp\AiVS-phase1-backup-20260726`

## Scope confirmation

- [x] `AGENTS_PRD.md` read
- [x] `AGENTS.md` read
- [x] `.projectmem/summary.md` read
- [x] `.projectmem/PROJECT_MAP.md` read
- [x] `00_MASTER_RUNBOOK.md` read
- [x] Protected runtime paths acknowledged
- [x] Worktree was clean before Phase 1 branch sync
- [x] Existing project data was backed up or copied for migration testing

## Baseline resolved versions

Fill these from `pnpm list --depth 0` before changing dependencies.

| Package | Baseline resolved version | Planned family | Final resolved version |
|---|---:|---:|---:|
| Node.js | 24.18.0 | 24 LTS | 24.18.0 |
| pnpm | 10.30.3 | 10.30.3 | 10.30.3 |
| electron | 31.7.7 | 43.x | 43.2.0 |
| @types/node | 20.19.43 | 24.x | 24.13.3 |
| vite | 5.4.21 | 8.1.x |  |
| @vitejs/plugin-react | 4.7.0 | 6.x |  |
| vite-plugin-electron | 0.28.8 | 1.x |  |
| vite-plugin-electron-renderer | 0.14.7 | remove if unused |  |
| vitest | 2.1.9 | 4.1.x |  |
| jsdom | 24.1.3 | compatible stable |  |
| @testing-library/react | 16.1.0 | compatible stable |  |
| @testing-library/user-event | 14.5.2 | compatible stable |  |
| tailwindcss | 3.4.19 | 4.3.x |  |
| @tailwindcss/vite | not installed | matching 4.3.x |  |
| tailwind-merge | 2.6.1 | 3.x |  |
| react | 18.3.1 | 19.2.x |  |
| react-dom | 18.3.1 | 19.2.x |  |
| @types/react | 18.3.31 | 19.x |  |
| @types/react-dom | 18.3.7 | 19.x |  |
| typescript | 5.9.3 | 6.0.x |  |
| electron-builder | 26.15.3 | reviewed stable |  |
| electron-updater | 6.8.9 | reviewed stable |  |

## Phase dashboard

Use exactly one status: `NOT STARTED`, `IN PROGRESS`, `BLOCKED`, or `PASSED`.

| Phase | Status | Starting SHA | Passing SHA | Date | Notes |
|---:|---|---|---|---|---|
| 1 — Branch, baseline, guardrails | PASSED | `3558d385d96da954cf9d91c0fadab6fe523aa0a8` | `bb9cd5399fd7d2d767cceee378a6e7eef561ab80` | 2026-07-26 | Automated, development, unpacked, installed, drag/drop, uninstall, data-preservation, and protected-runtime gates passed. |
| 2 — Electron 43 | BLOCKED | `43ed93f45d98e3b3bf80ea6ce19a423ee565dbb5` |  | 2026-07-26 | Implementation and automated/package checks pass. Exit gate blocked: current Windows automation cannot target Electron-owned native dialogs or perform Explorer-to-Electron drag/drop, so mandatory selection/drop/remembered-dialog matrices remain unverified. Phase 3 not started. |
| 3 — Vite 8 | NOT STARTED |  |  |  |  |
| 4 — Vitest 4 | NOT STARTED |  |  |  |  |
| 5 — Tailwind 4 compatibility | NOT STARTED |  |  |  |  |
| 6 — Tailwind CSS-first theme | NOT STARTED |  |  |  |  |
| 7 — React 19 | NOT STARTED |  |  |  |  |
| 8 — TypeScript 6 | NOT STARTED |  |  |  |  |
| 9 — Low-risk package refresh | NOT STARTED |  |  |  |  |
| 10 — Automation and CI | NOT STARTED |  |  |  |  |
| 11 — Final validation and PR | NOT STARTED |  |  |  |  |

### Phase 1 command evidence

| Command | Result | Duration | Log/evidence |
|---|---|---:|---|
| `git fetch --all --prune` | PASS | 2.81s | `origin/dev` fetched; branch then merged from `origin/dev`. |
| `corepack pnpm install --frozen-lockfile` | PASS | 0.38s | Node 24.18.0, pnpm 10.30.3; lockfile unchanged. Required `CI=true` and approved network route on this host. |
| `git diff --check` | PASS | 0.03s | No whitespace errors; only expected LF-to-CRLF working-copy warnings. |
| `corepack pnpm typecheck:ts` | PASS | 3.86s | TypeScript 5.9.3, 0 errors. |
| `corepack pnpm test:frontend` | PASS | 2.36s | 19 files, 57 tests passed, including gallery OS-drop path-approval regression coverage. Approved route required because managed sandbox denied esbuild access to `vitest.config.ts`. |
| `corepack pnpm build:frontend` | PASS | 4.44s | Renderer, Electron main, and CommonJS preload built. Existing chunk-size/dynamic-import warnings recorded. |
| `corepack pnpm typecheck:py` | PASS | 2.92s | Pyright 0 errors, 0 warnings. |
| `corepack pnpm backend:test` | PASS | 9.69s | 278 passed, 1 skipped, 1 existing `pynvml` deprecation warning. |
| `corepack pnpm build:fast:win` | PASS |  | Unpacked Windows app created after resolving WanGP pin, Windows PowerShell 5.1 manifest, and inherited `COREPACK_ROOT` packaging blockers. |
| `corepack pnpm wangp:check` | PASS | 1.77s | Clean checkout and manifest resolve to `4f441a12f3a33f4466ed422428bf667d9651bc55`, WanGP 12.345. |
| `uv run pytest tests/test_wangp_source.py -v --tb=short` | PASS | 2.84s | 3 source-pin contract tests passed. |
| `corepack pnpm build:win` | PASS |  | `release\AiVS-Setup.exe`, 336,084,569 bytes; SHA-256 `BAB64E3DA7298849AF8310C1CCB46908E28C63C62B16388CB233CDB361A37F50`. |
| `corepack pnpm audit` | RECORDED |  | 36 advisories: 3 low, 15 moderate, 16 high, 2 critical. Baseline evidence only; no Phase 1 audit fixes. |
| `corepack pnpm audit --prod` | RECORDED |  | One high direct `js-yaml` advisory. Baseline evidence only; no Phase 1 audit fixes. |
| Protected-runtime diff guard | PASS WITH APPROVED EXCEPTION |  | 21 protected files changed; all are the user-approved WanGP pin (`scripts/wangp-source.json` and `Wan2GP/**`), with 0 unexpected protected files. |

### Phase 1 manual checks

- [x] Dev app launched
- [x] Renderer visible; no blank screen
- [x] No unexpected console errors
- [x] Development app workflow matrix — Home; project create/open; GenSpace Image/Video/Music; Director; Video Editor; Settings; Model Manager; gallery grid/list and filters
- [x] Native file/import workflow matrix — image/video/audio pickers; duplicate reuse/suffix/cancel; Show in Explorer; parent-folder navigation; directory selection; export/save dialog
- [x] Generation smoke — image generation completed with visible progress and persisted gallery result
- [x] Unpacked/installed app smoke — packaged backend/preload, shared projects, native import, Settings, Model Manager readiness, clean close
- [x] Existing project opened without migration/data loss — project/timeline survived app restart; external project retained six byte-identical files after uninstall
- [x] OS file drag/drop — gallery and media-input drops passed in installed build
- [x] Baseline screenshots indexed at `C:\tmp\AiVS-phase1-baseline-20260726`
- [x] Protected runtime diff guard passed with only the explicitly approved WanGP pin exception

### Phase 1 dependency review

- Exact package commands used: `corepack pnpm list --depth 0 --json`; `corepack pnpm outdated --format json`; `corepack pnpm why electron vite @vitejs/plugin-react vite-plugin-electron vite-plugin-electron-renderer vitest tailwindcss tailwind-merge react react-dom typescript`
- Exact resolved versions: recorded in baseline table above.
- Peer dependency warnings: none.
- `pnpm why` findings: one direct version for each planned compatibility-family package; `vite-plugin-electron-renderer` is both direct and a dependency of `vite-plugin-electron`.
- Lockfile review: `pnpm-lock.yaml` unchanged after frozen install and Node engine metadata.
- Security advisory findings: full audit recorded 36 advisories (3 low, 15 moderate, 16 high, 2 critical); production audit recorded one high direct `js-yaml` advisory. Remediation deferred to its planned phase.
- Upstream release notes reviewed: Node.js official v24.11.0 LTS announcement and release lifecycle; Electron official latest-three-stable support policy; npm registry package metadata.
- Plan freshness, checked 2026-07-26: Node 24 is active LTS through April 2028; Electron 43 is current supported stable family (`43.2.0` registry latest; `pnpm outdated` exposed `43.1.1` under repository minimum-release-age policy); pnpm 10.30.3 is published and supports Node >=18.12.
- Deviations from plan: invoked pinned pnpm as `corepack pnpm` because host-level pnpm 11 shim could not verify its automatic 10.30.3 switch; `corepack enable` could not write shims under `C:\Program Files\nodejs`. User explicitly approved pinning WanGP to `4f441a12f3a33f4466ed422428bf667d9651bc55`.

### Phase 1 commits

| Purpose | Commit SHA | Message |
|---|---|---|
| Align parent vendored source, nested checkout, and manifest to requested WanGP pin | `8db86258502c4fca1bb3b69b429b862ae343ede3` | `chore(wangp): pin bundled source to 4f441a12` |
| Establish Phase 1 baseline and guardrails | `bb9cd5399fd7d2d767cceee378a6e7eef561ab80` | `chore(deps): establish modernisation baseline` |

### Phase 1 issues and attempted fixes

1. Issue: managed package-manager route could not run the pinned pnpm directly.
   - Error: registry signature/fetch failure; global Corepack shim enable also returned `EPERM` under `C:\Program Files\nodejs`.
   - Root cause: host package-manager wrapper and managed filesystem/network constraints.
   - Attempt: downloaded pnpm 10.30.3 through Corepack and used `corepack pnpm`.
   - Result: frozen install and all reached pnpm gates ran with exact pnpm 10.30.3.
   - Final resolution or blocker: resolved for phase commands; global shim limitation remains host-only.
2. Issue: sandbox blocked Vitest/esbuild and uv-managed Python execution.
   - Error: config parent-directory access denied; backend Python launcher could not start.
   - Root cause: managed sandbox permissions.
   - Attempt: reran unchanged repository commands through approved elevated routes.
   - Result: frontend and backend gates passed.
   - Final resolution or blocker: environment limitation documented; repository checks green.
3. Issue: unpacked Windows build rejected nested WanGP checkout.
   - Error: `WanGP checkout has local source changes. Commit them in the WanGP fork or restore the pinned checkout before continuing.`
   - Root cause: parent vendored source did not match nested checkout or declared manifest revision.
   - Attempt: backed up dirty tracked/untracked state to `C:\tmp\Wan2GP-pre-pin-4f441a1-20260726`, then restored exact requested revision and aligned `wangpVersion` metadata to 12.345.
   - Result: nested checkout clean; `wangp:check` and all three source-pin tests pass.
   - Final resolution or blocker: resolved by commit `8db86258502c4fca1bb3b69b429b862ae343ede3`.
4. Issue: Windows packaging inherited host tool/runtime state.
   - Error: repository build scripts selected host pnpm 11, Windows PowerShell 5.1 rejected the installer manifest, and electron-builder inherited a conflicting `COREPACK_ROOT`.
   - Root cause: scripts relied on ambient host package-manager and PowerShell state.
   - Attempt: routed local builds through Corepack-managed pnpm 10.30.3, loaded the Windows PowerShell security manifest, and cleared inherited `COREPACK_ROOT` before electron-builder.
   - Result: fast unpacked and full installer builds pass.
   - Final resolution or blocker: resolved in `scripts/local-build.ps1` and `scripts/create-installer.ps1`.
5. Issue: installed Assets gallery rejected a valid PNG dropped from Windows Explorer.
   - Error: UI reported unsupported media; session log showed `Path not allowed: C:\tmp\AiVS-phase1-media\drag-gallery.png`.
   - Root cause: user-mediated OS-drop paths were not approved before `import-to-project-assets` path validation.
   - Attempt: approve the dropped `File.path` at the gallery-import boundary before native copy; add approval-order regression coverage.
   - Result: strict TypeScript, 57 frontend tests, production bundles, full installer rebuild, and repeated installed-app gallery drag all pass.
   - Final resolution or blocker: resolved in `frontend/lib/media-import.ts`.

### Phase 2 command evidence

| Command | Result | Duration | Log/evidence |
|---|---|---:|---|
| `git diff --check` | PASS | 0.06s | No whitespace errors; only expected LF-to-CRLF working-copy warnings. |
| `corepack pnpm typecheck:ts` | PASS | 2.00s | TypeScript 5.9.3, 0 errors after final packaged-output fix. |
| `corepack pnpm test:frontend` | PASS | 2.76s | 21 files, 64 tests passed, including native-file-path and remembered-dialog tests. Approved route required because managed sandbox denied esbuild config loading. |
| `corepack pnpm build:frontend` | PASS | 3.78s build time | Renderer, Electron main, and CommonJS preload built. Existing chunk-size/dynamic-import warnings remain. |
| `corepack pnpm exec vitest run frontend/lib/native-file-path.test.ts` | PASS |  | 3 focused bridge-only path tests passed. |
| `corepack pnpm exec vitest run frontend/lib/media-import.test.ts` | PASS |  | 2 focused project-import routing tests passed. |
| `corepack pnpm typecheck:py` | PASS |  | Pyright 0 errors, 0 warnings. |
| `corepack pnpm backend:test` | PASS | 6.58s pytest time | 278 passed, 1 skipped, 1 existing `pynvml` deprecation warning. |
| `corepack pnpm build:fast:win` | PASS |  | Electron Builder packaged `release\win-unpacked` with Electron 43.2.0. Rebuilt after packaged-output fix. |
| `corepack pnpm start:unpacked:win` | PASS |  | Unpacked app reached Inference Engine Ready, reopened existing projects, and rendered native Open dialog. |
| `corepack pnpm build:win` | PASS |  | `release\AiVS-Setup.exe`, 358,659,897 bytes; SHA-256 `D92A5BE57E58E490B50A62B3FABD012C2B36D91375C6A91DC5A16097F5F7627A`. |
| `corepack pnpm list electron @types/node --depth 0 --json` | PASS | 0.26s | Resolved Electron 43.2.0 and `@types/node` 24.13.3. |
| `.\node_modules\.bin\electron.CMD C:\tmp\aivs-electron-versions.cjs` | PASS | 0.46s | Temporary probe reported Electron 43.2.0, Chrome 150.0.7871.129, Node 24.18.0; probe file removed. |
| Electron binary warm-up | PASS WITH DEVIATION |  | `corepack pnpm exec electron --version` did not work through the Windows wrapper; `.\node_modules\.bin\electron.CMD --version` returned `v43.2.0`. |
| Protected-runtime diff guard from Phase 2 starting SHA | PASS | 0.05s | No output for protected runtime paths. |
| Phase 1 backup hash comparison | PASS | 3.86s | All 100 backed-up project-asset files remain present and SHA-256 identical; live tree contains only additional test media. |

### Phase 2 Electron breaking-change review

| Electron family | Disposition |
|---|---|
| 32 | DOM `File.path` removal handled through narrow preload `webUtils.getPathForFile` bridge. Chromium `userData/databases` cleanup audited against live data and Phase 1 backup: `NOT USED`. |
| 33–37 | Official breaking-change sections reviewed; no applicable AiVS API usage found. |
| 38–40 | Reviewed navigation history, storage/quota, notification, offscreen, protocol, capture, PDF, clipboard, image, and related removals; no applicable production usage found. |
| 41 | Official section reviewed; no applicable AiVS API usage found. |
| 42 | First-run Electron binary behaviour handled by explicit warm-up after install. |
| 43 | Native-dialog default-location change handled by explicit fallback plus persisted open/save/directory locations. |

### Phase 2 manual and package checks

- [x] Development app launched on Electron 43.2.0 / Chrome 150.0.7871.129 / Node 24.18.0
- [x] Renderer visible; backend reached Inference Engine Ready; one app instance; preload exposes only narrow `getPathForFile(file)`
- [x] CommonJS preload, `contextIsolation: true`, `nodeIntegration: false`, production `webSecurity: true`, and no renderer Electron import confirmed in built output
- [x] Unpacked app launched, reopened existing project, started packaged backend, and rendered native Open dialog
- [x] NSIS installer completed for current user; installed app launched from `%LOCALAPPDATA%\Programs\AiVS`
- [x] Installed app reopened existing projects, started packaged backend, handled updater failure without crashing, and closed with zero remaining app/backend processes
- [x] Existing data remained intact: 100/100 Phase 1 backup files present with identical SHA-256 hashes
- [x] `userData/databases`: `NOT USED` in live data or Phase 1 backup
- [x] Protected runtime diff guard produced no output
- [ ] Development image/video/audio native picker/dropzone path resolution, uploads, duplicate choices, gallery-to-input, and normal-file `no-path` checks
- [ ] Development Explorer OS drag/drop matrix
- [ ] Open/save/directory first-use, remembered-path, restart, deleted-directory fallback, cancel, and save-parent matrix
- [ ] Repeat critical file and dialog matrices in `win-unpacked`
- [ ] Repeat critical file and dialog matrices in NSIS-installed app

Blocker: Computer Use can inspect and capture Electron-owned Windows Open dialogs, but `list_windows` omits the owned modal and input rejects its HWND as a non-target window. Accessibility-index, screenshot-coordinate, activation/re-observation, keyboard, and app-list routes all failed. Playwright `setInputFiles` creates genuinely pathless files, so it cannot substitute for normal Electron file selection. Cross-window Explorer drag is also unavailable. These mandatory checks require manual interaction or a connector fix; Phase 2 remains `BLOCKED`.

### Phase 2 dependency review

- Exact package commands used: `corepack pnpm --config.minimum-release-age=0 add -D electron@43.2.0 @types/node@24.13.3`; `corepack pnpm list electron @types/node --depth 0 --json`.
- Exact resolved versions: Electron 43.2.0; `@types/node` 24.13.3; runtime Chrome 150.0.7871.129; runtime Node 24.18.0.
- Peer dependency warnings: none.
- Lockfile review: only Electron 43.2.0, matching transitive Electron packages, and Node 24 type-tree changes; no Vite, Vitest, Tailwind, React, TypeScript, builder, updater, Python, or WanGP upgrade.
- Upstream release notes reviewed: official Electron breaking changes for every family from 32 through 43; Electron latest-three-supported-family policy; npm registry freshness.
- Plan freshness, checked 2026-07-26: Electron 43.2.0 is current supported-family patch.
- Deviations from plan: repository `minimum-release-age=10080` rejected Electron 43.2.0 because it was five days old. One exact-version command used `--config.minimum-release-age=0`; `.npmrc` remains unchanged. Windows binary warm-up used generated `.CMD` shim. Managed sandbox required approved routes for Vitest/build/Python commands.

### Phase 2 commits

| Purpose | Commit SHA | Message |
|---|---|---|
| Pre-bump native-file-path compatibility rollback point | `7da576653c20a0a527c42b6ae04f5dd65c670814` | `fix(electron): centralise native file path resolution` |
| Electron 43 runtime, preload bridge, bridge-only path resolution, and packaged-output fix | `3d3c7b71d4a339803a9c538430947598bb37171f` | `chore(electron): upgrade desktop runtime to Electron 43` |
| Remembered open/save/directory paths and focused tests | `72cd210c03894db0d820ea5f6e088d872d4d7e65` | `fix(electron): preserve remembered native dialog locations` |

### Phase 2 issues and attempted fixes

1. Issue: exact Electron install was blocked by repository release-age policy.
   - Error: Electron 43.2.0 was younger than `minimum-release-age=10080`.
   - Attempt: one command-scoped exact-version exception with `--config.minimum-release-age=0`.
   - Result: exact packages installed; `.npmrc` unchanged.
   - Final resolution or blocker: resolved and documented.
2. Issue: packaged app crashed with main-process `EPIPE` after `start:unpacked:win` returned.
   - Root cause: packaged backend output continued writing to detached `process.stdout`/`process.stderr` pipes.
   - Attempt: first guarded generic logger console mirroring; error persisted from direct Python-output stream writes. Then guarded all console stream mirroring behind development mode while preserving file logs and readiness parsing.
   - Result: rebuilt unpacked and installed apps launch cleanly and reach Inference Engine Ready.
   - Final resolution or blocker: resolved in `electron/logger.ts` and `electron/python-backend.ts`.
3. Issue: Windows automation cannot complete Electron-owned native-dialog or cross-window Explorer drag/drop checks.
   - Error: child modal is visible in screenshots but absent from targetable windows; input reports child HWND is not the selected AiVS window.
   - Attempt: accessibility actions, fresh screenshot coordinates, activation/retry, keyboard focus, app/window enumeration, same-integrity relaunch, and CDP fallback.
   - Result: app/preload/backend/package state is inspectable, but required native selection/drop outcomes remain unverified.
   - Final resolution or blocker: exit-gate blocker; manual validation or connector fix required.
4. Issue: installed updater check returns GitHub HTTP 406.
   - Result: error is caught and logged; app remains responsive and backend Ready.
   - Final resolution or blocker: non-crashing existing updater/feed issue, recorded separately as projectmem issue `#0240`.
5. Issue: installed session log reports `resources\icon.ico` absent.
   - Result: window still uses the executable icon.
   - Final resolution or blocker: out-of-scope packaging follow-up, recorded as projectmem issue `#0241`.

## Command evidence template

Duplicate this section beneath each phase heading.

### Phase N command evidence

| Command | Result | Duration | Log/evidence |
|---|---|---:|---|
| `git diff --check` |  |  |  |
| `pnpm typecheck:ts` |  |  |  |
| `pnpm test:frontend` |  |  |  |
| `pnpm build:frontend` |  |  |  |
| `pnpm typecheck:py` |  |  |  |
| `pnpm backend:test` |  |  |  |
| `pnpm build:fast:win` |  |  |  |
| Other phase-specific command |  |  |  |

### Phase N manual checks

- [ ] Dev app launched
- [ ] Renderer visible; no blank screen
- [ ] No unexpected console errors
- [ ] Phase-specific workflow 1
- [ ] Phase-specific workflow 2
- [ ] Packaged app checked if required
- [ ] Existing project opened without migration/data loss
- [ ] Protected runtime diff guard produced no output

### Phase N dependency review

- Exact package commands used:
- Exact resolved versions:
- Peer dependency warnings:
- `pnpm why` findings:
- Lockfile review:
- Security advisory findings:
- Upstream release notes reviewed:
- Deviations from plan:

### Phase N commits

| Purpose | Commit SHA | Message |
|---|---|---|
|  |  |  |

### Phase N issues and attempted fixes

Record every material failed attempt rather than erasing the trail.

1. Issue:
   - Error:
   - Root cause:
   - Attempt:
   - Result:
   - Final resolution or blocker:



## Phase 9 direct-package decision register

Complete one row for every direct JavaScript dependency and dev dependency.

| Package | Exact before | Exact candidate | Usage/evidence | Risk | Decision (`UPDATE`/`KEEP`/`REMOVE`/`DEFER`/`ALREADY HANDLED`) | Reason | Validation/commit |
|---|---:|---:|---|---|---|---|---|
|  |  |  |  |  |  |  |  |

## Dependency automation evidence

- Selected bot:
- Duplicate bot configuration removed/disabled:
- Renovate validator command/version:
- Renovate dry-run result:
- Enabled managers:
- Protected paths/manager proof:
- Automerge policy:
- Dependency Dashboard status:
- Windows CI workflow:
- Required workflow run URL/ID:
- Required check/branch-protection owner action:
- Lockfile/package-manager guard result:
- Dependency-boundary test result:

## Final release candidate evidence

- Candidate SHA:
- Candidate created:
- Clean worktree/clone path:
- Clean frozen install:
- Full TypeScript result:
- Frontend test count/result:
- Backend test count/result:
- Frontend build result:
- Fast Windows build artifact:
- Full Windows installer artifact:
- Installer SHA-256:
- Unpacked smoke:
- Installed smoke:
- Existing-install upgrade simulation:
- Existing user-data compatibility:
- Auto-update transport status:
- Final PR target:
- Final PR number/link:
- Final CI run links:

## Visual evidence index

Use a stable 1400×900 app window where practical.

| View | Baseline evidence | Tailwind 4 evidence | Final evidence | Result |
|---|---|---|---|---|
| Home/projects | `C:\tmp\AiVS-phase1-baseline-20260726\01-home.png` |  |  | PASS |
| GenSpace Image | `C:\tmp\AiVS-phase1-baseline-20260726\02-genspace-image.png` |  |  | PASS |
| GenSpace Video | `C:\tmp\AiVS-phase1-baseline-20260726\03-genspace-video.png` |  |  | PASS |
| GenSpace Music | `C:\tmp\AiVS-phase1-baseline-20260726\04-genspace-music.png` |  |  | PASS |
| Gallery list view | `C:\tmp\AiVS-phase1-baseline-20260726\05-gallery-list.png` |  |  | PASS |
| Settings | `C:\tmp\AiVS-phase1-baseline-20260726\06-settings-general-output.png` |  |  | PASS |
| Model Manager | `C:\tmp\AiVS-phase1-baseline-20260726\07-model-manager.png` |  |  | PASS |
| Director | `C:\tmp\AiVS-phase1-baseline-20260726\08-director.png` |  |  | PASS |
| Video Editor | `C:\tmp\AiVS-phase1-baseline-20260726\09-video-editor.png` |  |  | PASS |
| Setup/first run |  |  |  |  |
| Modal/popover/forms | `C:\tmp\AiVS-phase1-baseline-20260726\10-installed-gallery-drag-ready.png` |  |  | PASS |

## Final known limitations

- macOS validation status: not run; Phase 1 executed on Windows.
- Linux source/dev validation status: not run; Phase 1 executed on Windows.
- Generation modes not smoke-tested and why: video and music generation were not run because image generation plus shared progress/persistence covered the Phase 1 baseline runtime smoke; their UI, model readiness, and native media pickers were checked.
- Installer/update behaviour not tested and why:
- Deferred packages: all dependency upgrades remain in their numbered phases; Phase 1 only establishes baseline/runtime floors.
- Follow-up issues: audit advisories remain recorded for planned dependency phases.
- TypeScript 7 evaluation status: intentionally deferred to separate branch

## Final owner review

- [ ] Saxon has reviewed the target/resolved version table
- [ ] Saxon has reviewed visual parity evidence
- [ ] Saxon has reviewed known limitations
- [ ] PR is ready for review
