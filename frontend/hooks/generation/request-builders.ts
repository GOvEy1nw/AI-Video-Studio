import type { GenerateDirectorRequest } from "../../types/director";
import type { GenerationSettings } from "../../types/generation";
import type { MediaCropRecipe } from "../../types/media-crop";
import type { ImageEditRequest } from "../../types/image-edit";
import type { GenerateMusicRequest } from "../../types/music";
import type { GenerateSfxRequest } from "../../types/sfx";
import {
  AUDIO_MEDIA_ROLE_SET,
  GUIDE_MEDIA_ROLE_SET,
} from "../../views/genspace/constants";
import type { SubmittedVideoToolId } from "../../types/video-tools";

export interface GenerationInputMediaRequest {
  path: string;
  role: string;
  type?: "image" | "video" | "audio";
  trimStartTime?: number;
  trimDuration?: number;
  crop?: MediaCropRecipe;
}

export interface GenerationReframeOptions {
  aspectMode:
    | "1:1"
    | "16:9"
    | "9:16"
    | "21:9"
    | "9:21"
    | "4:3"
    | "3:4"
    | "3:2"
    | "2:3"
    | "custom";
  padding: { top: number; bottom: number; left: number; right: number };
  controlVideoStartTime: number;
  controlVideoDuration: number;
}

export function buildDirectorRequestBody(
  request: GenerateDirectorRequest,
): { endpoint: string; body: Record<string, unknown> } {
  return { endpoint: "/api/director/generate", body: { ...request } };
}

export function buildMusicRequestBody(
  request: GenerateMusicRequest,
): { endpoint: string; body: GenerateMusicRequest } {
  return { endpoint: "/api/generate-music", body: request };
}

export function buildSfxRequestBody(request: GenerateSfxRequest): { endpoint: string; body: GenerateSfxRequest } {
  return { endpoint: "/api/generate-sfx", body: request }
}

function normalizeApiPadding(value: number): number {
  return Math.max(0, Math.round(value));
}

function normalizeReframeForApi(options: GenerationReframeOptions) {
  return {
    aspectMode: options.aspectMode,
    padding: {
      top: normalizeApiPadding(options.padding.top),
      bottom: normalizeApiPadding(options.padding.bottom),
      left: normalizeApiPadding(options.padding.left),
      right: normalizeApiPadding(options.padding.right),
    },
    controlVideoStartTime: options.controlVideoStartTime,
    controlVideoDuration: options.controlVideoDuration,
  };
}

export function buildVideoRequestBody({
  prompt,
  imagePath,
  settings,
  audioPath,
  inputMedia,
  useAudioTrack,
  shotPrompts,
  reframe,
  videoTool,
}: {
  prompt: string;
  imagePath: string | null;
  settings: GenerationSettings | null;
  audioPath?: string | null;
  inputMedia?: GenerationInputMediaRequest[];
  useAudioTrack?: boolean;
  shotPrompts?: { seconds: number; prompt: string }[];
  reframe?: GenerationReframeOptions;
  videoTool?: SubmittedVideoToolId;
}): { endpoint: string; body: Record<string, unknown> } {
  if (!settings) throw new Error("Generation settings are required");

  const body: Record<string, unknown> = {
    prompt,
    model: settings.model,
    modelProfileId: settings.videoProfileId,
    duration: String(settings.duration),
    resolution: settings.videoResolution,
    fps: String(settings.fps),
    audio: String(settings.audio),
    cameraMotion: settings.cameraMotion,
    aspectRatio: settings.aspectRatio || "16:9",
    useAudioTrack: useAudioTrack ?? true,
    enhancePrompt: settings.enhancePrompt ?? false,
  };
  if (imagePath) body.imagePath = imagePath;
  if (audioPath) body.audioPath = audioPath;
  if (inputMedia?.length) {
    body.inputMedia = inputMedia.map((item) => ({
      type: AUDIO_MEDIA_ROLE_SET.has(item.role)
        ? "audio"
        : GUIDE_MEDIA_ROLE_SET.has(item.role)
          ? "video"
          : item.type || "image",
      path: item.path,
      role: item.role,
      trimStartTime: item.trimStartTime,
      trimDuration: item.trimDuration,
      ...(item.crop ? { crop: item.crop } : {}),
    }));
  }
  if (shotPrompts?.length) body.shotPrompts = shotPrompts;
  if (reframe) {
    body.prompt = prompt.trim() || "outpaint";
    body.videoPromptType = "VG";
    body.reframe = normalizeReframeForApi(reframe);
  }
  if (videoTool) body.videoTool = videoTool;
  return { endpoint: "/api/generate", body };
}

const IMAGE_SHORT_SIDE_BY_RESOLUTION: Record<string, number> = {
  "1080p": 1080,
  "1440p": 1440,
  "2048p": 2048,
};
const IMAGE_ASPECT_RATIO_VALUE: Record<string, number> = {
  "1:1": 1,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
  "4:3": 4 / 3,
  "3:4": 3 / 4,
  "21:9": 21 / 9,
};

function getImageDimensions(settings: GenerationSettings) {
  const shortSide = IMAGE_SHORT_SIDE_BY_RESOLUTION[settings.imageResolution];
  if (!shortSide) {
    throw new Error(
      `Unsupported image resolution mapping: ${settings.imageResolution}`,
    );
  }
  const ratio = IMAGE_ASPECT_RATIO_VALUE[settings.imageAspectRatio];
  if (!ratio) {
    throw new Error(
      `Unsupported image aspect ratio mapping: ${settings.imageAspectRatio}`,
    );
  }
  return ratio >= 1
    ? { width: Math.round(shortSide * ratio), height: shortSide }
    : { width: shortSide, height: Math.round(shortSide / ratio) };
}

export function buildImageRequestBody(
  prompt: string,
  settings: GenerationSettings,
  inputMedia?: GenerationInputMediaRequest[],
  edit?: ImageEditRequest,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    prompt,
    numSteps: settings.imageSteps || 8,
    numImages: settings.variations || 1,
    enhancePrompt: settings.enhancePrompt ?? false,
  };
  if (settings.imageProfileId) {
    body.modelProfileId = settings.imageProfileId;
    body.aspectRatio = settings.imageAspectRatio || "1:1";
    body.resolutionTier = settings.imageResolution;
    if (inputMedia?.length) {
      body.inputMedia = inputMedia.map((item) => ({
        type: "image",
        path: item.path,
        role: item.role,
        ...(item.crop ? { crop: item.crop } : {}),
      }));
    }
    if (edit) body.edit = edit;
  } else {
    Object.assign(body, getImageDimensions(settings));
  }
  return body;
}
