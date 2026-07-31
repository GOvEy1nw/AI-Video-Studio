# GenSpace architecture

`frontend/views/GenSpace.tsx` is the route entry. It renders
`GenSpaceWorkspace`, which composes the sidebar, gallery, and overlays from one
always-mounted controller.

## Composition

```text
GenSpace
└─ GenSpaceWorkspace
   ├─ useGenSpaceController
   │  ├─ mode/settings/media/video-tool state
   │  ├─ one useGeneration instance
   │  ├─ generation actions and immutable snapshots
   │  ├─ result persistence and settings restoration
   │  └─ gallery controller
   ├─ GenSpaceSidebar
   │  ├─ image/ImageGenPanel
   │  ├─ video/VideoGenPanel
   │  └─ music/MusicGenPanel
   ├─ GenSpaceSelectedGeneration
   ├─ GenSpaceGallery
   └─ GenSpaceOverlays
```

Only the active panel is rendered. Generation-critical state lives in hooks
above the panels, so tab switches do not reset settings or create hidden media
elements.

The center detail header uses the selected asset prompt and keeps Copy Settings
beside it. Asset Library grid cards are square, crop image/video media with
`object-cover`, and never autoplay audio or video on hover.

Mode-owned UI and helpers live under `image/`, `video/`, or `music/`.
Cross-mode controls remain in `components/`; cross-mode state, effects, and
pure workflow logic remain in `hooks/` and `logic/`. Keep these folders direct
and shallow rather than adding one-file `views/components/lib` subfolders.

## Ownership

| Area | Owner |
| --- | --- |
| Main/image/video mode transitions | `hooks/useGenSpaceModeState.ts` |
| Typed image/video/music settings | `hooks/useGenSpaceSettingsState.ts` |
| Prompt and attached media | `hooks/useGenSpaceMediaInputs.ts` |
| Reframe/Retake panel state | `hooks/useGenSpaceVideoTools.tsx` |
| Image panel UI | `image/` |
| Video, Reframe, Retake, and trim UI | `video/` |
| Shared Image/Video Reframe framing UI | `components/ReframeEditor.tsx` |
| Shared image/video input crop UI and geometry | `components/MediaCropPopover.tsx` and `logic/media-crop.ts` |
| Music panel, media, lyrics settings, advanced settings, compiler, and keywords | `music/` |
| Per-mode command construction | `logic/generation-requests.ts` |
| Submission and immutable snapshots | `hooks/useGenSpaceGenerationActions.ts` |
| Generated asset metadata | `logic/generation-assets.ts` |
| Completion persistence/idempotency | `hooks/useGenSpaceResultPersistence.ts` |
| Copy Settings | `logic/settings-restore.ts` and `hooks/useGenSpaceSettingsRestore.ts` |
| Editor/context hand-offs | `hooks/useGenSpaceExternalHandoffs.ts` |
| Gallery selection/state/actions | `hooks/useGenSpaceGallery.ts` |
| Selected asset/current generation detail | `GenSpaceSelectedGeneration.tsx` |
| Narrow gallery and dialog presentation | `GenSpaceGallery.tsx` and `GenSpaceOverlays.tsx` |

Panels receive mode-specific controller contracts. They do not import project
context, call backend endpoints, persist assets, or instantiate
`useGeneration`.

## Media input crop contract

- Populated image/video input slots expose a hover crop action. Audio inputs
  never do.
- Crop interaction uses a directly movable/resizable crop box with Freeform,
  1:1, 4:3, 3:4, 16:9, and 9:16 modes. No crop sliders are used.
- Slots store normalized crop recipes. Generated asset metadata preserves
  those recipes so Copy Settings restores them.
- Source assets are immutable. Image/video handlers create temporary cropped
  derivatives only when generation starts, pass those derivatives to WanGP,
  and remove them after success, error, or cancellation.
- Video crop runs before an optional input trim. Source audio remains
  available on cropped video derivatives.

## Image contract

- Image mode exposes Create, Edit, and Region as distinct process modes.
  Edit owns a dedicated master-image workflow while reusing the common prompt
  and output controls. Region owns a dedicated Ideogram 4 structured prompt
  editor.
- Model choices are process-specific. Create exposes Flux 2 Klein 4B/9B,
  Krea 2 Turbo, Z-Image Turbo, Qwen Image, and HiDream O1. Edit exposes
  Flux 2 Klein 4B/9B, Krea 2 Edit, Qwen Image Edit, and HiDream O1.
  Region exposes only Ideogram 4 Standard and TurboTime.
- Edit stores one full-width `Edit Image` master separately from optional
  reference images. Normal prompt/reference editing sends the master first;
  additional references follow within the selected profile's total image
  limit.
- A populated master is a non-replaceable preview with an explicit remove
  action. Removing it returns the area to its image drop zone.
- `Edit`, `Retouch`, and `Reframe` tabs sit directly below the master area.
  All three workflows use one full-width canvas sized to the source image
  aspect. Retouch and Reframe place compact controls in the fixed-height
  `Edit Image` header, so switching workflows does not change panel height.
  Reframe fits the target frame's longest side to that canvas. Reference
  inputs remain visible but disabled and dimmed outside Edit.
- Retouch uses normalized ordered brush, rectangle, and ellipse operations.
  Reframe stores a preset target aspect plus normalized padding. Image and
  Video use the same `ReframeEditor` for zoom, pan, reset, and frame layout.
  Resolution and the shared aspect-ratio dropdown live in that editor's control row. Only the active workflow's references,
  mask, or outpaint recipe is submitted; backend combined-recipe support
  remains for saved-data compatibility.
- Retouch and Reframe tabs remain visible but disabled unless the selected
  profile exposes the corresponding native capability. Flux 2 Klein 4B/9B,
  Krea 2 Edit, and Qwen Image Edit support both. HiDream O1 remains
  prompt/reference-only.
- A visual input makes output aspect input-driven in Image Create, Edit,
  Retouch, and Video Generate. The aspect selector is disabled while
  resolution remains an editable pixel budget. Audio-only input does not lock
  aspect. Reframe is the exception: its authored frame remains the output
  aspect, so Image Reframe omits the separate output aspect selector.
- AiVS starts WanGP with `fit_canvas=0`, matching WanGP's Resolution Budget
  behavior. Retouch also reallocates its temporary guide/mask canvas to the
  master image aspect before native masked denoising; Reframe keeps its
  authored target canvas.
- Masked Edit always maps to WanGP native masked denoising with
  `image_mode=2`, `model_mode=0`, and `VAG` (`VAGI` with supported
  references). AiVS never selects LanPaint modes `2..5`.
- Backend rasterizes temporary output-sized guide/mask PNGs, combining
  inpaint selections with outpaint canvas regions, then removes both files
  after success, error, or cancellation.
- Generated Edit assets persist the master plus active references, mask, or
  outpaint recipe. Copy Settings restores the separate master, active
  workflow, model, aspect, and authored prompt.
- Region renders a box canvas in the selected generation aspect ratio.
  Movable/resizable boxes store normalized `0..1000` bboxes in Ideogram's
  `[y_min, x_min, y_max, x_max]` order and support object or exact-text
  elements.
- Region presents Global Prompt (collapsed), Region, and Style disclosures in
  that order. Global Prompt owns high-level/background text; Region owns the
  canvas, selected element, Seed, Resolution, and Aspect Ratio controls; Style owns medium, editable
  art/lighting/aesthetic prompts, camera settings, and color swatches.
- Region exposes 16 optional global color swatches and six per-element
  swatches progressively, showing one empty slot after the chosen colors plus
  a used/maximum count. Text elements use exact Text Copy plus separate
  common-font and custom-font controls; bbox and swatches already express
  placement, size, and color.
- Medium uses a curated dropdown plus a custom-only text field. `photograph`
  replaces the Art Style prompt with the shared Camera Settings popover and
  compiles its exact recipe into `style_description.photo`; other media expose
  inline plus popovers for presets and compile editable comma-separated Art
  Style prompt text into `style_description.art_style`. Lighting and
  Aesthetics follow the same editable prompt pattern.
- Submission serializes compact JSON in Ideogram's caption shape and bypasses
  generic prompt enhancement so the structure is not rewritten.
- Generated assets persist the submitted JSON through existing prompt
  metadata. Copy Settings detects Ideogram profiles and reconstructs Region
  state from that JSON; plain legacy prompts become high-level descriptions.
- Prompt-prefix framing is available in Image Create and Video Generate.
  Applied camera, lens, focal length, aperture, shutter, and ISO stay outside
  the authored prompt, appear as a compact prompt-area indicator, and compile
  into the immutable submission prompt as `Shot on ...` at generation time.
- Framing applies after optional prompt enhancement so the camera prefix keeps
  its exact user-selected values. Generated asset prompt metadata stores the
  final effective prompt sent for generation.
- Image Create/Edit and Video Generate keep their output Duration, Resolution,
  and Aspect Ratio controls in the prompt editor footer. Reframe moves
  Resolution and Aspect Ratio into its editor control row. Media-owned disabled
  aspect controls display `Auto`. Aspect
  choices use one icon-labelled grid ordered as `1:1`, then paired
  landscape/portrait rows for `16:9`, `21:9`, `4:3`, and `3:2`.
  Video Generate duration uses a continuous 2-20 second slider.

## Music contract

- Music has one full settings mode. `experienceMode: "advanced"` remains only
  for saved-generation compatibility.
- `MusicMediaInputs` owns independent Cover Song and Transfer Timbre slots.
  The backend maps none/Cover/Timbre/both to WanGP audio tasks `""`, `A`, `B`,
  and `AB`.
- Instrumental, Auto Lyrics, and Custom Lyrics share one three-way tab.
  Custom Lyrics shows the lyrics editor, seed, Compose Lyrics, Think, and vocal
  controls. Auto Lyrics hides the editor but keeps vocal controls.
  Instrumental hides both the editor and vocal controls. Compose treats the
  current text as an idea and replaces it with the composed lyrics.
- Auto Lyrics composes hidden lyrics from the song description during
  generation. Empty Custom Lyrics does the same with its optional idea,
  Think, and lyrics seed; vocal covers still require original custom lyrics.
- Description enhancement is a green generation-time toggle for WanGP music
  LM Chain Of Thought preprocessing, not an immediate prompt rewrite.
- Song Prompt keeps presets behind one inline plus popover grouped by Genre,
  Mood, Vibe, and Instruments. Multiple choices stay open for selection and
  append as ordinary editable comma-separated prompt text.
- Duration, BPM, Key & Scale, and Time Signature use icon popovers in the Song
  Prompt footer. Variations remains in Advanced Settings.

## Generation lifecycle

`frontend/hooks/use-generation.ts` remains the public compatibility facade for
GenSpace and Director. Pure transport builders and progress formatters live in
`frontend/hooks/generation/`; `useGenerationJob` owns the single state object,
abort controller, 500 ms polling interval, cancellation route, terminal-state
guard, and unmount cleanup.

Per-mode GenSpace builders run only on submission. Each successful submission
captures the project ID, prompt, settings, media roles/paths, crop recipes, and
trim data needed to persist the result. Completion effects consume that
snapshot rather than live UI state, use idempotency keys, and write to the
submission project even if the user switches projects.

## Compatibility and performance rules

- Existing backend endpoints, request field conversions, project schema, and
  `generationParams` remain compatible.
- Guide/audio role groups have one source in `genspace/constants.ts`.
- `GenerationSettings` lives in `frontend/types/generation.ts`.
- Panels use static imports; this refactor does not introduce tab loading.
- `GenSpaceGallery` is memoized and receives no prompt/settings values.
- Gallery library, progress badges, import callback, Copy Settings callback,
  and Reframe hand-off callbacks stay stable during prompt-only updates.
- Direct imports are preferred over a broad barrel while the architecture is
  evolving.

## Adding a generation mode

1. Define its settings, snapshot, and panel-controller types.
2. Add an explicit panel and mode tab while keeping persistent state in an
   always-mounted hook.
3. Add a pure GenSpace command builder and transport request builder if a new
   endpoint is required.
4. Dispatch through `useGenSpaceGenerationActions`; do not call
   `useGeneration` from the panel.
5. Add a pure asset builder and idempotent persistence path.
6. Extend settings restoration, focused tests, and the parity checklist.

Do not add a schema-driven universal form, a second project/gallery context,
an independent polling hook, or lazy-loaded panels without a separately
measured need.
