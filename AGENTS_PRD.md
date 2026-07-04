# AI Video Studio — LTX-Desktop-WanGP Inherited-Foundation PRD

**Working title:** AI Video Studio  
**Document type:** Product Requirements Document + agent implementation guide  
**Version:** 2.1 — inherited-foundation direction  
**Date:** 3 July 2026  
**Primary platform:** Windows desktop  
**Primary app foundation:** `deepbeepmeep/LTX-Desktop-WanGP`  
**Primary runtime:** WanGP / Wan2GP only  
**Inherited app stack:** Electron + React + TypeScript + FastAPI backend  
**Initial product focus:** QuickGen image generation  
**Later product focus:** QuickGen video, QuickGen audio/TTS, then Production workflows  
**Commercial intent:** Free/community-focused, not commercial

---

## 1. Purpose

AI Video Studio is a local-first desktop app for AI image, video, and audio generation.

The project should start by **forking and adapting `LTX-Desktop-WanGP`**, not by rebuilding the app from scratch.

The base app already includes a large amount of working product infrastructure, including:

- an Electron/React desktop app;
- a local FastAPI backend;
- projects;
- a generation space / QuickGen-like workflow;
- gallery and generation card behaviour;
- generation history and metadata handling;
- WanGP-backed local generation patterns;
- a video editor.

This PRD intentionally avoids respecifying those existing systems in detail. Where `LTX-Desktop-WanGP` already has a working implementation, that implementation should remain the source of truth unless there is a clear reason to change it.

The goal is to reshape the existing app into:

> A local Freepik/Higgsfield-style AI media studio powered only by WanGP, with simple QuickGen workflows first and structured Production workflows later.

---

## 2. Strategic decision

### 2.1 Core decision

Use `LTX-Desktop-WanGP` as the actual starting codebase for AI Video Studio.

This is not only a reference app and not only UX inspiration. It is the foundation to build on.

### 2.2 Why this is the right direction

This direction is preferable because the base app already solves many hard product problems that would otherwise take significant time to rebuild.

Starting from it should reduce work on:

- desktop app setup;
- local backend process coordination;
- project management;
- generation spaces;
- gallery/output review;
- generation card UX;
- generation history;
- metadata persistence;
- editor integration;
- WanGP bridge patterns.

The project should focus effort on adapting the existing app towards the final product goal, not recreating foundations that already work.

### 2.3 Main change from the previous direction

The earlier product direction treated LTX-Desktop-WanGP mainly as a useful proof-of-concept/reference while defining a separate app architecture.

This version changes that:

```text
Old direction:
  Build a new app and borrow ideas from LTX-Desktop-WanGP.

New direction:
  Fork LTX-Desktop-WanGP and evolve it into AI Video Studio.
```

That means inherited systems should be preserved by default.

---

## 3. Product summary

AI Video Studio should let users:

- create or open local creative projects;
- generate images quickly through QuickGen;
- later generate videos through QuickGen;
- later generate music, sound, and TTS;
- browse, compare, reuse, and organise generations;
- use curated local WanGP-supported models;
- use simple model presets (model/aspect ratio/resolution) instead of raw technical settings;
- use LoRAs in a simple, discoverable way where supported;
- keep work local;
- eventually build structured AI video projects through a Production tab.

The product identity is:

```text
Local-first creative studio
Built on LTX-Desktop-WanGP
WanGP-only generation
Simple QuickGen workflows first
Production workflow later
```

---

## 4. Inheritance rule

### 4.1 Existing base app behaviour should remain the default

If `LTX-Desktop-WanGP` already has a working system for a feature, do not redesign, respecify, or rebuild it unless required by one of the explicit goals in this PRD.

This applies especially to:

- project creation/opening;
- project storage;
- project metadata;
- generation cards;
- gallery/output display;
- generation history;
- job/progress behaviour;
- local backend architecture;
- frontend routing/layout patterns;
- editor integration;
- packaging/build scripts.

### 4.2 Do not make speculative changes to inherited systems

Avoid changing inherited systems just because this PRD mentions them at a high level.

A coding agent should not interpret this PRD as permission to redesign existing working systems.

### 4.3 Change inherited systems only when necessary

Inherited systems should only be changed when needed to:

- remove cloud/API generation paths;
- enforce WanGP-only generation;
- support curated WanGP model profiles;
- support simple QuickGen model/aspect ratio/resolution UX;
- support LoRA selection where WanGP supports it;
- improve local runtime readiness/diagnostics;
- fix bugs discovered during testing;
- support later Production features after QuickGen is stable.

### 4.4 Prefer extension over replacement

When adding new capability, prefer extending existing LTX-Desktop-WanGP patterns over replacing them.

Examples:

```text
Good:
  Add WanGP model profiles into the existing model/generation flow.

Bad:
  Replace the entire project system with a newly designed one.
```

```text
Good:
  Reuse existing gallery cards and add model/preset/LoRA info if missing.

Bad:
  Build a new gallery from scratch because the PRD mentions output history.
```

---

## 5. Non-negotiable product principles

### 5.1 WanGP-only generation

All normal product generation must route through WanGP.

This includes:

- image generation;
- video generation;
- audio/music generation;
- TTS;
- future retake/edit/postprocess features where possible.

If a model cannot run through WanGP, it should not be exposed as a normal QuickGen model.

### 5.2 Local-first

The default product must not require cloud API keys.

Users should be able to run the app locally, configure local runtime/models, and generate locally.

### 5.3 Simple first, advanced second

QuickGen should expose simple creative controls first:

- media type;
- model;
- aspect ratio;
- resolution;
- prompt;
- reference input where supported;
- seed lock;
- LoRA selection where supported;
- generate.

Advanced settings may exist, but they should not dominate the main QuickGen experience.

### 5.4 Curated models only

Do not expose every WanGP-supported model automatically.

The main UI should show a curated set of tested model profiles.

### 5.5 Production later

Production is important, but it should not be built before QuickGen is strong.

QuickGen should mature in this order:

```text
Images
Video
Audio/TTS
Production
```

### 5.6 Preserve what already works

The project should avoid unnecessary rewrites.

The fastest path is:

```text
Keep working LTX-Desktop-WanGP systems
Remove non-WanGP/cloud paths
Add curated local model support
Polish QuickGen
Then expand carefully
```

---

## 6. What to keep from LTX-Desktop-WanGP

Keep the inherited implementation for these areas unless a specific issue is found:

- Electron app shell;
- React frontend structure;
- FastAPI backend structure;
- local backend startup/supervision;
- project system;
- generation space / QuickGen foundation;
- gallery/generation card behaviour;
- generation history;
- generation metadata handling;
- output registration/display patterns;
- existing WanGP bridge/integration patterns;
- diagnostics/logging where useful;
- video editor code as future leverage.

The agent should first study how these currently work, then make the smallest useful changes.

---

## 7. What to remove, disable, or hide

The app should be converted into a local-only WanGP product.

Remove, disable, or hide inherited features that depend on external generation providers or product assumptions that no longer fit.

Target areas to audit:

- LTX API-only generation paths;
- cloud generation provider flows;
- API key onboarding;
- fal.ai / hosted Z-Image API usage;
- Gemini prompt suggestion API usage;
- any feature that sends prompts/media to external services;
- direct non-WanGP model-loading paths;
- cloud text encoding requirements;
- API-only macOS assumptions;
- telemetry unless fully removed or made strictly opt-in and transparent;
- billing/cost/API quota copy;
- branding/copy tied to LTX Desktop as the product.

Temporary cloud/API code may remain during an early audit only if:

- it is unreachable from the UI;
- it is behind a disabled feature flag;
- it is documented in a removal tracker;
- there is a clear plan to delete it.

---

## 8. MVP definition

### 8.1 MVP name

**MVP 0.1 — Local-Only QuickGen Image Foundation**

### 8.2 MVP goal

Create a fork of `LTX-Desktop-WanGP` that:

- launches as AI Video Studio;
- keeps the inherited project/generation/gallery foundations;
- removes or disables visible cloud/API usage;
- generates images locally through WanGP only;
- supports at least one stable WanGP image model end-to-end;
- introduces a simple way to add curated WanGP image models;
- keeps output/history behaviour aligned with the inherited app;
- keeps Production visible but disabled or marked as coming later.

### 8.3 MVP user journey

A user should be able to:

1. Open AI Video Studio.
2. See that the app is local/WanGP-powered.
3. Create or open a project using the inherited project flow.
4. Enter QuickGen.
5. Choose Images.
6. Select an installed WanGP image model.
7. Pick Preview, Balanced, or Quality.
8. Enter a prompt.
9. Optionally add reference input if supported by the selected model.
10. Optionally select LoRA if supported by the selected model.
11. Generate locally through WanGP.
12. See progress using the inherited job/progress pattern.
13. View results using the inherited gallery/generation card pattern.
14. Reuse previous prompts/settings where the inherited app already supports this or where a small extension is needed.
15. Reopen the project later and see previous work.

### 8.4 MVP success criteria

The MVP succeeds when QuickGen image generation feels like a usable local creative app, not a technical proof-of-concept.

The user should not need to:

- open WanGP manually;
- open Gradio;
- use API keys;
- paste raw WanGP settings;
- understand CUDA/Torch;
- manually move generated outputs;
- use a cloud provider.

---

## 9. QuickGen direction

### 9.1 Core QuickGen goal

QuickGen should become the fast creative loop:

```text
Prompt → Generate → Compare → Reuse → Vary → Save
```

Do this by adapting the existing Gen Space / QuickGen implementation rather than replacing it.

### 9.2 MVP QuickGen controls

QuickGen should support:

- media type selector;
- model selector;
- aspect ratio;
- resolution;
- prompt;
- reference input where supported;
- LoRA selector where supported;
- seed lock where already supported or easy to add;
- generate/cancel/progress.

### 9.3 Existing gallery and generation cards

Use the existing gallery/generation card implementation as the default.

Do not redesign it in MVP.

Only extend it where needed to show useful local-generation information, such as:

- model name;
- preset;
- seed;
- LoRA used;
- WanGP/local status;
- reuse settings.

If those details are already stored/displayed by the inherited app, leave them alone.

---

## 10. Model strategy

### 10.1 Model rule

Only expose models that run through WanGP.

```text
No WanGP support = no normal QuickGen exposure
```

### 10.2 Initial image model candidates

Candidate QuickGen image models include:

- Z-Image / Z-Image Turbo through WanGP;
- Flux 2 Klein through WanGP;
- Flux 2 Chroma through WanGP if available and useful;
- Qwen Image through WanGP;
- HiDream through WanGP;
- Krea 2 Turbo only if supported through WanGP;
- Ideogram 4 only if supported through WanGP.

### 10.3 Important candidate warning

Krea 2 Turbo, Flux2 Klein, Ideogram 4, or any other desired model should not be integrated as a direct custom pipeline unless WanGP supports it.

If a desired model is not yet available through WanGP, list it as:

```text
Desired model — blocked until WanGP support exists
```

### 10.4 First model target

The first promoted image model should be whichever WanGP-supported image model is easiest to make reliable end-to-end inside the inherited app.

Krea 2 Turbo can be a preferred target, but it must not block MVP progress.

### 10.5 Model profile approach

Add a lightweight curated model profile layer only if the inherited app does not already provide an equivalent clean mechanism.

The goal is not to create a large new architecture. The goal is to make adding WanGP-backed models repeatable and safe.

A model profile should answer:

- display name;
- media type;
- WanGP model/type/settings mapping;
- supported inputs;
- LoRA support status;
- resolution availability;
- aspect ratio availability;
- install/availability status;
- experimental/stable status.

---

## 11. LoRA support

### 11.1 Why LoRA matters

LoRA support is a key differentiator versus many online prompt-first platforms.

It gives AI Video Studio a local-first advantage beyond simply copying cloud UX.

### 11.2 MVP LoRA scope

Start simple and model-aware.

MVP LoRA support should include:

- LoRA folder detection or configuration;
- compatible LoRA listing where compatibility can be inferred;
- manual LoRA import/copy if useful;
- enable/disable LoRA per generation;
- strength slider where WanGP supports it;
- LoRA info saved with generation metadata if not already captured.

### 11.3 LoRA UX

LoRA should appear as an optional QuickGen control, not as a major settings panel.

Example:

```text
LoRA: None / Select...
```

The control should be hidden, disabled, or marked unsupported for models where LoRA is not available.

---

## 12. Runtime and diagnostics

### 12.1 Runtime goal

Users should not need to manually understand Python, Torch, CUDA, WanGP startup scripts, or model folder structure.

### 12.2 MVP runtime strategy

Reuse and adapt the existing LTX-Desktop-WanGP runtime/WanGP detection patterns where possible.

MVP should support:

- repo-local WanGP checkout if inherited;
- external WanGP folder selection/config if inherited;
- `WANGP_ROOT`-style setup if inherited;
- checks for WanGP availability;
- checks for `shared/api.py` or the inherited WanGP bridge route;
- CUDA/Torch readiness checks where available;
- friendly missing/broken runtime states.

### 12.3 App-managed runtime later

A later version can move towards a fully app-managed runtime informed by WanGP-Easy-Install.

Do not let a perfect runtime installer block the MVP if an existing WanGP folder can be used during early development.

### 12.4 Friendly status states

Expose statuses such as:

```text
Ready
Runtime missing
WanGP missing
WanGP API unavailable
Model missing
CUDA unavailable
GPU memory too low
Repair needed
Generating
```

Avoid raw stack traces in the main UI.

---

## 13. Production tab

### 13.1 Product intent

Production is the future structured workflow for finished AI video projects.

It should eventually support:

- idea/treatment;
- script;
- visual style;
- characters;
- locations;
- props;
- shot list;
- storyboards;
- per-shot prompts;
- image generation;
- video generation;
- audio/music/TTS;
- review/approval;
- export/editor handoff.

### 13.2 MVP state

Production should be visible but disabled, hidden, or marked as coming later.

Recommended copy:

```text
Production is coming later.
QuickGen comes first: images, then video, then audio/TTS.
```

### 13.3 Do not build early

Do not build Production until QuickGen is stable.

---

## 14. Video editor

### 14.1 Role

The inherited video editor is a bonus, not the MVP centre.

### 14.2 MVP handling

Keep the inherited editor code if it does not slow development.

Hide it, beta-label it, or leave it as-is depending on the current state of the base app.

Do not rewrite it for MVP.

### 14.3 Future use

The editor may later become:

- a review area for generated clips;
- a simple assembly space;
- a way to compare variations;
- a bridge from QuickGen into Production;
- a rough AI animatic tool.

---

## 15. Phased roadmap

### Phase 0 — Fork audit and preservation map

Goal:

Understand what the base app already does and avoid accidental rewrites.

Tasks:

- fork `LTX-Desktop-WanGP`;
- document inherited project system;
- document inherited generation/gallery/card behaviour;
- document inherited metadata/job behaviour;
- identify all generation routes;
- identify all cloud/API paths;
- identify all WanGP paths;
- identify runtime setup assumptions;
- create a keep/remove/extend tracker.

Definition of done:

```text
There is a clear map of what must be kept, removed, extended, and left untouched.
```

### Phase 1 — Local-only product shell

Goal:

Make the app clearly local-first and WanGP-powered.

Tasks:

- rename/rebrand app to AI Video Studio;
- remove/hide visible API key onboarding;
- remove/hide cloud provider settings;
- remove or disable telemetry;
- update copy to local/WanGP positioning;
- add clear WanGP attribution/disclosure;
- keep inherited project/home flow intact.

Definition of done:

```text
The app opens as AI Video Studio and exposes no normal cloud/API generation workflow.
```

### Phase 2 — WanGP-only generation enforcement

Goal:

Ensure normal generation paths route through WanGP only.

Tasks:

- audit image/video generation routes;
- disable/remove LTX API generation;
- disable/remove fal/Gemini/cloud helper paths;
- ensure inherited Z-Image or image generation uses WanGP rather than hosted API;
- add guardrails/tests/checks to prevent accidental external generation calls.

Definition of done:

```text
A normal generation from the UI cannot call an external generation provider.
```

### Phase 3 — QuickGen image baseline

Goal:

Make one image model work end-to-end locally through WanGP.

Tasks:

- use inherited QuickGen/Gen Space UI;
- select the easiest stable WanGP image model;
- map model/preset controls to WanGP settings;
- run generation through the inherited backend/WanGP bridge;
- preserve inherited progress/gallery/metadata handling;
- add friendly local runtime/model errors.

Definition of done:

```text
A user can generate one image locally through WanGP and see it in the inherited gallery/output flow.
```

### Phase 4 — Curated image model expansion

Goal:

Add more WanGP-supported image models without turning QuickGen into a technical settings dump.

> **Detailed brief:** `docs/PHASE4_DETAILS.md` is the source of truth for Phase 4 implementation. Read it before starting Phase 4 work. The notes below summarise it; the detailed brief takes precedence on any conflict.

Tasks:

- add or adapt a lightweight curated model profile mechanism (backend-owned, exposed to frontend via API — single source of truth);
- add candidate image models one at a time, starting with **Krea 2 Turbo** alongside the existing **Z-Image Turbo** baseline;
- show installed/missing/experimental states with friendly messages, not raw WanGP tracebacks;
- keep UI simple — extend the existing `ModelSelector` (already works in video mode) into image mode; do not redesign GenSpace/gallery/cards;
- curated resolution/aspect-ratio set only: aspect ratios `1:1` / `16:9` / `9:16`, resolution tiers `540p` minimum; no 4K/2160p by default;
- collapse duplicate same-aspect-ratio resolutions per tier to one curated `WxH` value (prefer lower pixel count when ambiguous);
- backend resolves simple UI choices to exact WanGP `WxH` (e.g. `1080p 16:9 → 1920x1088`) and validates profile/resolution/aspect before calling WanGP;
- model switching keeps current aspect ratio/resolution where supported, otherwise falls back to model defaults;
- include LoRA capability fields in profiles now, but do not build LoRA UI in Phase 4 — that is Phase 5;
- treat reference images as model-aware — hide/disable for profiles where `referenceImages` is false (both initial profiles are normal prompt-to-image);
- WanGP discovery is used for validation/availability only, not as the raw UI source;
- do not switch the WanGP integration to MCP for this phase — continue using the existing in-process WanGP bridge.

Implementation principle:

```text
WanGP tells us what can exist.
AiVS decides what should be visible.
```

The frontend should not scrape or infer arbitrary WanGP options directly into the UI. The curated profile layer remains the source of truth for what AiVS exposes; the backend validates that each curated profile still maps to a real WanGP-supported model.

Definition of done:

```text
Additional image models can be added predictably without rewriting core UI each time.
```

### Phase 5 — LoRA MVP

Goal:

Add simple LoRA usage for supported image models.

Tasks:

- detect/configure LoRA folders;
- list compatible/experimental LoRAs;
- add optional LoRA selection in QuickGen;
- expose strength where supported;
- pass LoRA settings to WanGP;
- ensure LoRA usage is stored/displayed if not already captured.

Definition of done:

```text
A compatible LoRA can be selected and used in a WanGP image generation.
```

### Phase 6 — QuickGen image polish

Goal:

Make image generation genuinely useful for creative iteration.

Tasks:

- improve prompt/settings reuse if needed;
- improve seed lock/variation flows if needed;
- improve compare/favourite/delete/reveal actions if inherited app lacks them;
- keep gallery/generation card changes minimal and additive;
- tighten friendly errors.

Definition of done:

```text
QuickGen image feels practical for real creative exploration.
```

### Phase 7 — QuickGen video

Goal:

Bring video generation into the same WanGP-only QuickGen model.

Tasks:

- expose one stable WanGP video model;
- support prompt/reference/duration/motion controls where appropriate;
- reuse inherited output/gallery/video preview behaviour;
- store useful generation settings through inherited metadata flow.

Definition of done:

```text
A user can generate video locally through WanGP from QuickGen.
```

### Phase 8 — QuickGen audio/TTS

Goal:

Add audio/music/TTS once image and video foundations are stable.

Tasks:

- expose one stable WanGP audio/music path if available;
- expose one stable WanGP TTS path if available;
- add simple prompt/voice controls;
- reuse inherited asset/output patterns where possible.

Definition of done:

```text
A user can generate audio or TTS locally through WanGP.
```

### Phase 9 — Production planning

Goal:

Design the future structured workflow without destabilising QuickGen.

Tasks:

- prototype Production UX;
- define script/character/location/shot/storyboard concepts;
- define handoff from Production shots into QuickGen;
- avoid major implementation until approved.

Definition of done:

```text
Production is clearly specified, but QuickGen remains the stable foundation.
```

---

## 16. MVP acceptance checklist

### Local-only

- [ ] No visible API key requirement.
- [ ] No normal cloud provider generation path.
- [ ] Prompt/media are not sent to external generation services.
- [ ] WanGP is clearly disclosed.
- [ ] Runtime/model status is understandable.

### Inherited foundation

- [ ] Existing project flow is preserved unless explicitly changed.
- [ ] Existing gallery/generation card behaviour is preserved unless explicitly changed.
- [ ] Existing metadata/history behaviour is preserved unless explicitly changed.
- [ ] Existing backend/frontend architecture is preserved unless explicitly changed.
- [ ] Existing editor is not rewritten for MVP.

### QuickGen image

- [ ] Image generation works through WanGP only.
- [ ] At least one WanGP image model works end-to-end.
- [ ] Model selector is curated.
- [ ] Prompt submission works.
- [ ] Progress/cancel uses inherited patterns where possible.
- [ ] Outputs appear through inherited gallery/output flow.
- [ ] Previous settings can be reused if inherited or added minimally.

### Model expansion

- [ ] New models are WanGP-supported.
- [ ] Desired-but-unsupported models are tracked, not directly integrated.
- [ ] Model availability/missing states are friendly.
- [ ] Adding a model does not require major UI surgery.

### LoRA

- [ ] LoRA selection only appears where supported or clearly experimental.
- [ ] LoRA strength works where WanGP supports it.
- [ ] LoRA usage is saved/displayed if needed.

### Codebase

- [ ] Cloud/API paths are removed, disabled, or unreachable.
- [ ] External calls are not used for normal generation.
- [ ] WanGP remains the generation backend.
- [ ] App-specific changes are documented.
- [ ] Existing working systems are not unnecessarily rewritten.

---

## 17. Risks and mitigations

### Risk: AI agent rebuilds systems that already work

Mitigation:

- this PRD explicitly treats inherited systems as source of truth;
- Phase 0 requires a preservation map;
- architecture/project/gallery/metadata details are intentionally not respecified;
- changes should be additive unless required by local-only/WanGP-only goals.

### Risk: inherited cloud/API assumptions are deeply embedded

Mitigation:

- start with a cloud/API removal tracker;
- hide cloud UI first;
- remove routes/services once WanGP-only path is stable;
- add checks to prevent normal generation from calling external providers.

### Risk: desired models are not supported by WanGP

Mitigation:

- expose only WanGP-supported models;
- track desired unsupported models separately;
- do not add custom direct pipelines;
- use fallback stable WanGP image models for MVP.

### Risk: QuickGen becomes a raw WanGP settings UI

Mitigation:

- curated models;
- simple presets;
- hidden advanced controls;
- model-aware defaults;
- minimal UI changes.

### Risk: fork diverges too far from upstream/base app

Mitigation:

- preserve inherited systems;
- isolate AI Video Studio changes;
- document major changes;
- avoid rewrites unless necessary.

### Risk: video editor distracts from MVP

Mitigation:

- keep/hide/beta-label inherited editor;
- do not rewrite it;
- do not make editor changes part of QuickGen image MVP.

---

## 18. AI coding agent instructions

### 18.1 North star

Turn `LTX-Desktop-WanGP` into AI Video Studio by preserving its working desktop/project/generation/gallery foundations, removing non-WanGP/cloud generation paths, and making QuickGen excellent for local WanGP-powered generation.

### 18.2 Core agent rule

Before changing an inherited feature, ask:

```text
Does this already work in LTX-Desktop-WanGP?
Is this change required for WanGP-only/local-only/QuickGen model support?
Can this be done by extending the existing implementation instead of replacing it?
```

If the answer does not justify the change, leave the inherited implementation alone.

### 18.3 Hard guardrails

1. Do not rebuild the project system unless there is a specific bug or approved requirement.
2. Do not rebuild the gallery/generation card system unless there is a specific bug or approved requirement.
3. Do not redesign metadata storage unless the inherited system cannot support required WanGP/model/LoRA fields.
4. Do not replace the Electron/React/FastAPI architecture.
5. Do not add generation paths that bypass WanGP.
6. Do not expose cloud/API generation as a normal feature.
7. Do not require API keys for MVP.
8. Do not add direct custom model pipelines for models that WanGP does not support.
9. Do not expose every WanGP setting in QuickGen.
10. Do not expose every WanGP model automatically.
11. Do not build Production before QuickGen is stable.
12. Do not let the inherited video editor define the MVP.
13. Do not hide WanGP attribution.

### 18.4 Implementation order for any feature

For each feature:

1. classify it as MVP core, MVP nice-to-have, future QuickGen, future Production, runtime infrastructure, or out of scope;
2. check whether LTX-Desktop-WanGP already has an equivalent feature;
3. decide keep / remove / extend / replace;
4. prefer the smallest extension that meets the requirement;
5. ensure generation still routes through WanGP;
6. ensure no external generation service is called;
7. preserve inherited project/gallery/metadata behaviour unless the change explicitly requires otherwise;
8. add friendly errors/status where needed;
9. smoke test the user path;
10. document any significant deviation from the base app.

### 18.5 Definition of done

A feature is done when it:

- works through WanGP;
- respects local-only product rules;
- preserves inherited working systems where possible;
- has friendly failure states;
- avoids unnecessary technical complexity in QuickGen;
- can be tested through a repeatable manual or automated smoke test.

---

## 19. One-sentence product instruction

Fork LTX-Desktop-WanGP into AI Video Studio, preserve its existing project, gallery, generation-card, metadata, editor, and Electron/React/FastAPI foundations wherever they already work, remove non-WanGP/cloud/API generation paths, make QuickGen image generation excellent first with curated WanGP models and simple LoRA support, then expand to video, audio/TTS, and finally Production.
