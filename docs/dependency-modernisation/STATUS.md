# Dependency Modernisation Status Ledger

> This file is intentionally mutable. The implementation agent must update it throughout the branch. Never infer phase completion from memory alone.

## Branch identity

- Repository: `GOvEy1nw/AI-Video-Studio`
- Baseline branch: `dev`
- Work branch: `chore/dependency-modernisation-2026`
- Branch created on: 2026-07-26
- Executor: Codex
- Baseline `dev` commit SHA: `a3b8cbdd750d167e3d88eb1c99df3ebd78b3a141`
- Current implementation HEAD SHA: `5a0df7d313f759d96648746d9e5690dd19230071`
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
| vite | 5.4.21 | 8.1.x | 8.1.5 |
| @vitejs/plugin-react | 4.7.0 | 6.x | 6.0.4 |
| vite-plugin-electron | 0.28.8 | 1.x | 1.1.0 |
| vite-plugin-electron-renderer | 0.14.7 | remove if unused | removed as direct dependency; 0.14.7 remains optional transitively |
| vitest | 2.1.9 | 4.1.x | 4.1.10 |
| jsdom | 24.1.3 | compatible stable | 30.0.0 |
| @testing-library/react | 16.1.0 | compatible stable | 16.3.2 |
| @testing-library/user-event | 14.5.2 | compatible stable | 14.6.1 |
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
| 2 — Electron 43 | PASSED | `43ed93f45d98e3b3bf80ea6ce19a423ee565dbb5` | `a9194ba700ba890c933c8d0543be99d71d429cee` | 2026-07-27 | Automated, development, unpacked, installed, file-workflow, native-dialog persistence/fallback, data-preservation, and protected-runtime gates passed. Phase 3 not started. |
| 3 — Vite 8 | PASSED | `59d425e91284fdf2ac6cc1ad56c5e306b1de6310` | `3710866c35e7fe52370b586c39230abc3ee0c88f` | 2026-07-27 | Automated, development lifecycle, debug, unpacked, native file-import, data-preservation, and protected-runtime gates passed. Phase 4 not started. |
| 4 — Vitest 4 | PASSED | `08fa360ec108fed212c6c5495b4faff1068fe71a` | `92012f374438214367c74756e27e98c387d0ebdd` | 2026-07-27 | Exact test cluster, existing suite, strengthened native file-import coverage, Tier A, development launch, visual confirmation, and protected-runtime gates passed. Phase 5 not started. |
| 5 — Tailwind 4 compatibility | PASSED | `92012f374438214367c74756e27e98c387d0ebdd` | `50fcb190234ba28289c12d8364c96191b8c7b1f8` | 2026-07-27 | Tailwind 4.3.3 compatibility migration, Tier A/B, development and unpacked visual/file workflows, and protected-runtime gates passed. Phase 6 not started. |
| 6 — Tailwind CSS-first theme | PASSED | `4593f1d16ba2dfa36907342ba36eee3cb9250cce` | `5a0df7d313f759d96648746d9e5690dd19230071` | 2026-07-27 | CSS-first mappings, runtime retheming, Tier A/B, development and unpacked parity, project reopen, and protected-runtime gates passed. Phase 7 not started. |
| 7 — React 19 | PASSED | `4d20cb815a8a19ea9ef4718098ddbfc6578e5503` | `1c667c9d8f7d28c950fe475dd9fca0fb2766b280` | 2026-07-27 | React 19.2.8 migration, nullable DOM-ref compatibility, Tier A/B, development and unpacked smoke/visual parity, and protected-runtime gates passed. Phase 8 not started. |
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
| `git diff --check` | PASS | 0.11s | No whitespace errors. |
| `corepack pnpm typecheck:ts` | PASS | 4.10s | TypeScript 5.9.3, 0 errors after final save-dialog fix. |
| `corepack pnpm test:frontend` | PASS | 2.58s test time | 22 files, 67 tests passed, including native-file-path, remembered/save-default dialog, and gallery drop-boundary tests. Approved route required because managed sandbox denied esbuild config loading. |
| `corepack pnpm build:frontend` | PASS | 4.25s build time | Renderer, Electron main, and CommonJS preload built. Existing chunk-size/dynamic-import warnings remain. |
| `corepack pnpm exec vitest run electron/dialog-paths.test.ts` | PASS | 1.48s | 5 focused dialog tests passed, including filename-only save defaults under remembered/fallback directories. |
| `corepack pnpm exec vitest run frontend/lib/native-file-path.test.ts` | PASS |  | 3 focused bridge-only path tests passed. |
| `corepack pnpm exec vitest run frontend/lib/media-import.test.ts` | PASS |  | 2 focused project-import routing tests passed. |
| `.\node_modules\.bin\vitest.CMD run frontend/views/genspace/GenSpaceGallery.test.tsx` | PASS | 1.66s | 1 focused test passed; gallery OS-drop handlers are attached only to the right-hand gallery pane. |
| `corepack pnpm typecheck:py` | PASS | 3.18s | Pyright 0 errors, 0 warnings. |
| `corepack pnpm backend:test` | PASS | 6.61s pytest time | 278 passed, 1 skipped, 1 existing `pynvml` deprecation warning. |
| `corepack pnpm build:fast:win` | PASS | 17.90s | Electron Builder packaged `release\win-unpacked` with Electron 43.2.0 after final save-dialog fix. |
| `corepack pnpm start:unpacked:win` | PASS |  | Unpacked app reached Inference Engine Ready, reopened existing projects, and rendered native Open dialog. |
| `corepack pnpm build:win` | PASS | 1m 12s | `release\AiVS-Setup.exe`, 358,657,640 bytes; SHA-256 `9054E38F07FD22A966C1F95214B5EB49DD3E722FCD31524EEE97860632394885`. |
| `corepack pnpm list electron @types/node --depth 0 --json` | PASS | 0.26s | Resolved Electron 43.2.0 and `@types/node` 24.13.3. |
| `.\node_modules\.bin\electron.CMD C:\tmp\aivs-electron-versions.cjs` | PASS | 0.46s | Temporary probe reported Electron 43.2.0, Chrome 150.0.7871.129, Node 24.18.0; probe file removed. |
| Electron binary warm-up | PASS WITH DEVIATION |  | `corepack pnpm exec electron --version` did not work through the Windows wrapper; `.\node_modules\.bin\electron.CMD --version` returned `v43.2.0`. |
| Protected-runtime diff guard from Phase 2 starting SHA | PASS | 0.29s | No output for protected runtime paths. |
| Phase 1 backup hash comparison | PASS | 2.79s | All 100 backed-up project-asset files remain present and SHA-256 identical; live tree contains only additional test media. |

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
- [x] Development image/video/audio native picker/dropzone path resolution, uploads, duplicate choices, gallery-to-input, and normal-file `no-path` checks
- [x] Development Explorer OS drag/drop matrix — gallery and media-input ownership passed; packaged repetitions covered video/audio variants
- [x] Open/save/directory first-use, remembered-path, restart, deleted-directory fallback, cancel, and save-parent matrix
- [x] Critical file and dialog matrix repeated in `win-unpacked`: existing project, audio OS drop, and remembered filename-only save path
- [x] Critical file and dialog matrix repeated in NSIS-installed app: image/video OS drops, audio drop/picker, open/directory/save persistence, cancellation, restart, and deleted-directory fallback

Exit gate: user-assisted native interaction completed where automation could not target Windows-owned dialogs or cross-window OS drags. Installed save export opened at `C:\tmp\AiVS-phase2-save` with the expected filename, cancel preserved state, restart preserved paths, and a deleted remembered directory fell back to `C:\Users\rais\Documents\AiVS`. Installed and unpacked critical file/drop workflows passed. Phase 2 is `PASSED`; Phase 3 remains not started.

### Phase 2 dependency review

- Exact package commands used: `corepack pnpm --config.minimum-release-age=0 add -D electron@43.2.0 @types/node@24.13.3`; `corepack pnpm list electron @types/node --depth 0 --json`.
- Exact resolved versions: Electron 43.2.0; `@types/node` 24.13.3; runtime Chrome 150.0.7871.129; runtime Node 24.18.0.
- Peer dependency warnings: none.
- Lockfile review: only Electron 43.2.0, matching transitive Electron packages, and Node 24 type-tree changes; no Vite, Vitest, Tailwind, React, TypeScript, builder, updater, Python, or WanGP upgrade.
- Upstream release notes reviewed: official Electron breaking changes for every family from 32 through 43; Electron latest-three-supported-family policy; npm registry freshness.
- Plan freshness, checked 2026-07-26: Electron 43.2.0 is current supported-family patch.
- Deviations from plan: repository `minimum-release-age=10080` rejected Electron 43.2.0 because it was five days old. One exact-version command used `--config.minimum-release-age=0`; `.npmrc` remains unchanged. Windows binary warm-up used generated `.CMD` shim. Managed sandbox required approved routes for Vitest/build/Python commands. User performed native visual and OS interaction checks manually rather than through Computer Use.

### Phase 2 commits

| Purpose | Commit SHA | Message |
|---|---|---|
| Pre-bump native-file-path compatibility rollback point | `7da576653c20a0a527c42b6ae04f5dd65c670814` | `fix(electron): centralise native file path resolution` |
| Electron 43 runtime, preload bridge, bridge-only path resolution, and packaged-output fix | `3d3c7b71d4a339803a9c538430947598bb37171f` | `chore(electron): upgrade desktop runtime to Electron 43` |
| Remembered open/save/directory paths and focused tests | `72cd210c03894db0d820ea5f6e088d872d4d7e65` | `fix(electron): preserve remembered native dialog locations` |
| Constrain gallery OS-drop ownership to the right-hand gallery pane | `d02436e894c0352d50d1c8f358090979467c2f39` | `fix(genspace): constrain gallery drop zone` |
| Resolve filename-only save defaults under the remembered save directory | `a9194ba700ba890c933c8d0543be99d71d429cee` | `fix(electron): preserve save directory for filename defaults` |

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
6. Issue: the gallery OS-drop handlers were attached to the entire GenSpace workspace and competed with media-input dropzones in the left sidebar.
   - Attempt: first stopped event propagation inside every media-input implementation; user evidence identified workspace-level gallery ownership as the root cause.
   - Result: moved handlers and overlay into the right-hand gallery pane, reverted the child propagation workaround, added a focused boundary test, and received user confirmation that development `drag-input` works.
   - Final resolution or blocker: resolved in `d02436e894c0352d50d1c8f358090979467c2f39`; unpacked and installed repetitions passed.
7. Issue: rebuilding `release\win-unpacked` failed twice with `EPERM` while Electron Builder renamed `win-unpacked.tmp`.
   - Root cause: the running development Electron process held runtime state during packaging; the same directory rename succeeded after the build process exited.
   - Attempt: closed development AiVS and reran the exact build.
   - Result: `corepack pnpm build:fast:win` passed and produced the updated unpacked app.
   - Final resolution or blocker: resolved; close running Electron app variants before rebuilding their package output.
8. Issue: installed Video Editor save dialog ignored persisted `lastSaveDirectory` when the caller supplied a filename-only `defaultPath`.
   - Root cause: the caller filename took precedence without being joined to the remembered directory, so Windows reused the prior directory-picker location.
   - Attempt: resolve filename-only defaults under the valid remembered/fallback directory while preserving defaults that already contain a directory.
   - Result: focused and full tests passed; rebuilt installed and unpacked apps opened export dialogs at `C:\tmp\AiVS-phase2-save` with the expected filename.
   - Final resolution or blocker: resolved in `a9194ba700ba890c933c8d0543be99d71d429cee`.

### Phase 3 command evidence

| Command | Result | Duration | Log/evidence |
|---|---|---:|---|
| Vite/plugin registry freshness queries | PASS | 4.27s | Newest stable approved-family patches on 2026-07-27: Vite 8.1.5, `@vitejs/plugin-react` 6.0.4, `vite-plugin-electron` 1.1.0. |
| Vite release/advisory review | PASS | 1.06s | Official Vite releases reviewed; no Vite advisory published from 2026-07-26 through 2026-07-27. |
| Baseline `corepack pnpm build:frontend` | PASS | 5.10s | Vite 5.4.21: renderer 3.22s/957.84 kB JS/72.11 kB CSS; main 709ms/409.93 kB; CommonJS preload 7ms/4.81 kB. |
| Renderer Electron/Node import audit | PASS | 0.82s | Frontend uses `window.electronAPI`; no direct Electron or Node built-in imports. Direct renderer plugin dependency removed. |
| `git diff --check` | PASS |  | No whitespace errors; only expected LF-to-CRLF working-copy warnings. |
| `corepack pnpm typecheck:ts` | PASS | 3.88s | TypeScript 5.9.3, 0 errors. |
| `corepack pnpm test:frontend` | PASS | 2.49s test time | Vitest 2.1.9 remains unchanged; 22 files and 67 tests passed. |
| `corepack pnpm build:frontend` | PASS | 1.72s tool time | Vite 8.1.5: renderer 1.03s/929.83 kB JS/68.99 kB CSS; main 64ms/378.09 kB; CommonJS preload 7ms/3.49 kB. |
| `corepack pnpm typecheck:py` | PASS | 3.17s | Pyright 0 errors, 0 warnings. |
| `corepack pnpm backend:test` | PASS | 11.95s | 278 passed, 1 skipped, 1 existing `pynvml` deprecation warning. |
| `corepack pnpm build:fast:win` | PASS | 15.30s | Windows unpacked app rebuilt with Vite 8.1.5 and Electron 43.2.0. |
| Development startup | PASS |  | Clean Vite 8 start reached ready state; one Electron main process; embedded Gradio scan issue resolved by scoping `optimizeDeps.entries` to root `index.html`. |
| Renderer HMR | PASS |  | Temporary no-op CSS variable produced `hmr update /frontend/index.css`; probe reverted. |
| Preload reload | PASS |  | Temporary type-safe preload probe rebuilt `dist-electron/preload.js`; probe reverted; no duplicate Electron main process. |
| Main-process restart | PASS |  | Temporary main probe rebuilt and restarted Electron once; old backend exited and one replacement backend remained; probe reverted. |
| `corepack pnpm dev:debug` | PASS |  | Inspector listening on 9229, Chromium remote debugging on 9222, one Electron main process. |
| Protected-runtime diff guard | PASS |  | No protected runtime path changed from Phase 3 starting SHA. |

### Phase 3 output contract

- Renderer output: `dist/`; production entry: `dist/index.html`; relative `./assets/` URLs retained.
- Electron output: `dist-electron/main.js` and `dist-electron/preload.js`; source maps retained.
- Preload: one CommonJS build containing `require("electron")`; no ESM preload pass or alternate filename remains.
- Main entry remains `electron/main.ts`; preload source remains `electron/preload.ts`.
- Alias remains `@ -> ./frontend`; Electron Builder still packages `dist/**/*` and `dist-electron/**/*`.
- `vite-plugin-electron` flat two-build architecture retained; `startup()` is awaited.

### Phase 3 manual checks

- [x] Development Vite/Electron startup completed without terminal errors
- [x] Renderer HMR observed in Vite lifecycle output
- [x] Preload rebuild/reload observed in Vite lifecycle output
- [x] Main process restarted once; backend processes did not multiply
- [x] Debug inspector 9229 and remote debugging 9222 opened
- [x] User confirms development renderer is visible and not blank after HMR/preload/main lifecycle checks
- [x] User confirms existing project, Settings, Director, and one practical generation workflow in development
- [x] User confirms unpacked app loads without missing `file://` assets, CSS, preload, or blank renderer
- [x] User confirms Phase 2 native file import still works in unpacked app
- [x] User confirms unpacked app closes/reopens cleanly with project data intact
- [x] Protected runtime diff guard produced no output

Exit gate: user confirmed development visual stability through HMR, preload reload, and main restart, then passed existing-project, Settings, Director, generation, unpacked production, native file-import, clean-restart, and data-preservation checks. Phase 3 is `PASSED`; Phase 4 remains not started and unread.

### Phase 3 dependency review

- Exact package commands used: `corepack pnpm --config.minimum-release-age=0 add -D vite@8.1.5 @vitejs/plugin-react@6.0.4 vite-plugin-electron@1.1.0`; `corepack pnpm --config.minimum-release-age=0 remove vite-plugin-electron-renderer`.
- Exact resolved versions: Vite 8.1.5; `@vitejs/plugin-react` 6.0.4; `vite-plugin-electron` 1.1.0; Rolldown 1.1.5; Vitest remains 2.1.9 with its own Vite 5.4.21 dependency.
- Peer dependency warnings: none.
- `pnpm why` findings: one direct Vite 8.1.5 used by app/plugin-react; Vitest 2.1.9 retains nested Vite 5.4.21 until Phase 4; renderer plugin is no longer direct but remains optional under `vite-plugin-electron`.
- Lockfile review: expected Vite/Rolldown/Oxc/Lightning CSS/plugin graph changes; Babel/react-refresh packages removed from the Vite plugin path; no React, Tailwind, TypeScript, Electron, builder, updater, Python, or WanGP direct upgrade.
- Security advisory findings: GitHub advisory query returned no Vite advisory published since the 2026-07-26 runbook review.
- Upstream release notes reviewed: official Vite 8.1.5 release; Vite 8 build/dep-optimization documentation; `vite-plugin-electron` v1 configuration and Vite 8 compatibility documentation.
- Plan freshness, checked 2026-07-27: approved families remain supported; Vite 8.2 is beta only, so Phase 3 stays on stable 8.1.5.
- Deviations from plan: exact current plugin-react and an Electron transitive dependency were younger than repository `minimumReleaseAge`; one command-scoped exception was used and `.npmrc` remains unchanged. CommonJS preload entry moved into explicit `build.lib` config because plugin v1 flat-entry defaults follow repository ESM mode.

### Phase 3 commits

| Purpose | Commit SHA | Message |
|---|---|---|
| Vite 8 cluster, renderer-plugin removal, Rolldown config, CommonJS preload contract, and dev scan scope | `3710866c35e7fe52370b586c39230abc3ee0c88f` | `chore(build): migrate Vite toolchain to Vite 8` |

### Phase 3 issues and attempted fixes

1. Issue: normal package transactions were blocked by release-age policy.
   - Attempt: exact reviewed commands under normal policy.
   - Result: rejected before dependency changes because plugin-react 6.0.4 and transitive `undici` 7.29.0 were too new.
   - Final resolution or blocker: command-scoped `minimum-release-age=0` exception; exact install passed; repository policy unchanged.
2. Issue: plugin v1 emitted an ESM preload despite `rolldownOptions.output.format = 'cjs'`.
   - Attempt: added `build.lib.formats = ['cjs']`; deep merge produced both ESM and CJS passes.
   - Result: moved preload entry into explicit `build.lib`, set only `formats: ['cjs']`, and fixed output name to `preload.js`.
   - Final resolution or blocker: clean build emits one CommonJS preload with required path.
3. Issue: Vite 8 dev dependency scan traversed embedded Gradio HTML under `python-embed`.
   - Attempt: initial startup completed but logged unresolved Svelte/Gradio dependencies.
   - Result: `optimizeDeps.entries = ['index.html']`; clean restart no longer scans embedded runtime sources.
   - Final resolution or blocker: resolved.

### Phase 4 command evidence

| Command | Result | Duration | Log/evidence |
|---|---|---:|---|
| Test inventory and mock/browser-API searches | PASS | 0.13s | 22 Vitest files: 21 under `frontend/` and `electron/dialog-paths.test.ts`; one `restoreAllMocks` use correctly restores manual media spies; no third-argument test options or shared setup file. |
| Baseline `corepack pnpm exec vitest run --reporter=verbose` | PASS | 2.69s | Vitest 2.1.9: 22 files and 67 tests passed; no skipped/flaky tests, console warnings, unhandled rejections, or open handles. |
| Registry freshness and compatibility queries | PASS | 2.86s | Newest stable reviewed targets: Vitest 4.1.10, jsdom 30.0.0, Testing Library React 16.3.2, user-event 14.6.1. |
| Initial Vitest 4 complete suite | PASS | 2.78s | 22 files and 67 existing tests passed unchanged before test edits. |
| `corepack pnpm exec vitest run frontend/lib/native-file-path.test.ts frontend/lib/media-import.test.ts` | PASS | 0.88s | 2 files and 13 focused tests passed after typed preload fixtures and expanded native-path/import coverage. |
| `git diff --check` | PASS | 0.05s | No whitespace errors; only expected LF-to-CRLF working-copy warnings. |
| `corepack pnpm typecheck:ts` | PASS | 3.82s | TypeScript 5.9.3, 0 errors. |
| `corepack pnpm test:frontend` | PASS | 2.15s | Vitest 4.1.10: 22 files and 75 tests passed; process exited normally with no watch mode or open-handle symptoms. |
| `corepack pnpm build:frontend` | PASS | 1.01s build time | Renderer, Electron main, and CommonJS preload built; existing chunk-size/dynamic-import warnings remain. |
| Protected-runtime diff guard from Phase 4 starting SHA | PASS | 0.06s | No protected runtime path changed. |
| Development startup | PASS |  | Vite 8.1.5 started, rebuilt the Electron main/preload bundles, launched Electron, and backend reached application startup complete with WanGP runtime preloaded. |

### Phase 4 Vitest 4 migration review

- Mock construction/restoration: no constructor mocks; the only `restoreAllMocks` use restores manual `HTMLMediaElement` spies and remains correct. No tests depend on automock restoration or cross-test call history.
- Mock names/snapshots: no mock-name assertions or snapshots.
- Removed configuration: `poolMatchGlobs`, `environmentMatchGlobs`, deprecated dependency options, browser tester scripts, and `minWorkers` are `NOT USED`.
- Third-argument test options: `NOT USED`.
- Browser mode: `NOT USED`.
- V8 coverage: `NOT USED`; coverage remains disabled.
- Custom environments/pools: `NOT USED`; minimal jsdom configuration remains unchanged.
- Browser shims: repeated global setup is not justified. Existing media spies and object-URL shims remain local, explicitly cleaned up where reused.

### Phase 4 manual checks

- [x] Development app launched
- [x] Renderer visible; no blank screen
- [x] Existing project opened
- [x] No unexpected visible errors
- [x] Protected runtime diff guard produced no output

Exit gate: user confirmed the development app renders normally, an existing project opens, and no unexpected visible errors are present. Automated Tier A and focused native-file/import regression checks passed. Phase 4 is `PASSED`; Phase 5 remains not started and unread.

### Phase 4 dependency review

- Exact package command used: `corepack pnpm --config.minimum-release-age=0 add -D vitest@4.1.10 jsdom@30.0.0 @testing-library/react@16.3.2 @testing-library/user-event@14.6.1`.
- Exact resolved versions: Vitest 4.1.10; jsdom 30.0.0; Testing Library React 16.3.2; user-event 14.6.1; transitive Testing Library DOM 10.4.1.
- Peer dependency warnings: none. Vitest supports Vite 6–8 and Node 20/22/24+; jsdom 30 requires Node 22.22.2 or Node 24.15+; Testing Library React supports React and React DOM 18/19.
- `pnpm why` findings: one Vitest 4.1.10 and one deduplicated Vite 8.1.5; the Phase 3 nested Vite 5.4.21 test-tool dependency is removed.
- Lockfile review: expected Vitest 4, jsdom 30, Testing Library, Chai, DOM/CSS parser, and related test-only graph changes; obsolete Vitest 2/Vite 5/esbuild/Rollup test graph removed. No React, Tailwind, TypeScript, Electron, builder, updater, Python, or WanGP direct upgrade.
- Security advisory findings: exact-version public GitHub advisory queries for all four targets, restricted to advisories published since 2026-07-26, returned none. Full `pnpm audit` was not run because managed approval rejected sending the installed dependency graph to npm.
- Upstream release notes reviewed: official Vitest 4 migration guide and API documentation through Context7; npm registry engine, peer, version, and publication metadata for each exact target.
- Plan freshness, checked 2026-07-27: approved Vitest 4.1 family remains stable; Vitest 5 was not selected. jsdom 30.0.0 is current stable and compatible with Node 24.18.0. Testing Library React 16.3.2 supports both current React 18 and planned React 19.
- Deviations from plan: exact current releases required a command-scoped `minimum-release-age=0` exception; `.npmrc` remains unchanged. Managed sandbox required approved Vitest and registry routes. No `vitest.setup.ts` was added because shims do not repeat across three or more files.

### Phase 4 commits

| Purpose | Commit SHA | Message |
|---|---|---|
| Vitest 4 test cluster and native file-import regression coverage | `92012f374438214367c74756e27e98c387d0ebdd` | `chore(test): migrate frontend suite to Vitest 4` |

### Phase 4 issues and attempted fixes

1. Issue: managed sandbox denied Vitest/esbuild access to `vitest.config.ts`.
   - Attempt: ran the complete baseline and migrated suites through the approved `corepack pnpm exec vitest` route.
   - Result: all suites passed.
   - Final resolution or blocker: host sandbox limitation; repository tests green.
2. Issue: npm registry freshness query hung and failed `EACCES` in the managed route.
   - Attempt: reran exact package metadata queries through approved network access.
   - Result: exact stable targets and compatibility metadata resolved.
   - Final resolution or blocker: host network limitation; resolved for phase planning.
3. Issue: full `pnpm audit` approval was rejected because it would send the installed dependency graph to npm.
   - Attempt: queried exact-version public GitHub advisories for only the four Phase 4 package identifiers.
   - Result: no advisories published since the runbook review date apply to the selected versions.
   - Final resolution or blocker: safer package-specific review completed; no project graph disclosed.

### Phase 5 pre-upgrade command evidence

| Command | Result | Duration | Log/evidence |
|---|---|---:|---|
| `corepack pnpm typecheck:ts` | PASS | 4.78s | TypeScript 5.9.3, 0 errors. |
| `corepack pnpm test:frontend` | PASS | 2.57s test time | Tailwind 3 baseline: 22 files and 75 tests passed. |
| `corepack pnpm build:frontend` | PASS | 1.00s build time | Tailwind 3 baseline CSS 68.99 kB / 12.48 kB gzip; renderer JS 929.83 kB / 241.85 kB gzip; CommonJS preload preserved. |
| `$env:CI='true'; corepack pnpm build:fast:win` | PASS | 28.22s | Approved route restored 492 packages from the existing pnpm store and produced `release\win-unpacked`. |
| Phase 5 registry freshness queries | PASS |  | Stable approved-family candidates: `tailwindcss` 4.3.3, `@tailwindcss/vite` 4.3.3, `@tailwindcss/upgrade` 4.3.3, and `tailwind-merge` 3.6.0. |
| Exact-package advisory queries | PASS |  | Public GitHub advisory API returned no advisories published from 2026-07-26 through 2026-07-27 for the four exact candidates. |

### Phase 5 pre-upgrade inventory

- Existing integration: Tailwind 3 directives in `frontend/index.css`, JavaScript theme in `tailwind.config.js`, and project-level PostCSS/autoprefixer pipeline.
- Existing class composition: one `cn()` helper wraps `clsx` and `twMerge`; `class-variance-authority` is used directly by the shared button component.
- Opacity utilities: 0 matches.
- Removed aliases: 163 matches across 40 files, all from the `flex-shrink` family.
- Scale-sensitive standalone utilities: 289 matches across 56 files.
- `space-*` / `divide-*`: 91 matches across 25 files.
- CSS-variable arbitrary syntax: 0 matches.
- Direct-child variant stacking: 0 matches.
- Tailwind CSS directives: 3 matches in `frontend/index.css`.
- Bare border tokens: 347 matches across 69 files.
- Ring usage: 31 matches across 21 files.
- `hidden` attribute: 3 matches in `frontend/views/Project.tsx`; native `<dialog>` usage: 0.
- Scoped app-owned search found no direct PostCSS/autoprefixer workflow beyond `postcss.config.js` and package/lockfile entries.
- Visual baseline remains `C:\tmp\AiVS-phase1-baseline-20260726`; Phases 2–4 recorded no intentional style changes and Phase 4 user visual confirmation passed.

### Phase 5 dependency review

- Exact candidate versions: Tailwind CSS/Vite plugin/upgrade tool 4.3.3; `tailwind-merge` 3.6.0.
- Publication dates: Tailwind 4.3.3 cluster published 2026-07-16; `tailwind-merge` 3.6.0 published 2026-05-10.
- Security advisory findings: no exact-package advisories published since the 2026-07-26 runbook review.
- Upstream documentation reviewed: official Tailwind v4 upgrade guide and v4.3 Vite integration documentation through Context7.
- Plan freshness, checked 2026-07-27: Tailwind 4.3.3 is current stable and remains inside the approved 4.3 family; `tailwind-merge` 3.6.0 is current stable 3.x.
- Deviations from plan so far: fast Windows preflight required `CI=true` and approved execution after pnpm attempted a non-interactive dependency-tree recreation.

### Phase 5 migration result

- Exact resolved versions: `tailwindcss` 4.3.3, `@tailwindcss/vite` 4.3.3, and `tailwind-merge` 3.6.0.
- Tailwind now runs through the Vite plugin. Direct `postcss` and `autoprefixer` dependencies and `postcss.config.js` were removed.
- `frontend/index.css` uses `@import 'tailwindcss' source(none)` with explicit renderer and `index.html` sources. The existing JavaScript theme remains loaded through `@config`; CSS-first theme work remains Phase 6.
- Official `@tailwindcss/upgrade@4.3.3` migrated 78 renderer templates. Manual review restored DOM/persistence `blur` identifiers and AiVS's custom 0.25rem `rounded-sm` contract.
- The first development visual check exposed an unlayered universal margin/padding reset overriding Tailwind 4 utility layers. Removing the redundant reset restored Phase 1 spacing parity.
- Post-migration audits: removed aliases 0; legacy `@tailwind` directives 0; CSS-variable arbitrary syntax 0; direct-child variant stacking 0; bare ring tokens 0. Bare borders remain covered by the temporary v3 compatibility base rule.
- Production CSS: 113.79 kB / 17.19 kB gzip. Renderer JavaScript: 936.91 kB / 243.80 kB gzip. Electron main and CommonJS preload built successfully.
- Rollback checkpoint: `fc1c2e361784c94025f5be4d75e2ce858937e10f`.

### Phase 5 post-upgrade command evidence

| Command | Result | Duration | Log/evidence |
|---|---|---:|---|
| `git diff --check` | PASS | 0.06s | No whitespace errors; only expected line-ending conversion warnings. |
| `corepack pnpm typecheck:ts` | PASS | 4.12s | TypeScript 5.9.3, 0 errors. |
| `corepack pnpm test:frontend` | PASS | 2.56s test time | Vitest 4.1.10: 22 files and 75 tests passed. |
| `corepack pnpm build:frontend` | PASS | 0.32s renderer build | Renderer, Electron main, and CommonJS preload built; existing chunk-size/dynamic-import warnings remain. |
| `corepack pnpm typecheck:py` | PASS WITH APPROVED ROUTE | 3.08s | Pyright: 0 errors and 0 warnings. Managed sandbox could not read the existing uv cache. |
| `corepack pnpm backend:test` | PASS WITH APPROVED ROUTE | 7.00s test time | 278 passed, 1 skipped; existing pynvml deprecation warning only. |
| `$env:CI='true'; corepack pnpm build:fast:win` | PASS WITH APPROVED ROUTE | 16.25s | Produced `release\win-unpacked` with Electron 43.2.0 and the pinned WanGP revision. |
| Protected-runtime diff guard from Phase 5 starting SHA | PASS | 0.15s | No protected runtime path changed. |

### Phase 5 manual checks

- [x] Development app launched; renderer and backend reached ready state.
- [x] Phase 1 visual matrix compared at approximately 1400×900.
- [x] Home, GenSpace Image/Video/Music, gallery grid/list, Settings, Model Manager, Director, and Video Editor retain expected spacing, borders, radii, focus states, and container-query behaviour.
- [x] User confirmed development visual parity after the universal reset fix.
- [x] Unpacked app loaded from `file://` without a blank renderer or FOUC.
- [x] Existing project opened.
- [x] Native file picker/import and OS drag/drop passed in the unpacked app.
- [x] Protected runtime diff guard produced no output.

### Phase 5 commits

| Purpose | Commit SHA | Message |
|---|---|---|
| Pre-upgrade evidence | `042cf97c4958af8752a26a75a45ca6dae2b51e9f` | `docs: record Tailwind 4 preflight` |
| Rollback checkpoint | `fc1c2e361784c94025f5be4d75e2ce858937e10f` | `chore(styles): checkpoint before Tailwind 4 migration` |
| Tailwind 4 compatibility migration | `50fcb190234ba28289c12d8364c96191b8c7b1f8` | `chore(styles): migrate to Tailwind CSS 4` |

### Phase 5 issues and attempted fixes

1. Issue: `gh` could not start for advisory queries because managed sandbox denied access to its AppData config.
   - Attempt: replaced `gh` with unauthenticated public GitHub advisory REST queries through `curl`.
   - Result: all four exact-package queries completed with no advisories in the review window.
   - Final resolution or blocker: resolved as projectmem issue `#0256`.
2. Issue: fast Windows preflight aborted when pnpm requested a non-interactive `node_modules` recreation, then the first `CI=true` retry stalled under restricted network access.
   - Attempt: stopped only the exact stalled pnpm PID, then reran the unchanged command with `CI=true` through the approved route.
   - Result: dependencies restored from the pnpm store and unpacked packaging passed.
   - Final resolution or blocker: resolved as projectmem issue `#0257`.
3. Issue: repository-wide PostCSS audit hit access-denied linked WanGP documentation paths.
   - Attempt: scoped the audit to app-owned package/config/frontend/scripts/workflow paths.
   - Result: audit completed and confirmed no direct app workflow beyond the old Tailwind PostCSS configuration.
   - Final resolution or blocker: resolved as projectmem issue `#0258`.
4. Issue: official upgrade tool used pnpm 11.10.0 and skipped dependency/PostCSS operations.
   - Attempt: retained its reviewed template/CSS migration, then completed exact dependency and Vite-plugin changes with repository-pinned pnpm 10.30.3.
   - Result: exact Tailwind cluster installed and production build passed.
   - Final resolution or blocker: resolved as projectmem issue `#0259`.
5. Issue: upgrade tool rewrote DOM event and persisted effect identifier `blur` to `blur-sm`.
   - Attempt: restored non-class identifiers while retaining valid utility migrations.
   - Result: TypeScript, frontend tests, and production build passed.
   - Final resolution or blocker: resolved as projectmem issue `#0260`.
6. Issue: exact Tailwind 4.3.3 install was blocked by `minimumReleaseAge` through transitive `undici` 7.29.0.
   - Attempt: used a one-command release-age exception without changing repository policy.
   - Result: exact reviewed versions installed.
   - Final resolution or blocker: resolved as projectmem issue `#0261`.
7. Issue: upgrade tool mapped AiVS custom `rounded-sm` uses to `rounded-xs`, halving the intended radius.
   - Attempt: restored the four affected `rounded-sm` utilities.
   - Result: generated CSS retains 0.25rem radius parity and Tier A passed.
   - Final resolution or blocker: resolved as projectmem issue `#0262`.
8. Issue: development visual gate showed compressed spacing across major screens.
   - Attempt: compared saved Phase 1 screenshots and removed the redundant unlayered universal margin/padding reset.
   - Result: user confirmed development spacing parity.
   - Final resolution or blocker: resolved as projectmem issue `#0263`.
9. Issue: `wmic` was unavailable and managed sandbox denied `Get-CimInstance` during safe process shutdown.
   - Attempt: used approved read-only process inspection, stopped the exact Electron root, and verified Vite/backend ports closed.
   - Result: dev tree exited cleanly before packaging.
   - Final resolution or blocker: resolved as projectmem issue `#0264`.
10. Issue: final Pyright gate could not read the existing uv cache under managed sandbox.
    - Attempt: reran the unchanged repository command through the approved route.
    - Result: Pyright passed with 0 errors and 0 warnings.
    - Final resolution or blocker: resolved as projectmem issue `#0265`.

### Phase 6 preflight and token inventory

- Starting SHA: `4593f1d16ba2dfa36907342ba36eee3cb9250cce`; worktree clean on `chore/dependency-modernisation-2026`.
- Plan freshness, checked 2026-07-27: npm registry reports Tailwind CSS `4.3.3` remains latest; no Tailwind advisories were published from 2026-07-26 through 2026-07-27.
- Upstream syntax review: official Tailwind CSS 4 documentation confirms `@theme inline` for theme values that reference runtime CSS variables.
- Font mapping: `font-sans` maps to `Inter, system-ui, sans-serif`.
- Radius mappings: `rounded-lg`, `rounded-md`, and `rounded-sm` retain `0.75rem`, `0.5rem`, and `0.25rem`.
- Blue mappings: complete `blue-50` through `blue-950` brand scale moved unchanged.
- Runtime semantic mappings: `accent`, `accent-dark`, `app-bg`, `surface`, `surface-raised`, `foreground`, `card-foreground`, `primary`, `primary-foreground`, `secondary-foreground`, and `muted-foreground` map through the existing `:root` tokens where values match.
- Fixed semantic mappings: `background`, `card`, `border`, `input`, `secondary`, and `muted` retain their exact Phase 5 values.
- Dynamic-class audit found no generated Tailwind class fragments. Two fixed-string matches were non-class `text-*` object IDs.
- Border decision: retain the app-wide Tailwind v3 default-border compatibility base rule. Removing it would create broad visual drift or noisy repeated classes without semantic benefit.

### Phase 6 migration result

- Product-editable runtime tokens and Tailwind utility mappings now live together in `frontend/index.css`.
- Runtime-dependent mappings use `@theme inline`; compiled primary, foreground, muted, and opacity-modified utilities continue to reference the runtime variables.
- User's first runtime test exposed that visible AiVS brand controls use `blue-500`/`blue-600` rather than the sparse semantic `primary` utilities. Those two exact baseline shades now map to `--accent`/`--accent-dark`, preserving default appearance while enabling live runtime retheming of current UI.
- Explicit source detection remains limited to `index.html` and `frontend/`.
- `tailwind.config.js` and its `@config` reference were removed.
- Font/radius, blue-palette, semantic-colour, and config-removal checkpoints each passed the frontend build and all 75 frontend tests.
- No dependency version changed.

### Phase 6 command evidence

| Command | Result | Duration | Log/evidence |
|---|---|---:|---|
| `git diff --check` | PASS |  | No whitespace errors; expected line-ending conversion warnings only. |
| `corepack pnpm typecheck:ts` | PASS |  | TypeScript 5.9.3, 0 errors. |
| `corepack pnpm test:frontend` | PASS | 2.72s final Tier A | Vitest 4.1.10: 22 files and 75 tests passed. |
| `corepack pnpm build:frontend` | PASS | 0.38s renderer build | CSS-first theme built; Electron main and CommonJS preload also built. |
| `corepack pnpm typecheck:py` | PASS WITH APPROVED ROUTE | 3.12s | Pyright: 0 errors and 0 warnings. |
| `corepack pnpm backend:test` | PASS WITH APPROVED ROUTE | 7.32s test time | 278 passed, 1 skipped; existing `pynvml` deprecation warning only. |
| `corepack pnpm build:fast:win` | PASS WITH APPROVED ROUTE | 25.97s final rebuild | Restored 436 packages from existing pnpm store, then rebuilt `release\win-unpacked` successfully after the runtime accent mappings. |
| CSS-first compiled-output assertions | PASS | 0.05s | Config removal, sources, inline mappings, radius, blue opacity, semantic opacity, muted text, and border contracts passed. |
| Protected-runtime diff guard | PASS |  | No protected runtime path changed from Phase 6 starting SHA. |

### Phase 6 manual checks

- [x] Development visual matrix matches Phase 5.
- [x] Runtime accent retheming updates buttons, progress, selected states, focus, highlights, and opacity variants. User confirmed both `--accent` and `--accent-dark` visibly retheme the current blue-500/600-backed UI.
- [x] Unpacked app styling matches Phase 5.
- [x] Existing project opens without migration/data loss.
- [x] Protected runtime diff guard produced no output.

Exit gate: user confirmed development and unpacked styling parity, dual-token runtime accent retheming, and existing-project reopen. Automated Tier A/B, compiled CSS, packaging, and protected-runtime gates passed. Phase 6 is `PASSED`; Phase 7 remains not started and unread.

### Phase 6 dependency review

- Exact package commands used: no dependency changes; `npm view tailwindcss version dist-tags.latest time.modified --json` for freshness.
- Exact resolved versions: Tailwind CSS `4.3.3`, `@tailwindcss/vite` `4.3.3`, `tailwind-merge` `3.6.0`.
- Peer dependency warnings: none introduced; package graph unchanged.
- Lockfile review: no changes.
- Security advisory findings: public GitHub advisory API returned no Tailwind advisories published since the 2026-07-26 runbook review.
- Upstream release notes/docs reviewed: official Tailwind CSS 4 theme-variable, `@theme inline`, colour, and source-detection documentation through Context7.
- Deviations from plan: registry query required approved network access after the managed route hung.

### Phase 6 commits

| Purpose | Commit SHA | Message |
|---|---|---|
| CSS-first theme implementation checkpoint | `5a0df7d313f759d96648746d9e5690dd19230071` | `refactor(styles): move Tailwind theme tokens into CSS` |

### Phase 6 issues and attempted fixes

1. Issue: managed npm registry freshness query hung and its process backend rejected interruption.
   - Attempt: confirmed no matching process remained, then reran the exact query through approved network access.
   - Result: Tailwind CSS `4.3.3` confirmed as latest.
   - Final resolution or blocker: resolved as projectmem issue `#0266`.
2. Issue: the first inline Node compiled-CSS assertion command failed because nested PowerShell quoting produced invalid JavaScript.
   - Attempt: removed nested quoted `@source` literals and asserted the exact directive count instead.
   - Result: all nine CSS-first compiled-output assertions passed.
   - Final resolution or blocker: resolved as projectmem issue `#0267`.
3. Issue: managed sandbox denied both Tier B Python gates access to the existing uv cache.
   - Attempt: reran the unchanged repository commands through the approved uv-cache route.
   - Result: Pyright passed; backend suite passed with 278 tests and 1 skip.
   - Final resolution or blocker: resolved as projectmem issue `#0268`.
4. Issue: the first fast Windows build stalled while recreating `node_modules` under restricted network access.
   - Attempt: inspected and stopped only the confirmed stalled build tree, then reran through the approved route with `CI=true`.
   - Result: dependencies restored from the existing pnpm store and unpacked packaging passed.
   - Final resolution or blocker: resolved as projectmem issue `#0269`.
5. Issue: changing `--accent` produced no visible change because current screens predominantly use fixed `blue-500`/`blue-600` utilities.
   - Attempt: moved those exact baseline blue shades into `@theme inline` mappings backed by `--accent`/`--accent-dark`.
   - Result: TypeScript, 75 frontend tests, production build, runtime-token mappings, and opacity compilation passed; user then confirmed dual-token runtime retheming in development.
   - Final resolution or blocker: resolved as projectmem issue `#0270`.
6. Issue: first compiled runtime assertion assumed standalone utility selectors, while Tailwind grouped selectors sharing the same declaration.
   - Attempt: inspected generated selectors and changed the assertion to verify each class's nearby compiled value.
   - Result: blue-500, blue-600, semantic primary, and opacity mappings passed.
   - Final resolution or blocker: resolved as projectmem issue `#0271`.
7. Issue: rebuilt unpacked app could not replace `release\win-unpacked` while the previous development process tree held packaging output.
   - Attempt: identified the exact development tree, waited for it to exit, confirmed no AiVS process remained, and reran the unchanged fast Windows build.
   - Result: electron-builder replaced `release\win-unpacked` and completed successfully in 25.97 seconds.
   - Final resolution or blocker: resolved as projectmem issue `#0272`.
8. Issue: managed sandbox denied the required Git index write for the Phase 6 implementation checkpoint.
   - Attempt: reran staging through the approved Git route with the same three-file scope.
   - Result: exact implementation files staged, cached diff check passed, and checkpoint commit succeeded.
   - Final resolution or blocker: resolved as projectmem issue `#0273`.

### Phase 7 pre-upgrade review

- Starting SHA: `4d20cb815a8a19ea9ef4718098ddbfc6578e5503`; worktree was clean on `chore/dependency-modernisation-2026`.
- Current versions: React/React DOM `18.3.1`; React types `18.3.31` / `18.3.7`; Node `24.18.0`; pnpm `10.30.3`; TypeScript `5.9.3`.
- Reviewed targets: React/React DOM `19.2.8`; React types `19.2.17` / `19.2.3`.
- Plan freshness, checked 2026-07-27: npm registry reports `19.2.8` as the newest stable patch in the approved React 19.2 family. It was published 2026-07-21; the upstream changelog has no additional client-renderer migration entry for this patch.
- Security review: public GitHub advisory queries returned no advisory for any exact target package.
- Official React 19 migration review: removed legacy renderer APIs, legacy context/string refs, function-component `defaultProps`, `react-dom/test-utils`, empty `useRef`, global JSX namespace, callback-ref implicit returns, and stricter `ReactElement` props were checked.
- Repository inventory: modern `createRoot` plus `StrictMode` already used; no removed runtime API, legacy ref/context, function static, empty `useRef`, global JSX type, or `react-dom/test-utils` match. `frontend/components/ui/tooltip.tsx` uses supported `ReactDOM.createPortal`.
- Lifecycle review: generation polling has explicit stop/abort/unmount guards and a Strict Mode replay test; inspected provider timers, subscriptions, media listeners, object URLs, portals, and timeline listeners retain their existing cleanup ownership.
- Peer review: one React/React DOM runtime is installed. `react-dropzone` `14.4.1`, `lucide-react` `0.400.0`, and Testing Library React `16.3.2` peer ranges accept React 19; no test-library update or peer override is required.
- Baseline `corepack pnpm typecheck:ts`: passed with TypeScript `5.9.3`.
- Baseline `corepack pnpm test:frontend`: Vitest `4.1.10`, 22 files and 75 tests passed.
- Baseline `corepack pnpm build:frontend`: renderer, Electron main, and CommonJS preload passed; existing chunk-size/dynamic-import warnings only.
- Deviations so far: managed npm registry queries hung and required approved network execution. `pnpm outdated` applies the repository release-age policy and therefore reports React `19.2.7`; the exact reviewed `19.2.8` target is six days old and will require the same command-scoped release-age exception used by earlier phases.

### Phase 7 React 18 warning baseline

- [x] Development app launched.
- [x] Home, GenSpace Image/Video/Music, Settings, Model Manager, Director, and Video Editor inspected.
- [x] Terminal and renderer console checked; no React warnings or errors.
- [x] User confirmed Phase 6 visual parity.

### Phase 7 React 19 implementation and validation

- Implementation commit: `1c667c9d8f7d28c950fe475dd9fca0fb2766b280` (`chore(deps): migrate renderer to React 19`).
- Versions: React/React DOM `18.3.1` -> `19.2.8`; `@types/react` `18.3.31` -> `19.2.17`; `@types/react-dom` `18.3.7` -> `19.2.3`.
- Compatibility change: DOM `RefObject` prop/helper contracts and compatibility casts now represent mount-time `null` under React 19 types. No runtime behaviour, provider ownership, or renderer API changed.
- Peer and runtime graph: `react-dropzone` `14.4.1`, `lucide-react` `0.400.0`, and Testing Library React `16.3.2` accept React 19; `corepack pnpm list react react-dom --depth 20` confirmed one React/React DOM `19.2.8` runtime.
- `corepack pnpm typecheck:ts`: passed with zero errors.
- `corepack pnpm test:frontend`: 22 files and 75 tests passed.
- `corepack pnpm build:frontend`: renderer, Electron main, and CommonJS preload passed; existing chunk-size/dynamic-import warnings only.
- `corepack pnpm typecheck:py`: passed with zero errors and warnings.
- `corepack pnpm backend:test`: 278 passed, 1 skipped; existing `pynvml` deprecation warning only.
- `corepack pnpm build:fast:win`: passed; unpacked Windows app rebuilt with Electron `43.2.0`.
- Development exit gate: user confirmed application shell, project/settings persistence, GenSpace modes and media, Director/editor interactions, console/Strict Mode state, and visual parity.
- Unpacked exit gate: user confirmed `file://` launch, preload-backed file/import workflows, project state, media/navigation behaviour, and visual parity with no production-only error.
- Diff review: phase-scoped dependency metadata plus React 19 DOM-ref typing only; `git diff --check` passed.
- Protected runtime guard: no change under `backend/pyproject.toml`, `backend/uv.lock`, `scripts/wangp-stacks.json`, `scripts/wangp-source.json`, stack/source installers, update scripts, or `Wan2GP/`.
- Deviations: exact targets required the documented command-scoped release-age exception. Managed Pyright needed approved uv-cache access. No codemod, peer override, dependency replacement, or TypeScript suppression was used.
- Exit gate: `PASSED`. Phase 8 remains `NOT STARTED`.

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
| Home/projects | `C:\tmp\AiVS-phase1-baseline-20260726\01-home.png` | User-confirmed development and unpacked parity, 2026-07-27 |  | PASS |
| GenSpace Image | `C:\tmp\AiVS-phase1-baseline-20260726\02-genspace-image.png` | User-confirmed development and unpacked parity, 2026-07-27 |  | PASS |
| GenSpace Video | `C:\tmp\AiVS-phase1-baseline-20260726\03-genspace-video.png` | User-confirmed development and unpacked parity, 2026-07-27 |  | PASS |
| GenSpace Music | `C:\tmp\AiVS-phase1-baseline-20260726\04-genspace-music.png` | User-confirmed development and unpacked parity, 2026-07-27 |  | PASS |
| Gallery list view | `C:\tmp\AiVS-phase1-baseline-20260726\05-gallery-list.png` | User-confirmed development and unpacked parity, 2026-07-27 |  | PASS |
| Settings | `C:\tmp\AiVS-phase1-baseline-20260726\06-settings-general-output.png` | User-confirmed development and unpacked parity, 2026-07-27 |  | PASS |
| Model Manager | `C:\tmp\AiVS-phase1-baseline-20260726\07-model-manager.png` | User-confirmed development and unpacked parity, 2026-07-27 |  | PASS |
| Director | `C:\tmp\AiVS-phase1-baseline-20260726\08-director.png` | User-confirmed development and unpacked parity, 2026-07-27 |  | PASS |
| Video Editor | `C:\tmp\AiVS-phase1-baseline-20260726\09-video-editor.png` | User-confirmed development and unpacked parity, 2026-07-27 |  | PASS |
| Setup/first run |  |  |  |  |
| Modal/popover/forms | `C:\tmp\AiVS-phase1-baseline-20260726\10-installed-gallery-drag-ready.png` | User-confirmed development and unpacked parity, 2026-07-27 |  | PASS |

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
