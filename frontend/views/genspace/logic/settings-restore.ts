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

export function buildGenSpaceRestorePlan(
  asset: Asset,
  projectAssets: Asset[],
  settings: GenSpaceSettings,
  musicSettings: MusicSettings,
) {
  const params = asset.generationParams;
  if (!params) return null;
  const mode = genSpaceModeFromParams(params);
  const imageInputs = buildImageInputsFromParams(params, projectAssets);
  const legacy = resolveLegacyInputMedia(params, imageInputs, projectAssets);
  return {
    mode:
      mode === "image" ? "image" : mode === "music" ? "music" : "video",
    videoMode: mode === "reframe" ? "reframe" : "generate",
    prompt: params.prompt,
    settings: settingsPatchFromGenerationParams(params, settings),
    musicSettings:
      mode === "music"
        ? musicSettingsFromGenerationParams(params, musicSettings)
        : null,
    media: {
      imageInputs,
      inputImage: legacy.inputImage,
      inputAudio: legacy.inputAudio,
    },
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
