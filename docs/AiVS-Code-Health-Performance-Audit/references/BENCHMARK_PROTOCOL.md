# AiVS application-performance benchmark protocol

## Purpose

Use this protocol to establish evidence before and after each performance PR. It measures **AiVS application behaviour only**. It does not measure WanGP inference speed, GPU utilisation during generation, model quality, or quantisation.

The audit environment could inspect the pinned source but could not execute the Windows/Electron application. Codex must collect local figures on the target development PC before claiming an improvement.

## General rules

1. Record the exact Git commit, Windows version, CPU, RAM, GPU, storage location, Node/pnpm versions, and whether the app is packaged or dev-mode.
2. Compare like with like: packaged-to-packaged or dev-to-dev; cold-to-cold or warm-to-warm.
3. Use a fixed fixture project for all before/after runs.
4. Run each timing at least five times; report median and slowest run.
5. Close unrelated heavy applications and leave power mode unchanged.
6. Do not run WanGP generation while measuring renderer/UI performance.
7. Preserve raw logs/results in `artifacts/performance/<task-id>/` or attach them to the Backlog task; do not paste large logs into `.projectmem/summary.md`.
8. A change is an improvement only when the intended metric improves without a material regression in another critical metric or workflow.

## Fixture set

Create local test fixtures; do not commit large media.

### Project S — small

- 1 project;
- 10 image assets;
- 5 video assets with thumbnails;
- 3 audio assets;
- 1 Director timeline;
- 1 Video Editor timeline with 10 clips.

### Project M — representative

- 10 projects in Home;
- active project with 250 assets: 120 images, 80 videos, 50 audio/takes;
- 8 bins and mixed favourites;
- 3 Director timelines;
- 3 editor timelines, one with 150 clips across video/audio/subtitle tracks.

### Project L — stress

- 50 project summaries;
- active project with 2,000 assets;
- at least 500 audio variations and 500 videos;
- editor timeline with 1,000 clips.

Project L is used only for gallery/editor/storage PRs and the PR 11 measurement gate.

## Instrumentation conventions

Prefer stable marks over stopwatch-only measurement.

Add development-only performance marks where required:

```ts
performance.mark("aivs:renderer-entry");
performance.mark("aivs:home-interactive");
performance.mark("aivs:project-shell-interactive");
performance.mark("aivs:workspace:gen-space:mounted");
performance.mark("aivs:workspace:director:mounted");
performance.mark("aivs:workspace:video-editor:mounted");
```

Then measure:

```ts
performance.measure(
  "aivs:renderer-to-home",
  "aivs:renderer-entry",
  "aivs:home-interactive",
);
```

Development instrumentation must:

- be behind `import.meta.env.DEV` or an explicit diagnostics flag;
- not pollute normal logs every frame;
- be removed after investigation unless retained as a tiny diagnostics API;
- never include user prompts or paths.

Use Electron’s renderer process metrics/DevTools Performance and Memory panels for CPU/heap observations. Take heap snapshots only after the same navigation and garbage-collection procedure.

## Baseline record template

```md
Task/PR:
Commit:
Date/time:
Mode: [packaged unpacked | production build via Electron | Vite dev]
Machine:
Fixture:
Runs:

| Metric | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Median | Slowest |
|---|---:|---:|---:|---:|---:|---:|---:|
| ... | | | | | | | |

Functional smoke result:
Known noise/limitations:
Raw artifact paths:
```

## PR-specific measurements

### PR 01 — validation baseline

Record before/after:

- frontend test files discovered;
- frontend test cases passed/failed/skipped;
- frontend suite wall time;
- backend test count and wall time;
- number of unhandled runner errors;
- TypeScript diagnostics;
- Pyright diagnostics;
- production build result.

Target:

- all retained tests green;
- no unhandled media errors;
- at least 20% fewer frontend test cases unless the task contains a justified exception;
- no test runner invokes another static-analysis tool.

### PR 02 — renderer chunks and first-visit mounting

Use a clean production build.

Record:

- renderer entry JS raw/gzip size;
- dynamic chunk list from Vite manifest;
- time from renderer entry to Home interactive;
- time from clicking a project to Quick Gen interactive;
- first and second switch to Director;
- first and second switch to Video Editor;
- renderer heap after Home, project/Quick Gen, first Director visit, first Video Editor visit;
- whether unopened workspaces created timelines, listeners, media elements, or profile requests.

Acceptance guidance:

- Home entry no longer statically owns project/editor/settings/model-manager graphs;
- unopened Director/Video Editor code is absent from the entry and not mounted;
- second tab switch preserves state and is effectively immediate;
- no active generation is cancelled by switching tabs.

Do not define success solely as “more chunks”; compare entry size and interactivity.

### PR 03 — shared lifecycle and profiles

Instrument request/IPC counts during:

1. app start;
2. open project;
3. visit Director;
4. visit Video Editor;
5. backend restart;
6. Model Manager refresh/download completion.

Record counts for:

- `/api/model-profiles`;
- `getModelPacks`/`refreshModelPacks`;
- `getBackendHealthStatus`;
- active `onBackendHealthStatus` listeners;
- retry timers after a simulated transient failure.

Target:

- one profile refresh cycle per lifecycle event regardless of consumers;
- one health subscription/snapshot owner;
- zero retries while backend is restarting/dead;
- last successful profile data remains visible through a transient restart.

### PR 04 — project-state render isolation

Use React DevTools Profiler with Project M.

Capture commits for:

- typing ten characters in Quick Gen prompt;
- generation progress updates for ten seconds using a mocked/local progress source;
- favourite one asset;
- rename one project;
- move one editor clip;
- update one Director segment.

Record:

- components committed;
- total render duration;
- whether inactive workspace trees committed;
- whether the Asset Library rerendered for a prompt-only update.

Target:

- domain-unrelated consumers do not commit;
- inactive workspaces do not rerender for unrelated changes;
- no correctness/state-retention regression.

### PR 05 — persistence and path approval

With Project M and Project L, record:

- number of `saveProject` IPC calls while dragging an editor control for ten seconds;
- maximum concurrent saves per project;
- time from final mutation to durable file update;
- save ordering under injected latency;
- number of assets/paths scanned after one metadata-only update;
- number of `approveLocalPath` IPC calls after adding one new asset;
- project JSON size and write duration.

Failure injection:

- delay save N, then trigger save N+1;
- reject one save;
- mutate while a save is in flight;
- close/navigate after final mutation.

Target:

- writes are serial per project;
- newest state eventually persists;
- failed/pending work is not silently discarded;
- one new asset approves only its new paths;
- high-frequency edits coalesce to bounded writes.

### PR 06 — Electron file/media I/O

Use representative 100 MB, 1 GB, and 4 GB files on the normal project storage volume.

Record:

- main-process event-loop delay/responsiveness during import/copy/move/delete;
- elapsed operation time;
- renderer and main-process peak memory;
- bytes transferred over IPC for audio decode input;
- cancellation/close behaviour where applicable;
- UI ability to move/resize the window and switch tabs during the operation.

Target:

- no synchronous full-file work on the main process for user-triggered large operations;
- no base64 expansion for large media bytes;
- path validation and duplicate semantics unchanged;
- UI remains responsive.

### PR 07 — media decode/cache

With 50 unique audio files and repeated uses of 10 of them, record:

- decode count per URL;
- total AudioContext count;
- peak decoded-audio cache bytes;
- cache hits/misses/evictions;
- thumbnail blob URL count and revoked URL count;
- renderer heap after visiting/leaving media-heavy views three times.

Target:

- one in-flight decode per URL;
- shared cache hit across waveform and playback consumers;
- bounded cache by bytes, not only item count;
- evicted thumbnail object URLs are revoked;
- no unbounded growth across navigation cycles.

### PR 08 — Asset Library

Use Project M and L. Test grid and list modes.

Record at top, middle, and bottom:

- rendered asset-row/card count;
- `<video>` element count;
- active waveform canvas/decode count;
- scroll FPS/long tasks;
- renderer heap;
- time to apply type/source/bin/favourite filter;
- marquee selection update frequency;
- selection/focus correctness after virtual rows recycle.

Target guidance:

- rendered items stay proportional to viewport + overscan, not total library size;
- no eager video metadata elements for offscreen assets;
- offscreen audio does not decode;
- marquee DOM/state updates are rAF-limited;
- keyboard/multi-select/destructive behaviour remains correct.

### PR 09 — Video Editor hot paths

Use the 150-clip and 1,000-clip timelines.

Record:

- playback dropped frames/long tasks;
- average and worst rAF callback duration;
- allocations or GC events during 30 seconds playback;
- React commits per second during normal playback and dissolve;
- `<video>` elements used for timeline thumbnails;
- seek latency at five positions;
- time to move/trim one clip;
- time to derive active clip/dissolve/audio set.

Target:

- hot loop reads precomputed indexes/maps;
- no per-frame whole-array map/filter/sort for active clip;
- no repeated asset linear search per active media lookup;
- timeline thumbnails are static;
- inactive editor releases/pauses media work;
- playback correctness and transition timing remain unchanged.

### PR 10 — structural cleanup

This is not primarily a performance PR. Record:

- `VideoEditor.tsx` line count before/after;
- dormant imports/state/handlers removed;
- production chunk sizes to ensure no accidental regression;
- React Profiler spot check for editor open and clip selection;
- focused critical editor tests and manual smoke result.

Do not claim speed based on line-count reduction.

### PR 11 — conditional project loading gate

Measure before implementing:

- app start to Home interactive for 1/10/50 projects;
- `loadProjects` elapsed time and total bytes parsed;
- Home renderer heap;
- time to open the largest project;
- index JSON and project JSON sizes.

Implement PR 11 only when either condition is met on Project L:

- project load/parse contributes at least **250 ms** median to Home startup; or
- fully loaded closed projects contribute at least **100 MB** renderer heap.

After implementation, verify:

- Home uses summaries only;
- full project loads on open;
- dirty/full document is not evicted;
- migration/crash recovery works;
- open latency remains acceptable.

If neither gate is met, close AIVS-026 as `not planned` with measurements.

### PR 12 — docs/context hygiene

Record repository-only outcomes:

- `.projectmem/summary.md` line/byte count;
- number of issue-history files retained in active context;
- current-state docs with stale dependency/version claims;
- Codex prompt/context tokens if the tooling exposes them.

Do not claim application runtime or installer improvement.

## Regression thresholds

Unless a PR defines a stricter target:

- a target metric should improve by at least 10% or remove a clearly proven duplicate/blocking operation;
- no critical interactivity metric should regress by more than 5%;
- no material heap increase without an explicit trade-off;
- no data-safety, file-safety, generation-contract, or state-retention regression is acceptable.

Small sub-10% changes can still be accepted when they remove deterministic duplicate requests, a main-thread blocking primitive, an unbounded cache, or an architectural hazard with clear evidence.
