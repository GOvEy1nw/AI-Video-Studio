"""Curated model profile registry for AiVS.

This is the product-facing source of truth for which models appear in the
AiVS UI. Per the Phase 4 brief: 'WanGP tells us what can exist; AiVS
decides what should be visible.' WanGP discovery is used for
validation/availability only — never as the raw UI source.

Each profile maps an AiVS-facing ``id`` to a WanGP ``model_type`` plus the
curated UI surface (aspect ratios, resolution tiers, capabilities, default
settings). Adding a model means adding a profile here; the frontend reads
the list from the backend API.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

MediaType = Literal["image", "video", "audio", "tts"]
AspectRatio = Literal["1:1", "16:9", "9:16"]
ResolutionTier = Literal["540p", "720p", "1080p", "1440p", "2160p"]
ProfileStatus = Literal["stable", "experimental", "hidden"]
LoraSupport = Literal["supported", "unsupported", "future", "experimental"]
ImageInputRole = Literal[
    "reference_subject",
    "reference_people_objects",
    "control_image",
    "control_pose",
    "control_depth",
    "control_canny",
    "start_image",
    "end_image",
    "control_video",
    "audio_guide",
    "human_motion",
    "human_motion_pose",
    "depth",
    "canny_edges",
    "sdr_to_hdr",
    "continue_video",
    "audio_to_video",
    "reference_voice",
]
ImageInputKind = Literal["reference", "control", "inpaint"]
AvailabilityState = Literal[
    "available",
    "missing_model_files",
    "partially_installed",
    "unsupported",
    "experimental",
    "hidden",
]


@dataclass(frozen=True)
class InputMediaRole:
    role: ImageInputRole
    label: str
    description: str
    kind: ImageInputKind


@dataclass(frozen=True)
class InputMediaPolicy:
    supports_image_inputs: bool = False
    tooltip_label: str = ""
    max_images: int = 0
    default_role: ImageInputRole | None = None
    roles: tuple[InputMediaRole, ...] = ()
    wangp_model_type: str | None = None
    wangp_default_settings: dict[str, object] = field(default_factory=dict[str, object])
    setting_values: dict[str, object] = field(default_factory=dict[str, object])


@dataclass(frozen=True)
class WanGPModelMetadata:
    """WanGP-discovered model metadata kept separate from AiVS curation."""

    family: str
    family_label: str
    base_model_type: str
    finetune: bool
    main_output: tuple[str, ...]
    outputs: tuple[str, ...]
    inputs: tuple[str, ...]
    media_inputs: dict[str, dict[str, bool]]
    capabilities: dict[str, bool]
    setting_values: dict[str, object] = field(default_factory=dict[str, object])


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
    text_to_video: bool = False
    image_to_video: bool = False
    video_to_video: bool = False
    audio_to_video: bool = False
    audio_output: bool = False
    start_image: bool = False
    end_image: bool = False
    control_video: bool = False
    video_continuation: bool = False
    sliding_window: bool = False
    reference_images: bool = False
    control_image: bool = False
    inpainting: bool = False
    lora: LoraSupport = "future"
    input_media: InputMediaPolicy = field(default_factory=InputMediaPolicy)
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
    max_parallel_images: int = 1
    max_total_variations: int = 12


REFERENCE_SUBJECT_ROLE = InputMediaRole(
    role="reference_subject",
    label="Subject / Scene Reference",
    description="Use the image as the main subject, scene, or landscape guide.",
    kind="reference",
)
REFERENCE_PEOPLE_OBJECTS_ROLE = InputMediaRole(
    role="reference_people_objects",
    label="People / Object Reference",
    description="Use the image as a people/object reference.",
    kind="reference",
)
CONTROL_IMAGE_ROLE = InputMediaRole(
    role="control_image",
    label="Use Image Unchanged",
    description="Use the image directly as a control guide.",
    kind="control",
)
CONTROL_POSE_ROLE = InputMediaRole(
    role="control_pose",
    label="Transfer Human Pose",
    description="Extract and transfer human pose from the image.",
    kind="control",
)
CONTROL_DEPTH_ROLE = InputMediaRole(
    role="control_depth",
    label="Transfer Depth",
    description="Extract and transfer depth from the image.",
    kind="control",
)
CONTROL_CANNY_ROLE = InputMediaRole(
    role="control_canny",
    label="Transfer Canny Edges",
    description="Extract and transfer edge guidance from the image.",
    kind="control",
)
START_IMAGE_ROLE = InputMediaRole(
    role="start_image",
    label="Start Image",
    description="The video will start from this image.",
    kind="reference",
)
END_IMAGE_ROLE = InputMediaRole(
    role="end_image",
    label="End Image",
    description="The video will end at this image (optional).",
    kind="reference",
)
CONTROL_VIDEO_ROLE = InputMediaRole(
    role="control_video",
    label="Control Video",
    description="Guide the generation with a control video.",
    kind="control",
)
AUDIO_GUIDE_ROLE = InputMediaRole(
    role="audio_guide",
    label="Audio Track",
    description="Add a synchronized soundtrack/audio file.",
    kind="control",
)
HUMAN_MOTION_ROLE = InputMediaRole(
    role="human_motion",
    label="Human Motion",
    description="Transfer human motion guidance from the video.",
    kind="control",
)
HUMAN_MOTION_POSE_ROLE = InputMediaRole(
    role="human_motion_pose",
    label="Human Motion (Pose Aligned)",
    description="Transfer human motion with pose alignment.",
    kind="control",
)
DEPTH_ROLE = InputMediaRole(
    role="depth",
    label="Depth",
    description="Guide generation using depth map of the video.",
    kind="control",
)
CANNY_EDGES_ROLE = InputMediaRole(
    role="canny_edges",
    label="Canny Edges",
    description="Guide generation using Canny edge maps of the video.",
    kind="control",
)
SDR_TO_HDR_ROLE = InputMediaRole(
    role="sdr_to_hdr",
    label="Convert SDR to HDR",
    description="Convert SDR input video to HDR format using IC-LoRA.",
    kind="control",
)
CONTINUE_VIDEO_ROLE = InputMediaRole(
    role="continue_video",
    label="Continue Video",
    description="Continue video generation from the ending of a source video.",
    kind="reference",
)
AUDIO_TO_VIDEO_ROLE = InputMediaRole(
    role="audio_to_video",
    label="Audio To Video",
    description="Generate video based on soundtrack and text prompt.",
    kind="control",
)
REFERENCE_VOICE_ROLE = InputMediaRole(
    role="reference_voice",
    label="Reference Voice",
    description="Generate video using reference voice (ID-LoRA).",
    kind="control",
)


# Curated image model profiles. Add new image models here — the frontend
# reads this list via GET /api/model-profiles and renders the dropdowns
# from it. Do not auto-expose every WanGP-supported model.
IMAGE_PROFILES: tuple[ModelProfile, ...] = (
    ModelProfile(
        id="z_image_turbo",
        display_name="Z-Image Turbo",
        media_type="image",
        visible=True,
        status="stable",
        wangp_model_type="z_image",
        wangp_metadata=WanGPModelMetadata(
            family="z_image",
            family_label="Z-Image",
            base_model_type="z_image",
            finetune=False,
            main_output=("image",),
            outputs=("image",),
            inputs=("text",),
            media_inputs={
                "image": {
                    "start": False,
                    "end": False,
                    "reference": False,
                    "single_reference": False,
                    "multiple_references": False,
                    "background": False,
                    "injected_frames": False,
                    "control": False,
                    "mask": False,
                },
                "video": {
                    "continue": False,
                    "last": False,
                    "control": False,
                    "mask": False,
                },
                "audio": {"prompt": False, "output": False},
            },
            capabilities={
                "text_to_video": False,
                "image_to_video": False,
                "video_to_video": False,
                "text_to_image": True,
                "image_to_image": False,
                "text_to_audio": False,
                "audio_to_audio": False,
                "audio_to_video": False,
                "audio_output": False,
                "inpainting": False,
                "outpainting": False,
                "reference_images": False,
                "background_image": False,
                "injected_frames": False,
                "control_image": False,
                "control_video": False,
                "video_continuation": False,
                "sliding_window": False,
                "lora": True,
            },
            setting_values={
                "image_prompt_type": {
                    "allowed": "",
                    "choices": [{"label": "Text/new generation", "value": ""}],
                },
                "video_prompt_type": {
                    "guide_preprocessing": None,
                    "mask_preprocessing": None,
                    "guide_custom_choices": None,
                    "image_ref_choices": None,
                    "custom_video_selection": None,
                    "forced": "",
                },
                "audio_prompt_type": {"sources": None, "custom_option": None},
                "model_mode": None,
                "sample_solver": None,
                "prompt_enhancer": None,
            },
        ),
        text_to_image=True,
        reference_images=False,
        control_image=True,
        inpainting=False,
        lora="future",
        input_media=InputMediaPolicy(
            supports_image_inputs=True,
            tooltip_label="Control Only",
            max_images=1,
            default_role="control_image",
            roles=(
                CONTROL_IMAGE_ROLE,
                CONTROL_POSE_ROLE,
                CONTROL_DEPTH_ROLE,
                CONTROL_CANNY_ROLE,
            ),
            wangp_model_type="z_image_control2_1",
            wangp_default_settings={
                "num_inference_steps": 9,
                "guidance_scale": 0,
                "control_net_weight_alt": 0.65,
            },
            setting_values={
                "video_prompt_type": {
                    "guide_preprocessing": {
                        "choices": [
                            {"label": "Use Z-Image Raw Format", "value": ""},
                            {"label": "PV", "value": "PV"},
                            {"label": "DV", "value": "DV"},
                            {"label": "EV", "value": "EV"},
                            {"label": "Use Z-Image Raw Format", "value": "V"},
                        ],
                    }
                }
            },
        ),
        default_aspect_ratio="1:1",
        default_resolution_tier="720p",
        allowed_aspect_ratios=("1:1", "16:9", "9:16"),
        allowed_resolution_tiers=("540p", "720p", "1080p"),
    ),
    ModelProfile(
        id="krea2_turbo",
        display_name="Krea 2 Turbo",
        media_type="image",
        visible=True,
        status="stable",
        wangp_model_type="krea2_turbo",
        wangp_metadata=WanGPModelMetadata(
            family="krea2",
            family_label="Krea 2",
            base_model_type="krea2_turbo",
            finetune=False,
            main_output=("image",),
            outputs=("image",),
            inputs=("text", "image"),
            media_inputs={
                "image": {
                    "start": False,
                    "end": False,
                    "reference": False,
                    "single_reference": False,
                    "multiple_references": False,
                    "background": False,
                    "injected_frames": False,
                    "control": False,
                    "mask": True,
                },
                "video": {
                    "continue": False,
                    "last": False,
                    "control": False,
                    "mask": False,
                },
                "audio": {"prompt": False, "output": False},
            },
            capabilities={
                "text_to_video": False,
                "image_to_video": False,
                "video_to_video": False,
                "text_to_image": True,
                "image_to_image": False,
                "text_to_audio": False,
                "audio_to_audio": False,
                "audio_to_video": False,
                "audio_output": False,
                "inpainting": True,
                "outpainting": False,
                "reference_images": False,
                "background_image": False,
                "injected_frames": False,
                "control_image": False,
                "control_video": False,
                "video_continuation": False,
                "sliding_window": False,
                "lora": True,
            },
            setting_values={
                "image_prompt_type": {
                    "allowed": "",
                    "choices": [{"label": "Text/new generation", "value": ""}],
                },
                "video_prompt_type": {
                    "guide_preprocessing": None,
                    "mask_preprocessing": None,
                    "guide_custom_choices": None,
                    "image_ref_choices": None,
                    "custom_video_selection": None,
                    "forced": "",
                },
                "audio_prompt_type": {"sources": None, "custom_option": None},
                "model_mode": {
                    "default": 2,
                    "label": "Inpainting Method",
                    "choices": [
                        {
                            "label": "LanPaint (2 steps): ~2x slower, easy task",
                            "value": "2",
                        },
                        {
                            "label": "LanPaint (5 steps): ~5x slower, medium task",
                            "value": "3",
                        },
                        {
                            "label": "LanPaint (10 steps): ~10x slower, hard task",
                            "value": "4",
                        },
                        {
                            "label": "LanPaint (15 steps): ~15x slower, very hard task",
                            "value": "5",
                        },
                    ],
                },
                "sample_solver": None,
                "prompt_enhancer": None,
            },
        ),
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
        default_aspect_ratio="1:1",
        default_resolution_tier="720p",
        allowed_aspect_ratios=("1:1", "16:9", "9:16"),
        allowed_resolution_tiers=("540p", "720p", "1080p", "1440p"),
        min_resolution_tier="540p",
        max_resolution_tier="1440p",
        wangp_resolution_categories=("<=2k",),
    ),
    ModelProfile(
        id="flux2_klein_4b",
        display_name="Flux 2 Klein 4B",
        media_type="image",
        visible=True,
        status="stable",
        wangp_model_type="flux2_klein_4b",
        wangp_metadata=WanGPModelMetadata(
            family="flux2",
            family_label="Flux 2",
            base_model_type="flux2_klein_4b",
            finetune=False,
            main_output=("image",),
            outputs=("image",),
            inputs=("text", "image"),
            media_inputs={
                "image": {
                    "start": False,
                    "end": False,
                    "reference": True,
                    "single_reference": False,
                    "multiple_references": True,
                    "background": True,
                    "injected_frames": False,
                    "control": True,
                    "mask": True,
                },
                "video": {
                    "continue": False,
                    "last": False,
                    "control": False,
                    "mask": False,
                },
                "audio": {"prompt": False, "output": False},
            },
            capabilities={
                "text_to_video": False,
                "image_to_video": False,
                "video_to_video": False,
                "text_to_image": True,
                "image_to_image": True,
                "text_to_audio": False,
                "audio_to_audio": False,
                "audio_to_video": False,
                "audio_output": False,
                "inpainting": True,
                "outpainting": True,
                "reference_images": True,
                "background_image": True,
                "injected_frames": False,
                "control_image": True,
                "control_video": False,
                "video_continuation": False,
                "sliding_window": False,
                "lora": True,
            },
            setting_values={
                "image_prompt_type": {
                    "allowed": "",
                    "choices": [{"label": "Text/new generation", "value": ""}],
                },
                "video_prompt_type": {
                    "guide_preprocessing": {
                        "choices": [
                            {"label": "None", "value": ""},
                            {"label": "PV", "value": "PV"},
                            {"label": "MV", "value": "MV"},
                        ],
                    },
                    "mask_preprocessing": {
                        "visible": True,
                        "choices": [
                            {"label": "None", "value": ""},
                            {"label": "A", "value": "A"},
                            {"label": "NA", "value": "NA"},
                        ],
                    },
                    "guide_custom_choices": None,
                    "image_ref_choices": {
                        "letters_filter": "KI",
                        "choices": [
                            {"label": "None", "value": ""},
                            {
                                "label": (
                                    "Conditional Image is first Main Subject / "
                                    "Landscape and may be followed by People / "
                                    "Objects"
                                ),
                                "value": "KI",
                            },
                            {
                                "label": "Conditional Images are People / Objects",
                                "value": "I",
                            },
                        ],
                    },
                    "custom_video_selection": None,
                    "forced": "",
                },
                "audio_prompt_type": {"sources": None, "custom_option": None},
                "model_mode": {
                    "default": 0,
                    "label": "Inpainting Method",
                    "choices": [
                        {
                            "label": (
                                "Masked Denoising : Inpainted area may reuse "
                                "some content that has been masked"
                            ),
                            "value": "",
                        },
                        {
                            "label": "LanPaint (2 steps): ~2x slower, easy task",
                            "value": "2",
                        },
                        {
                            "label": "LanPaint (5 steps): ~5x slower, medium task",
                            "value": "3",
                        },
                        {
                            "label": "LanPaint (10 steps): ~10x slower, hard task",
                            "value": "4",
                        },
                        {
                            "label": "LanPaint (15 steps): ~15x slower, very hard task",
                            "value": "5",
                        },
                    ],
                },
                "sample_solver": None,
                "prompt_enhancer": None,
            },
        ),
        text_to_image=True,
        reference_images=True,
        control_image=True,
        inpainting=False,
        lora="future",
        input_media=InputMediaPolicy(
            supports_image_inputs=True,
            tooltip_label="Reference or Control",
            max_images=5,
            default_role="reference_subject",
            roles=(
                REFERENCE_SUBJECT_ROLE,
                REFERENCE_PEOPLE_OBJECTS_ROLE,
                CONTROL_POSE_ROLE,
            ),
        ),
        default_aspect_ratio="1:1",
        default_resolution_tier="720p",
        allowed_aspect_ratios=("1:1", "16:9", "9:16"),
        allowed_resolution_tiers=("540p", "720p", "1080p", "1440p"),
        min_resolution_tier="540p",
        max_resolution_tier="1440p",
    ),
    ModelProfile(
        id="hidream_o1_dev",
        display_name="HiDream O1",
        media_type="image",
        visible=True,
        status="stable",
        wangp_model_type="hidream_o1_dev",
        wangp_metadata=WanGPModelMetadata(
            family="hidream",
            family_label="HiDream",
            base_model_type="hidream_o1_dev",
            finetune=False,
            main_output=("image",),
            outputs=("image",),
            inputs=("text", "image"),
            media_inputs={
                "image": {
                    "start": False,
                    "end": False,
                    "reference": True,
                    "single_reference": False,
                    "multiple_references": True,
                    "background": True,
                    "injected_frames": False,
                    "control": True,
                    "mask": False,
                },
                "video": {
                    "continue": False,
                    "last": False,
                    "control": False,
                    "mask": False,
                },
                "audio": {"prompt": False, "output": False},
            },
            capabilities={
                "text_to_video": False,
                "image_to_video": False,
                "video_to_video": False,
                "text_to_image": True,
                "image_to_image": True,
                "text_to_audio": False,
                "audio_to_audio": False,
                "audio_to_video": False,
                "audio_output": False,
                "inpainting": False,
                "outpainting": False,
                "reference_images": True,
                "background_image": True,
                "injected_frames": False,
                "control_image": True,
                "control_video": False,
                "video_continuation": False,
                "sliding_window": False,
                "lora": True,
            },
            setting_values={
                "image_prompt_type": {
                    "allowed": "",
                    "choices": [{"label": "Text/new generation", "value": ""}],
                },
                "video_prompt_type": {
                    "guide_preprocessing": {
                        "choices": [
                            {"label": "Use Control Image Unchanged", "value": ""},
                            {"label": "Use Control Image Unchanged", "value": "V"},
                            {"label": "PV", "value": "PV"},
                            {"label": "DV", "value": "DV"},
                            {"label": "EV", "value": "EV"},
                        ],
                    },
                    "mask_preprocessing": None,
                    "guide_custom_choices": None,
                    "image_ref_choices": {
                        "default": "",
                        "letters_filter": "KI",
                        "choices": [
                            {"label": "None", "value": ""},
                            {
                                "label": (
                                    "Conditional Image is first Main Subject / "
                                    "Landscape and may be followed by People / "
                                    "Objects"
                                ),
                                "value": "KI",
                            },
                            {
                                "label": "Conditional Images are References",
                                "value": "I",
                            },
                        ],
                    },
                    "custom_video_selection": None,
                    "forced": "",
                },
                "audio_prompt_type": {"sources": None, "custom_option": None},
                "model_mode": None,
                "sample_solver": {
                    "choices": [{"label": "Flash", "value": "flash"}],
                },
                "prompt_enhancer": None,
            },
        ),
        text_to_image=True,
        reference_images=True,
        control_image=True,
        inpainting=False,
        lora="future",
        input_media=InputMediaPolicy(
            supports_image_inputs=True,
            tooltip_label="Reference or Control",
            max_images=5,
            default_role="reference_subject",
            roles=(
                REFERENCE_SUBJECT_ROLE,
                REFERENCE_PEOPLE_OBJECTS_ROLE,
                CONTROL_IMAGE_ROLE,
                CONTROL_POSE_ROLE,
                CONTROL_DEPTH_ROLE,
                CONTROL_CANNY_ROLE,
            ),
        ),
        default_aspect_ratio="1:1",
        default_resolution_tier="720p",
        allowed_aspect_ratios=("1:1", "16:9", "9:16"),
        allowed_resolution_tiers=("540p", "720p", "1080p", "1440p"),
        min_resolution_tier="540p",
        max_resolution_tier="1440p",
    ),
)


VIDEO_PROFILES: tuple[ModelProfile, ...] = (
    ModelProfile(
        id="ltx2_22b_distilled",
        display_name="LTX 2.3 Fast",
        media_type="video",
        visible=True,
        status="stable",
        wangp_model_type="ltx2_22B_distilled_1_1",
        wangp_metadata=WanGPModelMetadata(
            family="ltx2",
            family_label="LTX-2",
            base_model_type="ltx2_22B",
            finetune=False,
            main_output=("image", "video"),
            outputs=("image", "video", "audio"),
            inputs=("text", "audio", "image", "video"),
            media_inputs={
                "image": {
                    "start": True,
                    "end": True,
                    "reference": True,
                    "single_reference": True,
                    "multiple_references": False,
                    "background": True,
                    "injected_frames": True,
                    "control": False,
                    "mask": False,
                },
                "video": {
                    "continue": True,
                    "last": True,
                    "control": True,
                    "mask": True,
                },
                "audio": {"prompt": True, "output": True},
            },
            capabilities={
                "text_to_video": True,
                "image_to_video": True,
                "video_to_video": True,
                "text_to_image": True,
                "image_to_image": True,
                "text_to_audio": False,
                "audio_to_audio": False,
                "audio_to_video": True,
                "audio_output": True,
                "inpainting": True,
                "outpainting": True,
                "reference_images": True,
                "background_image": True,
                "injected_frames": True,
                "control_image": False,
                "control_video": True,
                "video_continuation": True,
                "sliding_window": True,
                "lora": True,
            },
            setting_values={
                "image_prompt_type": {
                    "allowed": "TSEVL",
                    "choices": [
                        {"label": "Text/new generation", "value": ""},
                        {"label": "Start image", "value": "S"},
                        {"label": "End image", "value": "E"},
                        {"label": "Continue from source video", "value": "V"},
                        {"label": "Continue from last generated video", "value": "L"},
                    ],
                },
                "video_prompt_type": {
                    "guide_preprocessing": None,
                    "mask_preprocessing": {
                        "choices": [
                            {"label": "None", "value": ""},
                            {"label": "A", "value": "A"},
                            {"label": "NA", "value": "NA"},
                            {"label": "XA", "value": "XA"},
                            {"label": "XNA", "value": "XNA"},
                        ],
                    },
                    "guide_custom_choices": {
                        "default": "",
                        "label": "Control Video / Frames Injection",
                        "letters_filter": "OPDEMVG&KFI",
                        "visible": True,
                        "choices": [
                            {"label": "No Video Process", "value": ""},
                            {"label": "Transfer Human Motion", "value": "PVG"},
                            {"label": "Transfer Human Motion With Pose Alignment", "value": "OVG"},
                            {"label": "Transfer Depth", "value": "DVG"},
                            {"label": "Transfer Canny Edges", "value": "EVG"},
                            {"label": "LTX2 Raw Format / Control Video for Ic Lora", "value": "VG"},
                            {"label": "Inpaint Masked Area", "value": "MVG"},
                            {"label": "Ingredients Reference Sheet", "value": "I"},
                            {"label": "Convert SDR to HDR (IC-LoRA)", "value": "V&G"},
                            {"label": "Inject Frames", "value": "KFI"},
                        ],
                    },
                    "image_ref_choices": None,
                    "custom_video_selection": None,
                    "forced": "",
                },
                "audio_prompt_type": {
                    "sources": {
                        "default": "",
                        "letters_filter": "A1OFK2",
                        "show_label": False,
                        "choices": [
                            {"label": "Generate Video & Soundtrack based on Text Prompt", "value": ""},
                            {"label": "Generate Video based on Soundtrack and Text Prompt", "value": "A"},
                            {"label": "Generate Video based on Control Video + its Audio Track and Text Prompt", "value": "K"},
                            {"label": "Generate Audio based on Control Video and Text Prompt", "value": "2"},
                            {"label": "Generate Video based on Reference Voice (ID-LoRA) and Text Prompt", "value": "A1OF"},
                        ],
                    },
                    "custom_option": None,
                },
                "model_mode": None,
                "sample_solver": None,
                "prompt_enhancer": {
                    "default": "",
                    "choices": [
                        {"label": "An Enhanced Prompt using existing Text Prompt", "value": "T"},
                        {"label": "An Enhanced Prompt using existing Text Prompt and Start Image", "value": "TI"},
                        {"label": "An Enhanced Relayed Prompt using existing Text Prompt", "value": "T1"},
                        {"label": "An Enhanced Relayed Prompt using existing Text Prompt and Start Image", "value": "TI1"},
                    ],
                },
            },
        ),
        wangp_default_settings={"num_inference_steps": 8},
        text_to_image=True,
        text_to_video=True,
        image_to_video=True,
        video_to_video=True,
        audio_to_video=True,
        audio_output=True,
        start_image=True,
        end_image=True,
        control_video=True,
        video_continuation=True,
        sliding_window=True,
        reference_images=True,
        inpainting=True,
        lora="future",
        input_media=InputMediaPolicy(
            supports_image_inputs=True,
            tooltip_label="Add Start/End Image, Control Video, or Audio Track",
            max_images=4,
            default_role="start_image",
            roles=(
                START_IMAGE_ROLE,
                END_IMAGE_ROLE,
                HUMAN_MOTION_ROLE,
                HUMAN_MOTION_POSE_ROLE,
                DEPTH_ROLE,
                CANNY_EDGES_ROLE,
                SDR_TO_HDR_ROLE,
                CONTINUE_VIDEO_ROLE,
                AUDIO_TO_VIDEO_ROLE,
                REFERENCE_VOICE_ROLE,
            ),
        ),
        default_aspect_ratio="16:9",
        default_resolution_tier="540p",
        allowed_aspect_ratios=("1:1", "16:9", "9:16"),
        allowed_resolution_tiers=("540p", "720p", "1080p"),
    ),
)


def get_image_profile(profile_id: str) -> ModelProfile | None:
    """Return the image profile with the given id, or None if not curated."""
    for profile in IMAGE_PROFILES:
        if profile.id == profile_id:
            return profile
    return None


def get_video_profile(profile_id: str) -> ModelProfile | None:
    """Return the video profile with the given id, or None if not curated."""
    for profile in VIDEO_PROFILES:
        if profile.id == profile_id:
            return profile
    return None


def get_visible_image_profiles() -> list[ModelProfile]:
    """Return visible image profiles in display order."""
    return [profile for profile in IMAGE_PROFILES if profile.visible]


def get_visible_video_profiles() -> list[ModelProfile]:
    """Return visible video profiles in display order."""
    return [profile for profile in VIDEO_PROFILES if profile.visible]
