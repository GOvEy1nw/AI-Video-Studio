# AI Video Studio — Product Charter and Agent Guardrails

**Product:** AI Video Studio (AiVS)  
**Document type:** Current product charter and implementation guardrails  
**Version:** 3.0  
**Last reviewed:** 26 July 2026 against `dev`  
**Primary platform:** Windows desktop  
**Foundation:** `deepbeepmeep/LTX-Desktop-WanGP`  
**Generation runtime:** bundled WanGP / Wan2GP only  
**Commercial intent:** free, open-source, community-focused

> This document describes the product AiVS is today, the direction it is moving in, and the boundaries every implementation must respect. It is not a chronological phase plan. Completed plans under `docs/` remain useful historical rationale, but they must not be re-executed as active instructions unless a current task explicitly reopens that work.

## 1. Product mission

AI Video Studio is a local-first desktop creative environment for AI image, video, and music generation.

Its purpose is to give users the approachable creative loop of modern hosted AI platforms while retaining the advantages of local software:

```text
Prompt or guide media
    -> Generate locally
    -> Compare and organise results
    -> Reuse settings and references
    -> Refine or direct the next result
    -> Keep the project and media under the user's control
```

AiVS is not intended to expose every raw WanGP model or technical setting. It turns tested WanGP capabilities into curated, understandable product workflows.

## 2. Product identity

```text
Local-first creative studio
Built on the proven LTX-Desktop-WanGP foundation
Powered exclusively by WanGP / Wan2GP
Curated rather than exhaustive
Simple first, advanced when useful
Project-based rather than disposable
Free and community-focused
```

The inherited foundation remains important, but AiVS is no longer an image-only fork prototype. It currently contains working image, video, Reframe, music, Director, asset-management, setup, and model-management workflows.

## 3. Document authority and source-of-truth order

For implementation decisions, use this order:

1. The user's explicit current request and any approved task-specific implementation plan.
2. The non-negotiable product guardrails in this document.
3. Current code, tests, and focused current-state contracts such as:
   - `docs/GENSPACE_ARCHITECTURE.md`;
   - `docs/DIRECTOR_MODE_V1.md`;
   - `docs/REFRAME_MODE.md`;
   - `backend/architecture.md`;
   - `backend/WANGP_BACKEND.md`.
4. `AGENTS.md`, `.projectmem/PROJECT_MAP.md`, and `.projectmem/summary.md` for operational guidance and navigation.
5. Completed implementation plans and historical issue records.

When an old plan conflicts with current code or a focused current-state document, the current implementation and current contract win. Do not silently reinterpret a historical plan as unfinished work.

## 4. Non-negotiable product principles

### 4.1 Local generation and user control

Normal image, video, music, future TTS, and future editing-generation workflows must execute through the user's local WanGP runtime.

Prompts and guide media must not be sent to an external generation provider.

The app may use the network for clearly necessary supporting operations such as:

- downloading models and runtime components;
- checking or downloading application updates;
- opening explicitly requested documentation or project links.

Those operations do not permit cloud generation, hidden media upload, or silent telemetry.

### 4.2 WanGP-only generation

All product generation routes must use WanGP / Wan2GP.

```text
No supported WanGP path = no normal AiVS product exposure
```

Do not add a separate direct model pipeline, ComfyUI dependency, hosted API fallback, or second generation runtime merely to expose a desired model sooner.

A feature may remain planned or disabled until the corresponding WanGP path is reliable.

### 4.3 Curated product surface

WanGP determines what is technically available. AiVS determines what should be visible and supported.

The main UI must expose a curated set of:

- model profiles;
- media roles;
- resolutions and aspect ratios;
- generation controls;
- model packs;
- error and readiness states.

Do not automatically turn raw WanGP metadata into product controls.

### 4.4 Simple first, advanced second

Primary workflows should use clear creative language and sensible defaults.

Advanced controls are appropriate when they materially help the creative result, but they should be grouped, progressively disclosed, and model-aware rather than dominating the initial experience.

Raw internal terms, manifest fields, model-loader flags, and stack traces should not leak into the primary user experience.

### 4.5 Preserve and extend working systems

AiVS began as a fork, but this rule now applies to the current AiVS implementation as well as inherited code:

- study the existing path before changing it;
- extend established ownership and data flows;
- reuse shared components and services when their contract fits;
- avoid speculative rewrites;
- replace a system only when an approved requirement or demonstrated limitation justifies it.

The goal is maintainable evolution, not permanent fidelity to old code. Refactoring is welcome when it clarifies ownership or removes duplication without changing product behaviour unexpectedly.

### 4.6 Reproducible runtime compatibility

The Python, Torch, CUDA, performance-kernel, WanGP, and model-runtime combination is a curated compatibility unit.

It must remain reproducible through pinned manifests and installation scripts. Generic dependency automation must not independently upgrade this stack.

### 4.7 Project-centred creative work

Generations are not disposable API responses. They belong to local projects and should preserve the information needed to understand, reuse, organise, and continue the work.

Where a workflow creates media, it should integrate with the shared project Asset Library unless a documented reason requires different ownership.

### 4.8 Friendly failure and recovery

Missing models, interrupted downloads, backend restarts, incompatible settings, and invalid media should produce actionable product states.

Do not require users to interpret raw Python, CUDA, HTTP, or WanGP errors for ordinary recovery.

### 4.9 Honest capability presentation

Unavailable features may be shown only when their disabled/planned state is unambiguous.

Do not imply that Retake, TTS, LoRA selection, or locked Director tracks work before their complete user path is validated.

### 4.10 Open-source responsibility

Keep licensing, attribution, local-data behaviour, and system requirements understandable.

Do not add opaque tracking, proprietary lock-in, or dependencies that undermine the community-focused intent without an explicit product decision.

## 5. Current product state

### 5.1 Project shell

Users can create and reopen local projects. A project currently exposes three persistent workspaces:

- **Quick Gen** — implemented by GenSpace;
- **Director** — frame-based generation planning and execution;
- **Video Editor** — inherited NLE-style editing workspace.

The workspaces remain mounted to preserve state, but only the active workspace may own playback, keyboard transport, visible compositor layers, media warming, or other active work.

### 5.2 Quick Gen / GenSpace

Quick Gen is the fast creative loop:

```text
Choose media type
    -> choose a curated model
    -> add prompt and optional guides
    -> adjust useful controls
    -> generate/cancel
    -> compare, organise, and reuse results
```

Implemented media modes:

- Image;
- Video;
- Music.

GenSpace uses a persistent left generation sidebar and the shared Asset Library. Mode state lives above the visible panels so switching modes does not destroy settings or create independent generation jobs.

### 5.3 Image generation

Current curated image profiles:

- Z-Image Turbo;
- Krea 2 Turbo;
- Flux 2 Klein 4B;
- HiDream O1.

Image profiles may expose different curated reference or control-image roles. Unsupported roles must not be shown merely because another model supports them.

The renderer submits the AiVS profile, aspect ratio, resolution tier, prompt, seed, and supported media roles. The backend validates the profile and resolves the exact WanGP dimensions and settings.

### 5.4 Video generation

The current curated video profile is LTX 2.3 Fast, mapped through WanGP's supported LTX path.

Generate mode supports the curated combination of:

- text-to-video;
- start and end images;
- continuation from source video;
- supported control-video and guidance roles;
- supported audio inputs;
- prompt enhancement;
- duration/output controls.

GenSpace is intended for a direct generation, not a multi-segment production timeline. Director owns authored prompt timing.

### 5.5 Reframe

Reframe is the working video-outpainting workflow within GenSpace video mode.

It provides:

- source-video trim selection;
- preset or custom aspect framing;
- zoom and pan;
- mirrored custom edge expansion;
- an optional text prompt;
- WanGP-backed outpainting generation.

Its current geometry, padding limits, source-frame length handling, and backend mapping are established in `docs/REFRAME_MODE.md`. Do not casually reinterpret them during unrelated work.

### 5.6 Retake

Retake is visible but disabled.

It must remain unavailable until the complete WanGP-backed user path is reliable, including trim semantics, generation mapping, progress, cancellation, output persistence, and real-runtime QA.

Do not treat dormant routes, old UI fragments, or backend compatibility structures as proof that Retake is product-ready.

### 5.7 Music generation

Music generation is implemented through curated ACE-Step 1.5 Fast and XL profiles.

The current workflow includes:

- Instrumental, Auto Lyrics, and Custom Lyrics modes;
- song-description prompting;
- Genre, Mood, Vibe, and Instruments keyword chips;
- generation-time description enhancement;
- Compose Lyrics with optional Think and independent lyric seed;
- manual or automatic duration;
- BPM, key scale, time signature, language, vocal, variability, and sampling controls;
- independent Cover Song and Transfer Timbre inputs;
- multiple output variations;
- multi-variation audio takes in the shared Asset Library.

Music has one canonical full settings experience. Legacy saved fields may remain for compatibility but must not recreate removed product modes.

### 5.8 Shared Asset Library

GenSpace, Director, and Video Editor use one controlled shared Asset Library presentation.

The product contract includes:

- local uploaded and generated assets;
- project bins and bin-owned colours;
- filters and favourites;
- grid and list views;
- shared context actions;
- duplicate-name handling;
- multi-take assets;
- image, video, and audio presentation;
- project-safe deletion and reveal/open actions.

Shared presentation does not require every workspace to expose identical actions. Each workspace supplies the actions appropriate to its purpose.

Idle video cards should remain thumbnail-first. Inactive workspaces must not decode or render large media collections in the background merely because their state remains mounted.

### 5.9 Director V1

Director is the canonical multi-segment prompt-timing workflow.

It is a generation-intent timeline, not an NLE timeline.

Current V1 supports:

- multiple Director timelines per project;
- Global Prompt and local Prompt segments;
- movable/resizable segments and authored gaps;
- image keyframes at Start, Centre, or End;
- a Continue Video prefix anchored at frame zero;
- integer-frame authoring at 24 fps;
- upward `8n+1` output snapping;
- sequences up to 20 seconds;
- independent preview, playhead, playback, zoom, scroll, focus, and undo/redo;
- generated output and regeneration takes;
- normal project Asset creation after generation.

Guide Audio and Control Media authoring remain visible but locked in V1.

Director and Video Editor may share domain-neutral timeline visuals, but their recipes, time models, history, selection, and editing rules must remain separate.

### 5.10 Video Editor

The inherited Video Editor remains a separate NLE-style workspace.

It is not the storage model for Director segments and should not automatically receive Director output. Users may add generated assets through the normal Asset Library workflow.

Changes to the editor should preserve working editing behaviour and avoid turning unrelated Quick Gen or Director tasks into an editor rewrite.

### 5.11 Setup and Model Manager

AiVS manages the Windows Python and GPU runtime installation path and exposes optional WanGP model packs through first-run setup and Settings.

Users may:

- install the curated runtime;
- choose optional model packs;
- see structured transfer progress;
- cancel downloads;
- retry failed downloads;
- delete supported model packs;
- configure project, checkpoint, and LoRA storage paths.

Generation-triggered model downloads and Model Manager downloads have different transport owners, but both should present consistent progress information in the renderer.

## 6. Product surface boundaries

### 6.1 Quick Gen versus Director

Use Quick Gen for a direct image, video, Reframe, or music generation.

Use Director for frame-based, multi-segment video intent and prompt timing.

Do not reintroduce a second prompt timeline inside GenSpace unless a future approved product decision deliberately changes this boundary.

### 6.2 Director versus Video Editor

Director authors what should be generated.

Video Editor arranges and modifies finished media.

Do not store Director Prompt segments as NLE clips or make the editor timeline drive Director playback merely because the visuals are related.

### 6.3 Asset Library versus workspace state

Assets and bins are shared project data.

Transient selection, playback, timeline playheads, mode settings, and undo history remain owned by their workspace.

### 6.4 Product profiles versus raw runtime models

A WanGP model definition or downloaded file is not automatically an AiVS product profile.

Product exposure requires an explicit curated profile, capability policy, defaults, availability behaviour, tests, and user-facing validation.

### 6.5 Current product versus long-term Production concepts

A broader structured Production workflow remains a possible long-term direction, potentially building on Director, projects, and the editor.

There is no currently approved requirement to invent or expose a separate Production tab. Do not build one from the old phase-era PRD without a new product plan.

## 7. Model strategy

### 7.1 Backend-owned profile registry

`backend/model_profiles/profiles.py` is the source of truth for product-visible models.

A curated profile defines the product contract, including:

- stable AiVS ID and display name;
- media type;
- mapped WanGP model type;
- supported generation capabilities;
- supported input roles and limits;
- default and allowed output choices;
- Director or Music policy where relevant;
- availability/status behaviour;
- licence information where available.

The frontend consumes the model-profile API. It must not infer the product UI by scraping raw WanGP configuration.

### 7.2 Adding a model

A new model is not complete when its files download or WanGP lists it.

Promotion requires:

1. verified WanGP support;
2. an explicit AiVS profile and display policy;
3. curated controls and defaults;
4. model-pack/readiness behaviour where applicable;
5. backend validation and mapping;
6. frontend support without generic raw-setting exposure;
7. metadata persistence and Copy Settings compatibility;
8. focused automated coverage;
9. real-runtime generation testing on supported hardware;
10. licensing/attribution review.

### 7.3 LoRA direction

AiVS already supports configurable LoRA storage at the runtime level, but user-facing selection and strength controls are not implemented.

Future LoRA UX should be:

- model-aware;
- optional;
- compact in primary workflows;
- explicit about unsupported or experimental compatibility;
- persisted with generation settings and metadata;
- mapped through WanGP rather than a direct loader.

### 7.4 TTS direction

TTS is not currently implemented.

A future TTS workflow must use a supported WanGP path, integrate with projects and the Asset Library, expose a curated voice/control surface, and avoid direct cloud APIs.

## 8. Runtime and dependency strategy

### 8.1 Current runtime ownership

The app owns the user-facing setup and readiness experience. WanGP remains the generation and model-acquisition authority beneath that product layer.

Users should not need to manually understand:

- Python environments;
- Torch/CUDA combinations;
- performance-kernel wheels;
- WanGP launch scripts;
- raw model folder layouts;
- generation manifests.

### 8.2 Curated GPU stack

The current Windows stack pins Python, Torch, CUDA, and hardware-specific acceleration packages through:

- `backend/pyproject.toml`;
- `backend/uv.lock`;
- `scripts/wangp-stacks.json`;
- `scripts/install-wangp-stack.ps1`.

Treat these as one compatibility matrix. Do not run broad Python dependency upgrades or accept automated runtime version PRs without explicit stack-level validation.

### 8.3 Bundled WanGP source

AiVS bundles a reproducible WanGP checkout pinned by `scripts/wangp-source.json`.

WanGP updates must use the transactional update workflow, review sensitive bridge/model/default/dependency changes, run the required checks, and restore the previous checkout and manifest when validation fails.

### 8.4 Frontend and desktop dependencies

React, Electron, Vite, Tailwind, TypeScript, test tooling, and related desktop packages may be modernised, but major upgrades must be isolated, phased, and validated in development, unpacked, and installed builds.

Do not combine frontend/desktop modernisation with unrelated product feature work.

## 9. Local data, privacy, and storage

### 9.1 Local project data

Projects, imported assets, generated outputs, settings, and recipes are stored locally.

Default project assets live under `Documents/AiVS`, with project uploads and generated outputs separated inside each project.

### 9.2 Runtime data

Executable runtime components, model caches, updater state, and application state belong in appropriate application/runtime locations rather than inside user project folders.

Checkpoint and LoRA roots may be configured without changing the ownership of project media.

### 9.3 No hidden upload

Adding a media input must not upload it to an external service.

Any future networked collaboration, sharing, or optional telemetry would require an explicit product decision, transparent user controls, and documentation. It must not emerge accidentally from a dependency or inherited feature.

## 10. User-experience principles

### 10.1 Clear hierarchy

Keep primary generation controls easy to scan:

- model;
- process/mode;
- media inputs;
- prompt or lyrics;
- output settings;
- generate/cancel.

Group secondary controls rather than presenting an undifferentiated settings wall.

### 10.2 Model-aware controls

Hide, disable, or explain controls that the selected profile cannot use.

Do not allow impossible combinations and rely on the backend error to teach the user the model contract.

### 10.3 Consistent shared behaviour

Where GenSpace, Director, and Video Editor expose the same concept—assets, bins, filters, takes, model readiness, progress—the visual and interaction language should stay aligned through shared components or shared primitives.

Consistency does not mean forcing different workflows into one universal component.

### 10.4 Actionable status

Prefer states such as:

```text
Ready
Model files missing
Downloading model
Runtime starting
Runtime needs repair
Generation queued
Generating
Cancelling
Complete
Failed — Retry
```

Retain detailed diagnostics in logs and structured API data, while showing concise human-readable status in the primary UI.

### 10.5 Stable creative state

Switching modes, tabs, or projects must not silently discard authored settings or allow a finishing generation to save into the wrong project.

Preserve persistent state intentionally and stop inactive side effects intentionally.

### 10.6 Performance awareness

Avoid duplicate media decoding, duplicate polling loops, hidden active workspaces, repeated thumbnail extraction, or unnecessary rerenders of the Asset Library.

Measure before introducing lazy loading or a new state framework. Existing static imports and focused controller boundaries are deliberate unless evidence justifies change.

## 11. Architecture guardrails with product impact

The implementation details live in `AGENTS.md` and architecture documents, but these boundaries protect product behaviour:

1. Renderer-native communication goes through the context-isolated preload bridge.
2. Renderer-backend communication uses the authenticated local FastAPI service.
3. Backend routes remain thin; handlers own domain decisions; services isolate side effects.
4. Shared generation state owns progress and cancellation across image, video, music, and Director workflows.
5. The backend validates all curated profile and media-role choices before invoking WanGP.
6. Generated results are registered through project-safe persistence paths.
7. Heavy GPU or I/O work must not block shared state locks.
8. Director recipes and NLE clips remain different domain models.
9. Runtime and source pins remain reproducible.
10. No product feature may bypass WanGP or the local project/data boundaries.

## 12. Active roadmap

The current near-term directions are:

1. Phased modernisation of the frontend/Electron dependency stack on a dedicated branch.
2. Real-runtime regression testing across image, video, Reframe, Director, music, setup, and every model-download entry point.
3. Retake once its WanGP-backed flow is reliable enough to expose.
4. Curated user-facing LoRA selection and strength controls.
5. TTS generation through WanGP.
6. Director Guide Audio and Control Media authoring after Prompt Track V1 is stable.
7. Continued curated model additions supported by profiles, model packs, and real-runtime testing.
8. Ongoing maintainability, performance, accessibility, and packaging improvements.

This list establishes direction, not permission to implement every item in one task. Significant features require a focused plan and explicit scope.

## 13. Explicit non-goals without a new approved plan

Do not introduce the following as incidental work:

- cloud generation providers or API-key onboarding;
- a direct model runtime beside WanGP;
- automatic exposure of every WanGP model or setting;
- ComfyUI as a required runtime;
- a universal schema-generated settings form replacing curated panels;
- a second project or Asset Library state system;
- a second independent generation polling/cancellation implementation;
- merging Director and Video Editor data models;
- a speculative Production tab;
- silent telemetry or media upload;
- bulk upgrades of the curated Python/Torch/CUDA/WanGP stack;
- large visual redesigns hidden inside dependency, bug-fix, or refactor work.

## 14. Product decision framework for agents

Before changing a product flow, answer:

```text
What user problem or approved requirement does this solve?
Which current component, handler, service, or domain already owns it?
Does the requested behaviour belong in Quick Gen, Director, Video Editor, Settings, or setup?
Can the current system be extended without creating a second source of truth?
Does generation still route through WanGP locally?
Is the selected model/profile combination explicitly supported?
Will project persistence, Copy Settings, progress, cancellation, and error recovery still work?
What automated and native-runtime evidence will prove parity?
```

If ownership is unclear, inspect the current map and code before creating a new abstraction.

## 15. Definition of done for product work

A product change is complete only when all applicable items are true:

- The intended user path works from the actual Electron app.
- Generation remains local and WanGP-backed.
- The UI exposes only supported, curated combinations.
- Existing projects and saved generation settings remain compatible or have an explicit migration.
- Progress, cancellation, errors, and retry behaviour are handled.
- Generated media and metadata persist to the correct project.
- Inactive workspaces do not retain unintended playback or heavy work.
- Focused automated tests cover the changed contracts.
- Type checking and relevant full test/build gates pass.
- Native drag/drop, playback, model download, generation, packaging, or installer behaviour is manually tested where automation cannot prove it.
- Documentation reflects any new product capability, ownership boundary, runtime requirement, or deliberate limitation.
- The implementation does not quietly bundle unrelated redesign or dependency changes.

## 16. One-sentence product instruction

Build AiVS as a reliable, approachable, local creative studio that turns curated WanGP capabilities into project-based image, video, music, and directed-generation workflows, while preserving user control, clear ownership, reproducible runtime compatibility, and the working systems already proven in the app.
