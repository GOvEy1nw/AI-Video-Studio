# AiVS Pre-Release Code Audit and Cleanup Plan

**Repository:** `GOvEy1nw/AI-Video-Studio`  
**Audit basis:** Current `main` branch reviewed on 10 July 2026  
**Audience:** AI coding agents and maintainers preparing the first public release  
**Status:** Reference plan only — no code changes have been applied by this document

---

## 1. Purpose

AiVS is a heavily modified fork of LTX-Desktop-WanGP. Its intended architecture is:

- Local-only AI generation.
- WanGP as the single generation runtime.
- No LTX cloud API, fal.ai, Gemini, or other third-party generation API paths.
- AiVS owns the desktop UI, project system, media handling, model profiles, settings, packaging, and release process.
- WanGP owns model execution and the model-specific inference stack.

This document identifies remaining inherited code, release risks, and likely bottlenecks that should be addressed before or shortly after the first public release.

The most important distinction throughout this work is:

> **Remove obsolete LTX cloud/direct-pipeline infrastructure, but do not remove LTX model support provided through WanGP.**

LTX video models are still valid local models inside WanGP. The cleanup target is the inherited LTX Desktop architecture and cloud integrations, not the models themselves.

---

## 2. Executive Summary

The current generation architecture is fundamentally sound. AiVS uses an in-process `WanGPSession`, keeps it alive between jobs, and sends model-specific manifests through the WanGP API. This is likely why generation already performs well on the development machine.

The largest risks are currently release engineering and architectural leftovers rather than raw inference speed.

### Must fix before the first public release

1. Stop downloading the Windows Python runtime from Lightricks' LTX Desktop releases and storage bucket.
2. Make the packaged runtime match the tested development WanGP/CUDA/kernel stack.
3. Pin WanGP to a tested commit instead of cloning the latest upstream state.
4. Fix or hide Retake, because the exposed endpoint currently always returns `503`.
5. Port or remove the remaining direct IC-LoRA pipeline route.
6. Verify that the bundled Python bootstrap installs the pinned WanGP stack deterministically on first run.

### Highest-value work immediately after those blockers

1. Remove unreachable LTX API, fal.ai, direct LTX, direct Z-Image, A2V, Retake, and local text-encoding architecture.
2. Simplify `AppHandler` and the backend dependency graph.
3. Move project persistence away from whole-library synchronous `localStorage` writes.
4. Remove or hand control of the global SageAttention patch back to WanGP.
5. Throttle preview image writes and duplicate progress logging.
6. Clean remaining `LTX_*` names, stale build branding, notices, and packaging metadata.

---

## 3. Architectural Guardrails

The coding agent must preserve the following behaviours unless explicitly instructed otherwise.

### Preserve

- WanGP in-process session reuse.
- Local generation for all image and video models.
- Existing model profile system.
- Existing project, gallery, generation card, timeline, metadata, and media import behaviour.
- User-selectable output codec/container/metadata settings.
- Automatic backend startup and recovery.
- Generation cancellation.
- Model download behaviour handled by WanGP.
- Existing project data through migration code.
- Attribution and required third-party notices.

### Do not reintroduce

- LTX cloud API generation.
- fal.ai generation.
- Gemini API prompt processing.
- API-key settings for removed services.
- Direct model pipelines that bypass WanGP.
- Separate model-download logic that duplicates WanGP.
- Automatic fallback to cloud generation.
- Silent dependency on Lightricks release assets.

### Do not assume

- A dependency named `ltx-*` is unnecessary merely because it contains “LTX”.
- WanGP does not require a package just because AiVS should no longer directly depend on it.
- The packaged release environment behaves like the development virtual environment.
- Upstream WanGP `main` remains API-compatible.

---

# Part I — Release Blockers

## 4. P0 — Move Python Runtime Distribution to AiVS

### Problem

`electron/python-setup.ts` still resolves Windows Python runtime archives from Lightricks infrastructure:

- `https://github.com/Lightricks/ltx-desktop/releases/download/v<version>`
- `https://storage.googleapis.com/ltx-desktop-artifacts/...`

This means a clean AiVS install or update can depend on upstream LTX Desktop assets with a matching version number. The downloaded runtime may be missing, incompatible, or built for a different application dependency graph.

### Primary files

- `electron/python-setup.ts`
- `electron/updater.ts`
- `electron/ipc/app-handlers.ts`
- `electron-builder.yml`
- `scripts/prepare-python.ps1`
- `scripts/create-installer.ps1`
- `scripts/local-build.ps1`
- `python-deps-hash.txt`
- Release workflow files, if present

### Required changes

- Replace Lightricks release URLs with AiVS release URLs.
- Add an explicit GitHub owner and repository to update/publish configuration.
- Rename `LTX_PYTHON_URL` to `AIVS_PYTHON_URL`.
- Optionally support `LTX_PYTHON_URL` as a deprecated fallback for one release.
- Generate runtime assets during the release build.
- Publish runtime assets alongside the app installer.
- Add cryptographic validation before extraction.
- Fail clearly when an archive is missing or has the wrong hash.
- Remove the Lightricks Google Cloud fallback unless AiVS owns an equivalent mirror.

### Suggested runtime assets

```text
python-deps-hash.txt
python-embed-win32.manifest.json
python-embed-win32.part01
python-embed-win32.part02
...
python-embed-win32.sha256
```

The manifest should include at least:

```json
{
  "archiveSha256": "...",
  "totalSize": 123,
  "parts": [
    {
      "name": "python-embed-win32.part01",
      "size": 123,
      "sha256": "..."
    }
  ]
}
```

### Acceptance criteria

- A clean Windows machine downloads no runtime asset from Lightricks infrastructure.
- The downloaded archive is verified before extraction.
- A corrupt or partial part produces a clear error and is not installed.
- `python-deps-hash.txt` is included in the installer and release assets.
- Updates can pre-download an AiVS runtime when dependencies change.
- The update process works when the runtime hash does not change.
- The current installed runtime is never replaced by an unverified archive.

### Implementation decision — 2026-07-10

This archive-based recommendation was superseded after product review. AiVS now
bundles compact embedded Python 3.11.9 with `pip`, `uv`, and matching Python
headers/import libraries. On first Windows launch it copies that bootstrap into
app data, detects the GPU, and installs the pinned WanGP GPU stack through the
same `wangp-stacks.json` source used in development. This removes separate
multi-gigabyte release runtime assets and requires no manual Python, Git, pip,
uv, or CUDA setup from the user.

Updated acceptance criteria:

- The installer contains the compact Python bootstrap, `uv.lock`, the GPU stack
  installer, and the pinned Wan2GP checkout.
- The first-run installer uses bundled `uv`, not a system installation.
- The first-run runtime copies matching `Include/` and `libs/` files for native
  kernels such as GGUF.
- Runtime readiness is tied to a hash of the bundled lockfile and installer
  scripts, so dependency-definition changes trigger a fresh install.
- No Lightricks runtime asset is downloaded or required.

---

## 5. P0 — Make Packaged and Development GPU Stacks Match

### Problem

Development setup uses `scripts/install-wangp-stack.ps1`, which:

- Detects GPU generation.
- Selects CUDA 13.0 or CUDA 12.8.
- Installs curated acceleration kernels.
- Installs WanGP requirements.

The Windows distribution build in `scripts/prepare-python.ps1` instead:

- Uses a fixed CUDA 12.8 index.
- Installs the AiVS lockfile.
- Installs generic WanGP requirements.
- Does not install the same curated GPU-specific kernels.

A packaged release may therefore be slower or less compatible than the development environment that was tested.

### Primary files

- `scripts/install-wangp-stack.ps1`
- `scripts/wangp-stacks.json`
- `scripts/prepare-python.ps1`
- `scripts/setup-dev.ps1`
- `backend/pyproject.toml`
- `backend/uv.lock`

### Required changes

Choose and document one release strategy.

#### Recommended first-release strategy

- Officially support NVIDIA RTX 30, 40, and 50 series first.
- Build a pinned CUDA 13.0 runtime matching the tested development stack.
- Publish a separate CUDA 12.8/legacy runtime later if needed.
- Select the appropriate archive before download using GPU detection.
- Store stack identity in the runtime manifest.

Alternative:

- Build multiple runtime archives now:
  - `win-cu130`
  - `win-cu128`
- Select one at first launch.

### Important implementation rule

There must be one shared source of truth for:

- Torch versions.
- CUDA index.
- Kernel wheel URLs.
- Kernel selection by GPU generation.
- WanGP commit.
- Python version.

Avoid maintaining separate version lists in:

- `backend/pyproject.toml`
- `scripts/wangp-stacks.json`
- `scripts/prepare-python.ps1`
- Release workflow files

Prefer generating install arguments from one machine-readable configuration.

### Acceptance criteria

- The release runtime reports the same Torch/CUDA/kernel versions as the tested dev runtime for the same GPU class.
- SageAttention, Flash Attention, Triton, Nunchaku, or other selected kernels import successfully where expected.
- The runtime can generate with each supported image and video profile.
- A clean install on an RTX 40-series machine performs within an acceptable tolerance of the dev environment.
- Unsupported GPU classes receive a clear message rather than an opaque import or CUDA error.

---

## 6. P0 — Pin WanGP to a Tested Revision

### Problem

`scripts/ensure-wan2gp.ps1` and the shell equivalent clone the latest upstream WanGP state without checking out a specific commit.

AiVS currently calls both public and internal WanGP APIs. Internal calls include private session/runtime attributes used by prompt enhancement. A normal upstream refactor could therefore break AiVS builds without any AiVS code changing.

### Primary files

- `scripts/ensure-wan2gp.ps1`
- `scripts/ensure-wan2gp.sh`
- `scripts/prepare-python.ps1`
- `scripts/prepare-python.sh`
- Release workflow files
- About/diagnostics UI

### Required changes

- Store the tested WanGP commit SHA in one source-of-truth file.
- Clone or fetch WanGP.
- Check out the exact SHA.
- Verify `shared/api.py` exists.
- Verify the checked-out SHA matches the expected SHA.
- Include the SHA in diagnostics and release metadata.

Example configuration:

```json
{
  "repo": "https://github.com/deepbeepmeep/Wan2GP.git",
  "commit": "<tested-commit-sha>"
}
```

### Acceptance criteria

- Two clean builds on different days use the same WanGP source.
- Updating WanGP requires changing the pinned revision intentionally.
- The application logs the active WanGP commit.
- A mismatched or unavailable commit fails the build clearly.
- Prompt enhancement, generation, cancellation, progress, and model profiles are tested against the pinned revision.

---

## 7. P0 — Resolve the Broken Retake Path

### Problem

The frontend Retake hook submits to `/api/retake`.

The backend `RetakeHandler.run()` immediately returns:

```text
503 WANGP_REQUIRED: Retake is only available via WanGP.
```

The same handler still contains unreachable legacy implementations for:

- LTX API Retake.
- Direct local LTX pipeline Retake.

This leaves a visible feature that consistently fails and retains obsolete code.

### Primary files

- `src/hooks/use-retake.ts`
- `src/components/RetakePanel.tsx`
- `src/pages/ProjectView.tsx` or the component that exposes Retake
- `backend/_routes/retake.py`
- `backend/handlers/retake_handler.py`
- `backend/app_factory.py`
- Retake request/response types
- Direct Retake pipeline services and interfaces

### Required decision

Choose one:

#### Option A — Implement Retake through WanGP

- Add a WanGP-backed Retake operation or translate Retake into a normal control-video manifest.
- Preserve the current UX.
- Remove all LTX API and direct-pipeline code.

#### Option B — Temporarily remove Retake

- Remove or hide the UI.
- Remove the route and handler.
- Remove Retake pipeline services.
- Add it back only when implemented through WanGP.

Option B is safer for the first public release if WanGP Retake semantics are not already reliable.

### Acceptance criteria

- No visible control calls an endpoint that always returns `503`.
- Retake either works through WanGP or is absent.
- No LTX API key is referenced by Retake.
- No direct LTX Retake pipeline remains.
- Existing project/take data is not damaged by removal or migration.

---

## 8. P0 — Port or Remove Direct IC-LoRA Generation

### Problem

The IC-LoRA route remains registered and directly loads inherited pipeline services instead of going through `WanGPBridge`.

This contradicts the local architecture claim that all generation is handled by WanGP and keeps much of the old pipeline graph alive.

### Primary files

- `backend/_routes/ic_lora.py`
- `backend/handlers/ic_lora_handler.py`
- `backend/handlers/pipelines_handler.py`
- IC-LoRA pipeline service implementations
- Pipeline interfaces and state types
- Any frontend UI that exposes the feature

### Required decision

- Port IC-LoRA to a supported WanGP model/profile/workflow.
- Or remove the route, handler, pipeline, state types, and UI until supported.

### Acceptance criteria

- Every reachable generation endpoint ultimately calls WanGP.
- No reachable generation route constructs a direct LTX or Diffusers pipeline.
- The About screen claim remains accurate.
- Removed UI does not leave dead controls, imports, or types.

---

# Part II — Remove Inherited API and Direct-Pipeline Architecture

## 9. P1 — Remove LTX API, fal.ai, and Gemini Settings

### Remaining backend settings

The backend settings schema still contains fields such as:

- `ltx_api_key`
- `fal_api_key`
- `gemini_api_key`
- `user_prefers_ltx_api_video_generations`
- `use_local_text_encoder`
- Old direct-pipeline fast/pro settings
- API-key presence flags

### Primary files

- `backend/state/app_settings.py`
- Settings request/response types
- Settings route/handler
- Frontend settings context and migrations
- Existing user settings JSON

### Required changes

- Delete obsolete fields from the canonical settings model.
- Remove response fields such as `has_ltx_api_key`, `has_fal_api_key`, and `has_gemini_api_key`.
- Remove API/local decision helpers.
- Add a one-time migration that removes stored secret values from existing settings files.
- Preserve unrelated output, seed, startup, and WanGP compile settings.

### Acceptance criteria

- Searching the repository for removed API field names returns no live references.
- Existing settings load successfully after migration.
- Old keys are not copied into new settings files.
- No API secret appears in logs, UI, or diagnostics.

---

## 10. P1 — Remove Unreachable Video and Image Generation Paths

### Video leftovers

The main video handler uses WanGP or returns `503`, but old implementations remain for:

- LTX API generation.
- Direct local LTX video generation.
- Direct A2V generation.
- Old image/audio upload logic.
- API-specific resolution and response handling.

### Image leftovers

The image handler uses WanGP or returns `503`, but old implementations remain for:

- fal.ai.
- Direct Z-Image Diffusers generation.
- Old direct-pipeline model loading and memory management.

### Primary files

- Video generation handlers
- Image generation handlers
- `backend/services/ltx_api_client/`
- fal/ZIT API clients
- Direct LTX pipeline services
- Direct Z-Image pipeline services
- A2V services
- Retake services
- Old upload helpers
- Related test doubles and interfaces

### Required changes

- Remove dead methods after Retake and IC-LoRA decisions are complete.
- Remove constructor dependencies that only support dead paths.
- Remove unused service interfaces.
- Remove unused state variants such as API generation slots if WanGP is treated as the single generation slot.
- Rename misleading symbols such as `start_api_generation` if they are retained for WanGP jobs.
- Prefer a neutral job state such as `start_generation_job`.

### Acceptance criteria

- Generation handlers are small request adapters around `WanGPBridge`.
- No cloud-generation client is instantiated.
- No direct image/video model pipeline is instantiated outside WanGP.
- Backend imports do not pull Diffusers or LTX pipeline modules solely for unreachable code.
- Type checking and tests pass after deletion.

---

## 11. P1 — Simplify the Backend Composition Root

### Problem

`backend/app_handler.py` still constructs the inherited service graph, including:

- LTX API client.
- fal/ZIT API client.
- Direct video pipeline.
- Direct image pipeline.
- IC-LoRA pipeline.
- A2V pipeline.
- Retake pipeline.
- Text encoder service.
- Pipeline lifecycle handler.

This makes obsolete features appear structurally supported and forces extra dependencies to remain installed.

### Target composition

The final backend should primarily own:

- `WanGPBridge`
- Generation/job state handler
- Video generation request adapter
- Image generation request adapter
- Prompt enhancement adapter
- Model profile handler
- Settings handler
- Health/status handler
- Project-independent media utilities
- Optional system/shutdown handler

### Required changes

- Remove unused constructor parameters and factories.
- Remove `PipelinesHandler` when no reachable direct pipeline depends on it.
- Remove `TextHandler` when prompt processing is fully delegated to WanGP.
- Remove GPU-slot state that exists only for direct pipelines.
- Keep job state and cancellation state independent from pipeline state.

### Acceptance criteria

- `AppHandler` can be understood without knowing the old LTX Desktop architecture.
- WanGP is the only generation runtime dependency.
- No dependency is injected “just in case”.
- Unit tests create the application without importing heavy model libraries unnecessarily.

---

## 12. P1 — Reduce AiVS-Owned Python Dependencies

### Current concern

`backend/pyproject.toml` still directly declares packages inherited from the direct LTX stack, including:

- `ltx-core`
- `ltx-pipelines`
- `diffusers`
- `peft`
- `transformers`
- `sentencepiece`
- ImageIO-related pipeline packages

Some of these may still be required by WanGP, but they should not necessarily be owned directly by the AiVS backend layer.

### Required approach

1. Remove obsolete direct pipeline imports first.
2. Run import/reference searches.
3. Remove dependencies from AiVS one at a time.
4. Let the pinned WanGP requirements define WanGP runtime dependencies.
5. Regenerate the lockfile.
6. Build a clean runtime.
7. Run all supported profile smoke tests.

### Important

Do not remove a package from the final environment merely because AiVS no longer imports it. WanGP may still require it.

The goal is:

- AiVS declares AiVS dependencies.
- WanGP declares WanGP dependencies.
- The final runtime contains the resolved union.

### Acceptance criteria

- A clean environment installs without dependency conflicts.
- AiVS backend imports without direct LTX pipeline packages.
- Every supported WanGP profile still starts and generates.
- Runtime archive size and file count are recorded before and after cleanup.
- `NOTICES.md` is regenerated from the actual shipped dependency set.

---

## 13. P1 — Remove Forced API Runtime Policy

### Problem

The backend still calculates and exposes a “force API generations” policy even though cloud fallback is no longer supported.

### Primary files

- Runtime policy module
- Runtime policy route
- Runtime policy handler
- Runtime configuration fields
- Response types
- GPU threshold logic
- Frontend callers, if any

### Required changes

- Remove `force_api_generations`.
- Remove API-only GPU fallback logic.
- Replace it with explicit WanGP compatibility reporting where needed.
- Report unsupported hardware clearly rather than silently switching architecture.

### Acceptance criteria

- No route or setting mentions forced API generation.
- Unsupported hardware produces a local-runtime compatibility message.
- No cloud fallback path exists.

---

## 14. P1 — Remove Legacy Model Download Infrastructure

### Problem

The backend still includes download specifications for:

- Standalone LTX checkpoint.
- LTX upscaler.
- Gemma text encoder.
- Direct Z-Image model.

When WanGP is available, model status bypasses most of this system.

### Required changes

- Confirm all first-run model acquisition is owned by WanGP.
- Remove direct model download specs, status calculations, and required-model policy.
- Replace them with WanGP status/model information.
- Keep profile metadata in AiVS only where it controls what the UI exposes.

### Acceptance criteria

- AiVS does not download duplicate model copies outside WanGP.
- The model status UI reflects WanGP state.
- Model paths shown to the user are accurate.
- No “optional with API key” wording remains.

---

# Part III — Performance and Scalability

## 15. P1 — Replace Whole-Library `localStorage` Persistence

### Problem

`ProjectContext` currently:

- Stores the complete project library in `localStorage`.
- Serializes the entire structure synchronously after every state change.
- Logs every save.
- Walks every project, asset, and take after changes.
- Sequentially re-approves stored paths through Electron IPC.

This will increasingly affect UI responsiveness as projects, timelines, assets, and takes grow.

### Primary files

- `src/contexts/ProjectContext.tsx`
- Project types
- Electron IPC handlers for project files and path approval
- Any import/export/migration utilities

### Recommended implementation

For the best long-term result:

- Use SQLite in Electron main.
- Keep project metadata in normalized tables.
- Keep media files in the existing project asset directories.
- Load summaries for the home view.
- Load full project data only when opening a project.
- Write only changed records.
- Debounce high-frequency timeline edits.

Simpler acceptable first step:

- Store one JSON file per project under app data.
- Keep a small project index file.
- Debounce writes by approximately 300–750 ms.
- Write only the changed project.
- Use atomic temporary-file replacement.
- Add backups or recovery for interrupted writes.

### Path approval improvement

- Maintain a cached set of approved paths.
- Approve only newly encountered paths.
- Avoid re-sending every asset and take after every project mutation.
- Batch approval through one IPC call where possible.

### Migration requirements

- Detect the existing `ltx-projects` local-storage key.
- Import it once into the new storage layer.
- Preserve IDs, assets, takes, timelines, subtitles, generation parameters, and active selections.
- Store a migration version.
- Do not delete old data until the new store is confirmed written.

### Acceptance criteria

- Timeline dragging does not synchronously serialize the full library.
- Adding one asset writes only the affected project/records.
- Existing users retain all project data after upgrade.
- A library with many projects and takes remains responsive.
- Storage failures produce a visible error and do not silently discard data.

---

## 16. P1 — Remove the Global SageAttention Monkey Patch

### Problem

`backend/ltx2_server.py` globally replaces:

```python
torch.nn.functional.scaled_dot_product_attention
```

with SageAttention when available.

Because WanGP owns model execution, this global patch can override WanGP's model-specific acceleration choices and affect models that were not tested with that implementation.

### Required changes

- Prefer WanGP's supported attention selection.
- Remove the global patch from AiVS.
- Pass acceleration choices into WanGP through documented configuration or CLI arguments.
- If a compatibility fallback is required, make it opt-in and model-aware.

### Acceptance criteria

- WanGP controls attention backend selection.
- Different models can use different supported acceleration paths.
- Diagnostics report the selected acceleration backend.
- Removing the patch does not reduce expected performance on the tested release stack without explanation.

---

## 17. P1 — Control Image Batch Size by Profile

### Problem

Image generation currently allows multiple variations to be passed as one WanGP batch. Heavy models and high resolutions may multiply VRAM use and cause avoidable out-of-memory failures.

### Recommended profile metadata

```json
{
  "max_parallel_images": 1,
  "max_total_variations": 12,
  "variation_seed_mode": "increment"
}
```

### Required changes

- Resolve `max_parallel_images` from the selected profile.
- Chunk requested variations.
- Generate chunks sequentially.
- Preserve deterministic seeds.
- Aggregate progress and output paths.
- Allow cancellation between chunks.

### Acceptance criteria

- Requesting many variations does not force all images into one GPU batch.
- Progress identifies current image/chunk.
- Cancelling stops remaining chunks.
- Output ordering and seed derivation are deterministic.
- Low-VRAM profiles default to one image at a time.

---

## 18. P2 — Throttle Preview Encoding and Progress Logging

### Problem

WanGP preview events currently cause synchronous JPEG writes to a shared preview file. Progress can also be logged by WanGP, the bridge, and Electron, creating duplicate work and noisy logs.

### Primary files

- `backend/services/wangp_bridge.py`
- `electron/python-backend.ts`
- Frontend generation polling
- Logging utilities

### Required changes

- Rate-limit preview writes to a sensible interval.
- Drop superseded preview events.
- Avoid preview encoding when no consumer needs it.
- Log progress on:
  - Phase changes.
  - Meaningful percentage increments.
  - A maximum periodic interval.
- Avoid recording duplicate raw and reformatted progress lines.

### Acceptance criteria

- Preview updates remain visually useful.
- Logs stay readable during long generations.
- Disk writes are bounded.
- Generation results and cancellation behaviour are unchanged.

---

## 19. P2 — Keep Single-GPU Generation Serial

The current one-generation-at-a-time restriction is appropriate for a consumer GPU.

Do not “optimize” this by running multiple inference jobs concurrently.

If job queuing is added:

- Use a FIFO queue.
- Show queued state.
- Allow queued jobs to be cancelled.
- Run one GPU inference job at a time.
- Separate lightweight preprocessing only when proven safe.

---

# Part IV — Packaging, Naming, and Release Polish

## 20. Rename Remaining LTX Desktop Identifiers

Likely remaining names include:

- `ltx2_server.py`
- `LTX_APP_DATA_DIR`
- `LTX_AUTH_TOKEN`
- `LTX_PORT`
- `LTX_LOG_FILE`
- `LTX_BACKEND_PYTHON`
- `LTX_PYTHON_URL`
- `ltx-projects`
- Build script banners and comments
- `LTX Desktop.exe`
- `LTX Desktop.app`

### Recommended replacements

- `aivs_server.py`
- `AIVS_APP_DATA_DIR`
- `AIVS_AUTH_TOKEN`
- `AIVS_PORT`
- `AIVS_LOG_FILE`
- `AIVS_BACKEND_PYTHON`
- `AIVS_PYTHON_URL`
- `aivs-projects`

### Migration rule

For environment variables and storage keys:

- Read the new name first.
- Fall back to the old name for one compatibility period.
- Write only the new name.
- Log a deprecation warning in development, not production.

---

## 21. Fix Publisher Metadata

### Required checks

- Add explicit GitHub repository owner.
- Add repository metadata to `package.json`.
- Confirm update URLs point to `GOvEy1nw/AI-Video-Studio`.
- Confirm prerelease channels behave as intended.
- Confirm release artifact naming is AiVS-specific.

Example:

```yaml
publish:
  provider: github
  owner: GOvEy1nw
  repo: AI-Video-Studio
```

---

## 22. Resolve macOS Packaging Before Advertising Support

The runtime expects packaged macOS Python under `resources/python`, but the packaging configuration must explicitly include it.

Before enabling macOS releases:

- Confirm `python-embed` is copied to `resources/python`.
- Confirm the correct arm64/x64 architecture.
- Confirm WanGP and all selected models support the target platform.
- Confirm MPS compatibility and model limitations.
- Test signing, notarization, first launch, updates, and model downloads.

If this is not ready, remove or disable the macOS release target for v0.1 rather than publishing an untested artifact.

---

## 23. Regenerate Notices and Licenses

`NOTICES.md` still describes software “used by LTX Desktop” and lists the old direct pipeline stack.

### Required changes

- Preserve required attribution to the original fork.
- Preserve WanGP attribution.
- Preserve model license references for models exposed by AiVS.
- Remove dependencies no longer shipped.
- Add dependencies newly shipped by WanGP/runtime changes.
- Bundle license text where practical.
- Avoid fetching only the LTX model license when multiple model families are supported.

### Acceptance criteria

- Notices describe AiVS accurately.
- Shipped dependencies are represented.
- Removed dependencies are not falsely claimed as shipped.
- Model licenses are discoverable from the application or documentation.
- Apache/NOTICE obligations from the fork remain satisfied.

---

# Part V — Suggested Implementation Sequence

## 24. Commit Group 1 — Deterministic Release Runtime

- Pin WanGP revision.
- Bundle the Python + pip + uv bootstrap.
- Install dependencies from the pinned lockfile and GPU stack definition on first run.
- Hash the bundled runtime definition before marking it ready.
- Align packaged GPU stack with development.
- Add explicit GitHub publisher owner.
- Verify the bootstrap contains `uv` and native Python headers/import libraries.
- Disable unready platform targets.

**Do not combine this with major backend deletions.** First make the existing application build deterministically.

---

## 25. Commit Group 2 — Complete WanGP-Only Generation

- Fix or remove Retake.
- Port or remove IC-LoRA.
- Remove the global SageAttention patch.
- Add profile-based image batch chunking.
- Confirm all generation routes end in `WanGPBridge`.

---

## 26. Commit Group 3 — Delete Dead Cloud and Direct Pipelines

- Remove LTX API client.
- Remove fal.ai client.
- Remove Gemini/API settings.
- Remove direct LTX video pipeline.
- Remove direct Z-Image pipeline.
- Remove direct A2V pipeline.
- Remove direct Retake pipeline.
- Remove `PipelinesHandler`.
- Remove `TextHandler` if no longer required.
- Simplify `AppHandler`.
- Remove forced API runtime policy.
- Remove legacy model downloader.
- Trim `pyproject.toml`.
- Regenerate `uv.lock`.
- Regenerate notices.

---

## 27. Commit Group 4 — Project Storage and UI Scalability

- Add the new persistence service.
- Add one-time local-storage migration.
- Debounce and scope writes.
- Batch/cache path approvals.
- Add storage error handling.
- Load project summaries lazily.
- Stress test with large projects.

---

## 28. Commit Group 5 — Naming and Final Polish

- Rename remaining `LTX_*` variables.
- Rename backend entry point.
- Rename local-storage key with migration fallback.
- Clean build script text and paths.
- Update README installation details.
- Update privacy/local-processing wording.
- Finalize About screen and diagnostics.

---

# Part VI — Agent Search Checklist

Before deleting code, run repository-wide searches for each concept.

```bash
rg -n "ltx_api|LTXAPI|ltxApi"
rg -n "fal_api|falApi|fal\.ai"
rg -n "gemini_api|geminiApi"
rg -n "user_prefers_ltx_api|force_api_generations"
rg -n "LTX_PYTHON_URL|LTX_BACKEND_PYTHON|LTX_APP_DATA_DIR|LTX_AUTH_TOKEN|LTX_PORT|LTX_LOG_FILE"
rg -n "Lightricks/ltx-desktop|ltx-desktop-artifacts"
rg -n "openLtxApiKeyPage"
rg -n "ltx-projects"
rg -n "PipelinesHandler|TextHandler"
rg -n "LTXFastVideoPipeline|ZitImageGenerationPipeline"
rg -n "RetakePipeline|A2VPipeline|IcLoraPipeline"
rg -n "start_api_generation|api_generation"
rg -n "diffusers|ltx_core|ltx_pipelines"
```

For every match, classify it as:

- Required for local model support through WanGP.
- Required attribution/documentation.
- Migration compatibility.
- Obsolete and removable.
- Uncertain — investigate before changing.

---

# Part VII — Validation Matrix

## 29. Static validation

Run after every major cleanup group:

```bash
pnpm run typecheck:ts
pnpm run typecheck:py
pnpm run backend:test
pnpm run build:frontend
```

Also run any repository-specific media import tests.

### Required result

- No ignored failures.
- No new broad `type: ignore`, `any`, or exception swallowing added merely to make checks pass.
- No unused route or service retained without a documented reason.

---

## 30. Clean development setup

Test from a clean clone:

1. No existing `Wan2GP` folder.
2. No backend virtual environment.
3. No existing model cache assumed.
4. Run the documented setup command.
5. Confirm the pinned WanGP commit.
6. Confirm Torch/CUDA/kernel versions.
7. Launch AiVS.
8. Generate with every visible profile.

---

## 31. Clean packaged Windows test

Use a Windows user account or machine without development dependencies.

Verify:

- Installer opens.
- Installation path can be changed.
- First launch downloads the AiVS runtime.
- Runtime hashes verify.
- Backend starts.
- WanGP loads.
- Model download progress appears.
- Image generation works.
- Video generation works.
- Cancellation works.
- Prompt enhancement works.
- Output settings work.
- Projects survive restart.
- Update check points to AiVS.
- App update works with unchanged runtime.
- App update works with changed runtime.

---

## 32. Profile smoke tests

For every visible model profile:

- Text-to-image or text-to-video.
- Every supported aspect ratio.
- Lowest and highest exposed resolution tier.
- Supported input image roles.
- Supported video/audio guide roles.
- Prompt enhancement where exposed.
- Multiple image variations.
- Cancellation.
- Output codec/container.
- Metadata output.

Do not assume one successful LTX generation validates Krea, Z-Image, Qwen, or other profiles.

---

## 33. Performance comparison

Record a baseline before major runtime changes.

For representative profiles, capture:

- App startup time.
- Backend-ready time.
- First generation model-load time.
- Warm generation time.
- Peak VRAM.
- Peak system RAM.
- Output encode time.
- Runtime archive size.
- Installer size.
- Project UI responsiveness with many assets/takes.

Compare:

- Current dev environment.
- New dev environment.
- Packaged clean install.

The release should not be accepted solely because it runs well on the original development environment.

---

# Part VIII — Definition of Done for v0.1

The first public release is ready when all of the following are true.

## Runtime and release

- [x] WanGP is pinned to a tested revision.
- [x] Windows installer includes embedded Python, `pip`, `uv`, and native Python headers/import libraries.
- [x] First-run runtime definition is hash-verified before the environment is marked ready.
- [x] Packaged GPU stack uses the supported/tested `wangp-stacks.json` configuration.
- [x] Update metadata points to the AiVS repository.
- [x] Clean install requires no Lightricks release assets.
- [x] Fresh NSIS installer build contains the pinned Wan2GP checkout and compact bootstrap, and excludes standalone downloader code, Wan2GP docs, checkpoints, LoRAs, and `.codegraph`.
- [ ] First-run dependency installation is exercised on a clean Windows user profile.
- [ ] Windows installer is Authenticode-signed with a release certificate.

## Architecture

- [ ] All reachable image/video generation runs through WanGP.
- [ ] Retake works through WanGP or is hidden/removed.
- [ ] IC-LoRA works through WanGP or is hidden/removed.
- [ ] No LTX cloud API client is reachable.
- [ ] No fal.ai client is reachable.
- [ ] No Gemini API key or generation path remains.
- [ ] No direct model pipeline is reachable outside WanGP.
- [ ] No forced cloud/API runtime policy remains.

## User experience

- [ ] Visible controls do not call intentionally disabled routes.
- [ ] Unsupported hardware produces a clear message.
- [ ] Projects and generation history survive restart and update.
- [ ] Cancellation is reliable.
- [ ] Model download and startup progress are clear.
- [ ] About/privacy wording accurately describes local generation and required downloads.

## Quality

- [x] TypeScript type check passes.
- [x] Python type check passes.
- [x] Backend tests pass.
- [x] Frontend build passes.
- [ ] Clean installer test passes.
- [ ] Supported model profile smoke tests pass.
- [ ] Notices and licenses match shipped components.
- [ ] No known P0 issue is deferred without being removed from the UI.

---

# Part IX — Notes for the Coding Agent

1. Work incrementally and keep commits focused.
2. Inspect references before deleting shared types or services.
3. Prefer deletion over leaving unreachable compatibility branches.
4. Add migrations before renaming storage keys or settings fields.
5. Do not change the existing project/gallery/timeline data model unless required for persistence.
6. Do not alter WanGP manifests or profile mappings without running profile smoke tests.
7. Do not use the developer machine's installed packages as proof that the packaged runtime is complete.
8. Avoid broad rewrites while release engineering is still non-deterministic.
9. Preserve attribution to the upstream projects.
10. Update this document when a decision changes, especially for Retake, IC-LoRA, platform support, and runtime stack strategy.

---

## Final Priority Order

1. **Own and verify the Python runtime distribution.**
2. **Pin WanGP.**
3. **Make release and development GPU stacks equivalent.**
4. **Fix or remove broken Retake.**
5. **Port or remove IC-LoRA.**
6. **Delete cloud and direct-pipeline architecture.**
7. **Replace whole-library local-storage persistence.**
8. **Clean naming, packaging, notices, and diagnostics.**

The WanGP bridge itself is not the main performance concern. The first-release risk is that the public build may use a different runtime, dependency set, and upstream source revision than the environment in which AiVS currently performs well.
