# projectmem — AI Video Studio

_Last reviewed: 2026-07-26 against the `dev` branch._

> This is a concise current-state brief for coding agents. Historical task attempts, sandbox failures, and resolved implementation bugs live in `.projectmem/issues/` and Git history; they are intentionally not repeated here.

## Project purpose

AI Video Studio (AiVS) is a local-first, community-focused desktop app for AI image, video, and music generation. It is built on `deepbeepmeep/LTX-Desktop-WanGP`, uses a bundled WanGP / Wan2GP runtime, and does not expose cloud generation providers or require API keys.

Product principles:

- Keep generation local and WanGP-only.
- Present a curated creative product rather than raw WanGP configuration.
- Preserve proven behaviour, user data, and architectural contracts; refactor or replace implementation deliberately when the current structure becomes a documented constraint.
- Keep model/runtime compatibility reproducible and deliberately pinned.
- Prefer simple user-facing workflows with advanced controls only where they add clear value.

Current integration baseline: `dev`.

## Current product state

### Quick Gen / GenSpace

GenSpace is implemented as a persistent left generation sidebar plus the shared Asset Library. Its large original component has been split into one always-mounted controller, mode-owned panels, focused hooks, pure request/asset logic, and isolated gallery/overlay views.

Implemented modes:

- **Image** — Z-Image Turbo, Krea 2 Turbo, Flux 2 Klein 4B, and HiDream O1 through backend-owned curated profiles.
- **Video** — LTX 2.3 Fast with text-to-video, start/end images, continuation, supported control video/audio roles, prompt enhancement, and Reframe.
- **Music** — ACE-Step 1.5 Fast and XL with instrumental/Auto Lyrics/Custom Lyrics, Compose Lyrics, optional Think, duration/BPM/key/time/language/vocal controls, Cover Song, Transfer Timbre, and multiple variations.

Video process modes:

- Generate — available.
- Reframe — available; trim plus aspect/zoom/pan outpainting.
- Retake — visible but intentionally disabled until the WanGP path is reliable.

Multi-segment prompt timing is owned by Director, not GenSpace. Legacy backend `shotPrompts` compatibility remains for old data/internal callers.

### Shared generation lifecycle

`frontend/hooks/use-generation.ts` remains the public compatibility facade. `frontend/hooks/generation/useGenerationJob.ts` owns the single active state object, abort controller, 500 ms polling loop, cancellation, terminal guards, and cleanup.

GenSpace captures immutable submission snapshots containing project, prompt, settings, media roles/paths, and trim information. Completion persistence uses the snapshot rather than live UI state so project/mode changes during generation cannot misfile results.

### Shared Asset Library

`frontend/components/GalleryAssetLibrary.tsx` is the controlled shared implementation used by GenSpace, Director, and Video Editor.

Current behaviour includes:

- project-local uploaded and generated assets;
- bins with bin-owned colours;
- type/source filters and favourites;
- grid and list views;
- shared context actions;
- duplicate filename handling;
- multi-take image/video navigation;
- independently previewable waveform rows for multi-variation music;
- thumbnail-first video cards with live video only on hover;
- inactive workspace media/compositor work suppressed while state remains mounted.

GenSpace imports are copied to `{projectAssetsRoot}/{projectId}/uploads/`; completed generations are moved into `generated/`.

### Director V1

Director is a standalone frame-based generation workspace between Quick Gen and Video Editor. It shares visual primitives and the Asset Library, but owns separate state and is not stored as NLE clips.

Implemented V1 behaviour:

- multiple Director timelines per project;
- Global Prompt plus movable/resizable local Prompt segments;
- authored gaps and prompt relay compilation;
- one Start/Centre/End image keyframe per Prompt segment;
- optional Continue Video prefix anchored at frame zero;
- fixed 24 fps integer-frame authoring;
- output snapped upward to WanGP `8n+1` frames;
- maximum 20-second sequences;
- independent playhead, preview, playback, focus, zoom, scroll, and undo/redo;
- Generated track and regeneration takes;
- project Asset creation after successful generation.

Guide Audio and Control Media tracks remain visible but locked for later work.

### Video Editor

The inherited NLE-style Video Editor remains a separate project tab. Director recipe objects and editor `TimelineClip` objects must remain separate because they use different time models and editing rules.

### Setup, runtime, and Model Manager

The Windows installer/dev setup prepares bundled Python and the curated WanGP GPU stack. Optional model packs can be downloaded during first-run setup, from Settings > Model Manager, or automatically when a generation needs missing files.

Model-pack progress ownership remains deliberately split:

- generation-triggered downloads flow through backend generation polling;
- setup/Model Manager downloads flow through Electron IPC;
- both normalise to one renderer transfer shape while retaining detailed filenames and counters.

Settings uses persistent left navigation for General, Model Manager, Advanced, and About. Project, checkpoint, and LoRA storage locations can be configured without moving executable/cache/update state into project folders.

## Current architecture

```text
React renderer
  ├─ authenticated localhost HTTP ──> FastAPI backend
  │                                  └─ in-process WanGP bridge/session
  │                                     └─ bundled Wan2GP checkout
  └─ context-isolated preload ──────> Electron main
                                     ├─ project/file IPC
                                     ├─ Python/runtime setup and supervision
                                     ├─ model-pack child process
                                     ├─ ffmpeg export/frame extraction
                                     └─ updater/lifecycle
```

Renderer/native boundary:

- All native access goes through typed `window.electronAPI` in `electron/preload.ts`.
- `contextIsolation` is enabled and renderer `nodeIntegration` is disabled.
- Native paths must be approved or validated before filesystem operations.

Backend request flow:

```text
_routes/* -> AppHandler -> handlers/* -> services/* + state/*
```

- Routes are thin.
- `AppHandler` is the composition root.
- Shared generation state and cancellation are owned by `GenerationHandler`.
- Heavy GPU/IO work must not hold the shared `RLock`.
- Tests replace heavy services with fakes; `unittest.mock` is not the project pattern.
- Exception traceback/logging policy is owned at the app boundary.

## Current stack and pins

Pre-modernisation frontend/desktop stack:

- React 18.3.1
- TypeScript 5.9.3
- Vite 5.4.21
- Tailwind CSS 3.4.19
- Vitest 2.1.9
- Electron 31.7.7
- pnpm 10.30.3
- electron-builder 26.x

Backend/runtime:

- Python 3.11.9
- Torch 2.10.0
- torchvision 0.25.0
- torchaudio 2.10.0
- CUDA 13.0 package index
- FastAPI/Pydantic/uvicorn managed with `uv`
- hardware-specific Triton, SageAttention, Sparge, Flash Attention, Nunchaku, GGUF, and LightX2V wheels installed through the curated stack script

Bundled WanGP source:

- Repository: `GOvEy1nw/Wan2GP`
- Branch: `AiVS`
- Revision: `4f441a12f3a33f4466ed422428bf667d9651bc55`
- WanGP version: `12.34`

Canonical runtime files:

- `scripts/wangp-source.json`
- `scripts/wangp-stacks.json`
- `scripts/ensure-wan2gp.ps1` / `.sh`
- `scripts/update-wangp.ps1`
- `scripts/install-wangp-stack.ps1`
- `backend/pyproject.toml`
- `backend/uv.lock`

The Python/Torch/CUDA/WanGP stack is one curated compatibility unit. Generic dependency automation must not upgrade it package-by-package.

## Curated model source of truth

`backend/model_profiles/profiles.py` owns product-visible profiles. WanGP metadata/discovery is used for validation and availability; it does not automatically become UI.

Visible profiles:

- Image: `z_image_turbo`, `krea2_turbo`, `flux2_klein_4b`, `hidream_o1_dev`
- Video: `ltx2_22b_distilled` (LTX 2.3 Fast)
- Music: `ace_step_15_turbo`, `ace_step_15_xl_turbo`

The renderer reads `GET /api/model-profiles`. Profile IDs and curated settings are revalidated by the backend before WanGP execution.

Model packs currently cover utility assets, the visible image/video/music models, and the prompt enhancer. Adding a pack or raw WanGP metadata does not by itself expose a product profile.

## Important current decisions

- AiVS stores no cloud generation credentials and has no cloud generation fallback.
- GenSpace has one always-mounted controller and one generation job instance; mode panels are statically imported.
- Image/video/music panels do not call endpoints or persist project assets directly.
- Director is the canonical prompt-timeline workflow; GenSpace stays focused on quick single-generation flows.
- Director and Video Editor share domain-neutral visuals only; their data models remain separate.
- All project workspaces stay mounted for state preservation, but only the active workspace may own playback, shortcuts, visible compositor layers, or media warming.
- Gallery/asset presentation is shared; each workspace supplies only data and surface-specific callbacks.
- Bin colour is bin-owned and appears through media badges/folder icons rather than card-edge accents.
- Music has one canonical full settings mode; legacy `experienceMode` remains only for saved-data compatibility.
- Music supports independent Cover and Timbre inputs; the backend still accepts the legacy single-input shape.
- Empty Custom Lyrics can fall back to generation-time composition, except Cover Song requires original supplied lyrics.
- Reframe behaviour and padding limits are established; its files now live under `frontend/views/genspace/video/`.
- WanGP updates are transactional and must preserve the exact source pin or roll back.
- Current implementation is not frozen: extension is preferred only where the existing owner still fits. A substantial refactor or replacement requires evidence, preserved-contract/parity tests, data migration where relevant, staged rollback, and a clear deletion path for the superseded system.

## Active constraints and known risks

- **Primary target:** Windows 10/11 with NVIDIA RTX 20/30/40/50 series hardware.
- **Driver requirement:** current Windows runtime expects NVIDIA driver 580+.
- **Frontend/desktop age:** Electron 31, Vite 5, Tailwind 3, and React 18 are scheduled for phased modernisation on a separate branch.
- **Electron breaking point:** `frontend/lib/media-import.ts` still uses Electron's removed non-standard `File.path`; the Electron upgrade must expose `webUtils.getPathForFile` through preload before moving beyond Electron 31.
- **Retake:** visible but unavailable; do not imply the user-facing mode works.
- **TTS:** not implemented.
- **LoRA UI:** runtime paths exist, but user-facing selection/strength controls are not implemented.
- **Director deferred tracks:** Guide Audio and Control Media authoring remain locked.
- **Installer signing:** the Windows installer is currently not Authenticode-signed.
- **Manual QA:** native drag/drop, audio/video playback/seeking, Reframe geometry, model downloads, and real generation outputs require Electron/runtime checks beyond unit tests.
- **Agent capture:** some managed Windows sessions deny `GetCursorPos`, preventing automated screenshots despite a healthy app; record this as tooling limitation rather than product failure.

## Active roadmap

Current near-term directions, not old implementation phase numbers:

1. Execute the phased frontend/Electron dependency modernisation on a dedicated branch.
2. Run real-runtime regression testing across image, video, Reframe, Director, music, and all model-download entry points.
3. Implement/expose Retake once WanGP support is reliable.
4. Add curated user-facing LoRA selection and strength controls.
5. Add TTS generation.
6. Add Director Guide Audio and Control Media authoring after Prompt Track V1 is stable.
7. Continue curated model expansion through backend profiles and tested model packs.
8. Continue evidence-based architecture, maintainability, performance, accessibility, and packaging work, including bounded subsystem replacements where extension would compound debt.

## Last recorded validation baseline

After the current GenSpace split and Music workflow work, the recorded full gates were:

- TypeScript: 0 errors.
- Pyright: 0 errors.
- Frontend Vitest: 56 passed.
- Backend pytest: 278 passed, 1 skipped.
- Production renderer/Electron main/preload build: passed.
- `git diff --check`: clean.

These figures are evidence of that checkpoint only. Every new task must rerun the checks relevant to its change.

## Common commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start Vite, Electron, and backend |
| `pnpm dev:debug` | Electron inspector + Python debugpy |
| `pnpm typecheck` | TypeScript and Pyright |
| `pnpm typecheck:ts` | TypeScript only |
| `pnpm typecheck:py` | Pyright only |
| `pnpm test:frontend` | Full frontend test suite |
| `pnpm backend:test` | Full backend pytest suite |
| `pnpm build:frontend` | Renderer, Electron main, and preload build |
| `pnpm build:fast:win` | Unpacked Windows build without rebuilding Python |
| `pnpm build:win` | Full Windows installer |
| `pnpm wangp:check` | Compare bundled pin with fork head |
| `pnpm wangp:update` | Transactional focused WanGP update |
| `pnpm wangp:update:full` | Transactional WanGP update with full validation |

## First files to read

1. `AGENTS_PRD.md`
2. `AGENTS.md`
3. `.projectmem/PROJECT_MAP.md`
4. `.projectmem/summary.md`
5. `docs/GENSPACE_ARCHITECTURE.md`
6. `docs/DIRECTOR_MODE_V1.md`
7. `docs/REFRAME_MODE.md`
8. `backend/architecture.md`
9. `backend/WANGP_BACKEND.md`
10. `scripts/wangp-source.json`
11. `scripts/wangp-stacks.json`

Key implementation entry points:

- `frontend/views/genspace/`
- `frontend/hooks/generation/`
- `frontend/components/GalleryAssetLibrary.tsx`
- `frontend/views/director/`
- `frontend/views/editor/`
- `frontend/contexts/ProjectContext.tsx`
- `frontend/types/project.ts`
- `frontend/types/music.ts`
- `frontend/types/director.ts`
- `electron/preload.ts`
- `electron/python-setup.ts`
- `backend/app_handler.py`
- `backend/api_types.py`
- `backend/model_profiles/profiles.py`
- `backend/services/wangp_bridge.py`
- `backend/wangp_model_packs.py`

## Historical memory policy

- `.projectmem/summary.md` and `PROJECT_MAP.md` describe the current system only.
- Granular resolved issues, failed tool attempts, and one-off sandbox workarounds remain in `.projectmem/issues/`.
- Completed implementation plans remain under `docs/` as historical rationale and parity evidence.
- Do not re-execute old phase checklists merely because they remain in the repository.
- When a completed plan conflicts with current code or a focused current-state document, current code/tests and the focused document win.

## Open questions

- No unresolved architecture question is currently recorded here. Feature-specific unknowns should be added only when they materially affect the active roadmap or implementation contract.
