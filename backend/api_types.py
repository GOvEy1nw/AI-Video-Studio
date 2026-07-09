"""Pydantic request/response models and TypedDicts for ltx2_server."""

from __future__ import annotations

from typing import Literal, NamedTuple, TypeAlias, TypedDict
from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints, model_validator

NonEmptyPrompt = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class ImageConditioningInput(NamedTuple):
    """Image conditioning triplet used by all video pipelines."""

    path: str
    frame_idx: int
    strength: float


# ============================================================
# TypedDicts for module-level state globals
# ============================================================


class GenerationState(TypedDict):
    id: str | None
    cancelled: bool
    result: str | list[str] | None
    error: str | None
    status: str  # "idle" | "running" | "complete" | "cancelled" | "error"
    phase: str
    progress: int
    current_step: int
    total_steps: int


class ModelDownloadState(TypedDict):
    status: str  # "idle" | "downloading" | "complete" | "error"
    current_file: str
    current_file_progress: int
    total_progress: int
    downloaded_bytes: int
    total_bytes: int
    files_completed: int
    total_files: int
    error: str | None
    speed_mbps: int


JsonObject: TypeAlias = dict[str, object]
VideoCameraMotion = Literal[
    "none",
    "dolly_in",
    "dolly_out",
    "dolly_left",
    "dolly_right",
    "jib_up",
    "jib_down",
    "static",
    "focus_shift",
]


# ============================================================
# Response Models
# ============================================================


class ModelStatusItem(BaseModel):
    id: str
    name: str
    loaded: bool
    downloaded: bool


class GpuTelemetry(BaseModel):
    name: str
    vram: int
    vramUsed: int


class HealthResponse(BaseModel):
    status: str
    models_loaded: bool
    active_model: str | None
    gpu_info: GpuTelemetry
    sage_attention: bool
    models_status: list[ModelStatusItem]


class GpuInfoResponse(BaseModel):
    cuda_available: bool
    mps_available: bool = False
    gpu_available: bool = False
    gpu_name: str | None
    vram_gb: int | None
    gpu_info: GpuTelemetry


class RuntimePolicyResponse(BaseModel):
    force_api_generations: bool


class GenerationProgressResponse(BaseModel):
    status: str
    phase: str
    progress: int
    currentStep: int | None
    totalSteps: int | None


class ModelInfo(BaseModel):
    id: str
    name: str
    description: str


class ModelFileStatus(BaseModel):
    name: str
    description: str
    downloaded: bool
    size: int
    expected_size: int
    required: bool = True
    is_folder: bool = False
    optional_reason: str | None = None


class TextEncoderStatus(BaseModel):
    downloaded: bool
    size_bytes: int
    size_gb: float
    expected_size_gb: float


class ModelsStatusResponse(BaseModel):
    models: list[ModelFileStatus]
    all_downloaded: bool
    total_size: int
    downloaded_size: int
    total_size_gb: float
    downloaded_size_gb: float
    models_path: str
    has_api_key: bool
    text_encoder_status: TextEncoderStatus
    use_local_text_encoder: bool


class DownloadProgressResponse(BaseModel):
    status: str
    currentFile: str
    currentFileProgress: int
    totalProgress: int
    downloadedBytes: int
    totalBytes: int
    filesCompleted: int
    totalFiles: int
    error: str | None
    speedMbps: int


class IcLoraModel(BaseModel):
    name: str
    path: str
    conditioning_type: str
    reference_downscale_factor: int


class IcLoraListResponse(BaseModel):
    models: list[IcLoraModel]
    directory: str


class SuggestGapPromptResponse(BaseModel):
    status: str = "success"
    suggested_prompt: str


class GenerateVideoResponse(BaseModel):
    status: str
    video_path: str | None = None


class GenerateImageResponse(BaseModel):
    status: str
    image_paths: list[str] | None = None


class EnhancePromptRequest(BaseModel):
    prompt: NonEmptyPrompt
    mode: Literal["image", "video"]
    modelProfileId: str | None = None
    inputImagePath: str | None = None


class EnhancePromptResponse(BaseModel):
    prompt: str


class CancelResponse(BaseModel):
    status: str
    id: str | None = None


class RetakeResponse(BaseModel):
    status: str
    video_path: str | None = None
    result: JsonObject | None = None


class IcLoraExtractResponse(BaseModel):
    conditioning: str
    original: str
    conditioning_type: str
    frame_time: float


class IcLoraDownloadResponse(BaseModel):
    status: str
    path: str | None = None
    already_existed: bool | None = None
    already_exists: bool | None = None


class IcLoraGenerateResponse(BaseModel):
    status: str
    video_path: str | None = None


class ModelDownloadStartResponse(BaseModel):
    status: str
    message: str | None = None
    skippingTextEncoder: bool | None = None


class TextEncoderDownloadResponse(BaseModel):
    status: str
    message: str | None = None


class StatusResponse(BaseModel):
    status: str


class ErrorResponse(BaseModel):
    error: str
    message: str | None = None


class ModelProfileCapabilities(BaseModel):
    textToImage: bool
    textToVideo: bool
    imageToVideo: bool
    videoToVideo: bool
    audioToVideo: bool
    audioOutput: bool
    startImage: bool
    endImage: bool
    controlVideo: bool
    videoContinuation: bool
    slidingWindow: bool
    referenceImages: bool
    controlImage: bool
    inpainting: bool
    lora: str


class ModelProfileInputMediaRole(BaseModel):
    role: str
    label: str
    description: str
    kind: str


class ModelProfileInputMedia(BaseModel):
    supportsImageInputs: bool
    tooltipLabel: str
    maxImages: int
    defaultRole: str | None
    roles: list[ModelProfileInputMediaRole]


class ModelProfileUi(BaseModel):
    defaultAspectRatio: str
    defaultResolutionTier: str
    allowedAspectRatios: list[str]
    allowedResolutionTiers: list[str]


class ModelProfileWanGPMetadata(BaseModel):
    modelType: str
    family: str
    familyLabel: str
    baseModelType: str
    finetune: bool
    mainOutput: list[str]
    outputs: list[str]
    inputs: list[str]
    mediaInputs: dict[str, dict[str, bool]]
    capabilities: dict[str, bool]
    settingValues: JsonObject


class ModelProfileResponse(BaseModel):
    id: str
    displayName: str
    mediaType: str
    visible: bool
    status: str
    wangpModelType: str
    wangpMetadata: ModelProfileWanGPMetadata
    capabilities: ModelProfileCapabilities
    ui: ModelProfileUi
    inputMedia: ModelProfileInputMedia
    availability: str = "available"


class ModelProfileListResponse(BaseModel):
    profiles: list[ModelProfileResponse]


# ============================================================
# Request Models
# ============================================================


class GenerateVideoInputMedia(BaseModel):
    id: str | None = None
    type: Literal["image", "video", "audio"] = "image"
    path: str
    role: Literal[
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


def _default_video_input_media() -> list[GenerateVideoInputMedia]:
    return []


class GenerateVideoShotPrompt(BaseModel):
    seconds: int = Field(ge=1, le=20)
    prompt: NonEmptyPrompt


def _default_video_shot_prompts() -> list[GenerateVideoShotPrompt]:
    return []


class ReframePadding(BaseModel):
    top: int = Field(ge=0, le=200)
    bottom: int = Field(ge=0, le=200)
    left: int = Field(ge=0, le=200)
    right: int = Field(ge=0, le=200)


class ReframeOptions(BaseModel):
    aspectMode: Literal["1:1", "16:9", "9:16", "custom"]
    padding: ReframePadding
    controlVideoStartTime: float = Field(ge=0)
    controlVideoDuration: float = Field(gt=0)


class GenerateVideoRequest(BaseModel):
    prompt: str = ""
    resolution: str = "540p"
    model: str = "fast"
    modelProfileId: str | None = None
    cameraMotion: VideoCameraMotion = "none"
    negativePrompt: str = ""
    duration: str = "2"
    fps: str = "24"
    audio: str = "false"
    imagePath: str | None = None
    audioPath: str | None = None
    aspectRatio: Literal["16:9", "9:16"] = "16:9"
    inputMedia: list[GenerateVideoInputMedia] = Field(default_factory=_default_video_input_media)
    videoPromptType: str | None = None
    useAudioTrack: bool = True
    shotPrompts: list[GenerateVideoShotPrompt] = Field(default_factory=_default_video_shot_prompts)
    reframe: ReframeOptions | None = None

    @model_validator(mode="after")
    def validate_prompt_or_shots(self) -> "GenerateVideoRequest":
        if not self.prompt.strip() and not self.shotPrompts and self.reframe is None:
            raise ValueError("prompt is required unless shotPrompts or reframe are provided")
        return self


class GenerateImageInputMedia(BaseModel):
    id: str | None = None
    type: Literal["image"] = "image"
    path: str
    role: Literal[
        "reference_subject",
        "reference_people_objects",
        "control_image",
        "control_pose",
        "control_depth",
        "control_canny",
    ]


def _default_image_input_media() -> list[GenerateImageInputMedia]:
    return []


class GenerateImageRequest(BaseModel):
    prompt: NonEmptyPrompt
    width: int = 1024
    height: int = 1024
    numSteps: int = 4
    numImages: int = 1
    # Phase 4 curated profile path. When set, the backend resolves the
    # profile, validates the tier/aspect, and overrides width/height with
    # the curated exact WxH. Raw width/height still accepted for
    # backwards compatibility but arbitrary frontend model_type values
    # cannot bypass the curated profile layer.
    modelProfileId: str | None = None
    aspectRatio: Literal["1:1", "16:9", "9:16"] | None = None
    resolutionTier: Literal["540p", "720p", "1080p", "1440p", "2160p"] | None = None
    inputMedia: list[GenerateImageInputMedia] = Field(default_factory=_default_image_input_media)


class ModelDownloadRequest(BaseModel):
    skipTextEncoder: bool = False


class SuggestGapPromptRequest(BaseModel):
    beforePrompt: str = ""
    afterPrompt: str = ""
    beforeFrame: str | None = None
    afterFrame: str | None = None
    gapDuration: float = 5
    mode: str = "t2v"
    inputImage: str | None = None


class RetakeRequest(BaseModel):
    video_path: str
    start_time: float
    duration: float
    prompt: str = ""
    mode: str = "replace_audio_and_video"


class IcLoraDownloadRequest(BaseModel):
    model: str


class IcLoraExtractRequest(BaseModel):
    video_path: str
    conditioning_type: str = "canny"
    frame_time: float = 0


class IcLoraImageInput(BaseModel):
    path: str
    frame: int = 0
    strength: float = 1.0


def _default_ic_lora_images() -> list[IcLoraImageInput]:
    return []


class IcLoraGenerateRequest(BaseModel):
    video_path: str
    lora_path: str
    conditioning_type: str = "canny"
    prompt: NonEmptyPrompt
    conditioning_strength: float = 1.0
    seed: int = 42
    height: int = 512
    width: int = 768
    num_frames: int = 121
    frame_rate: float = 24
    num_inference_steps: int = 30
    cfg_guidance_scale: float = 1.0
    negative_prompt: str = ""
    images: list[IcLoraImageInput] = Field(default_factory=_default_ic_lora_images)
