# Phase 4.1 Brief — Image Input Media Capabilities

## Context

Phases 0–4 are complete.

AiVS now has a backend-owned curated image model profile layer in `backend/model_profiles/`, exposed to the frontend through `GET /api/model-profiles`.

Phase 4 added profile-driven image model selection, curated aspect ratios/resolution tiers, backend validation, and profile-based WanGP model routing.

Recent Phase 4 schema work also added `wangpMetadata` to each profile response. This mirrors the common WanGP metadata shape extracted from the full Wan2GP model metadata JSON files:

- `family`, `familyLabel`, `baseModelType`, `finetune`;
- `mainOutput`, `outputs`, `inputs`;
- `mediaInputs`;
- raw WanGP `capabilities`;
- raw WanGP `settingValues`.

Use `wangpMetadata` as the local verification source before adding curated Phase 4.1 roles. Do not scrape WanGP live from the frontend.

Phase 5 was originally planned as LoRA MVP, but before implementing LoRA, add support for the other major image-model capabilities that already belong in the profile layer:

- reference images;
- control images;
- inpainting/mask-style image input where WanGP supports it;
- hidden WanGP model variant routing where one user-facing model needs a different WanGP model type depending on whether image input is used.

This should be treated as **Phase 4.1 — Image Input Media Capabilities**, not as Phase 5.

Phase 5 should remain LoRA.

---

## Goal

Add simple, model-aware input-image support to QuickGen image mode without exposing raw WanGP complexity.

The user should be able to:

1. Select an image model.
2. See an input media area only if the selected model supports image inputs.
3. Add one or more input images where supported.
4. Click an added input image to choose how AiVS should use it:

- reference image;
- main subject / landscape reference;
- people / object reference;
- transfer human pose;
- transfer depth;
- transfer canny edges;
- inpainting, if supported later;
- remove.

5. Generate through WanGP only.
6. Have the backend validate and translate the simple AiVS input selections into the correct WanGP settings.

The UI should stay simple and curated.

Do not expose raw WanGP dropdown labels directly unless they are the best available user-facing wording.

---

## Non-goals

Do not implement LoRA in this phase.

Do not redesign GenSpace.

Do not rebuild the gallery, generation cards, project system, metadata system, or backend architecture.

Do not expose every WanGP input mode automatically.

Do not expose every WanGP model variant as a separate model in the main model selector unless there is a strong product reason.

Do not switch to WanGP MCP. Continue using the existing in-process WanGP bridge.

---

## Core principle

Continue the Phase 4 rule:

```text
WanGP tells us what can exist.
AiVS decides what should be visible.
```

WanGP model schemas/default settings/discovery should be used for validation and implementation guidance.

AiVS model profiles remain the source of truth for what the product exposes.

---

## Important terminology

Use **Input Media** as the user-facing section name unless the existing UI already has a better name.

Use **Input Image** as the generic item label.

Do not call every input image a “reference image”, because some image inputs are control images.

In code and profiles, distinguish:

```text
reference image = image used as visual identity/content guidance
control image = image processed into structure guidance, such as pose/depth/canny
inpaint image/mask = image/mask used for inpainting
```

---

## Existing ModelProfile compatibility note

The current backend profile class already has broad capability fields:

```python
text_to_image: bool = False
reference_images: bool = False
control_image: bool = False
inpainting: bool = False
lora: LoraSupport = "future"
```

It also now has raw WanGP metadata:

```python
wangp_metadata: WanGPModelMetadata
```

Treat these as two different layers:

```text
top-level capabilities = AiVS curated UI contract
wangp_metadata.capabilities/media_inputs/setting_values = raw WanGP support data
```

Raw WanGP support does not automatically mean AiVS exposes that capability. Example: Krea 2 Turbo raw metadata reports mask/inpainting support, but Phase 4.1 can still keep Krea image inputs disabled if inpainting UI is deferred.

Do not replace these fields with a new `supportsImageInputs` field.

Instead, derive whether a profile supports image inputs from the existing fields:

```python
profile.reference_images or profile.control_image or profile.inpainting
```

For Phase 4.1, keep the existing flat capability flags and add only the missing per-role information needed by the UI and WanGP bridge.

Recommended additions:

```python
ImageInputKind = Literal["reference", "control", "inpaint"]

ImageInputRole = Literal[
    "reference_subject",
    "reference_people_objects",
    "control_image",
    "control_pose",
    "control_depth",
    "control_canny",
    "inpaint",
]


@dataclass(frozen=True)
class ImageInputRoleProfile:
    """One curated user-facing input-image role for a model profile.

    This describes what the user sees and how the backend maps that choice
    to WanGP. The frontend should receive role, label, description, and kind.
    Internal WanGP setting values should remain backend-owned.
    """

    role: ImageInputRole
    label: str
    kind: ImageInputKind
    description: str = ""

    # Backend-only WanGP translation hints.
    wangp_settings: dict[str, object] = field(default_factory=dict[str, object])

    # Optional hidden routing override, used for cases like Z-Image Turbo where
    # the user-facing profile stays the same but the actual WanGP model type
    # changes when a control image is used.
    wangp_model_type_override: str | None = None
```

Then extend `ModelProfile` minimally:

```python
@dataclass(frozen=True)
class ModelProfile:
    """A curated AiVS model profile.

    The exact ``WxH`` resolution sent to WanGP is resolved per
    ``(tier, aspect)`` by the resolution resolver — the frontend never
    sends a vague label like ``1080p`` to WanGP, only the resolved value.
    """

    id: str
    display_name: str
    media_type: MediaType
    visible: bool
    status: ProfileStatus
    wangp_model_type: str
    wangp_metadata: WanGPModelMetadata
    wangp_default_settings: dict[str, object] = field(default_factory=dict[str, object])

    text_to_image: bool = False
    reference_images: bool = False
    control_image: bool = False
    inpainting: bool = False
    lora: LoraSupport = "future"

    default_aspect_ratio: AspectRatio = "1:1"
    default_resolution_tier: ResolutionTier = "720p"
    allowed_aspect_ratios: tuple[AspectRatio, ...] = ("1:1", "16:9", "9:16")
    allowed_resolution_tiers: tuple[ResolutionTier, ...] = (
        "540p",
        "720p",
        "1080p",
    )
    min_resolution_tier: ResolutionTier | None = None
    max_resolution_tier: ResolutionTier | None = None
    wangp_resolution_categories: tuple[str, ...] = ()

    # Phase 4.1 additions.
    image_input_roles: tuple[ImageInputRoleProfile, ...] = ()
    default_image_input_role: ImageInputRole | None = None
    max_image_inputs: int = 0
    image_input_tooltip: str | None = None
```

Do not add a separate `supportsImageInputs` field unless there is a strong reason. It can be computed:

```python
def supports_image_inputs(profile: ModelProfile) -> bool:
    return profile.reference_images or profile.control_image or profile.inpainting
```

or:

```python
def supports_image_inputs(profile: ModelProfile) -> bool:
    return len(profile.image_input_roles) > 0
```

Prefer using both as a consistency check:

```python
has_capability_flag = profile.reference_images or profile.control_image or profile.inpainting
has_roles = len(profile.image_input_roles) > 0

if has_capability_flag != has_roles:
    raise ValueError(f"Model profile {profile.id} has inconsistent image input capability config")
```

Also verify curated roles against `profile.wangp_metadata`:

```python
if role.kind == "reference":
    assert profile.wangp_metadata.media_inputs["image"]["reference"]

if role.kind == "control":
    assert profile.wangp_metadata.media_inputs["image"]["control"]
```

## Example profiles

### Krea 2 Turbo

Krea 2 Turbo currently has no image input support in AiVS.

WanGP metadata currently reports `media_inputs.image.mask=true` and `capabilities.inpainting=true` for Krea 2 Turbo. Do not turn that into a visible Phase 4.1 input-media feature unless inpainting/mask UI is explicitly implemented in this phase. For the simple Phase 4.1 input-media MVP, keep Krea image inputs disabled.

```python
ModelProfile(
    id="krea2_turbo",
    display_name="Krea 2 Turbo",
    media_type="image",
    visible=True,
    status="experimental",
    wangp_model_type="krea2_turbo",
    wangp_default_settings={
        "image_mode": 1,
        "num_inference_steps": 8,
        "guidance_scale": 0,
    },
    text_to_image=True,
    reference_images=False,
    control_image=False,
    inpainting=False,
    lora="future",
    image_input_roles=(),
    default_image_input_role=None,
    max_image_inputs=0,
    image_input_tooltip=None,
)
```

### Flux 2 Klein

Flux 2 Klein supports reference images and some control/mask-style image inputs.

Current extracted metadata for `flux2_klein_4b` confirms:

```text
media_inputs.image.reference = true
media_inputs.image.multiple_references = true
media_inputs.image.control = true
media_inputs.image.mask = true
settingValues.video_prompt_type.image_ref_choices values = "", "KI", "I"
settingValues.video_prompt_type.guide_preprocessing values = "", "PV", "MV"
settingValues.video_prompt_type.mask_preprocessing values = "", "A", "NA"
```

It does **not** expose `DV` or `EV` in the current extracted metadata, so do not add Transfer Depth or Transfer Canny Edges for Flux unless a later WanGP schema/export proves those values are accepted.

```python
ModelProfile(
    id="flux2_klein_4b",
    display_name="Flux 2 Klein",
    media_type="image",
    visible=True,
    status="experimental",
    wangp_model_type="flux2_klein_4b",
    text_to_image=True,
    reference_images=True,
    control_image=True,
    inpainting=False,
    lora="future",
    image_input_roles=(
        ImageInputRoleProfile(
            role="reference_subject",
            label="Subject / Scene Reference",
            kind="reference",
            description="Use the image as the main subject, scene, or landscape guide.",
            wangp_settings={
                "image_ref_choice": "KI",
            },
        ),
        ImageInputRoleProfile(
            role="reference_people_objects",
            label="People / Object Reference",
            kind="reference",
            description="Use the image as a people/object reference.",
            wangp_settings={
                "image_ref_choice": "I",
            },
        ),
        ImageInputRoleProfile(
            role="control_pose",
            label="Transfer Human Pose",
            kind="control",
            description="Extract and transfer human pose from the image.",
            wangp_settings={
                "guide_preprocessing": "PV",
            },
        ),
    ),
    default_image_input_role="reference_subject",
    max_image_inputs=1,
    image_input_tooltip="Reference or Control",
)
```

`MV` exists in Flux metadata, but the user-facing meaning needs confirmation before exposing it. Add a new curated role only after naming it clearly and verifying the expected image path/settings.

### HiDream O1

HiDream should follow a similar profile shape, but it currently has a broader control preprocessing set than Flux.

Current extracted metadata for `hidream_o1_dev` confirms:

```text
media_inputs.image.reference = true
media_inputs.image.multiple_references = true
media_inputs.image.control = true
media_inputs.image.mask = false
settingValues.video_prompt_type.image_ref_choices values = "", "KI", "I"
settingValues.video_prompt_type.guide_preprocessing values = "", "V", "PV", "DV", "EV"
```

```python
reference_images=True
control_image=True
inpainting=False
default_image_input_role="reference_subject"
image_input_tooltip="Reference or Control"
```

Use profile roles to expose only verified HiDream-supported options.

### Z-Image Turbo

Z-Image Turbo should remain one user-facing profile.

The normal text-only route should use the standard Z-Image Turbo WanGP model type.

When a supported control-image role is used, the backend may route to the hidden control variant using `wangp_model_type_override` on the relevant role.

```python
ModelProfile(
    id="z_image_turbo",
    display_name="Z-Image Turbo",
    media_type="image",
    visible=True,
    status="stable",
    wangp_model_type="z_image",
    text_to_image=True,
    reference_images=False,
    control_image=True,
    inpainting=False,
    lora="future",
    image_input_roles=(
        ImageInputRoleProfile(
            role="control_image",
            label="Use Image Unchanged",
            kind="control",
            description="Use the image directly as a control guide without preprocessing.",
            wangp_settings={
                "guide_preprocessing": "V",
            },
            wangp_model_type_override="z_image_control",
        ),
        ImageInputRoleProfile(
            role="control_pose",
            label="Transfer Human Pose",
            kind="control",
            description="Extract and transfer human pose from the image.",
            wangp_settings={
                "guide_preprocessing": "PV",
            },
            wangp_model_type_override="z_image_control",
        ),
        ImageInputRoleProfile(
            role="control_depth",
            label="Transfer Depth",
            kind="control",
            description="Extract and transfer depth structure from the image.",
            wangp_settings={
                "guide_preprocessing": "DV",
            },
            wangp_model_type_override="z_image_control",
        ),
        ImageInputRoleProfile(
            role="control_canny",
            label="Transfer Canny Edges",
            kind="control",
            description="Extract and transfer edge structure from the image.",
            wangp_settings={
                "guide_preprocessing": "EV",
            },
            wangp_model_type_override="z_image_control",
        ),
    ),
    default_image_input_role="control_image",
    max_image_inputs=1,
    image_input_tooltip="Control Only",
)
```

`z_image_control` is based on the extracted metadata snapshot. The agent must still confirm it exists in the installed/current WanGP schema before final implementation.

Current extracted metadata includes these relevant WanGP model types:

```text
z_image          = text-only base profile
z_image_control  = control image variant
z_image_control2 = control + mask/inpainting variant
z_image_control2_1 = control + mask/inpainting variant
```

For Phase 4.1 control-only routing, `z_image_control` is the likely hidden override. Use `z_image_control2`/`z_image_control2_1` only if inpainting/mask support is intentionally included and verified.

If that hidden variant is missing/unavailable:

- text-only Z-Image Turbo should still work;
- control-image input should be hidden, disabled, or rejected with a friendly `CONTROL_VARIANT_UNAVAILABLE` error;
- do not expose the variant as a separate user-facing model unless explicitly requested later.

## Frontend profile response

The frontend already receives the current backend shape:

```ts
type ModelProfile = {
  id: string;
  displayName: string;
  mediaType: string;
  visible: boolean;
  status: "stable" | "experimental" | "hidden";
  wangpModelType: string;
  wangpMetadata: ModelProfileWanGPMetadata;
  capabilities: ModelProfileCapabilities;
  ui: ModelProfileUi;
  availability: ModelProfileAvailability;
};
```

Do not flatten this response back into the older draft shape.

The frontend does not need backend-only WanGP role mapping fields such as `wangp_settings` or `wangp_model_type_override`.

Expose only safe UI fields:

```ts
type ImageInputRoleProfileResponse = {
  role: ImageInputRole;
  label: string;
  kind: "reference" | "control" | "inpaint";
  description: string;
};

type ModelProfileResponse = {
  id: string;
  displayName: string;
  mediaType: "image" | "video" | "audio" | "tts";
  visible: boolean;
  status: "stable" | "experimental" | "hidden";
  wangpModelType: string;
  wangpMetadata: ModelProfileWanGPMetadata;

  capabilities: {
    textToImage: boolean;
    referenceImages: boolean;
    controlImage: boolean;
    inpainting: boolean;
    lora: "supported" | "unsupported" | "future" | "experimental";
  };

  ui: {
    defaultAspectRatio: AspectRatio;
    defaultResolutionTier: ResolutionTier;
    allowedAspectRatios: AspectRatio[];
    allowedResolutionTiers: ResolutionTier[];
  };

  inputMedia: {
    supportsImageInputs: boolean;
    roles: ImageInputRoleProfileResponse[];
    defaultRole: ImageInputRole | null;
    maxImages: number;
    tooltipLabel: string | null;
  };
};
```

The frontend should decide whether to show image input from:

```ts
const supportsImageInput =
  profile.capabilities.referenceImages ||
  profile.capabilities.controlImage ||
  profile.capabilities.inpainting ||
  profile.inputMedia.roles.length > 0;
```

But the backend remains the final authority and must validate all input-media requests.

## Important agent warning

Do not rename the existing profile fields.

Do not replace `reference_images`, `control_image`, or `inpainting` with `supportsImageInputs`.

Do not move WanGP setting codes into the frontend.

Do not let the frontend send raw WanGP input settings.

Do not let raw frontend-provided model types bypass the curated profile layer.

Phase 4.1 should be an additive extension of the current Phase 4 profile system, not a profile-system rewrite.

## Model capability model

Extend the existing `ModelProfile` structure rather than creating a new registry.

The profile should be able to describe:

```ts
type ImageInputRole =
  | "reference_subject"
  | "reference_people_objects"
  | "control_image"
  | "control_pose"
  | "control_depth"
  | "control_canny"
  | "inpaint";

type ImageInputCapability = {
  role: ImageInputRole;
  label: string;
  description?: string;
  wangp: {
    imageRefChoice?: string;
    controlPreprocess?: string;
    controlImageProcess?: string;
    imagePromptType?: string;
    modelTypeOverride?: string;
    defaultSettings?: Record<string, unknown>;
  };
};

type ImageInputSupport = {
  supportsImageInputs: boolean; // response-only computed field
  maxImages?: number;
  defaultRole?: ImageInputRole;
  roles: ImageInputCapability[];
  tooltipLabel:
    | "Reference Only"
    | "Control Only"
    | "Reference or Control"
    | "Inpainting Only";
};
```

This is a suggested shape only. Adapt to the current backend Python dataclasses and frontend TypeScript types.

The important part is that the profile can answer:

- should the input media section be visible?
- what image input roles are available?
- what role should a newly added image default to?
- what WanGP setting values should each role map to?
- does a role require a hidden WanGP model type override?
- what should the tooltip say?

---

## Suggested user-facing role labels

Avoid exposing WanGP’s long labels raw in the main UI.

Use concise labels:

```text
Subject / Scene Reference
People / Object Reference
Use Image Unchanged
Transfer Human Pose
Transfer Depth
Transfer Canny Edges
Inpaint
Remove
```

Suggested explanations:

```text
Subject / Scene Reference
Use the first image as the main subject, scene, or landscape guide.

People / Object Reference
Use the image as a people/object reference rather than the whole scene.

Use Image Unchanged
Use the image directly as a control guide without preprocessing.

Transfer Human Pose
Extract and transfer human pose from the image.

Transfer Depth
Extract and transfer depth structure from the image.

Transfer Canny Edges
Extract and transfer edge structure from the image.

Inpaint
Use the image/mask for inpainting where supported.
```

The two WanGP “Inject Reference Images” options should be mapped to clearer AiVS names:

```text
WanGP:
Conditional Image is first Main Subject / Landscape and may be followed by People / Objects

AiVS:
Subject / Scene Reference
```

```text
WanGP:
Conditional Images are People / Objects

AiVS:
People / Object Reference
```

Do not over-explain these in the main UI. Use short tooltip/help text.

---

## Initial model capability rules

### Krea 2 Turbo

Krea 2 Turbo does not support image inputs for the current AiVS scope.

Profile:

```text
supportsImageInputs: false
roles: []
tooltip: none
```

UI:

- do not show the input image option;
- do not show the input media image drop zone;
- do not allow stale input images to remain active when switching to Krea 2 Turbo.

If the user switches from an input-capable model to Krea 2 Turbo:

- remove or disable image inputs for the generation request;
- ideally show a subtle message such as:
  “Krea 2 Turbo does not use input images, so image inputs were removed.”

Do not block model switching.

---

### Flux 2 Klein

Flux 2 Klein supports reference images and limited verified control/mask-style image inputs.

Profile should expose:

```text
supportsImageInputs: true
tooltipLabel: Reference or Control
defaultRole: reference_subject
roles:
- reference_subject
- reference_people_objects
- control_pose
```

Initial role mapping should be based on WanGP schema/default-settings where possible.

Expected WanGP concepts to map:

```text
Reference:
- image_ref_choices / injected reference images
- likely values:
  - "KI" for Subject / Scene Reference
  - "I" for People / Object Reference

Control:
- guide_preprocessing / control image process
- verified current values:
  - "" for No Control Image
  - "PV" or equivalent for Transfer Human Pose
  - "MV" exists in metadata but needs user-facing meaning before exposure
```

Do not guess silently if the exact field names differ. Inspect WanGP exported settings or `get_model_schema("flux2_klein_4b")` and wire the exact accepted fields.

---

### HiDream O1

HiDream O1 supports reference images and control images.

Profile should expose:

```text
supportsImageInputs: true
tooltipLabel: Reference or Control
defaultRole: reference_subject
roles:
- reference_subject
- reference_people_objects
- control_image
- control_pose
- control_depth
- control_canny
```

Expected WanGP concepts to map:

```text
Reference:
- image_ref_choices
- likely values:
  - "KI" for Subject / Scene Reference
  - "I" for People / Object Reference

Control:
- guide_preprocessing
- verified current values:
  - "" for no control
  - "V" for Use Control Image Unchanged
  - "PV" for Transfer Human Pose
  - "DV" for Transfer Depth
  - "EV" for Transfer Canny Edges
```

Confirm the exact setting names and values from WanGP schema/default settings before final implementation.

---

### Z-Image Turbo

Z-Image is special.

There should remain one user-facing model:

```text
Z-Image Turbo
```

Do not expose a separate “Z-Image Turbo Fun ControlNet 6B” model in the main model dropdown unless later explicitly requested.

Instead, route in the background:

```text
No input image:
  Use normal Z-Image Turbo WanGP model type.

Input image with control role:
  Use hidden Z-Image control WanGP model type, likely `z_image_control`.
```

For Z-Image Turbo:

```text
supportsImageInputs: true
tooltipLabel: Control Only
defaultRole: control_image
  roles:
  - control_image
  - control_pose, if supported by the ControlNet variant
  - control_depth, if supported by the ControlNet variant
  - control_canny, if supported by the ControlNet variant
```

Z-Image Turbo should not expose reference-image roles unless the WanGP model variant truly supports them.

If the user adds an image while Z-Image Turbo is selected:

- default it to a standard control image role;
- route generation to the ControlNet/Fun variant;
- store both the user-facing profile ID and actual WanGP model type in metadata.

Example metadata:

```json
{
  "imageProfileId": "z_image_turbo",
  "displayModelName": "Z-Image Turbo",
  "actualWangpModelType": "z_image_control",
  "inputImages": [
    {
      "role": "control_image",
      "path": "..."
    }
  ]
}
```

The exact WanGP model type string must be verified from the installed/current WanGP model schema or handler before implementation. Current extracted metadata includes `z_image_control`, `z_image_control2`, and `z_image_control2_1`; prefer `z_image_control` for control-only routing unless mask/inpainting is intentionally included.

If the ControlNet variant is unavailable/missing but the base Z-Image model is available:

- allow text-only Z-Image generation;
- hide or disable image input for Z-Image, or show a friendly “control variant missing” state;
- do not fail text-only Z-Image generation.

---

## Input media UI behaviour

Video gen already has input media ui elements so extend/reuse that where possible instead of creating a new solution just for image gen.

### Visibility

In image mode, show the image input option only when the selected model profile has:

```text
profile.inputMedia.supportsImageInputs: true
```

If the selected model does not support image inputs, hide the image input option.

Do not show disabled controls unless there is a clear UX benefit.

---

### Tooltip

When hovering the image input/drop area, show a simple capability tooltip based on the selected profile:

```text
Reference Only
Control Only
Reference or Control
```

Optional slightly longer tooltip:

```text
This model supports reference and control images.
```

or:

```text
This model supports control images only.
```

Avoid raw WanGP terms in the hover tooltip.

---

### Adding an image

When a user adds an input image:

1. create an input-media item;
2. assign the model profile’s `defaultRole`;
3. show the image thumbnail in the input media section;
4. allow clicking the thumbnail to open a dropdown/popover;
5. include available role choices from the selected model profile;
6. include a Remove action.

Default role behaviour:

```text
If the model supports reference images:
  default to Subject / Scene Reference.

If the model supports only control images:
  default to Use Image Unchanged.
```

This means:

```text
Flux 2 Klein → default Subject / Scene Reference
HiDream O1 → default Subject / Scene Reference
Z-Image Turbo → default Use Image Unchanged / Control Image
Krea 2 Turbo → no image input
```

---

### Popover/dropdown contents

The popover should be generated from profile roles.

Example for Flux 2 Klein with current extracted metadata:

```text
Subject / Scene Reference
People / Object Reference
Transfer Human Pose
Remove
```

Example for HiDream:

```text
Subject / Scene Reference
People / Object Reference
Use Image Unchanged
Transfer Human Pose
Transfer Depth
Transfer Canny Edges
Remove
```

Example for Z-Image Turbo:

```text
Use Image Unchanged
Transfer Human Pose
Transfer Depth
Transfer Canny Edges
Remove
```

Only show roles supported by the selected model.

Do not show reference roles for Z-Image unless confirmed.

Do not show control roles for Krea 2 Turbo.

---

### Switching models with existing input images

When the selected model changes:

1. Check if the new profile supports image inputs.
2. If not, clear image inputs from active generation settings.
3. If it supports image inputs, validate each existing input role.
4. If a role is unsupported by the new profile:

- convert it to the new profile’s default role if safe;
- otherwise remove it.

5. Do not silently submit invalid image input roles.

Recommended simple behaviour for MVP:

```text
If new model supports image inputs:
  keep image files, reset unsupported roles to new model default.

If new model does not support image inputs:
  clear image inputs.
```

---

## Backend request shape

Extend the image generation request with explicit input media.

Suggested shape:

```json
{
  "modelProfileId": "flux2_klein_4b",
  "aspectRatio": "16:9",
  "resolutionTier": "1080p",
  "prompt": "...",
  "inputMedia": [
    {
      "id": "local-ui-id",
      "type": "image",
      "path": "C:\\path\\to\\image.png",
      "role": "reference_subject"
    }
  ]
}
```

Do not let the frontend send arbitrary WanGP setting names/values for input handling.

The backend should translate AiVS roles into WanGP settings.

---

## Backend validation

Before calling WanGP, validate:

- selected `modelProfileId` exists and is visible/allowed;
- selected profile supports image inputs if `inputMedia` is non-empty;
- each input file exists;
- each input file is a valid image;
- each input role is supported by the selected profile;
- incompatible combinations are rejected with friendly 400 errors;
- if a role requires a model type override, that model variant is available;
- all final WanGP settings are derived from the curated profile and role mapping.

Possible friendly errors:

```text
IMAGE_INPUT_NOT_SUPPORTED
UNSUPPORTED_IMAGE_INPUT_ROLE
IMAGE_INPUT_FILE_NOT_FOUND
INVALID_IMAGE_INPUT_FILE
CONTROL_VARIANT_UNAVAILABLE
REFERENCE_IMAGE_NOT_SUPPORTED
CONTROL_IMAGE_NOT_SUPPORTED
```

Do not allow a client-provided raw model type to bypass the curated profile.

---

## WanGP translation rules

The backend should build WanGP settings from:

1. selected model profile;
2. selected aspect ratio/resolution tier;
3. selected input media roles;
4. role-specific WanGP mappings;
5. profile default settings;
6. `profile.wangp_metadata.setting_values` for accepted field/value verification.

Example conceptual translation:

```json
{
  "model_type": "flux2_klein_4b",
  "prompt": "...",
  "resolution": "1920x1088",
  "image_mode": 1,
  "num_inference_steps": 8,
  "image_refs": ["C:\\input.png"],
  "image_ref_choices": "KI"
}
```

For control image:

```json
{
  "model_type": "flux2_klein_4b",
  "prompt": "...",
  "resolution": "1920x1088",
  "image_mode": 1,
  "guide_image": "C:\\input.png",
  "guide_preprocessing": "PV"
}
```

These field names are examples. The agent must verify exact accepted WanGP setting names by using:

- the already-extracted `profile.wangp_metadata.setting_values`;
- WanGP Export Settings from the web UI;
- `WanGPSession.get_model_schema(model_type)`;
- `WanGPSession.get_default_settings(model_type)`;
- existing WanGP handler definitions.

Do not hardcode guessed WanGP fields without verification.

---

## Multiple input images

Keep Phase 4.1 simple.

Recommended MVP rule:

```text
Allow one input image initially.
```

This avoids ambiguity around mixing reference and control images.

If WanGP supports multiple reference images and the current UI already supports multiple input media cleanly, the backend/profile layer may allow more later.

For now:

- one image input is enough;
- the role picker is per-image;
- the profile can include `maxImages: 1`.

If implementing multiple images is already trivial because the inherited input media component supports it, still validate per model:

- reference roles may support multiple images;
- control roles should usually be limited to one active control image;
- do not allow multiple conflicting control roles unless WanGP explicitly supports it.

---

## Z-Image hidden variant routing

Implement Z-Image variant routing in the profile layer, not in GenSpace.

Suggested profile concept:

```python
ModelProfile(
    id="z_image_turbo",
    display_name="Z-Image Turbo",
    wangp_model_type="z_image",
    input_routing={
        "none": "z_image",
        "control_image": "z_image_control",
        "control_pose": "z_image_control",
        "control_depth": "z_image_control",
        "control_canny": "z_image_control",
    },
)
```

The frontend should not know or care that a different WanGP model type is used.

The backend should save both:

```text
user-facing profile ID
actual WanGP model type used
```

This makes generation metadata clear and debuggable without cluttering the UI.

---

## Metadata

Save image input information with generation metadata.

At minimum:

```json
{
  "imageProfileId": "flux2_klein_4b",
  "displayModelName": "Flux 2 Klein",
  "actualWangpModelType": "flux2_klein_4b",
  "aspectRatio": "16:9",
  "resolutionTier": "1080p",
  "resolvedResolution": "1920x1088",
  "inputMedia": [
    {
      "type": "image",
      "role": "control_depth",
      "roleLabel": "Transfer Depth",
      "sourcePath": "..."
    }
  ]
}
```

This should be additive to the inherited metadata system.

Do not redesign metadata storage unless the existing generation metadata cannot store these fields.

---

## Frontend implementation notes

Likely areas:

- `frontend/views/GenSpace.tsx`
- existing input media / reference input component used by video mode
- `frontend/hooks/use-generation.ts`
- `frontend/types/model-profiles.ts`
- `frontend/types/generation.ts`
- `frontend/types/project.ts`, if generation metadata types need extending

Reuse the existing input media UI where possible.

If video mode already has a section that displays image/audio input buttons, extend that pattern into image mode rather than building a completely new surface.

The image input button should appear in that section only when the selected image model supports image input.

---

## Backend implementation notes

Likely areas:

- `backend/model_profiles/profiles.py`
- `backend/model_profiles/resolution_resolver.py`, only if input routing affects supported resolution combos
- `backend/api_types.py`
- `backend/handlers/model_profiles_handler.py`
- `backend/handlers/image_generation_handler.py`
- `backend/services/wangp_bridge.py`
- `backend/tests/test_model_profiles.py`
- `backend/tests/test_generation.py`
- `backend/tests/fakes/fake_wangp_bridge.py`

Keep profile validation in the backend.

The frontend should display capabilities, but the backend must enforce them.

---

## Profile response shape

Extend `GET /api/model-profiles` so the frontend can render image input support.

Example response fragment:

```json
{
  "id": "flux2_klein_4b",
  "displayName": "Flux 2 Klein",
  "mediaType": "image",
  "wangpModelType": "flux2_klein_4b",
  "wangpMetadata": {
    "family": "flux2",
    "inputs": ["text", "image"],
    "mediaInputs": {
      "image": {
        "reference": true,
        "multiple_references": true,
        "control": true,
        "mask": true
      }
    }
  },
  "capabilities": {
    "textToImage": true,
    "referenceImages": true,
    "controlImage": true,
    "inpainting": false,
    "lora": "future"
  },
  "ui": {
    "defaultAspectRatio": "1:1",
    "defaultResolutionTier": "720p",
    "allowedAspectRatios": ["1:1", "16:9", "9:16"],
    "allowedResolutionTiers": ["540p", "720p", "1080p", "1440p"]
  },
  "inputMedia": {
    "supportsImageInputs": true,
    "tooltipLabel": "Reference or Control",
    "maxImages": 1,
    "defaultRole": "reference_subject",
    "roles": [
      {
        "role": "reference_subject",
        "label": "Subject / Scene Reference",
        "description": "Use the image as the main subject, scene, or landscape guide."
      },
      {
        "role": "reference_people_objects",
        "label": "People / Object Reference",
        "description": "Use the image as a people/object reference."
      },
      {
        "role": "control_pose",
        "label": "Transfer Human Pose",
        "description": "Extract and transfer human pose from the image."
      }
    ]
  }
}
```

Do not expose internal WanGP codes such as `KI`, `I`, `PV`, `DV`, `EV` as user-facing labels. `wangpMetadata` may contain those raw values for debugging/future use, but the curated `inputMedia.roles` block should drive the UI. The backend should own final role-to-setting mappings.

---

## Tests

Add or update backend tests for:

1. Profile response includes `inputMedia` capability data.
2. Krea 2 Turbo has `supportsImageInputs = false`.
3. Flux 2 Klein has reference roles and only verified control roles (`PV` currently; do not require depth/canny unless metadata changes).
4. HiDream O1 has reference and control roles.
5. Z-Image Turbo has control-only roles if the hidden ControlNet variant is available/curated.
6. Image input request to Krea 2 Turbo is rejected with 400.
7. Unsupported role for a profile is rejected with 400.
8. Missing image file is rejected with 400.
9. Invalid image file is rejected with 400.
10. Flux reference image request maps to the expected WanGP model type and settings.
11. Flux control image request maps to the expected WanGP model type and verified settings.
12. HiDream reference/control request maps to expected WanGP settings.
13. Z-Image text-only request uses normal Z-Image model type.
14. Z-Image control image request uses hidden ControlNet variant model type.
15. Z-Image control image request fails gracefully if the hidden variant is unavailable.
16. Generation metadata includes input image role and actual WanGP model type.
17. Existing text-only image generation still passes for all profiles.

Frontend should pass TypeScript.

Backend should pass pyright and pytest.

Final checks:

```text
pnpm typecheck
pnpm backend:test
pnpm build:frontend
```

---

## Acceptance criteria

Phase 4.1 is complete when:

- image input support is controlled by backend model profiles;
- image input UI appears only for models that support it;
- Krea 2 Turbo does not show image input;
- Flux 2 Klein and HiDream O1 can expose reference/control image roles;
- Z-Image Turbo remains one user-facing model while routing to its ControlNet/Fun variant only when needed;
- added input images default to a safe role;
- clicking an input image opens a role picker/popover plus Remove action;
- the hover tooltip clearly says whether the selected model supports Reference Only, Control Only, or Reference or Control;
- backend validates all image input roles/files/profile combinations before calling WanGP;
- backend translates AiVS roles into verified WanGP settings;
- generation metadata records user-facing profile, actual WanGP model type, input image role, and resolved resolution;
- existing text-only image generation remains unchanged;
- inherited project/gallery/generation-card behaviour is preserved;
- LoRA remains deferred to Phase 5.
