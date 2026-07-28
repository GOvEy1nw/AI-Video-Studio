# AiVS GenSpace Full Split — Implementation Plan

**Repository:** `GOvEy1nw/AI-Video-Studio`  
**Baseline branch:** `dev`  
**Primary area:** `frontend/views/GenSpace.tsx`  
**Plan purpose:** refactor GenSpace into clear, identifiable UI panels, reusable media/prompt components, typed domain logic, isolated generation actions, isolated result persistence, and a thin composition page—without changing the visible UI, user workflow, generation behaviour, backend contract, or runtime responsiveness.

---

## 1. Desired outcome

The final GenSpace architecture should make it obvious where any piece of behaviour lives:

- Image UI lives in `ImageGenPanel.tsx`.
- Video UI lives in `VideoGenPanel.tsx`.
- Music UI lives in `MusicGenPanel.tsx`.
- Shared prompt and media-input visuals live in small reusable components.
- Mode-specific state remains available when the visible panel changes.
- Request construction is implemented in pure, typed logic rather than embedded in JSX.
- Generation submission and progress still use one shared generation job/controller.
- Generated-result persistence is separate from rendering and is idempotent.
- Gallery behaviour is isolated from prompt editing so the gallery does not needlessly rerender while the user types.
- `GenSpace.tsx` becomes a readable composition root rather than a feature implementation file.

This is a structural refactor, not a redesign.

> **Current Music override:** Subsequent approved Music work replaces the
> Simple/Advanced split with one full settings mode, adds independent Cover
> Song and Transfer Timbre inputs, uses one song-prompt-style lyrics box with
> inline seed/Compose/Think controls, and composes Auto or empty-Custom lyrics
> during the generation workflow.

### Final experience requirements

The user must not notice that the implementation has been split. The following must remain unchanged unless a separately approved bug fix is documented:

- Sidebar width, spacing, colours, typography, sticky areas, scrolling and control order.
- Image / Video / Music tab behaviour.
- Model dropdown contents and profile fallback behaviour.
- Media role selection, supported input counts and drag/drop behaviour.
- Start/end frame, guide video/audio, trim and automatic-duration behaviour.
- Generate, Reframe and disabled Retake behaviour.
- Prompt, custom lyrics, seed and prompt enhancement behaviour.
- Generation progress, model-download progress, preview, cancellation and errors.
- Gallery imports, bins, filters, favourites, grid/list views, previews and takes.
- Copy Settings restoration and editor-to-GenSpace hand-offs.
- Generated asset metadata and project persistence.

---

## 2. Current-state observations

The current `GenSpace.tsx` is roughly 4.2k lines and contains several distinct responsibilities:

1. Inline sidebar and mode UI.
2. Image, video and music controls.
3. Media drop zones, role menus and trimming.
4. Generation request preparation.
5. Prompt enhancement.
6. Result-to-project persistence for image, video, reframe, retake and music.
7. Copy Settings restoration and editor hand-offs.
8. Gallery filtering, import, bins and context actions.
9. Preview, takes, duplicate-filename, delete and error dialogs.
10. Project seed synchronisation.

Other relevant findings:

- The current inline `PromptBar` is effectively the whole generation sidebar, not merely a prompt component.
- `ImageInputItem` in `GenSpace.tsx` and `GenSpaceImageInput` in `frontend/lib/apply-generation-params.ts` describe essentially the same image/video/audio input shape. These should become one canonical type.
- `GenerationSettings` currently lives in `frontend/components/SettingsPanel.tsx`, although it is a domain type used by generation logic. It combines image and video settings and should ultimately move out of a UI component.
- `frontend/hooks/use-generation.ts` handles video, Director, image and music jobs and repeats some request/polling lifecycle logic.
- Existing reusable pieces should be retained: `ReframePanel`, `RetakePanel`, `VideoTrimPanel`, `MusicModeControls`, `MusicLyricsInput`, `SettingsDropdown`, `ModelDropdownTrigger`, `SeedControl`, `GalleryAssetLibrary`, and the existing media-import helpers.
- The repository currently has strict TypeScript settings but no frontend test suite. Logic extraction should not proceed without adding at least a lightweight pure-function test harness or an equivalent written parity gate.

---

## 3. Architectural rules

### 3.1 Preserve behaviour before improving architecture

Each phase must leave the app runnable. Do not combine a mechanical move with a new state model, new request contract and UI cleanup in the same commit.

The order is deliberately:

1. Baseline behaviour.
2. Move code without changing it.
3. Establish panel boundaries.
4. Extract shared visuals.
5. Extract state and logic.
6. Isolate persistence and gallery behaviour.
7. Optimise only after parity.

### 3.2 One generation controller per GenSpace workspace

Call `useGeneration()` once at the GenSpace workspace/controller level.

Do **not** call it independently inside `ImageGenPanel`, `VideoGenPanel` and `MusicGenPanel`. Multiple instances would risk:

- duplicate progress polling;
- independent cancellation state;
- overlapping result state;
- inconsistent model-download progress;
- duplicate persistence effects.

Panels receive controlled state and callbacks from the parent controller.

### 3.3 Keep generation-critical state outside conditional panels

Only the active panel should be rendered. Do not keep hidden image/video/audio panels mounted merely to preserve state; hidden media elements and listeners would add unnecessary work.

Instead, keep all user-authored or generation-critical state in always-mounted hooks/controllers:

- prompt;
- image settings;
- video settings;
- music settings;
- attached media and trim metadata;
- selected generation mode/submode;
- reframe and retake state;
- seed state;
- generation job state.

Transient presentation state may remain local to a panel and reset when the panel is left:

- hover state;
- drag highlight state;
- an open popover/menu;
- temporary playback position in a trim preview.

A mode change must never discard attached media or settings except where the existing implementation already does so.

### 3.4 Explicit panels, small shared primitives

Prefer clear domain components over a universal configuration-driven form.

Good:

```tsx
<ImageGenPanel />
<VideoGenPanel />
<MusicGenPanel />
<MediaInputSlot />
<VideoMediaInputs />
```

Avoid:

```tsx
<UniversalGenerationPanel
  supportsLyrics
  supportsStartFrame
  supportsEndFrame
  supportsGuideAudio
  supportsReframe
  supportsRetake
  // dozens more flags
/>
```

Small repeated markup is acceptable when abstraction would hide domain rules.

### 3.5 No initial lazy loading

Use static imports for the three panels during this refactor. Splitting source files must not introduce a visible delay when switching tabs.

`React.lazy` or route-level code splitting may be considered later only after bundle measurement and preloading design. It is not part of this refactor.

### 3.6 No backend or WanGP changes

This plan must not alter:

- FastAPI routes;
- request/response schemas;
- WanGP mappings;
- model profile definitions;
- generation defaults;
- polling cadence;
- output storage paths.

Frontend request-building code may be reorganised, but the emitted payload must remain equivalent.

### 3.7 Avoid architecture by line count alone

Line counts are useful warning signals, not acceptance tests. Split by responsibility and change surface.

Suggested soft targets:

- `GenSpace.tsx`: 150–350 lines.
- `GenSpaceSidebar.tsx`: 100–250 lines.
- Each top-level mode panel: ideally 200–500 lines.
- A shared visual component: generally under 300 lines.
- A hook or pure logic module: generally under 400 lines.

A file may exceed those ranges when it remains cohesive; do not fragment obvious logic into dozens of tiny files merely to satisfy a number.

---

## 4. Target directory structure

The final structure should remain shallow enough to browse quickly:

```text
frontend/
├─ views/
│  ├─ GenSpace.tsx
│  └─ genspace/
│     ├─ GenSpaceSidebar.tsx
│     ├─ GenSpaceModeTabs.tsx
│     ├─ GenSpaceGallery.tsx
│     ├─ GenSpaceOverlays.tsx
│     ├─ types.ts
│     ├─ constants.ts
│     │
│     ├─ image/
│     │  ├─ ImageGenPanel.tsx
│     │  ├─ ImageModelControls.tsx
│     │  └─ ImageMediaInputs.tsx
│     │
│     ├─ video/
│     │  ├─ VideoGenPanel.tsx
│     │  ├─ VideoModeTabs.tsx
│     │  ├─ VideoMediaInputs.tsx
│     │  ├─ GuideMediaTrimEditor.tsx
│     │  ├─ ReframePanel.tsx
│     │  ├─ RetakePanel.tsx
│     │  ├─ VideoTrimPanel.tsx
│     │  ├─ OutpaintFrameOverlay.tsx
│     │  └─ reframe-outpaint.ts
│     │
│     ├─ music/
│     │  ├─ MusicGenPanel.tsx
│     │  ├─ MusicMediaInputs.tsx
│     │  ├─ MusicSettings.tsx
│     │  ├─ MusicAdvancedSettings.tsx
│     │  ├─ compile-music-request.ts
│     │  └─ music-keywords.ts
│     │
│     ├─ components/
│     │  ├─ GenPanelSection.tsx
│     │  ├─ PromptEditor.tsx
│     │  ├─ PromptActions.tsx
│     │  ├─ GenerateButton.tsx
│     │  ├─ AspectIcon.tsx
│     │  ├─ MediaInputSlot.tsx
│     │  └─ MediaRoleMenu.tsx
│     │
│     ├─ hooks/
│     │  ├─ useGenSpaceController.ts
│     │  ├─ useGenSpaceModeState.ts
│     │  ├─ useGenSpaceSettingsState.ts
│     │  ├─ useGenSpaceMediaInputs.ts
│     │  ├─ useGenSpaceVideoTools.ts
│     │  ├─ useGenSpaceGenerationActions.ts
│     │  ├─ useGenSpacePromptEnhancement.ts
│     │  ├─ useGenSpaceResultPersistence.ts
│     │  ├─ useGenSpaceSettingsRestore.ts
│     │  ├─ useGenSpaceExternalHandoffs.ts
│     │  └─ useGenSpaceGallery.ts
│     │
│     └─ logic/
│        ├─ mode-transitions.ts
│        ├─ media-inputs.ts
│        ├─ generation-requests.ts
│        ├─ generation-assets.ts
│        └─ settings-restore.ts
│
├─ hooks/
│  ├─ use-generation.ts                 # compatibility facade
│  └─ generation/
│     ├─ types.ts
│     ├─ progress.ts
│     ├─ request-builders.ts
│     └─ useGenerationJob.ts
│
└─ types/
   └─ generation.ts                     # shared generation domain types
```

This is a target, not a requirement to create every file immediately. Files should appear in the phase where their responsibility is actually extracted.

### Avoid barrel-file overuse

A small `index.ts` may be added at the end for public panel exports, but internal hooks and logic should use direct imports during the refactor. This reduces circular dependency risk and makes ownership obvious.

---

## 5. Final state and data ownership

| Concern | Final owner | Notes |
|---|---|---|
| Active Image/Video/Music tab | `useGenSpaceModeState` | Exposes the exact current transition semantics. |
| Video Generate/Reframe/Retake mode | `useGenSpaceModeState` or `useGenSpaceVideoTools` | Retake remains disabled while the existing availability flag is false. |
| Prompt | `useGenSpaceController` or a small prompt-state hook | Preserve current cross-mode prompt behaviour. |
| Image settings | `useGenSpaceSettingsState` | Separate typed state from video settings. |
| Video settings | `useGenSpaceSettingsState` | Includes profile, duration, resolution, FPS, aspect and audio. |
| Music settings | Existing `MusicSettings`, normalised in `useGenSpaceSettingsState` | Preserve profile policy clamping. |
| Attached input media | `useGenSpaceMediaInputs` | One canonical `GenSpaceMediaInput` type. |
| Reframe/retake inputs | `useGenSpaceVideoTools` | Wrap existing panel state; do not rewrite panel internals. |
| Profiles | Existing profile hooks, called by `useGenSpaceController` | Backend remains source of truth. |
| Seed | Existing project/app settings integration | Preserve project seed synchronisation. |
| Generation job/progress | Exactly one `useGeneration()` instance | Passed to action/persistence hooks. |
| Request preparation | Pure functions in `logic/generation-requests.ts` | No React imports. |
| Submission snapshots | `useGenSpaceGenerationActions` | Capture prompt/settings/media before starting a job. |
| Generated asset construction | Pure functions in `logic/generation-assets.ts` | Test metadata without rendering. |
| Result persistence | `useGenSpaceResultPersistence` | Idempotent effects, one asset/take per result. |
| Copy Settings restoration | `useGenSpaceSettingsRestore` | Uses existing media recovery helpers. |
| External editor hand-offs | `useGenSpaceExternalHandoffs` | Keeps project-context bridge out of page JSX. |
| Gallery state/actions | `useGenSpaceGallery` | No dependency on prompt keystrokes. |
| Gallery view | `GenSpaceGallery` | Adapter around existing `GalleryAssetLibrary`. |
| Modals/context menus | `GenSpaceOverlays` | Receives focused overlay controller props. |

---

## 6. Core types to establish

Create or consolidate the following types before moving logic:

```ts
export type GenSpaceMode = "image" | "video" | "music";
export type VideoProcessMode = "generate" | "reframe" | "retake";
export type GenSpaceMediaKind = "image" | "video" | "audio";

export interface GenSpaceMediaInput {
  id: string;
  url: string;
  role: string;
  type?: GenSpaceMediaKind;
  trimStartTime?: number;
  trimDuration?: number;
  mediaDuration?: number;
}

export interface ImageGenSettings {
  profileId: string;
  resolution: string;
  aspectRatio: string;
  steps: number;
  variations: number;
  inputRole?: string;
}

export interface VideoGenSettings {
  model: "fast" | "pro";
  profileId: string;
  duration: number;
  resolution: string;
  fps: number;
  aspectRatio: string;
  audio: boolean;
}
```

Panel contracts should be grouped by responsibility rather than exposing 30 flat props:

```ts
export interface PromptController {
  value: string;
  setValue: (value: string) => void;
  enhance: () => Promise<void>;
  isEnhancing: boolean;
  seedLocked: boolean;
  lockedSeed: number;
  setSeed: (next: { seedLocked: boolean; lockedSeed: number }) => void;
}

export interface GenerationActionController {
  submit: () => Promise<void>;
  canSubmit: boolean;
  isRunning: boolean;
  label: string;
}
```

Use patch callbacks rather than passing raw React setters where practical:

```ts
onSettingsChange: (patch: Partial<ImageGenSettings>) => void;
```

The controller owns the merge:

```ts
setImageSettings((current) => ({ ...current, ...patch }));
```

### Move `GenerationSettings` out of `SettingsPanel.tsx`

Create `frontend/types/generation.ts` and move the shared compatibility type there. Initially re-export it from `SettingsPanel.tsx` if other code still imports from that location:

```ts
export type { GenerationSettings } from "../types/generation";
```

Long-term, the panel/controller code should use separate image/video types and only convert to the compatibility `GenerationSettings` at the `useGeneration` boundary.

---

## 7. Phase overview

| Phase | Focus | Behaviour risk | Main deliverable |
|---|---|---:|---|
| 0 | Baseline, parity and test safety net | None | Recorded reference behaviour and validation commands |
| 1 | Canonical types and constants | Low | No duplicate media/settings types; no runtime changes |
| 2 | Mechanical sidebar extraction | Low | Existing sidebar moved intact out of `GenSpace.tsx` |
| 3 | Full Image/Video/Music panel extraction | Medium | Three clear `*GenPanel.tsx` files with identical UI |
| 4 | Shared prompt/media primitives | Medium | Reusable slots, role menus and trim editor |
| 5 | State/controller extraction | Medium | Controlled panels; persistent state outside panels |
| 6 | Generation request/action extraction | High | Typed, testable per-mode submission logic |
| 7 | Persistence, restore and hand-off extraction | High | Idempotent result persistence and isolated restoration |
| 8 | Gallery and overlay extraction | Medium | Thin page and reduced prompt-to-gallery rerenders |
| 9 | Shared generation-hook split | High | One reusable job lifecycle with compatibility facade |
| 10 | Final performance, cleanup and documentation | Low | Final composition architecture and documented guardrails |

Do not begin a high-risk phase until the previous phase has passed the full parity checklist.

---

# 8. Detailed implementation phases

## Phase 0 — Freeze and document the baseline

### Objective

Create an objective reference for current behaviour before moving code.

### Tasks

1. Create a dedicated branch, for example:

   ```text
   refactor/genspace-full-split
   ```

2. Record the exact source revision in the PR/plan notes.
3. Run and record the baseline commands:

   ```powershell
   pnpm typecheck:ts
   pnpm build:frontend
   pnpm backend:test
   ```

   Backend tests are not expected to change, but running them establishes that any later failure is unrelated or newly introduced.

4. Capture reference screenshots of:
   - Image panel with no input.
   - Image panel with one/multiple reference inputs and an open role menu.
   - Video Generate panel with start/end/guide media.
   - Guide trim editor.
   - Video Reframe panel.
   - Music instrumental, auto-lyrics and custom-lyrics states.
   - Generation/model-download progress card.
   - Gallery grid/list and preview/takes dialogs.

5. Record a short network/performance baseline:
   - There is one progress polling loop per active job.
   - Polling cadence remains approximately 500 ms.
   - Switching tabs does not cause backend requests.
   - Typing in the prompt does not trigger backend requests.
   - Record production bundle sizes from `pnpm build:frontend`.

6. Add a minimal frontend test runner before pure logic extraction.

   Preferred dev-only dependencies:

   ```text
   vitest
   jsdom
   @testing-library/react
   @testing-library/user-event
   ```

   Add scripts such as:

   ```json
   "test:frontend": "vitest run",
   "test:frontend:watch": "vitest"
   ```

   Start with node-environment tests for pure functions. Use jsdom only for focused component interaction tests. Do not add a large end-to-end framework solely for this refactor.

7. Create an explicit parity checklist in the PR description or `docs/GENSPACE_REFACTOR_PARITY_CHECKLIST.md`.

### Constraints

- No production source changes except test/config setup.
- Dev-only test dependencies must not enter the renderer production bundle.
- Existing baseline failures must be documented rather than silently attributed to the refactor.

### Exit criteria

- Baseline typecheck/build status is known.
- Reference screenshots/checklist exist.
- Pure-function tests can run, or there is an approved equivalent gate.
- The current polling and bundle baseline is recorded.

### Suggested commit

```text
test(genspace): establish refactor parity baseline
```

---

## Phase 1 — Establish canonical types, constants and compatibility adapters

### Objective

Remove type ambiguity without moving behaviour.

### New files

```text
frontend/views/genspace/types.ts
frontend/views/genspace/constants.ts
frontend/types/generation.ts
```

### Tasks

1. Move `GenSpaceMode` and `VideoProcessMode` to `types.ts`.
2. Replace both inline `ImageInputItem` and `GenSpaceImageInput` with one exported `GenSpaceMediaInput` type.
3. Move guide-role, audio-role and other role collections to `constants.ts` as readonly sets/arrays.
4. Move `GenerationSettings` from `SettingsPanel.tsx` to `frontend/types/generation.ts`.
5. Keep a temporary re-export from `SettingsPanel.tsx` to avoid unrelated broad import churn.
6. Define separate `ImageGenSettings` and `VideoGenSettings`, but do not split runtime state yet.
7. Add explicit types for:
   - panel props;
   - media slot descriptors;
   - reframe/retake submission snapshots;
   - image/video/music submission snapshots;
   - generation action state.
8. Remove `onSettingsChange: (settings: any) => void` from the current sidebar contract. Use the existing compatibility settings type until Phase 5.
9. Update `apply-generation-params.ts` to import the canonical media type rather than declaring another one.
10. Add unit tests for any type-adjacent pure constants or role inference that is moved.

### Constraints

- No default changes.
- No mode-transition changes.
- No role-normalisation changes.
- No emitted request changes.

### Exit criteria

- There is one canonical GenSpace media-input type.
- No new GenSpace code uses `any` for settings or media.
- `pnpm typecheck:ts`, frontend tests and frontend build pass.

### Suggested commit

```text
refactor(genspace): centralize domain types and constants
```

---

## Phase 2 — Mechanically extract the current sidebar

### Objective

Remove the largest UI block from `GenSpace.tsx` without redesigning or reorganising its logic.

### New files

```text
frontend/views/genspace/GenSpaceSidebar.tsx
frontend/views/genspace/components/GuideMediaTrimEditor.tsx
frontend/views/genspace/components/ImageModelControls.tsx
frontend/views/genspace/components/GenSpaceIcons.tsx   # optional; only if useful
```

### Tasks

1. Move the existing `PromptBar` implementation almost verbatim to `GenSpaceSidebar.tsx`.
2. Rename it to `GenSpaceSidebar` because it represents the full sidebar.
3. Preserve:
   - JSX order;
   - Tailwind class strings;
   - conditional rendering;
   - keyboard behaviour;
   - local refs and transient UI state;
   - effects and callback order.
4. Move `MediaInputTrimEditor` to `GuideMediaTrimEditor.tsx` without changing behaviour.
5. Move inline `ImageModeControls` to `ImageModelControls.tsx`; retain its current `section="model" | "output" | "all"` compatibility for now.
6. Move reusable SVG icons (`LightricksIcon`, `AspectIcon`) only if doing so keeps imports clear; otherwise leave them local to the relevant extracted control.
7. Keep all generation state, gallery state, persistence effects and handlers in `GenSpace.tsx`.
8. Replace the inline component with one import:

   ```tsx
   <GenSpaceSidebar {...existingProps} />
   ```

9. Do not rename visible labels, change component order or clean class names in this phase.

### Why this phase is intentionally mechanical

It provides an immediate readability win and creates a clean review boundary. If parity fails, the cause is likely an import/prop/DOM move rather than a simultaneous state rewrite.

### Exit criteria

- The sidebar looks and behaves identically in all modes.
- GenSpace generation and gallery behaviour are unchanged.
- No new polling or effects exist.
- The reference screenshots match.
- Typecheck, frontend tests and build pass.

### Suggested commit

```text
refactor(genspace): move existing sidebar into dedicated component
```

---

## Phase 3 — Create complete Image, Video and Music panels

### Objective

Implement the user-requested top-level split: every generation mode has one clearly identifiable panel file containing the complete content below the main tabs.

### New files

```text
frontend/views/genspace/GenSpaceModeTabs.tsx
frontend/views/genspace/image/ImageGenPanel.tsx
frontend/views/genspace/video/VideoGenPanel.tsx
frontend/views/genspace/music/MusicGenPanel.tsx
frontend/views/genspace/video/VideoModeTabs.tsx
```

### Panel ownership

#### `ImageGenPanel.tsx`

Owns the complete Image panel below the top tabs:

- model section;
- image media inputs and role menus;
- prompt;
- seed;
- prompt enhancement;
- image resolution;
- image aspect ratio;
- variations/other current image options;
- Generate button.

#### `VideoGenPanel.tsx`

Owns the complete Video panel below the top tabs:

- video model;
- Generate/Reframe/Retake selector;
- start/end/guide media;
- guide role menu;
- guide trim editor;
- source-audio option;
- prompt, seed and enhancement;
- reframe or retake tool panel;
- duration/automatic duration;
- resolution and aspect ratio;
- Generate/Reframe/Retake action.

`VideoGenPanel` may internally compose mode-specific sections if it remains too large:

```text
VideoGenerateContent
VideoReframeContent
VideoRetakeContent
```

Keep `VideoGenPanel.tsx` as the clear entry point even if these helpers are introduced.

#### `MusicGenPanel.tsx`

Owns the complete Music panel below the top tabs:

- music model;
- prompt;
- instrumental/auto-lyrics/custom-lyrics mode;
- custom lyrics;
- duration;
- BPM, time signature and key/scale;
- variations and metadata options;
- seed where currently applicable;
- Generate button.

Continue using existing `MusicModeControls` and `MusicLyricsInput` rather than rebuilding them.

### Tasks

1. Extract the Image/Video/Music tabs to `GenSpaceModeTabs`.
2. Move each conditional JSX branch from `GenSpaceSidebar` into the appropriate panel.
3. Initially use typed panel prop objects even if they remain relatively broad.
4. Keep generation-critical state in `GenSpace.tsx`; panels remain controlled.
5. Render only the active panel:

   ```tsx
   {mode === "image" && <ImageGenPanel {...imageProps} />}
   {mode === "video" && <VideoGenPanel {...videoProps} />}
   {mode === "music" && <MusicGenPanel {...musicProps} />}
   ```

6. Do not add `React.lazy`.
7. Do not call hooks conditionally in the panels when those hooks own persistent generation state.
8. Preserve the existing sticky top tabs and sidebar scrolling container.
9. Keep all input/trim data outside panels so unmounting does not lose it.
10. Add focused component tests for:
    - switching main mode tabs;
    - switching video submodes;
    - disabled Retake state;
    - custom-lyrics visibility;
    - Generate button disabled state.

### Exit criteria

- The three requested panel files exist and each visibly owns its whole panel.
- Switching modes preserves all state that the old implementation preserved.
- Existing mode-transition clearing behaviour also remains unchanged.
- UI screenshots match the baseline.
- No extra backend calls or intervals occur on mode switches.

### Suggested commits

Use one commit per panel if that makes review easier:

```text
refactor(genspace): extract image generation panel
refactor(genspace): extract video generation panel
refactor(genspace): extract music generation panel
```

---

## Phase 4 — Extract shared prompt and media-input building blocks

### Objective

Reduce duplicated visual/interaction code while keeping image and video domain behaviour explicit.

### New files

```text
frontend/views/genspace/components/GenPanelSection.tsx
frontend/views/genspace/components/PromptEditor.tsx
frontend/views/genspace/components/PromptActions.tsx
frontend/views/genspace/components/GenerateButton.tsx
frontend/views/genspace/components/MediaInputSlot.tsx
frontend/views/genspace/components/MediaRoleMenu.tsx
frontend/views/genspace/components/ImageMediaInputs.tsx
frontend/views/genspace/components/VideoMediaInputs.tsx
frontend/views/genspace/logic/media-inputs.ts
```

### Component responsibilities

#### `GenPanelSection`

A visual wrapper for the current border/padding/title pattern. It must preserve the existing DOM layout closely enough that styling does not drift.

#### `PromptEditor`

Owns only:

- textarea value/change;
- Enter-without-Shift submission behaviour;
- placeholder;
- optional lyrics child/content area;
- current height, spacing and scroll styling.

It must not know how to generate media.

#### `PromptActions`

Composes `SeedControl` and the current Enhance button. Music-specific hiding/behaviour is supplied by props rather than inferred from global state.

#### `GenerateButton`

Owns the current button presentation and loading/disabled state. The panel supplies its label and icon.

#### `MediaInputSlot`

A small visual primitive that supports:

- empty state;
- attached media preview;
- click-to-pick;
- gallery/file drop;
- badge/label;
- optional action menu;
- remove action.

It does not decide which roles are valid.

#### `ImageMediaInputs`

Uses `MediaInputSlot` and the selected image profile policy to handle:

- maximum input count;
- default role;
- role menu;
- image-only acceptance.

#### `VideoMediaInputs`

Uses `MediaInputSlot` for:

- start frame;
- end frame;
- combined video/audio guide;
- guide role selection;
- guide trimming;
- source audio.

### Pure media logic

Move non-React operations to `logic/media-inputs.ts`:

```text
normalizeImageInputsForProfile
normalizeVideoInputsForProfile
replaceInputForRole
replaceGuideInput
removeMediaInput
findGuideInput
getDefaultImageInputRole
inferMediaKindForRole
```

Use the existing `detectMediaType`, `ensureGalleryAssetForInputFile`, `importGalleryFile`, `fileUrlToPath` and related helpers. Do not create a second file-type detection implementation inside GenSpace.

### Important anti-pattern to avoid

Do not create one universal media component with a large matrix of boolean props. The reusable layer should be the slot and role menu; image/video collections remain separate and readable.

### Object URL handling

The existing import helper may fall back to `URL.createObjectURL(file)` outside the normal Electron path. If this path is retained, track and revoke owned object URLs when they are replaced or the workspace unmounts. Do not revoke URLs backed by project assets.

Treat this as a contained memory-safety improvement and verify that it does not invalidate previews.

### Tests

Add pure tests for:

- image profile max-input clamping;
- invalid role fallback to the profile default;
- one start and one end frame maximum;
- one guide-media slot maximum;
- guide replacement preserving other slots;
- audio/video role inference;
- trim metadata preservation;
- mode transition filtering.

Add focused UI tests for:

- dropping an image into an empty image slot;
- selecting a different role;
- removing an input;
- start/end slot replacement;
- guide trim confirmation.

### Exit criteria

- Image and video panels no longer contain large duplicated drop-zone/menu blocks.
- Profile policy remains the source of truth.
- No input role/count behaviour changes.
- No hidden media elements remain mounted for inactive panels.
- Typecheck, tests, build and manual drag/drop checks pass.

### Suggested commits

```text
refactor(genspace): extract shared prompt controls
refactor(genspace): extract reusable media input primitives
```

---

## Phase 5 — Move state into clear, always-mounted controllers

### Objective

Remove mode-specific state and normalisation effects from `GenSpace.tsx` while ensuring conditional panel mounting cannot reset important state.

### New hooks

```text
useGenSpaceModeState.ts
useGenSpaceSettingsState.ts
useGenSpaceMediaInputs.ts
useGenSpaceVideoTools.ts
useGenSpaceController.ts
```

### `useGenSpaceModeState`

Owns:

- `mode`;
- `videoMode`;
- exact transition callbacks.

Extract the transition semantics to pure functions where possible and preserve current behaviour exactly, including:

- leaving Video resets the video submode to Generate;
- switching to a non-video mode removes media types the current code removes;
- switching to Music clears the current inputs exactly as it does now;
- selecting disabled Retake does nothing;
- selecting Reframe clears the prompt where the current code does.

Do not “improve” transition behaviour in this refactor. A later UX decision can change it deliberately.

### `useGenSpaceSettingsState`

Owns separate typed states:

```text
imageSettings
videoSettings
musicSettings
```

Tasks:

1. Split the current combined settings object.
2. Preserve existing defaults.
3. Preserve profile-driven resolution/aspect fallback.
4. Preserve video duration clamping when resolution changes.
5. Preserve music policy normalisation for vocal mode, duration, variations, BPM, time signature and key/scale.
6. Expose patch callbacks rather than raw setters.
7. Provide a compatibility adapter that creates the old `GenerationSettings` shape only at the generation-hook boundary.

### `useGenSpaceMediaInputs`

Owns:

- canonical media input array(s);
- legacy `inputImage`/`inputAudio` compatibility while required;
- file/gallery import resolution;
- role updates;
- removal;
- image/video normalisation;
- source-audio selection;
- object URL ownership/cleanup if applicable.

Do not duplicate project gallery imports. Continue routing local files through `ensureGalleryAssetForInputFile`.

### `useGenSpaceVideoTools`

Owns:

- retake state and submission snapshot reference;
- reframe state and submission snapshot reference;
- reset keys and initial values;
- stable `onChange` callbacks;
- derived `isReframeMode`, `isRetakeMode` and panel content/controller data.

Keep `ReframePanel` and `RetakePanel` implementations unchanged.

### `useGenSpaceController`

Acts as a composition root, not another giant implementation file. It should:

- read project/app contexts;
- call profile hooks;
- call one `useGeneration()` instance;
- compose mode, settings, media, video-tool, action, persistence and gallery hooks;
- return small controller objects for the page, sidebar, gallery and overlays.

If `useGenSpaceController` starts accumulating domain logic, move that logic into one of the focused hooks rather than letting the god component become a god hook.

### Render-performance rules

1. Memoise panel controller objects only when their contents are stable enough to make memoisation useful.
2. Use `useCallback` for callbacks crossing memoised boundaries.
3. Avoid wrapping every tiny value in `useMemo`; unnecessary memoisation makes code harder to follow.
4. Do not pass `currentProject` wholesale into mode panels.
5. Keep gallery props independent from prompt value.
6. Add `React.memo` to `GenSpaceGallery` and top-level panels only after profiling demonstrates a useful boundary.

### Tests

Add tests for pure mode transitions and settings normalisation. Add component tests proving state survives:

- Image → Video → Image;
- Video Generate → Reframe → Generate;
- custom lyrics toggling;
- switching projects where applicable;
- profile changes that invalidate resolution/aspect choices.

### Exit criteria

- `GenSpace.tsx` no longer directly owns most generation-form state.
- Each panel receives a typed controller/prop contract.
- One generation hook instance remains.
- Existing mode transition behaviour is unchanged.
- Prompt typing and mode switching remain immediate.

### Suggested commit

```text
refactor(genspace): introduce persistent panel controllers
```

---

## Phase 6 — Extract generation request construction and actions

### Objective

Replace the large branching `handleGenerate` implementation with explicit, typed, testable per-mode commands.

### New files

```text
frontend/views/genspace/logic/generation-requests.ts
frontend/views/genspace/hooks/useGenSpaceGenerationActions.ts
frontend/views/genspace/hooks/useGenSpacePromptEnhancement.ts
```

If `generation-requests.ts` becomes too broad, split it by mode:

```text
build-image-generation.ts
build-video-generation.ts
build-music-generation.ts
build-reframe-generation.ts
```

### Pure command builders

Create pure builders that receive already-resolved state and return command objects:

```ts
buildImageGenerationCommand(...)
buildVideoGenerationCommand(...)
buildMusicGenerationCommand(...)
buildReframeGenerationCommand(...)
buildRetakeGenerationCommand(...)
```

These builders should handle the existing rules:

#### Image

- prompt trimming/validation;
- selected profile;
- resolution/aspect/steps/variations;
- conversion of attached media URLs to paths;
- input roles and types.

#### Video Generate

- text-to-video, image-to-video and audio-to-video path selection;
- start frame and audio role resolution;
- video guide roles;
- guide trim start/duration;
- automatic duration from trimmed guide media;
- Continue Video duration label/semantics;
- forcing the legacy model mode to Pro when audio currently requires it;
- source-audio toggle;
- profile, resolution, FPS, aspect and audio settings.

#### Reframe

- blank prompt fallback to `outpaint`;
- minimum trim duration;
- rounded/clamped duration;
- control-video role;
- aspect mode, padding and trim values;
- audio disabled.

#### Retake

- source path and trim values;
- prompt;
- current retake mode value;
- disabled availability gate.

#### Music

- profile;
- description;
- instrumental/auto/custom vocal tab;
- one always-visible lyrics prompt with inline seed/Compose/Think controls;
- generation-time Auto and empty-Custom lyric composition;
- Cover Song and Transfer Timbre inputs;
- duration, BPM, time signature, key/scale;
- generation-time LM Chain Of Thought enhancement;
- variations.

### Submission snapshots

Before starting a job, capture an immutable typed snapshot:

```text
ImageSubmissionSnapshot
VideoSubmissionSnapshot
MusicSubmissionSnapshot
ReframeSubmissionSnapshot
RetakeSubmissionSnapshot
```

A snapshot contains everything required to persist the result later. This prevents a user changing the visible prompt/settings during a long job from corrupting the result metadata.

This is a correctness hardening, but it must be implemented with tests proving the persisted schema remains the same.

### `useGenSpaceGenerationActions`

Owns:

- `submitImage`;
- `submitVideo`;
- `submitMusic`;
- `submitReframe`;
- `submitRetake`;
- `submitActiveMode` if useful;
- per-mode `canSubmit` derivation;
- submission snapshot refs;
- calls to the single existing generation controller.

The panels should never know about endpoint paths or positional `generate(...)` arguments.

### Prompt enhancement

Move `handleEnhancePrompt` to `useGenSpacePromptEnhancement`:

- preserve existing mode restrictions;
- preserve input-image selection;
- preserve error handling;
- preserve prompt replacement behaviour;
- do not expose enhancement in Music unless separately implemented.

### Tests

Use table-driven tests for command builders:

1. Image with no input.
2. Image with several role-tagged references.
3. Video text-to-video.
4. Video with start/end frames.
5. Video with audio guide.
6. Video with video guide and trim-driven duration.
7. Continue Video.
8. Reframe with blank and non-blank prompt.
9. Music instrumental.
10. Music auto-lyrics.
11. Music custom lyrics.
12. Invalid custom lyrics/can-submit state.
13. Disabled Retake.

Where practical, compare the command output against captured baseline request data rather than only checking individual fields.

### Performance constraints

- The refactor must not add an extra request-building render cycle that matters to the user.
- Pure builders run only on submit, not on every keystroke.
- No new polling loop is introduced.
- Do not deep-clone large project asset arrays; snapshots should include only the values needed for persistence.

### Exit criteria

- There is no large mode-branching generation handler in `GenSpace.tsx`.
- Request rules are testable without React.
- Panels receive simple `submit` callbacks.
- Request payloads/commands are equivalent to baseline.
- Generation, cancellation, progress and model-download reporting remain unchanged.

### Suggested commits

```text
refactor(genspace): extract typed generation command builders
refactor(genspace): isolate generation actions and prompt enhancement
```

---

## Phase 7 — Extract result persistence, Copy Settings and external hand-offs

### Objective

Remove the side-effect-heavy completion/restoration logic from the page while preserving exact project asset behaviour.

### New files

```text
frontend/views/genspace/logic/generation-assets.ts
frontend/views/genspace/logic/settings-restore.ts
frontend/views/genspace/hooks/useGenSpaceResultPersistence.ts
frontend/views/genspace/hooks/useGenSpaceSettingsRestore.ts
frontend/views/genspace/hooks/useGenSpaceExternalHandoffs.ts
```

### Pure generated-asset builders

Create pure functions that build the `Omit<Asset, "id" | "createdAt">` payloads before file-copy side effects:

```text
buildGeneratedImageAsset
buildGeneratedVideoAsset
buildGeneratedMusicAsset
buildReframeAsset
buildRetakeTakeMetadata
```

They must preserve current `generationParams`, including:

- mode;
- prompt;
- model/profile IDs;
- duration/resolution/FPS/audio;
- image aspect/steps;
- input media URLs, paths, roles, types and trim metadata;
- reframe aspect, padding and trim fields;
- music schema version, requested/resolved lyrics, requested/actual duration, musical metadata and variation count;
- takes and active take index.

### `useGenSpaceResultPersistence`

Owns completion effects for:

- video;
- image variations;
- music variations as takes;
- reframe;
- retake.

Requirements:

1. Consume immutable submission snapshots from Phase 6.
2. Preserve idempotency keys so React rerenders cannot add duplicate assets.
3. Reset the relevant key when persistence fails so retry remains possible.
4. Copy/move generated files through the existing `copyToAssetFolder` helper.
5. Call `reset()` only after successful persistence, matching current behaviour.
6. Keep async side effects cancellable/guarded against project switches where necessary.
7. Log failures through the existing logger.
8. Do not add multiple effects watching the same result without a clear ownership rule.

A useful internal structure is one public hook that composes focused private hooks:

```text
usePersistImageResults
usePersistVideoResult
usePersistMusicResult
usePersistRetakeResult
```

### Copy Settings restoration

Move GenSpace-specific restoration to `settings-restore.ts` and `useGenSpaceSettingsRestore`.

Preserve:

- `genSpaceModeFromParams` behaviour;
- input media URL/path recovery;
- legacy image/audio input restoration;
- image/video/music settings restoration;
- reframe initial source/aspect/padding restoration;
- delayed media restoration until profiles are loaded;
- duplicate/stale blob URL handling.

Keep generic project-media recovery helpers in `frontend/lib/apply-generation-params.ts`; move only GenSpace-domain orchestration out of that shared file.

### External hand-offs

Move these ProjectContext-driven effects into `useGenSpaceExternalHandoffs`:

- editor frame → Video Generate input;
- editor audio → Video Generate audio input;
- incoming Retake source → existing disabled message/current handling;
- any future Director/editor hand-offs.

The hook must clear consumed context values exactly once.

### Seed synchronisation

Seed state may remain in a dedicated small hook or be included in settings restoration, but it must preserve:

- project-specific seed lock/value;
- app-settings update;
- project-switch synchronisation;
- clamping through existing helpers.

### Tests

Add tests for:

- generated image asset metadata;
- generated video input metadata;
- guide trim persistence;
- reframe fields;
- music variations represented as takes;
- stale submission state not affecting a completed result;
- Copy Settings for image/video/music/reframe;
- legacy media URL/path recovery;
- idempotency key behaviour using a small hook test if practical.

### Exit criteria

- `GenSpace.tsx` contains no generated-result persistence effects.
- Copy Settings and editor hand-offs are isolated.
- Exactly one asset/take set is created per completed result.
- Metadata remains compatible with existing projects.
- Project switching during/after generation does not write to the wrong project.

### Suggested commits

```text
refactor(genspace): extract generated asset persistence
refactor(genspace): isolate settings restoration and editor handoffs
```

---

## Phase 8 — Extract gallery controller, view and overlays

### Objective

Separate the generation workspace from gallery interaction and prevent prompt edits from unnecessarily traversing the full gallery tree.

### New files

```text
frontend/views/genspace/GenSpaceGallery.tsx
frontend/views/genspace/GenSpaceOverlays.tsx
frontend/views/genspace/hooks/useGenSpaceGallery.ts
```

Optionally split overlays if they remain large:

```text
GenSpaceAssetPreviewDialog.tsx
GenSpaceTakesDialog.tsx
GenSpaceDialogs.tsx
```

### `useGenSpaceGallery`

Owns:

- asset filtering;
- favourites;
- selected bin;
- bin create/rename/delete/colour;
- grid/list state and card size;
- visible-document preview enablement;
- gallery import and drag-over state;
- duplicate-filename choice promise;
- toast state;
- selected asset;
- takes dialog asset;
- context menu state and selected IDs;
- delete request integration;
- Copy Settings/Create Video/Reframe callbacks supplied by the GenSpace controller.

Do not move shared gallery implementation into GenSpace. Continue using `GalleryAssetLibrary` as the reusable view.

### `GenSpaceGallery`

Acts as a GenSpace-specific adapter around `GalleryAssetLibrary` and owns:

- GenSpace empty states;
- generation-progress leading card;
- import-progress card;
- gallery drop overlay;
- fixed left offset/sidebar relationship;
- current gallery callbacks.

It should not receive the prompt string, image settings, video settings or music settings.

### `GenSpaceOverlays`

Owns presentation for:

- asset preview/lightbox;
- previous/next navigation;
- prompt copy state;
- takes selection;
- asset context menu;
- duplicate filename dialog;
- delete confirmation;
- generation/local error dialog.

Keep data mutations in the controller/hooks; overlays remain focused views.

### Performance work

After extraction:

1. Profile typing in the prompt.
2. Ensure `GenSpaceGallery` props remain stable when only the prompt changes.
3. Add `React.memo(GenSpaceGallery)` if the stable boundary prevents unnecessary commits.
4. Avoid recreating large arrays or render callbacks unnecessarily.
5. Keep current hover-preview media behaviour and visibility gating.

Do not apply broad memoisation before measuring. Stale callbacks in gallery actions are more dangerous than an occasional harmless rerender.

### Tests/manual checks

- File drop to gallery.
- Duplicate filename Reuse/Suffix/Cancel.
- Type/source filters.
- Favourites.
- Bin create/rename/delete/assign/colour.
- Grid/list and card size.
- Asset preview navigation.
- Audio/video/image preview.
- Take selection.
- Copy Settings.
- Create Video and Reframe actions.
- Delete confirmation.
- Generation progress and cancellation card.

### Exit criteria

- Gallery state/JSX no longer dominates `GenSpace.tsx`.
- Prompt editing does not cause avoidable gallery commits where memoisation can safely prevent them.
- All gallery behaviour matches baseline.
- No gallery rewrite has occurred.

### Suggested commit

```text
refactor(genspace): isolate gallery controller and overlays
```

---

## Phase 9 — Split the shared generation hook behind a compatibility facade

### Objective

Complete the logic split by reducing the repeated request/progress lifecycle inside `frontend/hooks/use-generation.ts`, without changing its public behaviour or forcing simultaneous Director changes.

This phase begins only after GenSpace itself is stable.

### Target files

```text
frontend/hooks/use-generation.ts
frontend/hooks/generation/types.ts
frontend/hooks/generation/progress.ts
frontend/hooks/generation/request-builders.ts
frontend/hooks/generation/useGenerationJob.ts
```

### Compatibility strategy

Keep `use-generation.ts` as the public facade initially:

```ts
export function useGeneration(): UseGenerationReturn {
  const job = useGenerationJob();
  // expose generate, generateImage, generateMusic, generateDirector,
  // cancel and reset with the same caller-facing behaviour
}
```

This protects Director and any other callers while internals are reorganised.

### `useGenerationJob`

Owns exactly one:

- generation state object/reducer;
- `AbortController`;
- active polling interval;
- cancellation path;
- reset path;
- terminal success/error/cancel state handling.

It should expose a generic internal runner configured by a domain adapter:

```ts
runJob({
  endpoint,
  body,
  initialStatus,
  formatProgress,
  interpretResponse,
});
```

### Extract pure request builders

Move backend-body creation out of hook callbacks:

```text
buildVideoRequestBody
buildDirectorRequestBody
buildImageRequestBody
buildMusicRequestBody
```

Preserve:

- field names and string/boolean conversions;
- role-to-media-type inference;
- reframe normalisation;
- image profile vs legacy dimensions;
- endpoint paths;
- response compatibility for old/new image path formats.

### Extract progress helpers

Move to `progress.ts`:

- `getPhaseMessage`;
- `normaliseProgressResponse`;
- video inference interpolation;
- image variation status formatting;
- music variation status formatting.

The polling cadence remains 500 ms unless a separately approved performance change is made.

### Concurrency and cleanup requirements

- Starting a new job must not leave an earlier interval running.
- Polling updates must stop after the POST resolves or aborts.
- Terminal polling state must not overwrite the final POST response.
- Cancel must target the same backend cancellation route.
- Unmount must clear active intervals and abort/ignore updates safely.
- There must still be one job state per `useGeneration()` instance, not one per mode adapter.

### Tests

Add pure tests for every request builder and progress formatter. Add hook tests for:

- success;
- backend error;
- abort/cancel;
- interval cleanup;
- no polling update after terminal response;
- image result path compatibility;
- music result mapping;
- Director facade compatibility.

Use fake timers and stub `backendFetch` at the smallest possible boundary. Do not introduce production abstractions merely to make tests convenient.

### Exit criteria

- `use-generation.ts` is a readable facade/composition file.
- Request and progress logic are in focused modules.
- GenSpace and Director callers need little or no change.
- Polling/network behaviour matches the baseline.
- No bundle or runtime regression is observed.

### Suggested commit

```text
refactor(generation): split shared job lifecycle behind compatibility facade
```

---

## Phase 10 — Final composition, performance validation and documentation

### Objective

Remove temporary compatibility code, confirm final architecture, and document how future modes should be added.

### Expected final `GenSpace.tsx`

The page should read approximately like this:

```tsx
export function GenSpace() {
  const controller = useGenSpaceController();

  return (
    <div {...controller.workspace.rootProps}>
      <GenSpaceGallery controller={controller.gallery} />

      <aside className="absolute inset-y-0 left-0 z-20 w-[480px]">
        <GenSpaceSidebar controller={controller.sidebar} />
      </aside>

      <GenSpaceOverlays controller={controller.overlays} />
    </div>
  );
}
```

The exact props can differ, but mode-specific request logic, media role logic, persistence effects and gallery implementation should not be in this file.

### Cleanup tasks

1. Remove temporary aliases and obsolete duplicated types.
2. Remove unused imports, refs, effects and legacy setters.
3. Confirm no GenSpace settings handlers use `any`.
4. Confirm guide/audio role lists have one source of truth.
5. Confirm no panel imports project context directly unless there is a compelling documented reason.
6. Confirm no panel calls `useGeneration()`.
7. Confirm no inactive panel remains mounted with hidden video/audio elements.
8. Update:
   - `.projectmem/PROJECT_MAP.md`;
   - `.projectmem/summary.md` through the normal project-memory workflow;
   - `AGENTS.md` key file locations;
   - a new `docs/GENSPACE_ARCHITECTURE.md`.
9. Document the pattern for adding a future generation type:
   - define settings/types;
   - create explicit panel;
   - add request builder/action;
   - add persistence builder;
   - extend mode tabs and parity tests.

### Final validation commands

```powershell
pnpm typecheck
pnpm test:frontend
pnpm backend:test
pnpm build:frontend
```

Run the packaged/dev Electron smoke test because browser-only component tests cannot fully validate filesystem drops, native paths and media playback.

### Performance comparison

Compare against Phase 0:

- production renderer bundle size;
- initial GenSpace load responsiveness;
- mode-switch responsiveness;
- prompt typing responsiveness with a large gallery;
- number of gallery renders while typing;
- number/cadence of progress requests;
- generation start latency;
- memory behaviour after repeated tab switches and media replacements.

Acceptable result:

- no meaningful regression;
- ideally fewer gallery commits while typing;
- no additional network requests;
- no additional persistent media elements/listeners;
- no visible tab-switch loading state.

### Suggested commit

```text
docs(genspace): document final modular architecture
```

---

# 9. UX and behaviour parity matrix

Every row must be checked after Phases 3, 5, 7, 8 and 9.

## Common sidebar behaviour

- [ ] Sidebar remains 480 px wide at the current desktop layout.
- [ ] Top mode tabs remain sticky and ordered Image / Video / Music.
- [ ] Sidebar scroll behaviour and section borders match baseline.
- [ ] Enter submits; Shift+Enter inserts a newline.
- [ ] Generate is disabled while invalid or running.
- [ ] Seed lock/value persist and clamp correctly.
- [ ] Prompt enhancement availability and loading state match baseline.
- [ ] Error dialog text/dismissal matches baseline.
- [ ] Model-download state appears in both dropdown/progress surfaces as currently designed.

## Image

- [ ] Default profile, resolution and aspect match baseline.
- [ ] Profile fallback changes unsupported resolution/aspect correctly.
- [ ] Profiles without image inputs show no input strip.
- [ ] Input count respects profile maximum.
- [ ] Default role comes from profile policy.
- [ ] Role selection and descriptions remain available.
- [ ] File picker and gallery drag work.
- [ ] Removing/replacing an input works.
- [ ] Variations generate and persist as currently designed.
- [ ] Copy Settings restores profile, output settings and all media.

## Video Generate

- [ ] Default model/profile/settings match baseline.
- [ ] Start and end frame slots remain distinct.
- [ ] Only one start and one end frame are retained.
- [ ] Combined guide slot accepts supported video/audio types.
- [ ] Guide role menu options and labels match baseline.
- [ ] Guide trim editor opens, plays, seeks and confirms correctly.
- [ ] Trim duration controls automatic generated duration where expected.
- [ ] Continue Video uses extension semantics rather than normal guide-duration semantics.
- [ ] Source-audio toggle behaviour is unchanged.
- [ ] Audio input enforces current aspect/model rules.
- [ ] Resolution changes clamp duration as before.
- [ ] Generated metadata includes all media roles/paths/trim fields.

## Video Reframe/Retake

- [ ] Reframe panel source, trim, padding, aspect and prompt behave identically.
- [ ] Blank reframe prompt submits `outpaint` as before.
- [ ] Reframe duration and resolution display match baseline.
- [ ] Reframe result persistence and Copy Settings work.
- [ ] Retake remains disabled and shows the same availability explanation.
- [ ] Existing incoming-retake handling remains unchanged.

## Music

- [ ] Default music profile/settings match baseline.
- [ ] Instrumental, Auto Lyrics and Custom Lyrics modes work.
- [ ] The merged lyrics prompt and its seed/Compose/Think controls stay visible
  but disabled outside Custom Lyrics.
- [ ] Auto Lyrics and empty Custom Lyrics compose hidden lyrics during
  generation; vocal Cover Song still requires original custom lyrics.
- [ ] Cover Song and Transfer Timbre map to WanGP `A`, `B`, and `AB`.
- [ ] Duration bounds and steps follow the profile.
- [ ] BPM, time signature and key/scale support follow profile policy.
- [ ] Variations are persisted as takes on one audio asset.
- [ ] Requested/resolved lyrics and actual duration metadata remain intact.
- [ ] Copy Settings restores music settings and lyrics.

## Gallery and project integration

- [ ] Empty states match baseline.
- [ ] OS drop imports supported files.
- [ ] Duplicate filename Reuse/Suffix/Cancel works.
- [ ] Filters, favourites and bins work in combination.
- [ ] Grid/list and card-size controls work.
- [ ] Image/video/audio preview works.
- [ ] Previous/next preview navigation works.
- [ ] Takes dialog and active take selection work.
- [ ] Context menu actions work.
- [ ] Delete confirmation works.
- [ ] Create Video and Reframe shortcuts populate the correct panel.
- [ ] Project switching does not leak media/settings/results between projects.
- [ ] Generation completion creates exactly one expected project asset/take set.

---

# 10. Performance and responsiveness guardrails

## Must not change

- Generation still starts through the existing local backend APIs.
- Progress polling cadence remains unchanged during this refactor.
- Only one active polling interval exists per generation job.
- Switching tabs performs no network request.
- Source splitting does not use lazy loading initially.
- No panel mounts an independent project/gallery context tree.
- No inactive panel keeps video/audio playback elements alive.

## Desired improvements

- Prompt typing should no longer force meaningful rerenders of the gallery tree.
- Mode panels should receive only relevant state, reducing render surface.
- Pure request builders should run only on submission.
- Profile/media normalisation should execute only when its dependencies change.
- Repeated role arrays and media scans should be centralised and, where meaningful, represented by `Set`s.

## How to measure

Use React DevTools Profiler in development with a representative project containing many assets:

1. Record typing 20 characters in the prompt.
2. Record switching Image → Video → Music → Image.
3. Record opening/closing a media role menu.
4. Record starting/cancelling generation.
5. Compare gallery commit count and duration before/after.

Use browser/Electron network tools to confirm one `/api/generation/progress` loop while running and zero loops when idle.

Bundle comparison should distinguish source modularity from actual code splitting: static imports may leave total bundle size roughly unchanged, which is acceptable. The key requirement is no meaningful increase.

---

# 11. Risk register

| Risk | Likely cause | Mitigation |
|---|---|---|
| Settings/media reset after tab switch | State moved inside conditionally rendered panel | Keep all critical state in always-mounted controller hooks. |
| Duplicate progress requests | One `useGeneration` per panel or leaked interval | One workspace instance; interval cleanup tests. |
| Duplicate project assets | Persistence effects rerun after extraction | Preserve idempotency keys and submission snapshots; add tests. |
| Wrong metadata after long generation | Persistence reads live mutable settings | Capture immutable submission snapshot before POST. |
| Profile normalisation loop | Effect writes a newly created settings object every render | Compare fields and patch only when values actually differ. |
| Gallery becomes slower | Large controller object changes on every prompt keystroke | Separate gallery controller; stable callbacks; profile before memoising. |
| Stale gallery actions | Aggressive memoisation/useCallback with missing dependencies | Prefer correctness; use exhaustive dependencies and focused tests. |
| Drag/drop regression | Replacing explicit handlers with over-generic slot logic | Keep explicit image/video wrappers and test both gallery and filesystem drops. |
| Broken local file previews | Incorrect object URL revocation or path conversion | Revoke only owned blob URLs; keep project file URLs untouched. |
| Circular imports | Broad barrel exports across panels/hooks/logic | Use direct imports until architecture is stable. |
| Director regression | Rewriting `use-generation.ts` directly | Phase 9 compatibility facade and Director-specific tests. |
| UI drift | Class/DOM cleanup mixed with extraction | Mechanical move first; screenshot parity at each major phase. |
| Larger initial bundle/tab delay | Dynamic imports introduced prematurely | Static imports for this refactor. |
| Hidden performance cost | All panels kept mounted to preserve state | Externalise state and render only active panel. |

---

# 12. Testing strategy

## Pure unit tests

Recommended files:

```text
frontend/views/genspace/logic/mode-transitions.test.ts
frontend/views/genspace/logic/media-inputs.test.ts
frontend/views/genspace/logic/generation-requests.test.ts
frontend/views/genspace/logic/generation-assets.test.ts
frontend/views/genspace/logic/settings-restore.test.ts
frontend/hooks/generation/progress.test.ts
frontend/hooks/generation/request-builders.test.ts
```

These provide the highest confidence with the least brittle UI coupling.

## Focused component tests

Test interactions rather than full markup snapshots:

- main and video mode tabs;
- custom lyrics visibility and validation;
- prompt Enter/Shift+Enter;
- role selection/removal;
- Generate button state;
- settings/profile fallback display;
- state persistence across panel switches.

Avoid giant snapshots of the full sidebar; they create noisy diffs and do not prove behaviour.

## Manual Electron checks

Required because jsdom cannot fully represent:

- native `File.path`;
- Electron preload APIs;
- filesystem import/copy;
- local `file://` media playback;
- real video/audio metadata and seeking;
- drag from the AiVS gallery;
- drag from Windows Explorer;
- model generation and cancellation.

## Validation cadence

After every commit:

```powershell
pnpm typecheck:ts
pnpm test:frontend
pnpm build:frontend
```

After each phase and before merge:

```powershell
pnpm typecheck
pnpm test:frontend
pnpm backend:test
pnpm build:frontend
```

---

# 13. Commit and review strategy

Use a sequence of small reviewable commits. Do not submit one 4,000-line move-and-rewrite diff.

Recommended sequence:

1. Baseline/test harness.
2. Canonical types/constants.
3. Move sidebar intact.
4. Extract Image panel.
5. Extract Video panel.
6. Extract Music panel.
7. Shared prompt controls.
8. Shared media controls.
9. Controller/state hooks.
10. Generation request/action logic.
11. Persistence/restore/handoffs.
12. Gallery/overlays.
13. Shared generation-hook internals.
14. Cleanup/docs.

### Review guidance

For mechanical move commits, reviewers should use whitespace-insensitive/moved-code diff views where possible.

Every commit message/PR section should state:

- what responsibility moved;
- whether behaviour intentionally changed;
- validation performed;
- known follow-up work.

If a real bug is discovered, either:

1. fix it in a separate clearly labelled commit with a regression test; or
2. record it and defer it until the structural phase is complete.

Do not hide bug fixes inside a “no behaviour change” commit.

---

# 14. Definition of done

The refactor is complete only when all of the following are true:

## Architecture

- [ ] `ImageGenPanel.tsx`, `VideoGenPanel.tsx` and `MusicGenPanel.tsx` each own their complete visible panel below the main tabs.
- [ ] `GenSpace.tsx` is a thin composition page.
- [ ] Generation-critical state is outside conditionally mounted panels.
- [ ] There is exactly one `useGeneration()` instance for GenSpace.
- [ ] Request construction is pure and mode-specific.
- [ ] Result persistence is isolated and idempotent.
- [ ] Gallery state/view are isolated from prompt editing.
- [ ] Shared media/prompt components are reused without a universal flag-heavy form abstraction.
- [ ] There is one canonical media-input type and one source of truth for media-role groups.
- [ ] Shared generation types no longer live in `SettingsPanel.tsx`.

## Behaviour

- [ ] Full parity matrix passes.
- [ ] Existing project files and `generationParams` remain compatible.
- [ ] Copy Settings works for image, video, music and reframe.
- [ ] Model download/progress/cancel/error behaviour is unchanged.
- [ ] No generated result is persisted twice.
- [ ] No critical state is lost on panel switches.

## Quality

- [ ] New GenSpace code contains no avoidable `any` types.
- [ ] Typecheck, frontend tests, backend tests and frontend build pass.
- [ ] The final architecture is documented in `docs/GENSPACE_ARCHITECTURE.md` and project maps.
- [ ] No dead compatibility code remains without a documented reason.

## Performance

- [ ] No extra network requests or polling intervals.
- [ ] No visible panel-switch delay.
- [ ] No meaningful bundle-size regression.
- [ ] No inactive hidden media elements/listeners.
- [ ] Prompt typing with a large gallery is no worse and preferably produces fewer gallery commits.

---

# 15. Explicit non-goals

This refactor does not include:

- redesigning the GenSpace UI;
- changing labels, spacing or visual hierarchy;
- adding new generation settings or modes;
- enabling Retake;
- changing model profiles or WanGP mappings;
- rewriting `GalleryAssetLibrary`;
- replacing React context with Redux/Zustand;
- creating a schema-driven universal generation form;
- adding lazy-loaded panels;
- changing storage paths or project schema without migration;
- refactoring the entire Video Editor or ProjectContext at the same time.

Those areas may receive their own later plans after GenSpace is stable.

---

# 16. Recommended follow-on work after this plan

Once the GenSpace split is merged and proven stable, use the same principles on other hotspots in separate efforts:

1. `VideoEditor.tsx`: split workspace layout, timeline controller, preview, asset-library adapter, editor commands and modals.
2. `ProjectContext.tsx`: extract persistence and domain mutation services while retaining the current provider contract.
3. `GalleryAssetLibrary.tsx`: further separate card rendering, toolbar and list/grid shell if its change surface continues to grow.
4. Shared generation transport: continue reducing duplicated progress/request code only through stable compatibility facades.

Do not begin these as part of the GenSpace PR. Keeping the scope narrow is itself a maintainability and risk-control measure.
