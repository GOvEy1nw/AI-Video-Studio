# Audit report: AiVS code health and application performance

## Audit identity

- **Branch:** `dev`
- **Pinned head:** `c405f8224a8a510140591a9b76a568f3a78b49ad`
- **Local completion check:** 2026-08-04 on the pinned head
- **Audit type:** deep static/source audit of the current repository snapshot
- **Excluded:** WanGP model execution, quantisation, GPU kernels, model loading speed inside WanGP, and generation throughput
- **Included:** renderer startup and rendering, Electron main/preload work, project/state persistence, media decoding, asset browsing, Video Editor UI/playback, test/developer friction, and repository context hygiene

The original audit environment could inspect the exact GitHub branch and files but could not clone and execute the repository locally. Local completion on 2026-08-04 revalidated the static findings and developer baseline on the exact pinned head. No representative fixture project or native Electron performance run was available, so this report still does **not** invent startup milliseconds, frame rates, event-loop delay, or memory figures. Every performance PR begins with its relevant local baseline and uses relative before/after acceptance criteria.

## Executive assessment

AiVS does not need a broad rewrite. Its current runtime dependency set is modest and the recent GenSpace ownership split is sensible. The highest-value work is to stop doing expensive work before it is needed, share lifecycle/data owners that currently duplicate requests and timers, move blocking filesystem work off Electron’s main thread, and prevent media-heavy surfaces from rendering/decoding the whole project at once.

The current test suite should be made smaller before the performance work starts. At the pinned head, project notes report a direct Vitest run of **50 files, 197 passing tests, 11 failing tests, and one unhandled jsdom media error**, while strict TypeScript reports **12 unused-symbol diagnostics** in `GalleryAssetLibrary.tsx`, `ReframePanel.tsx`, and `VideoGenPanel.tsx`. A red suite full of presentation assertions is a poor refactor safety net.

## Local completion evidence

The following checks ran from the repository root on Windows against the pinned head:

- `pnpm typecheck:ts` reproduced the 12 cited unused-symbol diagnostics and no additional diagnostics.
- `pnpm test:frontend` reproduced 50 files, 197 passing tests, 11 failing tests, and one unhandled `HTMLMediaElement.play()`/jsdom error.
- `pnpm build:frontend` passed for renderer, Electron main, and preload. The renderer emitted one 1,084.02 kB raw / 284.15 kB gzip JavaScript entry chunk and a 133.74 kB raw / 19.15 kB gzip CSS asset. Vite warned that the renderer chunk exceeds 500 kB and that dynamic imports of `frontend/lib/thumbnails.ts` are ineffective because `DirectorTimeline.tsx` also imports it statically.
- All 19 payload files match the updated `PACKAGE_MANIFEST.md`.

These figures establish developer-state and bundle-structure evidence only. They are not substitutes for the five-run, fixture-based native measurements in `references/BENCHMARK_PROTOCOL.md`.

## Findings by severity

### P0 — renderer-callable Electron path controls do not consistently enforce the intended privilege boundary

**Evidence**

- `electron/ipc/file-handlers.ts` validates `open-parent-folder-of-file` and `read-local-file`, but `show-item-in-folder`, `search-directory-for-files`, and `check-files-exist` accept renderer paths without `validatePath`.
- `approve-local-path` accepts an arbitrary renderer-supplied path and adds it directly to the approved set. A renderer compromise can therefore approve a path before calling another nominally validated file operation.
- `set-project-assets-path` persists any renderer-supplied string, and `getProjectAssetsPath()` later returns persisted `projectAssetsPath` without trust provenance or revalidation. `getAllowedRoots()` includes that value, so an existing or newly written root such as `C:\` turns nominal validation into broad filesystem access for other IPC channels and survives restart.
- `copy-to-project-assets`, `import-to-project-assets`, and `delete-project-asset-files` accept renderer-supplied `projectId` values. `projectAssetCategoryDir()` and delete containment construct their trusted project root with `path.join(assetsRoot, projectId)` without validating the identifier or rechecking destination containment. Traversal segments can escape the intended project directory.
- No focused tests cover `file-handlers.ts`, `path-validation.ts`, project asset destination containment, or delete containment.

**Risk**

- Context isolation and narrow preload wrappers do not provide their intended containment if renderer code can approve arbitrary paths or select a broader project root.
- A compromised renderer or corrupted project identifier can probe, reveal, read, overwrite, import to, or delete outside the intended project-scoped boundary, depending on the invoked channel and available path.

**Recommendation**

Implement the standalone PR 00 before any validation cleanup or performance refactor. Validate project identifiers as single safe path segments, resolve and verify every derived destination beneath the selected project root, restrict project-root changes to a canonical path returned by a user-mediated native directory picker, reauthorize legacy custom roots before they enter the allowed set, remove or constrain renderer-driven path approval, and apply `validatePath` to every privileged path channel. Preserve legacy root data for non-destructive re-selection rather than silently falling back and hiding user assets. Add focused negative tests for traversal, persisted/arbitrary root changes, unapproved paths, and destination containment.

---

### P0 — validation baseline is noisy and red

**Evidence**

- `frontend/components/GalleryAssetLibrary.test.tsx` asserts details such as exact icon/label markup, scrollbar class, grid slider behaviour, model/time metadata, and card aspect/object-fit implementation.
- `frontend/components/SettingsDropdown.test.tsx`, `MusicGenPanel.test.tsx`, `VideoGenPanel.test.tsx`, and `GenSpaceControls.test.tsx` contain placement, sibling-order, class, and internal DOM assertions.
- Existing project issue records explicitly describe tests becoming stale because labels, disclosure order, widths, dropdown placement, and DOM structure changed while behaviour remained valid.
- `backend/tests/test_pyright.py` runs the type checker as a pytest case despite `typecheck:py` already being a first-class command.
- `backend/tests/test_no_mock_usage.py` is a style-policy scan presented as a product test.
- `scripts/test-project-asset-import.mjs` can fall back to testing a duplicate local implementation when production output is absent.

**Risk**

- Manual UI work requires unrelated test editing.
- Failures cease to be meaningful.
- Codex is incentivised to preserve old markup instead of improving the product.
- Static checks run redundantly and fail for environment/tooling reasons inside unrelated suites.

**Recommendation**

Implement PR 01 first. Delete brittle tests rather than “fixing” them to match the latest markup. Retain only domain, lifecycle, safety, persistence, request-mapping, and critical interaction contracts.

---

### P1 — the renderer eagerly imports and mounts heavy, inactive product areas

**Evidence**

`frontend/App.tsx` statically imports:

- `Project`
- `PythonSetup`
- `SettingsModal`
- `LogViewer`

`SettingsModal` statically imports `ModelPackManager`.

`frontend/views/Project.tsx` statically imports and simultaneously renders:

- `GenSpace`
- `DirectorEditor`
- `VideoEditor`

The three workspaces are wrapped with `hidden`, so they remain mounted. `VideoEditor.tsx` is more than 5,000 lines and imports a large editor graph. Director and Video Editor both include their own Asset Library and media/editor state.

`DirectorEditor` can create an initial Director timeline when a project is opened even if Director has never been visited.

**Risk**

- Large initial renderer entry and parse/evaluation cost.
- Hidden workspaces initialise hooks, state, effects, profile loaders, libraries, and media-related services.
- Project data may be mutated for an unused workspace.
- State preservation is achieved by paying the full startup cost up front.

**Recommendation**

PR 02 should use dynamic imports and “mount on first visit, then keep mounted” semantics. This preserves state and running generation jobs without loading every workspace on project entry.

---

### P1 — model profiles and backend lifecycle are duplicated

**Evidence**

`useProfilesByMediaType` contains local state, a backend fetch, a model-pack IPC call, and a fixed 1.5-second retry loop. It does not share a cache across hook instances.

On a normal project mount:

- GenSpace calls `useImageProfiles()`.
- GenSpace calls `useVideoProfiles()`.
- GenSpace calls `useMusicProfiles()`.
- `DirectorEditor` calls `useVideoProfiles()`.
- `DirectorWorkspacePanel` calls `useVideoProfiles()` again.

That is five independent loaders for one backend profile payload and one Electron model-pack payload.

Separately, `useBackend` and `AppSettingsProvider` each subscribe to backend-health IPC and request an initial snapshot.

**Risk**

- Duplicate startup requests and IPC.
- Duplicate retry timers during backend startup/failure.
- Additional renderer state and rerenders.
- Inconsistent freshness between consumers.

**Recommendation**

PR 03 should introduce one backend-lifecycle owner and one curated-profile owner, preserving the existing `useImageProfiles`/`useVideoProfiles`/`useMusicProfiles` consumer API.

---

### P1 — project state invalidates unrelated consumers

**Evidence**

`ProjectContext.tsx` exposes navigation, the entire project list/current project, every asset operation, every editor timeline operation, every Director timeline operation, and all cross-workspace hand-offs in one context.

The Provider `value` is created inline. Any provider render produces a new value object. Because all workspaces currently mount, a timeline update can invalidate Asset Library and GenSpace consumers that do not depend on timeline data, and asset updates can invalidate editor consumers that only need timeline state.

The underlying update functions generally preserve unrelated array references, which makes a small domain-context split viable without replacing the state model.

**Risk**

- Wide render fan-out.
- Hidden workspaces receive unrelated updates.
- Future memoisation at leaf components is undermined by broad context invalidation.

**Recommendation**

PR 04 should split consumers into a small set of stable domain contexts while retaining one internal store and no new state-management dependency.

---

### P1 — persistence and path approval do repeated or unsafe work

**Evidence**

The project persistence effect:

- compares full project object references;
- records pending IDs;
- clears pending IDs before asynchronous IPC writes complete;
- writes changed projects concurrently with `Promise.all`;
- updates the “persisted” map before writes succeed.

A failed save is reported but not automatically restored to the pending queue.

A separate effect walks every project, asset, and take on every `projects` change to find unapproved paths. Refs prevent duplicate approvals, but not the repeated full-library scan.

Electron project files are written atomically, which is good, but index read/modify/write can still race if multiple renderer saves/deletes are issued concurrently.

**Risk**

- Repeated O(all-assets) work during unrelated timeline changes.
- Overlapping saves and index operations.
- Latest pending state can be lost after a failed write.
- Full project JSON is repeatedly serialised/written.

**Recommendation**

PR 05 should serialize and coalesce writes, retain failed snapshots, and move path approval to load/import/add-take boundaries.

---

### P1 — Electron’s main process performs blocking large-file work

**Evidence**

`electron/ipc/file-handlers.ts`:

- reads local files with `fs.readFileSync`;
- converts the complete Buffer to base64;
- recursively searches directories with `readdirSync`;
- checks paths with synchronous filesystem calls;
- writes renderer-provided text and binary payloads with `writeFileSync`.

`electron/lib/project-asset-import.ts`:

- creates directories synchronously;
- copies, renames, deletes, and checks files synchronously.

These functions are invoked by asynchronous IPC handlers, but synchronous filesystem calls still block Electron’s main event loop. Base64 also expands payload size and forces a second renderer-side conversion.

**Risk**

- Window stalls during large imports/copies or audio reads.
- Extra peak memory and CPU.
- Main-process responsiveness becomes coupled to disk speed and media size.

**Recommendation**

After PR 00 closes the path-boundary gaps, PR 06 should use `fs/promises`, a typed byte IPC contract, and a single shared Electron API type without weakening the hardened checks. Worker threads/streaming are intentionally deferred unless asynchronous I/O still measures poorly.

---

### P1 — media decoding and caching are duplicated and unbounded in the wrong places

**Evidence**

`AudioWaveform.tsx`:

- owns a global waveform cache keyed only by URL even though callers request different bucket counts;
- deduplicates pending work with a 50 ms polling loop;
- creates a new `AudioContext` per decode;
- redraws/reallocates its canvas in an animation loop during playback.

`usePlaybackEngine.ts` separately:

- reads local files;
- performs the same base64 conversion;
- owns another AudioContext and full AudioBuffer cache;
- retains decoded buffers without a shared byte budget.

`thumbnails.ts` keeps blob URLs in a process-lifetime map and does not revoke them. Director and Video Editor each maintain local thumbnail maps and separately iterate project videos.

`Home.tsx` also mounts an autoplay hero `<video>` whenever Home renders. This is distinct from project-card video fallbacks and should be measured separately rather than assumed to dominate startup.

**Risk**

- Same media is read/decoded multiple times.
- Full waveform canvases are redrawn for a moving playhead.
- Blob URLs and decoded buffers remain resident.
- Multiple thumbnail loops compete for media decoders.

**Recommendation**

PR 07 should create two small, specific services—audio decode/waveform and video thumbnail—not a generic cache framework. Caches must be promise-deduplicated, bounded, and explicitly cleaned up.

---

### P1 — Asset Library eagerly renders and decodes the entire filtered set

**Evidence**

`GalleryAssetLibrary` maps all display assets in grid mode and `GalleryAssetList` maps all assets in list mode.

Cards are not memoized. Fallback videos use `<video preload="metadata">`. Audio cards and each audio take mount `ClipWaveform`. Images do not opt into lazy/async decoding.

During marquee movement, `setSelectionBox` updates React state for every pointer move, rerendering the library. On pointer-up, every rendered card is queried and measured.

The component also retains dead grid-card action/model metadata code that is no longer rendered, which contributes to the current TypeScript failures and stale tests.

**Risk**

- DOM/media cost grows linearly with library size.
- Scrolling and selection degrade as assets grow.
- Hidden workspace libraries amplify the cost.
- Pointer movement causes avoidable render storms.

**Recommendation**

After the shared media service exists, PR 08 should virtualize rows, render static thumbnails/placeholders, memoize cards/rows, and move marquee visual updates out of React’s per-pointer render path.

---

### P1 — Video Editor’s playback/timeline paths repeatedly scan project data

**Evidence**

`usePlaybackEngine` performs clip `map`/`filter`/`sort` work in the animation-frame loop, scans assets with `find`, scans for dissolve pairs, and finds the next video clip dynamically.

`VideoEditor.tsx` repeats asset and clip searches in rendering and helper functions. Timeline video clips render live `<video>` elements as thumbnails. A metadata-probe effect creates off-screen media elements for unique clip URLs and is not fully owned by active-workspace state.

The editor does stop playback when the tab changes, which should be preserved. The problem is the remaining lookup/media work and retained resources.

**Risk**

- Playback cost grows with timeline size.
- Short-lived arrays/objects increase garbage collection.
- Timeline DOM can create many media elements.
- Hidden editor state can retain decoders/buffers.

**Recommendation**

PR 09 should build stable lookup/index structures outside the frame loop, use static thumbnails, and add an explicit inactive cleanup contract. Horizontal timeline culling is a measurement-gated follow-up, not a default requirement.

---

### P2 — Video Editor is still a structural maintenance hotspot

**Evidence**

`VideoEditor.tsx` remains over 5,000 lines despite several extracted hooks/components. It contains dormant or hidden feature plumbing (`EFFECTS HIDDEN`, `IC-LORA HIDDEN`), large overlay blocks, timeline presentation, selection logic, layout management, and orchestration in one module.

**Risk**

- Merge conflicts and accidental cross-feature edits.
- Harder review and weaker ownership.
- Performance fixes become risky because hot and cold code are interleaved.

**Recommendation**

PR 10 should remove provably unreachable UI residue while preserving saved-data compatibility, then extract coherent visible sections. Do not create another 3,000-line “controller hook” or dozens of one-use wrappers.

---

### P2 conditional — all project documents load before Home can render its list

**Evidence**

Electron’s project index stores IDs only. `loadStoredProjects()` reads and parses every project JSON with `Promise.all`. `ProjectProvider` stores all full projects. Home needs name/date/thumbnail and currently scans full asset arrays to choose a card thumbnail.

**Risk**

- Startup time and memory scale with all historical projects, not the opened project.
- Home can mount media elements for project-card fallbacks.

**Recommendation**

PR 11 is conditional. Implement a project-summary index and lazy project-document loading only if the benchmark gate demonstrates material startup cost.

---

### P3 — repository/agent memory is noisy, but this is not packaged runtime bloat

**Evidence**

Recent `dev` changes include hundreds of small `.projectmem/issues` records, many describing shell quoting, patch-context, package-manager, or sandbox failures. `.projectmem/summary.md` accumulates chronological attempts. `.projectmem/PROJECT_MAP.md` still describes an older React/Electron/Vite stack while `package.json` already contains the modern stack.

Electron Builder excludes renderer source maps and selected backend/WanGP docs, caches, models, and development folders. The claim must remain scoped: the broad WanGP include still permits files such as tests or plugins unless a later exclusion removes them. `.projectmem` and this audit package are not part of the built renderer resources.

**Risk**

- Codex/search context dilution.
- Larger diffs and slower repository navigation.
- Conflicting “current state” documentation.

**Recommendation**

PR 12 should compact project memory and update current-state docs. Do not claim an end-user launch improvement from this PR.

## Explicit non-recommendations

The audit does **not** recommend:

- rewriting GenSpace again simply because `useGenSpaceController` is large;
- replacing React context with Redux/Zustand/a bespoke event bus;
- creating a schema-driven universal generation form;
- moving backend model profile data into many tiny files merely to reduce line count;
- undoing the shared `FloatingMenu` consolidation;
- blanket `React.memo`/`useMemo` everywhere;
- manual Vite chunk definitions before dynamic imports establish natural boundaries;
- disabling React Strict Mode as a production “optimization”;
- adding screenshot/visual-regression infrastructure to compensate for deleting brittle layout tests;
- modifying WanGP performance paths;
- combining these recommendations into one branch.

## Execution qualifiers

- Run standalone PR 00 first with focused negative tests and a production build. PR 01 follows to restore the broader trustworthy validation baseline; performance refactors follow only after both land.
- PR 03 should define one refresh cycle per lifecycle event; whether the first load occurs at app startup or on the first consumer must be chosen and measured rather than hidden behind “project open” wording.
- PR 04 may keep a temporary `useProjects()` compatibility adapter during migration, but the named high-fan-out consumers must leave it before acceptance.
- PR 01's 20% test-count reduction is a review target with a documented exception path, not a quota that overrides retention of critical contracts.
- PR 11 remains conditional. No local 1/10/50-project startup or heap gate was measured during this audit completion.
- Plan front matter uses semantic labels such as `performance`, `refactor`, and `documentation`; current Backlog accepts `enhancement`, `task`, `chore`, and `docs` instead. Map these labels when creating tasks rather than passing unsupported values to Backlog.

## Success definition

The overall programme is successful when:

- the validation suite is green, materially smaller, and contract-focused;
- initial Home/Project bundles no longer contain unopened workspace/modal code;
- opening a project performs one curated-profile load;
- unrelated asset/timeline changes no longer rerender every workspace domain;
- large file import/read operations do not block Electron’s main thread;
- media files are decoded once per required representation and caches remain bounded;
- an Asset Library with 1,000 items renders a bounded number of rows/cards;
- Video Editor frame-loop lookup work is allocation-free or near-allocation-free;
- inactive workspaces do not continue playback/decoder/timer work;
- every privileged Electron file operation validates its source, destination, approved root, and project identifier;
- current-state docs match the actual stack and omit routine tool-failure diaries.
