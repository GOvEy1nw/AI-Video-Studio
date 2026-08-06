# AGENTS.md — AI Video Studio

This file is the operational guide for AI coding agents working in this repository.

Read [`AGENTS_PRD.md`](AGENTS_PRD.md) first for product direction and non-negotiable guardrails. Then use this file for architecture, ownership, validation, and working conventions.

> **Origin:** AiVS is built on [`deepbeepmeep/LTX-Desktop-WanGP`](https://github.com/deepbeepmeep/LTX-Desktop-WanGP), itself derived from Lightricks' LTX Desktop. Current AiVS code, tests, and focused current-state documents take precedence over old inherited assumptions and completed phase plans. Preserve proven contracts; do not freeze accidental implementation structure.

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

Current desktop toolchain: Node 24, pnpm 10.30.3, Electron 43, React 19, Vite 8, Vitest 4, Tailwind CSS 4, and TypeScript 6.

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

## 4. Architectural evolution, refactoring, and replacement

### 4.1 Preserve contracts, not accidental structure

The default rule is not “never rewrite.” It is:

```text
Preserve proven behaviour, data, security, and product contracts.
Choose the smallest implementation change that creates a clean long-term owner.
```

AiVS began as a fork, so extending working inherited systems was initially the safest path. As the application grows, blindly extending every old structure can create wrappers around wrappers, scattered conditionals, duplicated state, and permanent compatibility layers. A focused refactor or subsystem replacement may therefore be safer than continued extension.

### 4.2 Terms

Use these terms precisely:

- **Extension** — add behaviour through an existing owner and contract without materially changing its structure.
- **Refactor** — change internal structure while intentionally preserving external behaviour and data contracts.
- **Targeted replacement** — replace one bounded subsystem behind explicit interfaces, with migration and parity validation.
- **Broad rewrite** — replace several connected domains or foundational contracts at once. This is exceptional and requires an approved architecture plan.

Do not label ordinary cleanup a rewrite, and do not label a blank-canvas replacement a refactor.

### 4.3 When extension is the right choice

Prefer extension when:

- the current component, hook, handler, service, or data model clearly owns the requirement;
- the change remains local and testable;
- existing interfaces express the new behaviour without misleading names or impossible states;
- reuse removes duplication rather than pushing domain-specific behaviour into a universal abstraction;
- performance, security, persistence, and cancellation contracts remain straightforward;
- the expected near-term roadmap fits the same ownership model.

### 4.4 Evidence that refactoring or replacement is justified

A larger change is justified when one or more of these are demonstrated:

- routine features require edits across several unrelated modules;
- one file or object owns multiple domains and cannot be tested independently;
- duplicated implementations exist because the supposed shared abstraction does not model its consumers cleanly;
- each new feature adds branches, flags, adapters, or compatibility shims that do not converge;
- the existing data flow makes cancellation, persistence, project isolation, or error recovery fragile;
- performance or memory problems cannot be fixed locally because ownership is wrong;
- security or path-validation boundaries are blurred;
- packaging, platform support, or testability is blocked by the current structure;
- an approved near-term roadmap would build substantial new work on a known unsuitable foundation;
- the proposed replacement has a clear owner and materially lowers ongoing complexity.

“Future-proofing” is not sufficient on its own. State the concrete future pressure, why the present architecture resists it, and how the proposed design reduces—not merely moves—complexity.

### 4.5 Required plan for a substantial replacement

Before destructive work begins, the implementation plan must identify:

1. the current problem and evidence;
2. the exact subsystem boundary;
3. user-visible behaviours that must remain unchanged;
4. persisted project/settings/asset/API contracts that require compatibility or migration;
5. characterisation tests or another reliable parity baseline;
6. the new owner and its interfaces;
7. staged cut-over and rollback points where practical;
8. native Electron, packaged-build, and real-runtime checks automation cannot cover;
9. when and how the old path will be deleted;
10. explicit non-goals so the replacement does not expand into a product redesign.

A broad rewrite must use its own branch and phased documents. Do not combine it with dependency modernisation, a visual redesign, or an unrelated feature.

### 4.6 Preferred migration shape

Prefer a controlled replacement over a flag-day rewrite:

```text
characterise current behaviour
    -> define stable boundary
    -> introduce replacement behind boundary
    -> migrate callers/data deliberately
    -> validate parity and improvements
    -> remove old path and compatibility scaffolding
```

Temporary adapters are acceptable during migration. They are not a permanent architecture. Record their deletion condition and remove them once all callers/data have moved.

### 4.7 Contracts that cannot be broken incidentally

Internal implementation may evolve, but the following require explicit migration and approval:

- local-only, WanGP-only generation;
- context-isolated preload and narrow native API exposure;
- authenticated local backend communication;
- project-scoped asset and persistence safety;
- shared progress/cancellation semantics;
- curated backend-owned model profiles;
- Director and NLE domain separation;
- reproducible WanGP/Python/Torch/CUDA runtime pins;
- compatibility with existing projects and saved generation settings.

## 5. Common commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start Vite, Electron, and the Python backend |
| `pnpm dev:debug` | Start with Electron inspector and Python debugpy |
| `pnpm typecheck` | Run strict TypeScript and Pyright checks |
| `pnpm typecheck:ts` | TypeScript only |
| `pnpm typecheck:py` | Pyright only |
| `pnpm test:frontend` | Run the full Vitest suite |
| `pnpm test:frontend:watch` | Run frontend tests in watch mode |
| `pnpm validate:frontend` | Run TypeScript, frontend tests, and frontend production builds |
| `pnpm check:package-manager` | Verify Node/pnpm metadata and reject foreign root lockfiles |
| `pnpm test:dependency-boundaries` | Test generic dependency-update runtime boundaries |
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

## 6. Validation expectations

Validation must match the risk of the change.

### 6.1 Documentation-only changes

- Review the full rendered content/diff.
- Check paths, commands, names, versions, and status claims against current source.
- Run `git diff --check` when working locally.
- Application tests are not required when no executable/configuration file changed, but say that explicitly.

### 6.2 Frontend component, hook, or pure-logic changes

Minimum:

```text
pnpm typecheck:ts
relevant focused Vitest tests
```

Also run `pnpm build:frontend` when the change affects composition, imports, bundling, preload types, global CSS, or a broad product surface.

See `docs/TESTING_POLICY.md` for retention rules and the risk-based validation matrix. Run full suites at PR completion/CI when the changed contract warrants them, not after every small edit. CSS, copy, and layout-only changes need build plus manual visual smoke, not a new automated test.

For component interaction changes, run the focused critical test, TypeScript, and the production build. For CSS, copy, or layout-only TypeScript changes, run TypeScript, the production build, and a manual visual smoke; do not add an automated test unless behavior changed.

Native media behaviour—drag/drop, audio/video playback, seeking, file URLs, resize interactions—still requires Electron smoke testing when relevant.

### 6.3 Backend changes

Minimum:

```text
cd backend
uv run pyright
relevant focused pytest files
```

Run `pnpm backend:test` for changes to shared state, app composition, API types, route/handler contracts, WanGP bridge behaviour, model profiles, model packs, or common services.

### 6.4 Electron, preload, IPC, or file handling

Run:

```text
pnpm typecheck:ts
pnpm test:frontend
pnpm build:frontend
```

Then verify the affected path in the actual Electron app. For packaging-sensitive work, also run an unpacked build and, where required, the full installer.

### 6.5 Architecture refactor or targeted replacement

In addition to the affected-layer checks:

- establish and record a pre-change parity baseline;
- add characterisation tests around preserved behaviour before removing the old path;
- test existing project/settings migration or reopen behaviour;
- compare performance, memory, or complexity claims with actual evidence where those justify the change;
- validate all callers of the replaced boundary;
- confirm old code, flags, adapters, and duplicated state are removed at completion;
- run native Electron and real-runtime smoke tests for the complete user path.

A passing unit suite is not enough when the change moves ownership, persistence, preload/IPC boundaries, or packaged resources.

### 6.6 Styling or dependency changes

A successful build is not visual proof. Compare the relevant screens and interactions in Electron.

For major frontend/desktop dependency upgrades, follow the approved phased plan on a dedicated branch and validate development, unpacked, and installed builds independently.

### 6.7 WanGP source or GPU runtime changes

Use the dedicated source/stack workflow. Review the exact source and wheel changes, run focused compatibility checks, then full validation before promotion.

Do not substitute a generic `uv update`, `pip install -U`, or package bot PR for the curated runtime process.

## 7. Frontend architecture

### 7.1 General rules

- Path alias: `@/*` maps to `frontend/*`.
- Strict TypeScript is enabled with unused locals/parameters rejected.
- Use React context and focused hooks already present in the project. A different state architecture may be proposed only through the section 4 process with measured need and migration scope.
- Prefer direct imports while ownership is evolving; avoid broad barrels that obscure dependencies or create cycles.
- Keep side effects in hooks/services and keep pure transformations independently testable.
- Do not access Node or Electron APIs directly from renderer code.
- Backend requests use the established authenticated localhost helper/connection flow; do not hard-code a second backend URL or bypass the session token contract.

### 7.2 Project workspaces

`frontend/views/Project.tsx` owns the Quick Gen, Director, and Video Editor tabs.

All workspaces remain mounted to preserve authored state. Inactive workspaces must:

- stop playback;
- ignore transport shortcuts;
- avoid media warming/decoding;
- avoid visible compositor residue;
- avoid polling or side effects not required for state preservation.

Do not replace this with unmount/remount behaviour casually; persistence and playback ownership are deliberate. A replacement mounting/state strategy must prove equivalent restore behaviour and lower background work.

### 7.3 GenSpace ownership

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
- Do not add a schema-generated universal form or independent mode-specific job manager as incidental work.

These are the current proven boundaries. They may be refactored or replaced only through an explicit architecture plan that preserves generation, persistence, Copy Settings, and project-switch safety.

See `docs/GENSPACE_ARCHITECTURE.md` for the current detailed contract.

### 7.4 Generation lifecycle

`frontend/hooks/use-generation.ts` is the public compatibility facade used by GenSpace and Director.

`frontend/hooks/generation/useGenerationJob.ts` exclusively owns:

- the current generation state;
- one abort controller;
- the 500 ms progress poll;
- cancellation;
- terminal-state guards;
- unmount cleanup.

Request builders and progress formatters live in `frontend/hooks/generation/`.

Do not create a second polling loop or cancellation implementation for a new media mode. A deliberate replacement of the shared job architecture must migrate every consumer and prove equivalent cancellation, terminal-state, unmount, and backend-restart behaviour.

GenSpace submissions capture immutable, project-scoped snapshots. Completion persistence must use the submission snapshot, not live UI state, so switching projects/modes while a job runs cannot misfile the result or save later settings.

### 7.5 Shared Asset Library

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

Do not fork another near-identical asset grid merely to avoid improving the shared contract. Conversely, do not keep expanding a universal component if evidence shows it has become an unnatural union of different domains. A split or replacement is valid when the common contract is explicitly identified, workspace-specific ownership becomes clearer, and visual/behavioural parity is tested.

Asset and bin state is shared project data. Workspace selection, playheads, playback, and undo history are not.

### 7.6 Director and Video Editor

Director authors generation intent using integer frames and Director-specific recipes.

Video Editor arranges finished media using NLE clips and continuous-time editing rules.

They may share `frontend/views/editor/timeline/TimelinePrimitives.tsx`, but must not share domain state or store Director segments as `TimelineClip` objects.

Director V1 behaviour is defined in `docs/DIRECTOR_MODE_V1.md`. Guide Audio and Control Media authoring remain locked unless a current task explicitly implements the approved later phase.

The Video Editor may be refactored or progressively replaced for maintainability when justified, but an editor rewrite must be a focused project with behavioural parity, project migration, preview/export validation, and no forced merging of Director and NLE domains.

### 7.7 Frontend testing

Frontend tests exist and are required.

- Vitest uses jsdom.
- Focused tests live beside GenSpace components/hooks/logic and under `frontend/hooks/generation/`.
- Prefer testing pure transitions, request compilation, persistence boundaries, and meaningful user interactions.
- Add browser API shims only where jsdom genuinely lacks the API; do not hide real application defects behind broad mocks.
- Keep test fixtures aligned with strict production types.
- Characterisation tests are required before replacing a proven subsystem whose exact behaviour is not already captured.

### 7.8 Styling

- Tailwind CSS 4 uses CSS-first semantic theme tokens and explicit source detection in `frontend/index.css`.
- Utilities commonly use `class-variance-authority`, `clsx`, and `tailwind-merge`.
- Preserve explicit focus, disabled, selected, hover, progress, and error states.
- Container queries are used for size-dependent Asset Library card controls.
- Dependency/style migrations require visual parity checks; compilation alone is insufficient.

## 8. Electron architecture

### 8.1 Security boundary

- `contextIsolation` must remain enabled.
- Renderer `nodeIntegration` must remain disabled.
- The preload is a CommonJS bundle on the current branch.
- Native capabilities are exposed narrowly through `window.electronAPI` in `electron/preload.ts`.
- Do not expose raw `ipcRenderer`, arbitrary filesystem access, shell execution, or an unbounded invoke wrapper.

This boundary may be reorganised internally, but its security properties cannot be weakened as part of a refactor.

### 8.2 IPC and native files

- Register IPC in the existing domain handler files under `electron/ipc/`, or move it through an approved replacement that keeps domain ownership explicit.
- Validate or explicitly approve paths before reading, copying, deleting, revealing, or serving files.
- Keep project asset import/delete policies in native helpers rather than duplicating path logic in renderer components.
- Ensure event subscriptions return or provide matching cleanup; avoid `removeAllListeners` when listener-specific cleanup is available and safer.
- Preserve project-scoped duplicate handling and deletion boundaries.

### 8.3 Electron native-file compatibility

Electron 43 file/drop imports resolve native paths through the narrow preload `webUtils.getPathForFile(file)` bridge. Keep every renderer path on that bridge. Do not restore removed `File.path` casts or fall back to temporary blob URLs for project imports.

### 8.4 Packaging

`electron-builder.yml` controls packaged files, backend/WanGP resources, bootstraps, NSIS, macOS output, and publishing.

A renderer build does not prove packaging. Changes affecting preload paths, resource locations, native modules, bootstraps, updater behaviour, or filesystem layout require unpacked/installed validation.

The current Windows installer is not Authenticode-signed; do not describe it as signed.

## 9. Backend architecture

Request flow:

```text
_routes/* -> AppHandler -> handlers/* -> services/* + state/*
```

### 9.1 Routes

Routes under `backend/_routes/` are thin HTTP adapters:

- parse/validate typed requests;
- retrieve the composed `AppHandler`;
- call the matching domain handler;
- return the typed response.

Do not put business logic, heavy work, or direct WanGP orchestration in route modules.

### 9.2 Composition root

`backend/app_handler.py` owns current application composition:

- shared state and `RLock`;
- settings;
- shared generation state;
- image/video/music/Director handlers;
- prompt enhancement;
- model profiles;
- health;
- Retake compatibility;
- the WanGP bridge.

Add new domain ownership deliberately. Do not create a second application state container as a shortcut. A replacement composition architecture requires a complete migration of state, tests, dependency wiring, and runtime startup.

### 9.3 State and concurrency

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

### 9.4 Handlers and services

- Handlers own domain decisions, validation, state transitions, and orchestration.
- Services isolate heavy or external side effects.
- Use Protocol-style boundaries and real/fake implementations when a new heavy dependency needs testing.
- Keep cross-domain shared behaviour in a clear shared owner rather than duplicating it.
- If the current handler/service split no longer models the domain, propose a bounded replacement rather than layering proxies indefinitely.

### 9.5 Exceptions and logging

- Raise `HTTPError` with useful details and exception chaining where appropriate.
- `app_factory.py` owns application-boundary traceback/logging policy.
- Do not `logger.exception()` and then rethrow the same error for the boundary to log again.
- User-facing messages should be actionable; detailed tracebacks belong in logs.

### 9.6 Backend testing

- Tests are integration-first through the real FastAPI app and composed `AppHandler`.
- Heavy services are replaced with fakes under `backend/tests/fakes/`.
- Prefer real pure collaborators and composed handlers. Use fakes or narrow mocks only at heavyweight/process/network boundaries when needed for deterministic critical behavior; do not scan test source for policy compliance at pytest runtime.
- `backend/tests/conftest.py` provides fresh state per test.
- Run strict Pyright as its own gate, not from pytest.

When adding or replacing a backend feature:

1. Add/extend typed API models in `backend/api_types.py`.
2. Add a thin route in `backend/_routes/` if a new endpoint is required.
3. Add/extend the correct domain handler, or document the replacement owner.
4. Add a service Protocol/real/fake boundary for new heavy side effects.
5. Add focused integration tests using fakes.
6. Verify cancellation, progress, errors, state cleanup, and migration behaviour when applicable.

## 10. Curated model and generation contracts

### 10.1 Product source of truth

`backend/model_profiles/profiles.py` owns product-visible profiles.

The renderer must use `GET /api/model-profiles`. It must not scrape WanGP definitions or infer raw settings into the UI.

Current visible profile IDs:

- Image: `z_image_turbo`, `krea2_turbo`, `flux2_klein_4b`, `hidream_o1_dev`.
- Video: `ltx2_22b_distilled`.
- Music: `ace_step_15_turbo`, `ace_step_15_xl_turbo`.

### 10.2 Adding a curated model

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

### 10.3 Generation invariants

- Backend validates profile IDs and curated choices before WanGP execution.
- All normal generation routes use the shared generation state/progress/cancel contract.
- Generated outputs must be copied/moved into the correct project and persisted once.
- Model-download progress must preserve structured details even when the main UI shows a concise summary.
- Legacy request fields may remain for saved-data compatibility, but new UI should use the canonical current contracts.

## 11. Python, WanGP, and GPU runtime rules

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

A future redesign of runtime ownership is possible, but it must preserve offline/reproducible installation, supported hardware validation, model-pack behaviour, existing user locations, and rollback. It is not ordinary dependency cleanup.

## 12. Persistence and file ownership

- Default project asset root is `Documents/AiVS` unless the user selects another location.
- Imports copied into a GenSpace project go under `{projectId}/uploads/`.
- Completed generated media goes under `{projectId}/generated/`.
- Runtime executables, model caches, updater state, and app state do not belong inside project folders.
- Video Editor may reference large editing imports in place where the current workflow deliberately does so.
- Store project references using stable project/Asset IDs where the domain contract requires it; resolve live paths at the native/request boundary.
- Deletion must stay scoped to the owning project and approved roots.
- Preserve generation settings needed by Copy Settings and project reopen compatibility.

Any persistence rewrite requires explicit schema/version migration, existing-project fixtures, idempotent upgrade behaviour, and a tested rollback or recovery story. Never silently reinterpret stored data.

## 13. Coding conventions

### 13.1 TypeScript

- Strict mode must remain enabled.
- Do not suppress errors broadly with `any`, unchecked casts, or `@ts-ignore`.
- Prefer explicit domain types and discriminated unions.
- Use `import type` for type-only imports.
- Keep renderer, preload, and Electron main contracts aligned.
- The preload output must remain CommonJS until the Electron loading contract is deliberately migrated and packaged-tested.

### 13.2 Python

- Python 3.11 compatibility is required on the current stack.
- Pyright strict mode must remain clean.
- Prefer typed dataclasses/Pydantic models/Protocols over untyped dictionaries at owned boundaries.
- External WanGP data may require defensive normalisation, but narrow it as early as possible.
- Use `*Payload` for DTO/TypedDict-like structures, `*Like` for structural adapters, and `Fake*` for test implementations where those conventions fit.

### 13.3 General

- Reuse existing logging helpers and error boundaries where their contract still fits.
- Keep functions/components focused around a clear owner.
- Avoid speculative abstraction and generic frameworks before there are multiple proven consumers.
- Do not use “consistency” as a reason to force unlike domains into one abstraction.
- Do not use “future-proofing” as a reason for a rewrite without concrete pressure and a migration plan.
- Preserve accessibility labels, keyboard behaviour, focus states, and disabled explanations.
- Comments should explain non-obvious intent or constraints, not restate the code.

## 14. Documentation and project memory policy

- `AGENTS_PRD.md` describes current product intent and guardrails.
- `AGENTS.md` describes current engineering rules.
- `backlog/tasks/` is the source of truth for actionable work, acceptance, status, implementation plans, and completion evidence.
- `.projectmem/PROJECT_MAP.md` describes current ownership/navigation.
- `.projectmem/summary.md` is a concise current-state brief.
- `.projectmem/issues/` retains only unresolved product/code defects, data/security risks, durable platform constraints, non-obvious architectural gotchas, cross-task baseline limitations, or upstream incompatibilities.
- Focused current behaviour belongs in focused docs such as GenSpace, Director, Reframe, backend, and WanGP contracts.
- Completed implementation plans remain historical rationale and parity evidence.

Routine shell quoting, search, patch-anchor, guessed-path, command, one-off sandbox, and
expected red-test failures are not permanent project-memory issues. Record material
task-specific implementation evidence in the active Backlog task. Use ignored
`.projectmem/runtime/` or `.projectmem/local/` for optional transient notes; never store
secrets, user data, or large logs there.

Update the current-state documents when a change alters:

- visible product capability;
- major code ownership;
- runtime/source pins;
- user-facing limitations;
- validation commands;
- an architectural invariant;
- a subsystem migration or replacement boundary.

Do not duplicate full acceptance criteria, validation transcripts, or completed-task
narratives across Backlog, project memory, and architecture docs. Update summary/map only
when current product state, ownership, constraints, pins, or architectural contracts change.

## 15. Dependency upgrade rules

- Follow `docs/DEPENDENCY_POLICY.md`.
- Renovate is the sole npm/GitHub Actions proposal bot. Automerge remains disabled.
- Move Electron, Vite, React, Tailwind, tests, and TypeScript only in their documented compatibility groups.
- Keep Node on major 24, pnpm on 10.30.3, and TypeScript below 7 until dedicated migrations approve movement.
- Major frontend/desktop upgrades require a dedicated branch and phased plan.
- Upgrade compatibility clusters together where required, but isolate independent majors into reviewable phases.
- Keep product behaviour stable during dependency work; do not hide a redesign or rewrite inside a migration.
- Capture baseline tests/builds and visual references before changing versions.
- Validate development, production bundle, unpacked app, installer, project reopen, drag/drop, playback, backend startup, model download, generation, and updater-sensitive paths as applicable.
- Protect `backend/pyproject.toml`, `backend/uv.lock`, `scripts/wangp-stacks.json`, `scripts/wangp-source.json`, stack installers, and `Wan2GP/` from generic dependency automation.

When a dependency upgrade exposes architectural debt, record it and create a separate follow-up phase unless the architectural change is strictly required for compatibility and is explicitly scoped in the upgrade plan.

## 16. Definition of done

Before declaring work complete, verify every applicable item:

- The requested behaviour is implemented without unrelated scope expansion.
- Product guardrails in `AGENTS_PRD.md` are respected.
- The current owner was extended only if its contract still fits; otherwise the replacement boundary and rationale are documented.
- Proven user-visible behaviour and persisted data are preserved or explicitly migrated.
- Characterisation/parity tests cover a substantial replaced path before its removal.
- TypeScript/Pyright are clean for affected layers.
- Focused tests cover the changed contract.
- Required full test suites pass.
- Production bundles build.
- Native Electron behaviour is tested where browser/jsdom tests are insufficient.
- Packaging/installer checks run when resource, preload, native-module, updater, or build-script behaviour changed.
- Project persistence, Copy Settings, progress, cancellation, and errors remain correct where relevant.
- No prompts/media are sent to a cloud generation provider.
- Runtime/source pins remain reproducible.
- Superseded code, temporary adapters, flags, and duplicate sources of truth are removed when migration is complete.
- Documentation and project memory reflect meaningful capability, ownership, or architecture changes.
- The final diff contains no generated artifacts, accidental formatting churn, stale imports, or unrelated edits.

## 17. Key file locations

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

<!-- BACKLOG.MD MCP GUIDELINES START -->
<!-- backlog.md-instructions-version: 1.48.0 -->

<CRITICAL_INSTRUCTION>

## BACKLOG WORKFLOW INSTRUCTIONS

This project uses Backlog.md MCP for all task and project management activities.

**CRITICAL GUIDANCE**

- If your client supports MCP resources, read `backlog://workflow/overview` to understand when and how to use Backlog for this project.
- If your client only supports tools or the above request fails, call `backlog.get_backlog_instructions()` to load the tool-oriented overview. Use the `instruction` selector when you need `task-creation`, `task-execution`, or `task-finalization`.

- **First time working here?** Read the overview resource IMMEDIATELY to learn the workflow
- **Already familiar?** You should have the overview cached ("## Backlog.md Overview (MCP)")
- **When to read it**: BEFORE creating tasks, or when you're unsure whether to track work

These guides cover:
- Decision framework for when to create tasks
- Search-first workflow to avoid duplicates
- Links to detailed guides for task creation, execution, and finalization
- MCP tools reference

You MUST read the overview resource to understand the complete workflow. The information is NOT summarized here.

</CRITICAL_INSTRUCTION>

<!-- BACKLOG.MD MCP GUIDELINES END -->
