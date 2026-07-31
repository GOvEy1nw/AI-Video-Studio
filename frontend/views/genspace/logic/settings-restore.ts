import {
  buildImageInputsFromParams,
  genSpaceModeFromParams,
  musicSettingsFromGenerationParams,
  resolveLegacyInputMedia,
  settingsPatchFromGenerationParams,
} from "../../../lib/apply-generation-params";
import type { MusicSettings } from "../../../types/music";
import type { Asset } from "../../../types/project";
import type { GenSpaceSettings } from "../constants";
import { getImageModeForProfileId } from "../image/image-profile-options";

export function buildGenSpaceRestorePlan(
  asset: Asset,
  projectAssets: Asset[],
  settings: GenSpaceSettings,
  musicSettings: MusicSettings,
) {
  const params = asset.generationParams;
  if (!params) return null;
  const mode = genSpaceModeFromParams(params);
  const restoredImageInputs = buildImageInputsFromParams(
    params,
    projectAssets,
  );
  const editImage =
    restoredImageInputs.find(({ role }) => role === "edit_image") ?? null;
  const imageInputs = restoredImageInputs.filter(
    ({ role }) => role !== "edit_image",
  );
  const legacy = resolveLegacyInputMedia(params, imageInputs, projectAssets);
  const restoredSettings = settingsPatchFromGenerationParams(params, settings);
  const editOutpaint =
    params.imageEditOutpaint?.aspectMode === "custom"
      ? {
          aspectMode: "16:9" as const,
          padding: { top: 0, bottom: 0, left: 0, right: 0 },
        }
      : (params.imageEditOutpaint ?? null);
  const reframeWasCustom = params.reframeAspectMode === "custom";
  return {
    mode:
      mode === "image" ? "image" : mode === "music" ? "music" : "video",
    imageMode:
      mode === "image"
        ? params.imageProcessMode ??
          getImageModeForProfileId(restoredSettings.imageProfileId)
        : "create",
    videoMode: mode === "reframe" ? "reframe" : "generate",
    prompt: params.prompt,
    settings: restoredSettings,
    musicSettings:
      mode === "music"
        ? musicSettingsFromGenerationParams(params, musicSettings)
        : null,
    media: {
      imageInputs,
      editImage,
      inputImage: editImage ? null : legacy.inputImage,
      inputAudio: legacy.inputAudio,
    },
    editToolMode: params.imageEditMask
      ? "retouch"
      : params.imageEditOutpaint
        ? "reframe"
        : "edit",
    editMask: params.imageEditMask ?? null,
    editOutpaint,
    reframe:
      mode === "reframe"
        ? {
            videoUrl: asset.url,
            videoPath: asset.path,
            duration: asset.duration ?? params.reframeDuration,
            aspectMode: reframeWasCustom ? "16:9" : params.reframeAspectMode,
            padding: reframeWasCustom
              ? { top: 0, bottom: 0, left: 0, right: 0 }
              : params.reframePadding,
          }
        : null,
  } as const;
}
