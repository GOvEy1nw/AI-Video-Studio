# AGENTS.md — AI Video Studio

This file is the operational guide for AI coding agents working in this repository.

Read [`AGENTS_PRD.md`](AGENTS_PRD.md) first for product direction and non-negotiable guardrails. Then use this file for architecture, ownership, validation, and working conventions.

> **Origin:** AiVS is built on [`deepbeepmeep/LTX-Desktop-WanGP`](https://github.com/deepbeepmeep/LTX-Desktop-WanGP), itself derived from Lightricks' LTX Desktop. The current AiVS code and focused current-state documents now take precedence over old inherited assumptions and completed phase plans.

## 1. Required reading order

Before changing code, read the smallest relevant set in this order:

1. `AGENTS_PRD.md` — product charter and hard guardrails.
2. `.projectmem/PROJECT_MAP.md` — current ownership and navigation.
3. `.projectmem/summary.md` — current decisions, limitations, and roadmap.
4. The focused contract for the area being changed:
   - `docs/GENSPACE_ARCHITECTURE.md`;
   - `docs/DIRECTOR_MODE_V1.md`;
   - `docs/REFRAME_MODE.md`;
   - `backend/architecture.md`;
   - `backend/WANGP_BACKEND.md`.
5. Current source and tests.

Completed implementation plans under `docs/` are historical rationale and parity evidence. Do not assume unchecked phase language means work remains incomplete.

## 2. Current project overview

AI Video Studio is a local-first desktop app for AI image, video, and music generation, powered exclusively by a bundled WanGP / Wan2GP runtime.

Current high-level layers:

- **Renderer** (`frontend/`) — React, TypeScript, Tailwind, projects, GenSpace, Director, Video Editor, Asset Library, and tests.
- **Electron** (`electron/`) — application lifecycle, context-isolated preload, IPC, project/file access, Python/runtime setup, model packs, ffmpeg, packaging, and updates.
- **Backend** (`backend/`) — FastAPI, typed domain handlers, state, services, curated model profiles, tests, and the in-process WanGP bridge.
- **WanGP** (`Wan2GP/`) — bundled source pinned by `scripts/wangp-source.json`.

Current product surfaces:

- Quick Gen image, video, Reframe, and music.
- Director V1 prompt timeline.
- Shared Asset Library.
- Inherited Video Editor.
- First-run runtime setup and Settings > Model Manager.

Retake, TTS, user-facing LoRA controls, and Director Guide Audio/Control Media authoring are not complete product features.

## 3. Working and branch discipline

- Confirm the requested base branch before creating or changing a branch. Active feature work normally targets `dev`, not `main`, unless the user says otherwise.
- Inspect the current branch and existing changes before editing. Do not overwrite or revert unrelated user work.
- Keep unrelated feature, refactor, dependency, runtime, and documentation work in separate branches/PRs.
- Prefer small coherent commits with explicit scope.
- Never claim a check passed unless it actually ran successfully in the current worktree.
- When a managed environment blocks a command, record the limitation and use an approved equivalent route; do not convert a sandbox problem into an application workaround.
- Do not commit generated media, model weights, local environments, release artifacts, caches, or temporary diagnostics unless the task explicitly requires a tracked fixture.

## 4. Common commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start Vite, Electron, and the Python backend |
| `pnpm dev:debug` | Start with Electron inspector and Python debugpy |
| `pnpm typecheck` | Run strict TypeScript and Pyright checks |
| `pnpm typecheck:ts` | TypeScript only |
| `pnpm typecheck:py` | Pyright only |
| `pnpm test:frontend` | Run the full Vitest suite |
| `pnpm test:frontend:watch` | Run frontend tests in watch mode |
| `pnpm backend:test` | Sync declared backend test/dev dependencies and run pytest |
| `pnpm build:frontend` | Build renderer, Electron main, and preload bundles |
| `pnpm build:fast:win` | Create an unpacked Windows build without rebuilding Python |
| `pnpm build:win` | Create the full Windows installer |
| `pnpm build:fast:mac` | Create an unpacked macOS build without rebuilding Python |
| `pnpm build:mac` | Create the full macOS build |
| `pnpm setup:dev:win` | Prepare the Windows development/runtime environment |
| `pnpm setup:dev:linux` | Prepare a Linux source-development environment |
| `pnpm setup:dev:mac` | Prepare the macOS development environment |
| `pnpm wangp:check` | Compare the bundled WanGP pin with the fork's `AiVS` head |
| `pnpm wangp:update` | Run a transactional focused WanGP update |
| `pnpm wangp:update:full` | Run a transactional WanGP update plus full validation |

Focused examples:

```powershell
pnpm typecheck:ts
pnpm test:frontend -- frontend/views/genspace/music/MusicGenPanel.test.tsx

cd backend
uv run pyright
uv run pytest tests/test_music_generation.py -v --tb=short
```

Use repository scripts rather than inventing parallel install/build paths.

## 5. Validation expectations

Validation should match the risk of the change.

### Documentation-only changes

- Review the full rendered content/diff.
- Check paths, commands, names, versions, and status claims against current source.
- Run `git diff --check` when working locally.
- Application tests are not required when no executable/configuration file changed, but say that explicitly.

### Frontend component, hook, or pure-logic changes

Minimum:

```text
pnpm typecheck:ts
relevant focused Vitest tests
pnpm test:frontend
```

Also run `pnpm build:frontend` when the change affects composition, imports, bundling, preload types, global CSS, or a broad product surface.

Native media behaviour—drag/drop, audio/video playback, seeking, file URLs, resize interactions—still requires Electron smoke testing when relevant.

### Backend changes

Minimum:

```text
cd backend
uv run pyright
relevant focused pytest files
```

Run `pnpm backend:test` for changes to shared state, app composition, API types, route/handler contracts, WanGP bridge behaviour, model profiles, model packs, or common services.

### Electron, preload, IPC, or file handling

Run:

```text
pnpm typecheck:ts
pnpm test:frontend
pnpm build:frontend
```

Then verify the affected path in the actual Electron app. For packaging-sensitive work, also run an unpacked build and, where required, the full installer.

### Styling or dependency changes

A successful build is not visual proof. Compare the relevant screens and interactions in Electron.

For major frontend/desktop dependency upgrades, follow the approved phased plan on a dedicated branch and validate development, unpacked, and installed builds independently.

### WanGP source or GPU runtime changes

Use the dedicated source/stack workflow. Review the exact source and wheel changes, run focused compatibility checks, then full validation before promotion.

Do not substitute a generic `uv update`, `pip install -U`, or package bot PR for the curated runtime process.

## 6. Frontend architecture

### 6.1 General rules

- Path alias: `@/*` maps to `frontend/*`.
- Strict TypeScript is enabled with unused locals/parameters rejected.
- Use React context and focused hooks already present in the project. Do not add Redux, Zustand, or another global state system without a measured architectural need and explicit approval.
- Prefer direct imports while ownership is evolving; avoid broad barrels that obscure dependencies or create cycles.
- Keep side effects in hooks/services and keep pure transformations independently testable.
- Do not access Node or Electron APIs directly from renderer code.
- Backend requests use the established authenticated localhost helper/connection flow; do not hard-code a second backend URL or bypass the session token contract.

### 6.2 Project workspaces

`frontend/views/Project.tsx` owns the Quick Gen, Director, and Video Editor tabs.

All workspaces remain mounted to preserve authored state. Inactive workspaces must:

- stop playback;
- ignore transport shortcuts;
- avoid media warming/decoding;
- avoid visible compositor residue;
- avoid polling or side effects not required for state preservation.

Do not replace this with unmount/remount behaviour casually; persistence and playback ownership are deliberate.

### 6.3 GenSpace ownership

`frontend/views/GenSpace.tsx` is intentionally a tiny route entry that renders `GenSpaceWorkspace`.

Current composition:

```text
GenSpaceWorkspace
├─ useGenSpaceController
│  ├─ mode/settings/media/video-tool state
│  ├─ one useGeneration instance
│  ├─ submission actions and immutable snapshots
│  ├─ result persistence/settings restore
│  └─ gallery state/actions
├─ GenSpaceGallery
├─ GenSpaceSidebar
│  ├─ image/ImageGenPanel
│  ├─ video/VideoGenPanel
│  └─ music/MusicGenPanel
└─ GenSpaceOverlays
```

Ownership rules:

- Mode panels receive typed controller contracts.
- Mode panels do not import project context directly.
- Mode panels do not call backend endpoints directly.
- Mode panels do not persist generated assets directly.
- Mode panels do not instantiate `useGeneration`.
- Persistent state belongs in the workspace controller/hooks above the active panel.
- Per-mode UI/helpers live under `image/`, `video/`, or `music/`.
- Cross-mode controls belong in `genspace/components/` only when genuinely shared.
- Pure transition/request/asset/restore logic belongs in `genspace/logic/`.
- Do not add a schema-generated universal form or independent mode-specific job manager.

See `docs/GENSPACE_ARCHITECTURE.md` for the current detailed contract.

### 6.4 Generation lifecycle

`frontend/hooks/use-generation.ts` is the public compatibility facade used by GenSpace and Director.

`frontend/hooks/generation/useGenerationJob.ts` exclusively owns:

- the current generation state;
- one abort controller;
- the 500 ms progress poll;
- cancellation;
- terminal-state guards;
- unmount cleanup.

Request builders and progress formatters live in `frontend/hooks/generation/`.

Do not create a second polling loop or cancellation implementation for a new media mode.

GenSpace submissions capture immutable, project-scoped snapshots. Completion persistence must use the submission snapshot, not live UI state, so switching projects/modes while a job runs cannot misfile the result or save later settings.

### 6.5 Shared Asset Library

`frontend/components/GalleryAssetLibrary.tsx` is the controlled shared Asset Library used by GenSpace, Director, and Video Editor.

The shared component owns common presentation and interaction primitives such as:

- toolbar, filters, favourites, bins, grid/list controls;
- card/list rendering;
- media-type badges;
- multi-take navigation;
- audio waveform rows;
- hover preview behaviour;
- common context-action presentation.

Each workspace supplies data, persistence, selection, and workspace-specific callbacks.

Do not fork another near-identical asset grid. Extend the shared contract only when the behaviour is truly common; keep workflow-specific actions at the caller boundary.

Asset and bin state is shared project data. Workspace selection, playheads, playback, and undo history are not.

### 6.6 Director and Video Editor

Director authors generation intent using integer frames and Director-specific recipes.

Video Editor arranges finished media using NLE clips and continuous-time editing rules.

They may share `frontend/views/editor/timeline/TimelinePrimitives.tsx`, but must not share domain state or store Director segments as `TimelineClip` objects.

Director V1 behaviour is defined in `docs/DIRECTOR_MODE_V1.md`. Guide Audio and Control Media authoring remain locked unless a current task explicitly implements the approved later phase.

### 6.7 Frontend testing

Frontend tests exist and are required.

- Vitest uses jsdom.
- Focused tests live beside GenSpace components/hooks/logic and under `frontend/hooks/generation/`.
- Prefer testing pure transitions, request compilation, persistence boundaries, and meaningful user interactions.
- Add browser API shims only where jsdom genuinely lacks the API; do not hide real application defects behind broad mocks.
- Keep test fixtures aligned with strict production types.

### 6.8 Styling

- Tailwind uses semantic colour tokens backed by CSS variables in `frontend/index.css` and configuration in `tailwind.config.js` on the current pre-modernisation branch.
- Utilities commonly use `class-variance-authority`, `clsx`, and `tailwind-merge`.
- Preserve explicit focus, disabled, selected, hover, progress, and error states.
- Container queries are used for size-dependent Asset Library card controls.
- Dependency/style migrations require visual parity checks; compilation alone is insufficient.

## 7. Electron architecture

### 7.1 Security boundary

- `contextIsolation` must remain enabled.
- Renderer `nodeIntegration` must remain disabled.
- The preload is a CommonJS bundle.
- Native capabilities are exposed narrowly through `window.electronAPI` in `electron/preload.ts`.
- Do not expose raw `ipcRenderer`, arbitrary filesystem access, shell execution, or an unbounded invoke wrapper.

### 7.2 IPC and native files

- Register IPC in the existing domain handler files under `electron/ipc/`.
- Validate or explicitly approve paths before reading, copying, deleting, revealing, or serving files.
- Keep project asset import/delete policies in the existing `electron/lib/` helpers rather than duplicating path logic in the renderer.
- Ensure event subscriptions return or provide matching cleanup; avoid `removeAllListeners` when listener-specific cleanup is available and safer.
- Preserve project-scoped duplicate handling and deletion boundaries.

### 7.3 Current Electron upgrade hazard

The current pre-modernisation renderer still reads Electron's removed non-standard `File.path` in `frontend/lib/media-import.ts`.

Any upgrade beyond Electron 31 must first expose `webUtils.getPathForFile(file)` through the context-isolated preload and migrate every file/drop import path. Do not cast around the removal or fall back to temporary blob URLs for project imports.

### 7.4 Packaging

`electron-builder.yml` controls packaged files, backend/WanGP resources, bootstraps, NSIS, macOS output, and publishing.

A renderer build does not prove packaging. Changes affecting preload paths, resource locations, native modules, bootstraps, updater behaviour, or filesystem layout require unpacked/installed validation.

The current Windows installer is not Authenticode-signed; do not describe it as signed.

## 8. Backend architecture

Request flow:

```text
_routes/* -> AppHandler -> handlers/* -> services/* + state/*
```

### 8.1 Routes

Routes under `backend/_routes/` are thin HTTP adapters:

- parse/validate typed requests;
- retrieve the composed `AppHandler`;
- call the matching domain handler;
- return the typed response.

Do not put business logic, heavy work, or direct WanGP orchestration in route modules.

### 8.2 Composition root

`backend/app_handler.py` owns application composition:

- shared state and `RLock`;
- settings;
- shared generation state;
- image/video/music/Director handlers;
- prompt enhancement;
- model profiles;
- health;
- Retake compatibility;
- the WanGP bridge.

Add new domain ownership deliberately. Do not create a second application state container.

### 8.3 State and concurrency

Use typed/discriminated state models.

Expected heavy-work pattern:

```text
lock
  read/validate/update state
unlock

perform GPU/network/disk work

lock
  publish complete/error/cancelled state
unlock
```

Never hold the shared `RLock` during model loading, generation, downloads, ffmpeg, or other long I/O/compute work.

### 8.4 Handlers and services

- Handlers own domain decisions, validation, state transitions, and orchestration.
- Services isolate heavy or external side effects.
- Use Protocol-style boundaries and real/fake implementations when a new heavy dependency needs testing.
- Keep cross-domain shared behaviour in an existing shared handler/service rather than duplicating it.

### 8.5 Exceptions and logging

- Raise `HTTPError` with useful details and exception chaining where appropriate.
- `app_factory.py` owns application-boundary traceback/logging policy.
- Do not `logger.exception()` and then rethrow the same error for the boundary to log again.
- User-facing messages should be actionable; detailed tracebacks belong in logs.

### 8.6 Backend testing

- Tests are integration-first through the real FastAPI app and composed `AppHandler`.
- Heavy services are replaced with fakes under `backend/tests/fakes/`.
- Do not use `unittest.mock`; `test_no_mock_usage.py` enforces this rule.
- `backend/tests/conftest.py` provides fresh state per test.
- Strict Pyright is enforced both directly and through the test suite.

When adding a backend feature:

1. Add/extend typed API models in `backend/api_types.py`.
2. Add a thin route in `backend/_routes/` if a new endpoint is required.
3. Add/extend the correct domain handler.
4. Add a service Protocol/real/fake boundary for new heavy side effects.
5. Add focused integration tests using fakes.
6. Verify cancellation, progress, errors, and state cleanup when applicable.

## 9. Curated model and generation contracts

### 9.1 Product source of truth

`backend/model_profiles/profiles.py` owns product-visible profiles.

The renderer must use `GET /api/model-profiles`. It must not scrape WanGP definitions or infer raw settings into the UI.

Current visible profile IDs:

- Image: `z_image_turbo`, `krea2_turbo`, `flux2_klein_4b`, `hidream_o1_dev`.
- Video: `ltx2_22b_distilled`.
- Music: `ace_step_15_turbo`, `ace_step_15_xl_turbo`.

### 9.2 Adding a curated model

Adding a model normally requires coordinated changes to:

- backend profile and capability policy;
- exact WanGP mapping/defaults;
- availability/readiness behaviour;
- model pack if product-managed download is desired;
- frontend types/controls only where the generic profile contract is insufficient;
- generation metadata and Copy Settings compatibility;
- focused tests;
- real-runtime validation;
- licence/attribution information.

A WanGP model definition or downloaded checkpoint is not automatically a product profile.

### 9.3 Generation invariants

- Backend validates profile IDs and curated choices before WanGP execution.
- All normal generation routes use the shared generation state/progress/cancel contract.
- Generated outputs must be copied/moved into the correct project and persisted once.
- Model-download progress must preserve structured details even when the main UI shows a concise summary.
- Legacy request fields may remain for saved-data compatibility, but new UI should use the canonical current contracts.

## 10. Python, WanGP, and GPU runtime rules

Current canonical files:

- `backend/pyproject.toml`;
- `backend/uv.lock`;
- `scripts/wangp-stacks.json`;
- `scripts/install-wangp-stack.ps1`;
- `scripts/wangp-source.json`;
- `scripts/ensure-wan2gp.ps1` / `.sh`;
- `scripts/update-wangp.ps1`;
- `backend/WANGP_BACKEND.md`.

Current Windows runtime is built around Python 3.11.9, Torch 2.10, CUDA 13.0, and curated hardware-specific acceleration wheels.

Rules:

- Treat Python/Torch/CUDA/kernels/WanGP as one tested stack.
- Do not bulk-upgrade runtime packages.
- Do not let Renovate/Dependabot update the runtime compatibility set independently.
- Use `uv sync --inexact` where repository scripts specify it, so declared backend packages can sync without pruning WanGP/performance wheels sharing the environment.
- Use the transactional WanGP update workflow rather than manually replacing `Wan2GP/`.
- Review sensitive model/default/dependency/bridge changes before accepting a new pin.
- Keep the exact bundled revision reproducible.

## 11. Persistence and file ownership

- Default project asset root is `Documents/AiVS` unless the user selects another location.
- Imports copied into a GenSpace project go under `{projectId}/uploads/`.
- completed generated media goes under `{projectId}/generated/`.
- Runtime executables, model caches, updater state, and app state do not belong inside project folders.
- Video Editor may reference large editing imports in place where the current workflow deliberately does so.
- Store project references using stable project/Asset IDs where the domain contract requires it; resolve live paths at the native/request boundary.
- Deletion must stay scoped to the owning project and approved roots.
- Preserve generation settings needed by Copy Settings and project reopen compatibility.

## 12. Coding conventions

### TypeScript

- Strict mode must remain enabled.
- Do not suppress errors broadly with `any`, unchecked casts, or `@ts-ignore`.
- Prefer explicit domain types and discriminated unions.
- Use `import type` for type-only imports.
- Keep renderer, preload, and Electron main contracts aligned.
- The preload output must remain CommonJS until the Electron loading contract is deliberately migrated and packaged-tested.

### Python

- Python 3.11 compatibility is required on the current stack.
- Pyright strict mode must remain clean.
- Prefer typed dataclasses/Pydantic models/Protocols over untyped dictionaries at owned boundaries.
- External WanGP data may require defensive normalisation, but narrow it as early as possible.
- Use `*Payload` for DTO/TypedDict-like structures, `*Like` for structural adapters, and `Fake*` for test implementations where those conventions fit.

### General

- Reuse existing logging helpers and error boundaries.
- Keep functions/components focused around a clear owner.
- Avoid speculative abstraction and generic frameworks before there are multiple proven consumers.
- Preserve accessibility labels, keyboard behaviour, focus states, and disabled explanations.
- Comments should explain non-obvious intent or constraints, not restate the code.

## 13. Documentation and project memory policy

- `AGENTS_PRD.md` describes current product intent and guardrails.
- `AGENTS.md` describes current engineering rules.
- `.projectmem/PROJECT_MAP.md` describes current ownership/navigation.
- `.projectmem/summary.md` is a concise current-state brief.
- `.projectmem/issues/` retains granular resolved issues, failed attempts, and tooling history.
- Focused current behaviour belongs in focused docs such as GenSpace, Director, Reframe, backend, and WanGP contracts.
- Completed implementation plans remain historical rationale and parity evidence.

Update the current-state documents when a change alters:

- visible product capability;
- major code ownership;
- runtime/source pins;
- user-facing limitations;
- validation commands;
- an architectural invariant.

Do not append every bug fix or command transcript to the summary or project map.

## 14. Dependency upgrade rules

- Major frontend/desktop upgrades require a dedicated branch and phased plan.
- Upgrade compatibility clusters together where required, but isolate independent majors into reviewable phases.
- Keep product behaviour stable during dependency work; do not hide a redesign inside a migration.
- Capture baseline tests/builds and visual references before changing versions.
- Validate development, production bundle, unpacked app, installer, project reopen, drag/drop, playback, backend startup, model download, generation, and updater-sensitive paths as applicable.
- Protect `backend/pyproject.toml`, `backend/uv.lock`, `scripts/wangp-stacks.json`, `scripts/wangp-source.json`, stack installers, and `Wan2GP/` from generic dependency automation.

## 15. Definition of done

Before declaring work complete, verify every applicable item:

- The requested behaviour is implemented without unrelated scope expansion.
- Product guardrails in `AGENTS_PRD.md` are respected.
- Current code ownership is preserved or deliberately improved without creating duplicate sources of truth.
- TypeScript/Pyright are clean for affected layers.
- Focused tests cover the changed contract.
- Required full test suites pass.
- Production bundles build.
- Native Electron behaviour is tested where browser/jsdom tests are insufficient.
- Packaging/installer checks run when resource, preload, native-module, updater, or build-script behaviour changed.
- Project persistence, Copy Settings, progress, cancellation, and errors remain correct where relevant.
- No prompts/media are sent to a cloud generation provider.
- Runtime/source pins remain reproducible.
- Documentation and project memory reflect meaningful capability or ownership changes.
- The final diff contains no generated artifacts, accidental formatting churn, stale imports, or unrelated edits.

## 16. Key file locations

### Product and current-state guidance

- `AGENTS_PRD.md`
- `AGENTS.md`
- `.projectmem/PROJECT_MAP.md`
- `.projectmem/summary.md`

### Frontend

- Project tabs/workspace mounting: `frontend/views/Project.tsx`
- GenSpace entry: `frontend/views/GenSpace.tsx`
- GenSpace implementation: `frontend/views/genspace/`
- GenSpace architecture: `docs/GENSPACE_ARCHITECTURE.md`
- Generation facade: `frontend/hooks/use-generation.ts`
- Generation job internals: `frontend/hooks/generation/`
- Shared Asset Library: `frontend/components/GalleryAssetLibrary.tsx`
- Director: `frontend/views/director/`
- Director types: `frontend/types/director.ts`
- Video Editor: `frontend/views/VideoEditor.tsx` and `frontend/views/editor/`
- Project data: `frontend/types/project.ts`
- Music types: `frontend/types/music.ts`

### Electron

- Lifecycle: `electron/main.ts`
- Window: `electron/window.ts`
- Preload/API: `electron/preload.ts`
- IPC: `electron/ipc/`
- App paths/state: `electron/app-state.ts`
- Python/model setup: `electron/python-setup.ts`
- Backend supervision: `electron/python-backend.ts`
- Builder config: `electron-builder.yml`

### Backend and runtime

- Composition root: `backend/app_handler.py`
- App factory: `backend/app_factory.py`
- API types: `backend/api_types.py`
- Routes: `backend/_routes/`
- Handlers: `backend/handlers/`
- Services: `backend/services/`
- Model profiles: `backend/model_profiles/profiles.py`
- WanGP bridge: `backend/services/wangp_bridge.py`
- Model packs: `backend/wangp_model_packs.py`
- Backend architecture: `backend/architecture.md`
- WanGP contract: `backend/WANGP_BACKEND.md`
- WanGP source pin: `scripts/wangp-source.json`
- GPU stack pin: `scripts/wangp-stacks.json`
