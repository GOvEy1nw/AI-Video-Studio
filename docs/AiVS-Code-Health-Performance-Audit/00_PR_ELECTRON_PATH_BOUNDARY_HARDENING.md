---
suggested_backlog_id: AIVS-028
title: Harden the renderer-to-Electron project path boundary
status: Draft
priority: high
type: bug
baseline_commit: c405f8224a8a510140591a9b76a568f3a78b49ad
dependencies: []
---

# PR 00 — Harden the renderer-to-Electron project path boundary

## Pull request intent

Restore the intended context-isolated filesystem boundary before performance refactoring begins. Renderer input must not be able to approve an arbitrary path, broaden the allowed root set, or escape a project asset directory through `projectId` traversal.

This is a focused security/data-safety PR. It does not convert filesystem calls to asynchronous I/O, change project layout, or alter generation behavior.

## Confirmed gaps

- `approve-local-path` accepts an arbitrary renderer path and adds it to the approved set.
- `set-project-assets-path` accepts an arbitrary renderer string; `getAllowedRoots()` then trusts that value.
- `show-item-in-folder`, `search-directory-for-files`, and `check-files-exist` skip `validatePath`.
- project asset import/copy/delete derive trusted directories from an unvalidated renderer `projectId`.
- destination containment is not rechecked after joining the asset root, project ID, and category.
- no focused test protects these boundaries.

## Invariants

- Keep `contextIsolation` enabled and `nodeIntegration` disabled.
- Keep a narrow typed preload API; do not expose `ipcRenderer` or raw filesystem methods.
- Preserve the default and user-selected project asset root behavior.
- Preserve valid existing project IDs and upload/generated folder layout.
- Preserve user-mediated external media selection and Video Editor in-place references.
- Reject unsafe input before filesystem access; do not normalize traversal into acceptance.

## Implementation plan

### 1. Make project-root selection main-process owned

Replace renderer-supplied `set-project-assets-path(path)` authority with a native directory-selection operation owned by Electron main:

- renderer requests a project-root change without supplying the trusted result;
- Electron shows the native directory picker;
- Electron canonicalizes and persists only the selected directory;
- cancellation leaves the existing root unchanged;
- `getAllowedRoots()` receives only the canonical default or main-selected root.

Do not accept `C:\`, another broad root, a relative path, or a fabricated renderer value merely because it can be resolved.

Existing custom `app_state.json.projectAssetsPath` values have no proof that they came from a native selection. On first hardened startup:

- never add an untrusted persisted custom root to `getAllowedRoots()`;
- preserve the stored value as migration/recovery context instead of deleting it or silently falling back;
- require one native re-selection before the custom root becomes trusted;
- clearly surface that project assets remain untouched and why re-selection is required;
- record trust provenance/version only after successful native selection.

### 2. Remove arbitrary path approval

Delete or constrain `approve-local-path` so renderer code cannot mint its own filesystem capability.

Approval must originate from a main-process-owned user action such as an open/save/directory dialog or another bounded native import operation. Preserve required in-place editor media behavior through that native boundary; do not restore arbitrary approval as a compatibility shortcut.

### 3. Validate every privileged path channel

Apply the same canonical validation policy before:

- revealing an item;
- opening a parent directory;
- searching a directory;
- probing existence;
- reading or writing;
- importing, copying, moving, or deleting.

Validate before checking existence or touching the filesystem. Keep user-facing errors path-safe.

### 4. Validate project IDs and derived destinations

Add one shared project-ID/path-segment guard that:

- accepts existing non-empty IDs that are one filename segment;
- rejects absolute paths, `.`/`..`, separators, and traversal forms;
- resolves every derived project/category directory;
- verifies the result is a strict descendant of the canonical project asset root.

Import, generated-asset copy, and delete must use the same helper. Delete containment must not treat a renderer-selected broader directory as the project root.

### 5. Add focused negative tests

Use the smallest existing Electron/native test infrastructure. Cover:

- arbitrary approval rejection;
- arbitrary/broad project-root input rejection or absence from the API;
- persisted legacy custom/broad roots remain outside `getAllowedRoots()` until native re-selection, without deleting or moving assets;
- unapproved reveal/search/existence access;
- `projectId` traversal and absolute-path rejection;
- destination containment for upload/generated copy and delete;
- one valid existing project/import/delete path.

No snapshots, UI layout assertions, or broad mock framework.

## Target files

- `electron/ipc/file-handlers.ts`
- `electron/path-validation.ts`
- `electron/app-state.ts`
- `electron/config.ts`
- `electron/lib/project-asset-import.ts`
- `electron/lib/project-asset-delete.ts`
- `electron/preload.ts`
- renderer `ElectronAPI` declaration/callers for project-root selection and path approval
- one focused Electron/native path-boundary test

## Commit plan

### Commit 1 — `fix(security): make project-root and path approval native-owned`

- remove renderer-minted approval;
- make root selection native-owned and canonical;
- validate reveal/search/existence channels.

### Commit 2 — `fix(files): enforce project-id and destination containment`

- shared safe-segment/containment helper;
- import/copy/delete migration;
- focused negative tests.

## Verification

- run focused path-boundary tests;
- run `pnpm typecheck:ts` and report unrelated pinned failures honestly until PR 01 lands;
- run `pnpm build:frontend`;
- manually select/cancel a project root, import external media, reveal an allowed item, and delete one project asset in Electron;
- confirm traversal/unapproved operations fail without touching the target.

## Acceptance criteria

- [ ] Renderer input cannot directly approve an arbitrary filesystem path.
- [ ] Renderer input cannot set or broaden the project asset root; root changes use a canonical native selection.
- [ ] Persisted custom roots without native-selection provenance are quarantined from `getAllowedRoots()` and recover through non-destructive re-selection.
- [ ] Every privileged file IPC validates its path before filesystem access.
- [ ] Project IDs are safe single segments.
- [ ] Every derived upload/generated/delete target remains beneath the canonical project directory.
- [ ] Existing valid project roots, imports, in-place references, reveal, and project-scoped deletion still work.
- [ ] Focused traversal/unapproved-path tests pass.
- [ ] Production renderer/Electron/preload build passes.
- [ ] No generation, schema, folder-layout, or WanGP code changes.

## Non-goals

- Do not perform the asynchronous/base64 I/O refactor from PR 06.
- Do not add a generic capability framework or expose raw filesystem access.
- Do not redesign project storage or migrate project JSON.
- Do not modify WanGP.
