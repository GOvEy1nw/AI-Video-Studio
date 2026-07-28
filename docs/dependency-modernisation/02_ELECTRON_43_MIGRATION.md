# Phase 2 — Electron 31 → Electron 43 Migration

## Objective

Upgrade the shipped desktop runtime from Electron 31 to the latest stable patch in the Electron 43 family while preserving AiVS's security model, file workflows, packaged behaviour, and user data.

At the time this plan was written, Electron 43.2.0 was the latest stable Electron 43 patch. Resolve and record the newest stable `43.x` patch at execution time; do not jump to Electron 44 or later without owner approval and a new breaking-change review.

## Why this phase is isolated

Electron is not only a build dependency. It supplies the production Chromium and Node runtime shipped to every user.

AiVS currently has at least one known breaking dependency on an API removed in Electron 32:

```ts
const filePath = (file as File & { path?: string }).path
```

The current occurrences are in `frontend/lib/media-import.ts`, but the agent must search the complete repository rather than assume there are only two.

Electron 43 also changes default native-dialog directories, and Electron 42 changed how the npm package obtains its binary. These require explicit validation.

Do not upgrade Vite, Vitest, Tailwind, React, or TypeScript in this phase.

## Phase inputs

- Phase 1 status: `PASSED`
- Clean worktree
- Starting SHA recorded in `STATUS.md`
- Baseline screenshots and file-workflow evidence available
- Existing project data backed up
- Node 24 LTS active
- `pnpm@10.30.3` active

## Step 1 — Inventory Electron usage

Run repository-wide searches:

```powershell
rg -n --hidden --glob '!node_modules/**' --glob '!release/**' `
  "File\s*&\s*\{\s*path|\.path\b|webUtils|getPathForFile" frontend electron

rg -n --hidden --glob '!node_modules/**' --glob '!release/**' `
  "from ['""]electron['""]|require\(['""]electron['""]\)" frontend electron

rg -n --hidden --glob '!node_modules/**' --glob '!release/**' `
  "canGoBack|goBack|canGoForward|goForward|goToIndex|goToOffset|clearHistory" electron frontend

rg -n --hidden --glob '!node_modules/**' --glob '!release/**' `
  "clearStorageData|quotas|offscreen|showHiddenFiles|Notification|nativeImage\.toBitmap|databases" electron frontend
```

Manually inspect:

- `electron/main.ts`
- `electron/window.ts`
- `electron/preload.ts`
- `electron/ipc/file-handlers.ts`
- `electron/app-state.ts`
- `electron/updater.ts`
- `electron/csp.ts`
- `electron-builder.yml`
- build scripts under `scripts/`

Record every API requiring migration in `STATUS.md`.

## Step 2 — Review upstream breaking changes from 32 through 43

Read the Electron breaking-change sections for every intervening major. Do not only read the Electron 43 release post.

At minimum review and record disposition for:

### Electron 32

- removal of non-standard `File.path`;
- replacement with `webUtils.getPathForFile`;
- automatic deletion of a `databases` directory under `userData` that was associated with WebSQL.

### Electron 38–40

- renderer/API removals and deprecations relevant to any repository search hits;
- platform support changes;
- command-line or environment behaviour used by build scripts.

### Electron 41

- navigation API changes if used;
- PDF/WebContents changes if relevant.

### Electron 42

- Electron package binary is no longer obtained through the old install-time behaviour; first execution can trigger download;
- macOS notification code-signing change if AiVS uses notifications;
- any removed session options found by the audit.

### Electron 43

- native file dialogs default to Downloads when `defaultPath` is omitted;
- Linux-specific dialog/title-bar behaviour if Linux source support is maintained;
- colour-space behaviour if image conversion code is affected.

For every item, mark one of:

```text
NOT USED
CODE CHANGE REQUIRED
TEST ONLY
PLATFORM NOT CURRENTLY VERIFIED
```

## Step 3 — Add a narrow native-file-path abstraction before the package bump

The renderer must stop directly reading the non-standard `File.path`.

Create a small helper, for example:

```text
frontend/lib/native-file-path.ts
```

Suggested contract:

```ts
export function getNativeFilePath(file: File): string | null
```

During the pre-bump compatibility commit, it may temporarily support both bridges:

```ts
export function getNativeFilePath(file: File): string | null {
  const bridged = window.electronAPI?.getPathForFile?.(file)
  if (bridged) return bridged

  // Temporary Electron 31 compatibility only; remove after the runtime bump.
  const legacy = (file as File & { path?: string }).path
  return legacy || null
}
```

Replace every direct renderer access to `File.path` with the helper.

In `frontend/lib/media-import.ts`, preserve current semantics:

- `ensureGalleryAssetForInputFile` returns an object URL only when there is genuinely no native path;
- `importGalleryFile` returns `no-path` when no path is available;
- duplicate detection still receives the native filesystem path;
- copy-into-project still routes through the existing IPC method;
- no new arbitrary filesystem API is exposed.

### Tests before the bump

Add focused unit tests for:

1. bridge path is preferred;
2. legacy path is used only during the compatibility step;
3. missing path returns `null`;
4. media import still calls the existing project-import bridge with the resolved path;
5. unsupported media behaviour is unchanged.

Run Tier A.

Commit this isolated refactor:

```text
fix(electron): centralise native file path resolution
```

Record the SHA. This is the rollback point before changing Electron itself.

## Step 4 — Add `webUtils.getPathForFile` to the preload bridge

Update `electron/preload.ts`.

Use a narrow import:

```ts
const { contextBridge, ipcRenderer, webUtils } = require('electron')
```

Expose only the required operation:

```ts
getPathForFile: (file: File): string => webUtils.getPathForFile(file),
```

Add the same method to the `Window['electronAPI']` declaration.

Important constraints:

- do not expose `webUtils` itself;
- do not expose `ipcRenderer`;
- do not add generic path-reading functions;
- do not move the operation into the main process;
- keep the preload output CommonJS;
- keep context isolation enabled.

Once Electron 43 is installed and the bridge works, remove the legacy renderer fallback from `getNativeFilePath`. The final helper should rely on the narrow preload bridge and return `null` when unavailable, such as in a plain jsdom test without a mock.

Suggested final form:

```ts
export function getNativeFilePath(file: File): string | null {
  const path = window.electronAPI?.getPathForFile?.(file)
  return path?.trim() ? path : null
}
```

Do not leave the old `File & { path?: string }` cast in production source.

## Step 5 — Preserve sensible native-dialog locations

Electron 43 explicitly defaults open/save dialogs to Downloads when `defaultPath` is omitted. AiVS currently omits `defaultPath` for open-file and open-directory operations in `electron/ipc/file-handlers.ts`.

Use the existing persisted `electron/app-state.ts` system instead of adding another settings store.

Extend `AppState` with narrowly named optional values, for example:

```ts
lastOpenDirectory?: string
lastSaveDirectory?: string
lastDirectoryPickerPath?: string
```

Add small getters/setters that:

- return `null` if the stored path is missing or invalid;
- update state only after a successful dialog selection;
- store directories rather than complete selected filenames where appropriate;
- tolerate deleted or unavailable directories by falling back to a sensible app path.

Update:

- `show-open-file-dialog`
- `show-open-directory-dialog`
- `show-save-dialog`

Behaviour:

1. Use an explicit caller-provided `defaultPath` when supplied.
2. Otherwise use the corresponding stored last-used directory.
3. Otherwise use an appropriate current path such as project assets, Documents, or Downloads according to the existing workflow.
4. After success, persist the selected directory.

Update preload option types where required:

```ts
showOpenFileDialog(options: {
  title?: string
  defaultPath?: string
  filters?: ...
  properties?: string[]
})
```

Do not change existing call sites unnecessarily. The fallback tracking should preserve useful behaviour centrally.

Add tests for the pure state/path selection logic where practical. Do not unit-test Electron's native dialog UI itself.

## Step 6 — Upgrade Electron and Node types

Use explicit commands:

```powershell
pnpm add -D electron@<EXACT_REVIEWED_43_PATCH>
pnpm add -D @types/node@<EXACT_REVIEWED_24_PATCH>
```

Do not modify `electron-builder` or `electron-updater` yet unless Electron 43 installation is impossible without a narrowly required compatibility patch. Their general refresh belongs to Phase 9.

Inspect:

```powershell
pnpm list electron @types/node --depth 0
pnpm why electron
git diff -- package.json pnpm-lock.yaml
```

Record exact versions.

### Electron binary warm-up

Electron 42+ may obtain the runtime binary on first execution rather than through the historical install-time path. Force an early, explicit check:

```powershell
pnpm exec electron --version
```

This command must succeed before build testing. Add it to CI later if clean installs otherwise fail late.

Do not commit downloaded binaries.

## Step 7 — Resolve TypeScript/API errors without widening scope

Run:

```powershell
pnpm typecheck:ts
```

Likely areas:

- preload `File` typing;
- `webUtils` availability;
- Node 24 type changes;
- Electron API type changes;
- `on`/event types;
- native dialog options;
- imports that should use type-only syntax.

Rules:

- fix against current supported APIs;
- do not add `any` merely to suppress a migration error;
- existing `any[]` dialog property typing may be narrowed if the Electron type makes that easy, but do not turn this into a general refactor;
- do not disable `skipLibCheck` or strict flags beyond their existing settings;
- do not alter frontend product state architecture.

## Step 8 — Audit preload output and Electron security

Build:

```powershell
pnpm build:frontend
```

Inspect:

```text
dist-electron/main.js
dist-electron/preload.js
```

Confirm:

- both exist;
- preload is CommonJS;
- `webUtils.getPathForFile` is present;
- production main can locate `preload.js`;
- no renderer bundle contains direct Node/Electron imports;
- `contextIsolation: true`;
- `nodeIntegration: false`;
- production `webSecurity: true`.

Do not commit `dist` or `dist-electron` unless repository policy already tracks them; they are build evidence, not source.

## Step 9 — Run focused tests

Mandatory focused checks:

```powershell
pnpm test:frontend -- frontend/lib/native-file-path.test.ts
pnpm test:frontend -- frontend/lib/media-import.test.ts
```

Use actual paths created/available in the repository. If focused invocation differs under the current test script, use a valid Vitest file filter and record it.

Also run full Tier A:

```powershell
git diff --check
pnpm typecheck:ts
pnpm test:frontend
pnpm build:frontend
```

## Step 10 — Development-app Electron smoke

Launch:

```powershell
pnpm dev
```

Verify:

- Electron 43 version in `process.versions.electron`;
- Chromium/Node values correspond to the selected Electron build;
- only one app instance;
- preload bridge includes `getPathForFile`;
- app is not blank;
- backend starts;
- DevTools show no preload/contextBridge error.

### Mandatory file-path regression tests

Test both native input mechanisms:

1. `<input type="file">` / dropzone route used by the UI.
2. OS drag-and-drop route.

For image, video, and audio:

- native path resolves;
- imported asset reaches project `uploads`;
- duplicate choices work;
- media input receives file URL;
- gallery drag into prompt input still works;
- temporary object URLs are used only for genuinely pathless files;
- no `no-path` error occurs for normal Electron-selected files.

## Step 11 — Native-dialog regression tests

Exercise all three dialog types multiple times.

Verify:

- first invocation uses a sensible fallback;
- second invocation begins in the last successfully used directory;
- app restart retains the directory if persisted through app state;
- a deleted stored directory falls back cleanly;
- cancel does not overwrite the stored location;
- save dialog remembers the parent directory, not a stale full filename unless intentionally used as the next suggested name.

## Step 12 — Run Tier B

```powershell
pnpm typecheck:py
pnpm backend:test
pnpm build:fast:win
```

Then run the unpacked app:

```powershell
pnpm start:unpacked:win
```

Repeat the critical file path and dialog tests in the unpacked production build.

## Step 13 — Full Windows package check

Because the production runtime changed, run:

```powershell
pnpm build:win
```

Test:

- NSIS installer;
- installed app launch;
- preload;
- backend;
- file import;
- save/open dialogs;
- app-state persistence;
- update check does not crash;
- clean shutdown stops backend processes.

If Electron's first-run binary download behaviour affects CI or build scripts, fix the development/build preparation path narrowly. Do not make installed users download Electron; Electron must remain packaged in the app.

## Step 14 — Review data and user-directory impact

Electron 32's Chromium cleanup can remove a `databases` directory under Electron `userData`.

Search whether AiVS intentionally stores anything there:

```powershell
rg -n --hidden --glob '!node_modules/**' "databases" electron frontend
```

Inspect a copy of the existing `%LOCALAPPDATA%\AiVS` user-data directory.

If there is no custom `databases` content, record `NOT USED`.

If AiVS has unexpectedly stored data there, stop and design an explicit pre-launch migration before allowing Electron 43 to open real user data.

Do not test this risk first against the user's only production data.

## Step 15 — Diff review

Expected primary source changes:

- `package.json`
- `pnpm-lock.yaml`
- `electron/preload.ts`
- `electron/ipc/file-handlers.ts`
- `electron/app-state.ts`
- new or updated frontend path helper/tests
- `frontend/lib/media-import.ts`
- possibly preload type consumers
- status/evidence docs

Run:

```powershell
git status --short
git diff --check
git diff --stat
git diff
```

Confirm:

- no direct `File.path` production usage remains;
- no security boundary weakened;
- protected runtime files untouched;
- no Vite/Tailwind/React major changed;
- no UI redesign entered the diff.

## Suggested commits

Keep the already-created compatibility commit, then:

```text
chore(electron): upgrade desktop runtime to Electron 43
fix(electron): preserve remembered native dialog locations
test(electron): cover native file path import compatibility
```

These may be combined into two commits if the diff remains clear, but do not hide the pre-bump rollback point.

## Exit gate

Phase 2 passes only when:

- [ ] all Electron 32–43 breaking sections were reviewed;
- [ ] exact Electron 43 patch recorded;
- [ ] exact Node types version recorded;
- [ ] `File.path` is absent from production source;
- [ ] narrow `webUtils.getPathForFile` bridge works;
- [ ] context isolation and node-integration settings are unchanged;
- [ ] open/save/directory dialogs use sensible remembered paths;
- [ ] Tier A passes;
- [ ] Tier B passes;
- [ ] native file selection and OS drag/drop pass in development;
- [ ] the same workflows pass in `win-unpacked`;
- [ ] NSIS-installed app passes;
- [ ] existing project data remains intact;
- [ ] `userData/databases` risk is resolved or documented as not used;
- [ ] protected runtime diff guard is clean;
- [ ] commits and evidence recorded;
- [ ] `STATUS.md` is marked `PASSED`.

Do not begin Vite migration while Electron file import or packaged preload behaviour is uncertain.
