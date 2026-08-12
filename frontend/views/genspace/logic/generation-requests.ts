import type { ReframePanelState } from "../video/ReframePanel";
import { compileMusicRequest } from "../music/compile-music-request";
import { fileUrlToPath } from "../../../lib/url-to-path";
import type { GenerationSettings } from "../../../types/generation";
import type { MediaCropRecipe } from "../../../types/media-crop";
import type {
  ImageEditMaskRecipe,
  ImageEditOutpaintRecipe,
  ImageEditRequest,
} from "../../../types/image-edit";
import type { ModelProfile } from "../../../types/model-profiles";
import type { MusicSettings } from "../../../types/music";
import {
  AUDIO_MEDIA_ROLE_SET,
  GUIDE_MEDIA_ROLE_SET,
  RETAKE_AVAILABLE,
} from "../constants";
import type { GenSpaceSettings } from "../constants";
import type { GenSpaceMediaInput } from "../types";
import { getH3ReferenceState } from "./media-inputs";
import type { SubmittedVideoToolId } from "../../../types/video-tools";

export interface GenerationInputMedia {
  path: string;
  role: string;
  alias?: string;
  type?: "image" | "video" | "audio";
  trimStartTime?: number;
  trimDuration?: number;
  crop?: MediaCropRecipe;
  useAudioTrack?: boolean;
}

export interface VideoGenerationCommand {
  prompt: string;
  imagePath: string | null;
  settings: GenerationSettings;
  audioPath: string | null;
  inputMedia: GenerationInputMedia[];
  useAudioTrack: boolean;
  normalizedSettings: GenSpaceSettings;
  persistNormalizedSettings: boolean;
  videoTool?: SubmittedVideoToolId;
}

export interface ReframeGenerationCommand extends VideoGenerationCommand {
  reframe: {
    aspectMode: ReframePanelState["aspectMode"];
    padding: ReframePanelState["padding"];
    controlVideoStartTime: number;
    controlVideoDuration: number;
  };
}

export function buildGenerationInputMedia(
  inputs: GenSpaceMediaInput[],
): GenerationInputMedia[] {
  return inputs.flatMap((item) => {
    const path = item.path ?? fileUrlToPath(item.url);
    if (!path) return [];
    return [
      {
        path,
        role: item.role,
        ...(item.alias ? { alias: item.alias } : {}),
        ...(item.type ? { type: item.type } : {}),
        ...(item.trimStartTime !== undefined
          ? { trimStartTime: item.trimStartTime }
          : {}),
        ...(item.trimDuration !== undefined
          ? { trimDuration: item.trimDuration }
          : {}),
        ...(item.crop ? { crop: { ...item.crop } } : {}),
        ...(item.useAudioTrack !== undefined
          ? { useAudioTrack: item.useAudioTrack }
          : {}),
      },
    ];
  });
}

export function buildImageGenerationCommand(
  prompt: string,
  settings: GenSpaceSettings,
  imageInputs: GenSpaceMediaInput[],
  enhancePrompt: boolean,
  edit?: {
    image: GenSpaceMediaInput;
    mask: ImageEditMaskRecipe | null;
    outpaint: ImageEditOutpaintRecipe | null;
  },
): {
  prompt: string;
  settings: GenerationSettings;
  inputMedia: GenerationInputMedia[];
  edit: ImageEditRequest | undefined;
} {
  const editImagePath = edit ? fileUrlToPath(edit.image.url) : null;
  const outpaintAspect =
    edit?.outpaint?.aspectMode === "custom"
      ? undefined
      : edit?.outpaint?.aspectMode;
  return {
    prompt,
    settings: {
      model: "fast",
      duration: 5,
      videoResolution: settings.videoResolution,
      fps: 24,
      audio: false,
      cameraMotion: "none",
      imageResolution: settings.imageResolution,
      imageAspectRatio:
        outpaintAspect ||
        settings.imageAspectRatio ||
        settings.aspectRatio,
      imageSteps: settings.imageSteps,
      variations: settings.variations,
      imageProfileId: settings.imageProfileId,
      imageInputRole: settings.imageInputRole,
      enhancePrompt,
    },
    inputMedia: buildGenerationInputMedia(imageInputs),
    edit:
      edit && editImagePath
        ? {
            image: { path: editImagePath },
            ...(edit.mask ? { mask: edit.mask } : {}),
            ...(edit.outpaint ? { outpaint: edit.outpaint } : {}),
          }
        : undefined,
  };
}

export function buildVideoGenerationCommand({
  prompt,
  settings,
  imageInputs,
  inputImage,
  inputAudio,
  useAudioTrack,
  enhancePrompt,
}: {
  prompt: string;
  settings: GenSpaceSettings;
  imageInputs: GenSpaceMediaInput[];
  inputImage: string | null;
  inputAudio: string | null;
  useAudioTrack: boolean;
  enhancePrompt: boolean;
}): VideoGenerationCommand {
  const startImage = imageInputs.find((item) => item.role === "start_image");
  const audio = imageInputs.find((item) =>
    AUDIO_MEDIA_ROLE_SET.has(item.role),
  );
  const videoGuide = imageInputs.find(
    (item) =>
      GUIDE_MEDIA_ROLE_SET.has(item.role) &&
      item.type !== "audio",
  );
  const imagePath = fileUrlToPath(startImage?.url ?? inputImage ?? "");
  const audioPath = fileUrlToPath(
    audio?.url ??
      (videoGuide && useAudioTrack ? videoGuide.url : inputAudio ?? ""),
  );
  const autoDuration = imageInputs.find(
    (item) =>
      GUIDE_MEDIA_ROLE_SET.has(item.role) &&
      (item.type === "video" || item.type === "audio"),
  )?.trimDuration;
  const normalizedSettings = {
    ...settings,
    ...(autoDuration && autoDuration > 0
      ? { duration: Math.max(2, Math.ceil(autoDuration)) }
      : {}),
    ...(audioPath ? { model: "pro" as const } : {}),
  };

  return {
    prompt,
    imagePath,
    settings: {
      model: normalizedSettings.model,
      videoProfileId: normalizedSettings.videoProfileId,
      duration: normalizedSettings.duration,
      videoResolution: normalizedSettings.videoResolution,
      fps: normalizedSettings.fps,
      audio: normalizedSettings.audio || false,
      cameraMotion: "none",
      aspectRatio: normalizedSettings.aspectRatio,
      imageResolution: normalizedSettings.imageResolution,
      imageAspectRatio: normalizedSettings.aspectRatio,
      imageSteps: normalizedSettings.imageSteps,
      enhancePrompt,
    },
    audioPath,
    inputMedia: buildGenerationInputMedia(
      settings.videoProfileId === "minimax_h3"
        ? getH3ReferenceState(imageInputs).activeInputs
        : imageInputs,
    ),
    useAudioTrack,
    normalizedSettings,
    persistNormalizedSettings: Boolean(autoDuration),
  };
}

export function buildVideoToolGenerationCommand({
  tool,
  prompt,
  settings,
  input,
  enhancePrompt,
}: {
  tool: SubmittedVideoToolId;
  prompt: string;
  settings: GenSpaceSettings;
  input: GenSpaceMediaInput | null;
  enhancePrompt: boolean;
}): VideoGenerationCommand | null {
  if (!prompt.trim() || !input) return null;
  const role = tool === "extend" ? "continue_video" : "control_video";
  const command = buildVideoGenerationCommand({
    prompt,
    settings,
    imageInputs: [{ ...input, role, type: "video" }],
    inputImage: null,
    inputAudio: null,
    useAudioTrack: false,
    enhancePrompt,
  });
  if (tool !== "extend") return { ...command, videoTool: tool };
  return {
    ...command,
    settings: { ...command.settings, duration: settings.duration },
    normalizedSettings: {
      ...command.normalizedSettings,
      duration: settings.duration,
    },
    persistNormalizedSettings: false,
    videoTool: tool,
  };
}

export function buildReframeGenerationCommand(
  prompt: string,
  settings: GenSpaceSettings,
  input: ReframePanelState,
  enhancePrompt: boolean,
): ReframeGenerationCommand | null {
  if (!input.videoPath || input.duration < 2) return null;
  const normalizedSettings = {
    ...settings,
    duration: Math.max(2, Math.ceil(input.duration)),
  };
  return {
    prompt: prompt.trim() || "outpaint",
    imagePath: null,
    settings: {
      model: normalizedSettings.model,
      videoProfileId: normalizedSettings.videoProfileId,
      duration: normalizedSettings.duration,
      videoResolution: normalizedSettings.videoResolution,
      fps: normalizedSettings.fps,
      audio: false,
      cameraMotion: "none",
      aspectRatio: normalizedSettings.aspectRatio,
      imageResolution: normalizedSettings.imageResolution,
      imageAspectRatio: normalizedSettings.aspectRatio,
      imageSteps: normalizedSettings.imageSteps,
      enhancePrompt,
    },
    audioPath: null,
    inputMedia: [{ path: input.videoPath, role: "control_video" }],
    useAudioTrack: false,
    normalizedSettings,
    persistNormalizedSettings: true,
    reframe: {
      aspectMode: input.aspectMode,
      padding: input.padding,
      controlVideoStartTime: input.startTime,
      controlVideoDuration: input.duration,
    },
  };
}

export function buildRetakeGenerationCommand(
  prompt: string,
  input: {
    videoPath: string | null;
    startTime: number;
    duration: number;
  },
) {
  if (!RETAKE_AVAILABLE || !input.videoPath || input.duration < 2) return null;
  return {
    request: {
      videoPath: input.videoPath,
      startTime: input.startTime,
      duration: input.duration,
      prompt,
      mode: "replace_audio_and_video" as const,
    },
    snapshot: {
      prompt,
      input: { ...input },
    },
  };
}

export function buildMusicGenerationCommand(
  prompt: string,
  settings: MusicSettings,
  profile: ModelProfile | undefined,
) {
  const submittedPrompt = prompt.trim();
  const compiled = compileMusicRequest(submittedPrompt, settings, profile);
  if (!compiled.ok) return compiled;
  return {
    ok: true as const,
    prompt: submittedPrompt,
    request: compiled.request,
    snapshot: compiled.snapshot,
  };
}
