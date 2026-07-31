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
    editOutpaint: params.imageEditOutpaint ?? null,
    reframe:
      mode === "reframe"
        ? {
            videoUrl: asset.url,
            videoPath: asset.path,
            duration: asset.duration ?? params.reframeDuration,
            aspectMode: params.reframeAspectMode,
            padding: params.reframePadding,
          }
        : null,
  } as const;
}
