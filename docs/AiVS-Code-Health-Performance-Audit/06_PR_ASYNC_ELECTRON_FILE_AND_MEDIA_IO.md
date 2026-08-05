---
suggested_backlog_id: AIVS-023
title: Remove blocking Electron media and file I/O and base64 transport
status: Implemented
priority: high
type: enhancement
baseline_commit: 50e76db
dependencies:
  - AIVS-017
  - AIVS-018
---

# PR 06 — Remove blocking Electron media/file I/O and base64 transport

## Pull request intent

Keep Electron’s main event loop responsive during media reads, imports, copies, moves, searches, writes, and deletes. Replace full-file base64 transfer with typed binary data and make the preload contract single-source.

This PR is about AiVS application responsiveness; it does not change generation or WanGP.

## Baseline blocking work

`electron/ipc/file-handlers.ts` and `electron/lib/project-asset-import.ts` currently use:

- `fs.readFileSync`;
- `Buffer.toString("base64")`;
- `fs.readdirSync` recursion;
- `fs.existsSync`/`statSync` loops;
- `fs.mkdirSync`;
- `fs.copyFileSync`;
- `fs.renameSync`;
- `fs.unlinkSync`.

An `ipcMain.handle` function being `async` does not make synchronous filesystem calls non-blocking.

Renderer media code then runs `atob` and creates another byte array before decode.

## Implemented outcome

- `shared/electron-api.ts` is the single preload/renderer API contract.
- Local media reads return `Uint8Array` bytes through IPC; renderer consumers use an exact backing-range `ArrayBuffer`.
- Project imports, generated-asset moves, directory searches, existence checks, media writes, and deletion preflight use asynchronous filesystem APIs.
- Per-destination import serialization preserves duplicate behavior under concurrent requests; asynchronous search preserves prior depth-first duplicate selection.
- Synchronous canonical containment remains inside the hardened path-validation boundary; no renderer filesystem authority was broadened.
- Focused path/import/byte tests, strict TypeScript, production renderer/Electron/preload build, and the production-module import test pass.
- A 256 MiB event-loop benchmark measured maximum heartbeat gaps of 68.4 ms for the previous synchronous copy shape, 19.3 ms for production async import, and 15.7 ms for async read. Native window interaction smoke was inconclusive because the managed agent had no desktop-control surface.

## Design constraints

- Keep context isolation and the narrow preload wrapper.
- Preserve the hardened PR 00 path boundary and its focused negative tests.
- Preserve duplicate strategies (`reuse`, `suffix`, `overwrite`, `prompt`).
- Preserve move semantics, including cross-device `EXDEV` fallback.
- Do not add a worker-thread framework unless asynchronous Node I/O still profiles poorly.
- Do not stream every tiny file; remove the proven blocking/base64 path first.

## Implementation plan

### 1. Single-source the Electron API type

`electron/preload.ts` currently defines the exposed methods and repeats a large global `Window.electronAPI` interface in the same file.

Create one type-only contract, for example:

```text
shared/electron-api.ts
```

or another shared path accepted by both TypeScript configs.

```ts
export interface ElectronAPI {
  readLocalFileBytes(filePath: string): Promise<{
    bytes: Uint8Array;
    mimeType: string;
  }>;
  ...
}
```

Then:

```ts
const electronAPI: ElectronAPI = { ... };
contextBridge.exposeInMainWorld("electronAPI", electronAPI);
```

The renderer global declaration should reference `ElectronAPI`; do not copy the method list again.

Update `tsconfig.json` and `tsconfig.node.json` narrowly to include the shared type file.

### 2. Replace base64 reads with typed bytes

Electron handler:

```ts
ipcMain.handle("read-local-file-bytes", async (_event, filePath: string) => {
  const normalizedPath = validatePath(filePath, getAllowedRoots());
  const buffer = await fsPromises.readFile(normalizedPath);
  return {
    bytes: new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength),
    mimeType: mimeTypeFor(normalizedPath),
  };
});
```

Renderer helper:

```ts
function exactArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}
```

Do not return a Node `Buffer` contract to the renderer. Use a structured-clone-compatible typed value.

Remove:

- `readLocalFile`;
- base64 conversion helpers;
- `atob` loops in waveform/playback code.

Migrate all callers before deleting the old IPC channel.

### 3. Make project asset import asynchronous

Convert:

- `findAvailableFileName`
- import-plan filesystem checks where needed
- `transferFile`
- `importProjectAsset`

to asynchronous operations using `fs/promises`.

Preserve pure filename/plan helpers separately when possible. A pure helper may accept a supplied `destinationExists` result rather than doing filesystem work.

Move semantics:

```ts
try {
  await fs.rename(src, dest);
} catch (error) {
  if (isExdev(error)) {
    await fs.copyFile(src, dest);
    await fs.unlink(src);
  } else {
    throw error;
  }
}
```

Overwrite semantics must remove/replace safely without leaving a partial destination. Consider copying to a temporary destination then renaming for very large overwrite operations if the current semantic requires atomicity.

### 4. Make directory search asynchronous and bounded

Replace recursive `readdirSync` with asynchronous depth-first traversal that preserves the original immediate-descent entry order:

- `fs.readdir(dir, { withFileTypes: true })`;
- maximum depth retained;
- skip dot directories as today;
- stop when all requested filenames are found;
- periodically yield naturally through awaited filesystem calls;
- deduplicate requested names;
- retain permission-error skipping.

Do not create one Promise per entire filesystem tree.

Optional only if a real caller needs it: add request cancellation by ID. Do not add cancellation solely for theoretical completeness.

### 5. Make existence/stat/delete checks asynchronous

- `check-files-exist`: use bounded/concurrent `fs.access` or `stat`;
- asset deletion: use `fs.stat` rather than sync exists/stat before `shell.trashItem`;
- import destination checks: use async `access`;
- `save-file` and `save-binary-file`: use asynchronous writes while retaining validation and existing result contracts;
- keep a small concurrency limit for large batches.

### 6. Keep UI-facing operations observable

For imports/copies:

- the existing importing state remains active while the async operation runs;
- errors retain path-safe user messages;
- duplicate-choice flow remains identical;
- multiple imports remain sequential or use a low concurrency (1–2) to avoid saturating disk;
- do not add progress infrastructure in this PR unless an existing IPC progress owner can be reused cleanly.

### 7. Remove the fallback test illusion

Update `scripts/test-project-asset-import.mjs` to exercise the real implementation only.

Preferred choices:

- a Node test against a small extracted pure plan module plus one asynchronous temp-directory integration; or
- a built-module integration after Electron build.

It must fail/skip explicitly if production code cannot be loaded; never test a duplicate fallback function and report product success.

## Target files

- `electron/preload.ts`
- `electron/ipc/file-handlers.ts`
- `electron/lib/project-asset-import.ts`
- `electron/lib/project-asset-delete.ts`
- any shared MIME/path helper
- `frontend/components/AudioWaveform.tsx`
- `frontend/views/editor/usePlaybackEngine.ts`
- other `readLocalFile` callers found by Codex
- TypeScript config(s)
- new shared Electron API type
- `scripts/test-project-asset-import.mjs`
- one focused async I/O test

## Commit plan

### Commit 1 — `refactor(ipc): single-source the Electron API contract`

- Shared type.
- preload/global declaration migration.
- no behaviour change.

### Commit 2 — `perf(ipc): transfer local media as bytes instead of base64`

- new handler/API;
- callers migrated;
- old channel removed.

### Commit 3 — `perf(files): make import search and delete operations asynchronous`

- fs/promises import/move/copy;
- async search/existence/stat;
- focused integration test.

## Manual responsiveness benchmark

Use the same machine and packaged/unpacked build.

1. Prepare a multi-gigabyte test media file on:
   - same drive as project assets;
   - different drive if available.
2. Start import/copy.
3. During transfer:
   - move/resize the AiVS window;
   - open/close a lightweight menu;
   - switch between already-visited tabs;
   - observe Electron main-process long tasks.
4. Decode a large audio file for a waveform and observe memory/CPU.

Record before/after:

- longest main-thread/main-process task;
- peak renderer/main memory;
- visible window stalls;
- transfer result/path/duplicate semantics.

Do not use a sparse-file result as the only benchmark if the filesystem can optimise it unrealistically.

## Acceptance criteria

- [ ] No user-triggered large media read/copy/move/search path uses synchronous filesystem calls in Electron main.
- [ ] Local media bytes cross IPC without base64.
- [ ] Renderer no longer uses `atob` for local media reads.
- [ ] Preload and renderer use one `ElectronAPI` interface.
- [ ] Duplicate import strategies preserve behaviour.
- [ ] Cross-device move fallback preserves behaviour.
- [ ] PR 00 path-boundary tests remain green and asynchronous conversion does not weaken validation or containment.
- [ ] Large import/read does not freeze normal window interaction in the manual benchmark.
- [ ] The project-asset import test exercises production code.
- [ ] Focused test, typecheck, renderer/Electron/preload build pass.
- [ ] No UI layout tests are added.

## Non-goals

- Do not expose Node filesystem APIs to the renderer.
- Do not disable context isolation or path validation.
- Do not add worker threads before measuring async I/O.
- Do not implement a generic transfer manager.
- Do not change project asset folder layout.
- Do not optimise WanGP reads.
