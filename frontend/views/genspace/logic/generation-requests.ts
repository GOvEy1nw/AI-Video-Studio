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

export interface GenerationInputMedia {
  path: string;
  role: string;
  type?: "image" | "video" | "audio";
  trimStartTime?: number;
  trimDuration?: number;
  crop?: MediaCropRecipe;
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
    const path = fileUrlToPath(item.url);
    if (!path) return [];
    return [
      {
        path,
        role: item.role,
        ...(item.type ? { type: item.type } : {}),
        ...(item.trimStartTime !== undefined
          ? { trimStartTime: item.trimStartTime }
          : {}),
        ...(item.trimDuration !== undefined
          ? { trimDuration: item.trimDuration }
          : {}),
        ...(item.crop ? { crop: { ...item.crop } } : {}),
      },
    ];
  });
}

export function buildImageGenerationCommand(
  prompt: string,
  settings: GenSpaceSettings,
  imageInputs: GenSpaceMediaInput[],
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
        edit?.outpaint?.aspectMode ||
        settings.imageAspectRatio ||
        settings.aspectRatio,
      imageSteps: settings.imageSteps,
      variations: settings.variations,
      imageProfileId: settings.imageProfileId,
      imageInputRole: settings.imageInputRole,
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
}: {
  prompt: string;
  settings: GenSpaceSettings;
  imageInputs: GenSpaceMediaInput[];
  inputImage: string | null;
  inputAudio: string | null;
  useAudioTrack: boolean;
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
    },
    audioPath,
    inputMedia: buildGenerationInputMedia(imageInputs),
    useAudioTrack,
    normalizedSettings,
    persistNormalizedSettings: Boolean(autoDuration),
  };
}

export function buildReframeGenerationCommand(
  prompt: string,
  settings: GenSpaceSettings,
  input: ReframePanelState,
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
