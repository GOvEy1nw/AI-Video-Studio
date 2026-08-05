# AiVS code-health and application-performance implementation package

**Audit date:** 2026-08-03  
**Repository:** [GOvEy1nw/AI-Video-Studio](https://github.com/GOvEy1nw/AI-Video-Studio)  
**Audited branch:** `dev`  
**Pinned baseline:** [`c405f8224a8a510140591a9b76a568f3a78b49ad`](https://github.com/GOvEy1nw/AI-Video-Studio/commit/c405f8224a8a510140591a9b76a568f3a78b49ad)  
**Scope:** AiVS renderer, Electron shell, application state, project storage, media UI, and developer validation. WanGP inference performance is explicitly out of scope.

This package turns the audit into small, ordered pull requests for Codex. It is deliberately not a “rewrite the app” plan. Each PR has a narrow performance or maintainability owner, measurable acceptance criteria, a minimal test requirement, and an explicit list of things not to change.

## What the audit found

AiVS is not suffering from dependency sprawl: the runtime dependency list is small, the current React/Electron/Vite stack is modern, Electron Builder already excludes tests, docs, source maps, caches, model folders, and development artefacts from the installer, and the recent GenSpace split is directionally sound.

The material issues are elsewhere:

1. The initial renderer import graph eagerly includes `Project`, `SettingsModal`, `ModelPackManager`, Director, and the very large Video Editor.
2. Opening a project mounts Quick Gen, Director, and Video Editor at once. Hidden workspaces retain state, but they also initialise hooks, contexts, media surfaces, listeners, and data loaders.
3. Model-profile loading is not actually shared. Quick Gen creates image/video/audio loaders, Director creates two further video loaders, and every instance separately calls the backend and Electron model-pack API.
4. `ProjectContext` is one very broad provider with an inline value object. Unrelated project changes can invalidate every consumer, including hidden workspaces.
5. Project persistence and path approval repeatedly walk or serialise large project structures; pending writes are cleared before asynchronous saves complete.
6. User-triggered Electron file operations include synchronous full-file reads/copies and base64 transfer, which can block the Electron main process and inflate memory.
7. Asset Library grid/list views eagerly render every visible card. Audio assets decode waveforms immediately; video fallbacks create media elements; marquee movement rerenders the parent library.
8. Audio waveform rendering and Video Editor playback duplicate file decoding, AudioContexts, caches, and byte conversion.
9. Video Editor playback performs clip/asset searches and allocations inside its animation-frame loop, and the timeline renders live `<video>` elements as clip thumbnails.
10. The frontend test suite is currently red and contains many assertions against CSS classes, exact layout, sibling order, wording, and implementation structure. Those tests are maintenance friction rather than protection.
11. `.projectmem` and current-state docs contain substantial chronological/tool-failure noise. This does not bloat the packaged app, but it does bloat repository and agent context.

## Recommended execution order

| PR | Original suggested Backlog ID | Title | Priority | Depends on | Runtime impact |
|---|---:|---|---|---|---|
| 00 | AIVS-028 | Harden the renderer-to-Electron project path boundary | P0 | — | File security and project data safety |
| 01 | AIVS-016 | Restore a lean, green, critical-only validation baseline | P0 | — | Indirect; unlocks safe work |
| 02 | AIVS-017 | Split the renderer bundle and mount workspaces on first visit | P1 | 01 | Startup, memory, initial work |
| 03 | AIVS-018 | Share backend lifecycle and curated model-profile loading | P1 | 01 | Startup traffic, timers, renders |
| 04 | AIVS-019 | Isolate project-state domains and consumer renders | P1 | 02–03 | Render cost across workspaces |
| 05 | AIVS-020 | Serialize/coalesce project persistence and approve paths incrementally | P1 | 04 | UI responsiveness, data safety |
| 06 | AIVS-021 | Remove blocking Electron media/file I/O and base64 transport | P1 | 00, 01 | Main-process responsiveness, memory |
| 07 | AIVS-022 | Unify bounded audio/thumbnail decoding and caches | P1 | 06 | CPU, memory, decoder pressure |
| 08 | AIVS-023 | Virtualize the Asset Library and eliminate eager media elements | P1 | 07 | Large-library scrolling and memory |
| 09 | AIVS-024 | Index Video Editor playback data and suspend inactive media work | P1 | 03, 06–07 | Playback/timeline responsiveness |
| 10 | AIVS-025 | Remove dormant Video Editor residue and finish structural decomposition | P2 | 09 | Maintainability; some render isolation |
| 11 | AIVS-026 | **Conditional:** lazy-load full project documents from a summary index | P2 | 04–05, 07 | Startup with many/large projects |
| 12 | AIVS-027 | Compact project memory and refresh current-state documentation | P3 | 01 | Codex/repository clarity only |

PR 11 has an explicit measurement gate. Do not implement it merely because it exists.

Local completion on 2026-08-04 found path-boundary gaps in Electron file IPC. Run standalone PR 00 first, then PR 01, then follow the remaining dependency order.

`AIVS-016` now identifies audit-completion task, so IDs in this package are historical suggestions rather than allocatable IDs. When creating implementation tasks, use actual next IDs and translate dependencies by PR number from this table. Do not copy stale numeric dependency values from plan front matter.

## How to use this package with Codex

1. Start from the current `dev` branch. If `dev` has moved beyond the pinned baseline, Codex must re-run the evidence checks in `00_AUDIT_REPORT.md` and record any changed assumptions in the selected Backlog task.
2. Create one Backlog task per PR using next IDs generated by Backlog, then translate plan dependencies to those actual task IDs.
   Map plan labels to configured Backlog types: `performance`/`refactor` to `enhancement`, and `documentation` to `docs`.
3. Work one PR at a time. Do not combine the sequence into a single “performance refactor” branch.
4. Before each PR, capture only the relevant baseline from `references/BENCHMARK_PROTOCOL.md`.
5. Apply the critical-test policy in `references/TEST_RETENTION_MATRIX.md`. UI/CSS movement does not justify a new automated test.
6. Use the commit breakdown inside each PR file. Each commit must build independently where practical.
7. Update current-state docs only after the code is verified; do not turn `.projectmem/summary.md` into another chronological transcript.
8. Do not modify `Wan2GP/` unless a PR explicitly names it. None of these PRs does.

## Package contents

- `00_AUDIT_REPORT.md` — evidence, risk ranking, and explicit non-recommendations.
- `00_PR_ELECTRON_PATH_BOUNDARY_HARDENING.md` — immediate security prerequisite.
- `01_...md` through `12_...md` — Codex-ready PR implementation plans.
- `CODEX_START_PROMPT.md` — a reusable prompt for assigning one PR at a time.
- `references/BASELINE_EVIDENCE.md` — commit-pinned source evidence.
- `references/TEST_RETENTION_MATRIX.md` — what to keep, delete, and never recreate.
- `references/BENCHMARK_PROTOCOL.md` — repeatable, local-only measurements.
- `PACKAGE_MANIFEST.md` — generated file list and checksums.

## Global constraints

- Preserve existing project schema and generation metadata unless the selected PR explicitly includes a migration.
- Keep generation running when a user switches project tabs.
- Preserve state after a workspace has been visited.
- Do not add a general state-management library just to solve context invalidation.
- Do not add a generic cache framework, schema-driven UI framework, broad barrel exports, or one-file-per-hook folder trees.
- Prefer deletion and ownership consolidation over another abstraction layer.
- Do not add snapshot tests, pixel tests, exact Tailwind-class tests, or tests that enforce DOM sibling order.
- Keep security boundaries: context isolation, path validation, and narrow preload wrappers.
- Treat build/typecheck as gates; do not disguise them as pytest/Vitest cases.
