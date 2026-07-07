# Phase 4 Brief — Curated Image Model Expansion + Model Capability Profiles

## Context

Phases 0–3 are complete.

AiVS can now generate images locally through WanGP using the inherited QuickGen/GenSpace flow. Phase 4 is to expand image model support in a controlled, maintainable way.

The next target image model is **Krea 2 Turbo**, which WanGP already supports. The current working image model is **Z-Image Turbo**.

The main user-facing UI change is:

> In Image mode, the existing model selector should become active and allow users to choose between curated image models, starting with:
>
> - Z-Image Turbo
> - Krea 2 Turbo

The model selector already works in video generation mode. Reuse and extend that existing pattern. Do not create a parallel model-selection system unless the current implementation genuinely cannot be extended.

---

## Core problem

WanGP supports many models, features, resolutions, and aspect ratios. AiVS should not expose all of them directly.

AiVS needs a lightweight, easy-to-update **curated model profile layer** that bridges the gap between:

1. the simple frontend UX, and
2. the more flexible WanGP model/settings system.

This model profile layer should control:

- which models appear in the AiVS UI;
- which media type each model supports;
- which WanGP `model_type` should be sent;
- which inputs/features are visible;
- which aspect ratios are available;
- which resolution tiers are available;
- which exact `WxH` resolution is sent to WanGP;
- whether reference images are supported;
- whether LoRA should be available later;
- whether the model is stable, experimental, installed, missing, or unavailable.

Do **not** automatically expose every WanGP-supported model or every WanGP-supported resolution.

---

## Important implementation principle

WanGP is the upstream generation/runtime layer.

AiVS model profiles are the product-facing curated layer.

That means:

```text
WanGP tells us what can exist.
AiVS decides what should be visible.
```

The frontend should not scrape or infer arbitrary WanGP options directly into the UI.

The backend/profile layer should validate that each curated profile still maps to a real WanGP-supported model, but the curated profile remains the source of truth for what AiVS exposes.

---

## Do not change inherited systems unnecessarily

Preserve the inherited LTX-Desktop-WanGP systems wherever possible.

Do not rebuild:

- project system;
- gallery;
- generation cards;
- metadata/history system;
- backend architecture;
- frontend routing;
- existing WanGP bridge pattern;
- video model selector behaviour.

Only extend the existing image generation path enough to support curated image model selection.

---

## Recommended architecture

Add a small curated model profile registry.

Prefer a single source of truth, ideally backend-owned and exposed to the frontend through an API endpoint, unless the existing codebase already has a better central config pattern.

Possible shape:

```ts
type MediaType = "image" | "video" | "audio" | "tts";

type AspectRatio = "1:1" | "16:9" | "9:16";

type ResolutionTier = "540p" | "720p" | "1080p" | "1440p" | "2160p";

type ModelProfile = {
  id: string;
  displayName: string;
  mediaType: MediaType;
  visible: boolean;
  status: "stable" | "experimental" | "hidden";

  wangp: {
    modelType: string;
    defaultSettings?: Record<string, unknown>;
  };

  capabilities: {
    textToImage?: boolean;
    referenceImages?: boolean;
    controlImage?: boolean;
    inpainting?: boolean;
    lora?: "supported" | "unsupported" | "future" | "experimental";
  };

  ui: {
    defaultAspectRatio: AspectRatio;
    defaultResolutionTier: ResolutionTier;
    allowedAspectRatios: AspectRatio[];
    allowedResolutionTiers: ResolutionTier[];
  };

  limits?: {
    minResolutionTier?: ResolutionTier;
    maxResolutionTier?: ResolutionTier;
    wangpResolutionCategories?: string[];
  };
};
```

This does not need to be exactly this shape. Adapt it to the existing TypeScript/Python patterns in the project.

The important thing is that the map is:

- easy to update;
- explicit;
- model-aware;
- not scattered through `GenSpace.tsx`;
- not duplicated between frontend and backend;
- validated before generation.

---

## Initial profiles

Start with two visible image profiles.

### Z-Image Turbo

Purpose:

- preserve the existing working Phase 3 baseline;
- keep it as the known-good model.

Suggested profile:

```json
{
  "id": "z_image_turbo",
  "displayName": "Z-Image Turbo",
  "mediaType": "image",
  "visible": true,
  "status": "stable",
  "wangp": {
    "modelType": "z_image"
  },
  "capabilities": {
    "textToImage": true,
    "referenceImages": false,
    "controlImage": false,
    "inpainting": false,
    "lora": "future"
  },
  "ui": {
    "defaultAspectRatio": "1:1",
    "defaultResolutionTier": "720p",
    "allowedAspectRatios": ["1:1", "16:9", "9:16"],
    "allowedResolutionTiers": ["540p", "720p", "1080p"]
  }
}
```

Use the exact current working WanGP `model_type` from the existing Phase 3 implementation if it differs from `z_image`.

### Krea 2 Turbo

Purpose:

- add Krea 2 Turbo as the next curated image model;
- keep the UX simple;
- do not expose all WanGP Krea-specific advanced settings yet.

Suggested profile:

```json
{
  "id": "krea2_turbo",
  "displayName": "Krea 2 Turbo",
  "mediaType": "image",
  "visible": true,
  "status": "experimental",
  "wangp": {
    "modelType": "krea2_turbo",
    "defaultSettings": {
      "image_mode": 1,
      "num_inference_steps": 8,
      "guidance_scale": 0
    }
  },
  "capabilities": {
    "textToImage": true,
    "referenceImages": false,
    "controlImage": false,
    "inpainting": false,
    "lora": "future"
  },
  "ui": {
    "defaultAspectRatio": "1:1",
    "defaultResolutionTier": "720p",
    "allowedAspectRatios": ["1:1", "16:9", "9:16"],
    "allowedResolutionTiers": ["540p", "720p", "1080p", "1440p"]
  },
  "limits": {
    "minResolutionTier": "540p",
    "maxResolutionTier": "1440p",
    "wangpResolutionCategories": ["<=2k"]
  }
}
```

Mark Krea 2 Turbo as `experimental` until it has been smoke-tested end-to-end inside AiVS.

Do not expose Krea 2 Raw in this phase unless explicitly requested later.

---

## Resolution and aspect ratio curation

AiVS should expose a curated resolution/aspect-ratio set, not WanGP’s full list.

For Phase 4, expose only:

```text
Aspect ratios:
- 1:1
- 16:9
- 9:16

Minimum resolution tier:
- 540p
```

Do not expose:

- 21:9;
- 9:21;
- 4:3;
- 3:4;
- 3:2;
- 2:3;
- 8:3;
- 4:7;
- 4K/2160p by default;
- every WanGP custom resolution.

The UI should show simple labels such as:

```text
Aspect ratio: 1:1 / 16:9 / 9:16
Resolution: 540p / 720p / 1080p / 1440p
```

The backend/profile layer should map those simple choices to exact WanGP `WxH` values.

---

## Exact resolution selection rule

WanGP may contain more than one resolution for the same apparent tier and aspect ratio.

Example:

```text
1080p 1:1 may include:
- 1440x1440
- 1088x1088
```

AiVS should choose only one.

Rule:

> For each model + resolution tier + aspect ratio, choose the exact WanGP resolution that is closest to the “true” expected size for that tier/aspect ratio, preferring lower pixel count when there is ambiguity.

Examples:

```text
1080p, 16:9 → 1920x1088
1080p, 9:16 → 1088x1920
1080p, 1:1 → 1088x1088, not 1440x1440

720p, 16:9 → 1280x720
720p, 9:16 → 720x1280
```

For square resolutions, avoid exposing multiple square options in the same tier. Pick one curated value only.

If a tier/aspect-ratio combination does not have a sensible WanGP-supported value, do not invent one and do not show that combination.

For example, if 540p has no suitable 1:1 option, then 540p can be hidden when 1:1 is selected, or 1:1 can start at 720p.

---

## Suggested resolution resolver behaviour

Implement or adapt a resolver that works like this:

1. Get the candidate WanGP resolutions for the selected model.
2. Apply model-specific WanGP limits where known, such as `resolutions_categories: ["<=2k"]`.
3. Filter out any resolution below AiVS minimum tier, currently 540p.
4. Filter to AiVS-supported aspect ratios only:
   - 1:1
   - 16:9
   - 9:16

5. Group candidates by:
   - resolution tier;
   - aspect ratio.

6. Pick one exact `WxH` value per group using the “closest to true size” rule.
7. Return clean frontend options.
8. During generation, send the selected exact `WxH` value to WanGP.

The frontend should never send a vague value like `1080p` to WanGP. It should send the exact resolved value, e.g. `1920x1088`.

---

## Model switching behaviour

When the user switches image models:

1. Keep the current aspect ratio if the new model supports it.
2. Keep the current resolution tier if the new model supports it.
3. If not, fall back to the nearest supported option.
4. Prefer the selected model’s default aspect ratio and resolution if there is no sensible match.
5. Do not silently keep an invalid resolution from the previous model.

Example:

```text
User is on Z-Image Turbo, 1080p, 16:9.
User switches to Krea 2 Turbo.
If Krea supports 1080p 16:9, keep it.

User is on a model with 1440p.
User switches to a model capped at 1080p.
Fallback to 1080p.
```

---

## Frontend tasks

Update the existing QuickGen image mode UI so that:

- the existing `ModelSelector` works in image mode;
- image models come from the curated profile list;
- only visible image profiles are shown;
- the selected model controls available aspect ratios;
- the selected model controls available resolution tiers;
- unsupported controls are hidden or disabled;
- reference image input is hidden/disabled for models where `referenceImages` is false;
- advanced Krea/WanGP-specific settings are not exposed yet.

Do not redesign the whole `GenSpace` view.

Do not rewrite gallery/generation cards.

---

## Backend tasks

The backend should:

- expose curated image model profiles to the frontend;
- validate that requested model/profile IDs are allowed;
- translate the selected AiVS profile ID into a WanGP `model_type`;
- merge model default settings with user-selected generation settings;
- resolve simple UI choices into exact WanGP settings;
- reject invalid model/resolution/aspect-ratio combinations with a friendly error;
- optionally query WanGP API discovery/schema/availability to confirm the model exists and whether files are available.

Generation requests should ideally use an AiVS-facing ID such as:

```json
{
  "mediaType": "image",
  "modelProfileId": "krea2_turbo",
  "aspectRatio": "16:9",
  "resolutionTier": "1080p",
  "prompt": "..."
}
```

The backend should then translate this into WanGP settings such as:

```json
{
  "model_type": "krea2_turbo",
  "prompt": "...",
  "resolution": "1920x1088",
  "image_mode": 1,
  "num_inference_steps": 8,
  "guidance_scale": 0
}
```

If the existing request shape already sends `model_type` directly, adapt carefully and keep backwards compatibility where practical, but avoid letting arbitrary frontend-provided WanGP model types bypass the curated profile layer.

---

## WanGP discovery usage

Use WanGP discovery/schema/availability as validation and runtime intelligence, not as the raw UI source.

Useful WanGP API calls include:

- list image model metadata;
- get one model schema;
- get default settings;
- get model availability.

The ideal flow:

```text
AiVS profile registry says which models are allowed.
WanGP discovery confirms whether those models currently exist and are installed.
Frontend displays stable/missing/experimental states.
Generation only proceeds for allowed + available models.
```

Do not switch the whole integration to MCP for this phase. Continue using the existing in-process WanGP bridge unless there is a specific reason it cannot support discovery.

---

## Reference image behaviour

Do not assume all image models support reference images.

For Phase 4:

- keep reference image support model-aware;
- hide or disable reference input when unsupported;
- do not expose WanGP control/inpaint/reference variants unless the profile explicitly supports them;
- do not map “reference image” to a WanGP control image field unless tested.

For the first two profiles, treat both Z-Image Turbo and Krea 2 Turbo as normal prompt-to-image models unless testing confirms otherwise.

---

## LoRA behaviour

Phase 5 is the LoRA MVP, not Phase 4.

For Phase 4:

- include LoRA capability fields in model profiles;
- do not build the LoRA UI yet unless it already exists cleanly;
- do not expose LoRA selection as part of adding Krea 2 Turbo;
- make sure the profile structure can support LoRA later.

---

## Friendly model availability states

The UI should be able to distinguish:

```text
Available
Missing model files
Partially installed
Unsupported by current WanGP install
Experimental
Hidden
```

If Krea 2 Turbo is selected but unavailable, show a friendly message rather than a raw WanGP traceback.

Example:

```text
Krea 2 Turbo is supported by AiVS, but the required WanGP model files are not installed yet.
```

Do not implement a full model downloader unless the current codebase already has the necessary pattern and it is small to wire up.

---

## Testing / smoke checks

Add lightweight tests or manual smoke checks for:

1. Image mode shows exactly:
   - Z-Image Turbo
   - Krea 2 Turbo

2. Video mode model selector still behaves as before.

3. Switching image model updates available resolutions/aspect ratios.

4. Invalid frontend model IDs are rejected.

5. Invalid resolution/profile combinations are rejected.

6. Z-Image Turbo still generates end-to-end.

7. Krea 2 Turbo generates end-to-end if installed.

8. Reference image input is hidden/disabled for unsupported profiles.

9. Gallery/output behaviour is unchanged.

10. Generation metadata records the selected AiVS profile ID, display name, WanGP model type, aspect ratio, and exact resolution.

---

## Acceptance criteria

Phase 4 is complete when:

- image mode model selector works;
- Z-Image Turbo and Krea 2 Turbo are visible image model options;
- model options are driven by curated profiles, not hardcoded directly in `GenSpace`;
- each model controls its visible features/resolutions/aspect ratios;
- only curated aspect ratios are exposed: 1:1, 16:9, 9:16;
- only curated resolution tiers are exposed, minimum 540p;
- duplicate same-aspect-ratio resolution options are collapsed to one best option;
- the backend validates model/profile/resolution choices before calling WanGP;
- generation still routes through WanGP only;
- inherited project/gallery/generation-card behaviour remains unchanged;
- Z-Image Turbo still works after the refactor;
- Krea 2 Turbo can be selected and tested without breaking the existing image baseline.
