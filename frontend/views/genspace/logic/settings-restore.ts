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
import type { SfxSettings } from "../../../types/sfx";
import type { SpeechSettings } from "../../../types/speech";
import { getImageModeForProfileId } from "../image/image-profile-options";

export function buildGenSpaceRestorePlan(
  asset: Asset,
  projectAssets: Asset[],
  settings: GenSpaceSettings,
  musicSettings: MusicSettings,
) {
  const params = asset.generationParams;
  if (!params) return null;
  const isSfx = params.mode === "text-to-sfx" && params.sfx?.schemaVersion === 1;
  const isSpeech =
    params.mode === "text-to-speech" &&
    (params.speech?.schemaVersion === 1 || params.speech?.schemaVersion === 2);
  const mode = genSpaceModeFromParams(params);
  const restoredImageInputs = buildImageInputsFromParams(
    params,
    projectAssets,
  );
  const editImage =
    restoredImageInputs.find(({ role }) => role === "edit_image") ?? null;
  const videoToolInput = params.videoTool
    ? (restoredImageInputs.find(({ type }) => type === "video") ?? null)
    : null;
  const imageInputs = params.videoTool
    ? []
    : restoredImageInputs.filter(({ role }) => role !== "edit_image");
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
    videoMode: mode === "reframe" || params.videoTool ? "reframe" : "generate",
    videoTool: params.videoTool ?? "reframe",
    prompt: params.prompt,
    settings: restoredSettings,
    musicSettings:
      mode === "music"
        ? musicSettingsFromGenerationParams(params, musicSettings)
        : null,
    sfxSettings: isSfx
      ? ({
          profileId: params.sfx!.modelProfileId,
          negativePrompt: params.sfx!.negativePrompt,
          durationSeconds: params.sfx!.durationSeconds,
          seed: params.sfx!.seed,
          video: params.sfx!.video
            ? (() => {
                const saved = params.sfx!.video!;
                const asset = projectAssets.find(({ id }) => id === saved.assetId);
                return asset ? { ...saved, path: asset.path, url: asset.url } : saved;
              })()
            : null,
        } satisfies SfxSettings)
      : null,
    speechSettings: isSpeech
      ? (() => {
          const recipe = params.speech!;
          const savedReferences = recipe.schemaVersion === 1
            ? recipe.referenceAudio ? [recipe.referenceAudio] : []
            : recipe.references;
          return {
            profileId: recipe.modelProfileId,
            seed: recipe.seed,
            references: savedReferences.map((saved) => {
              const source = saved.assetId
                ? projectAssets.find(({ id }) => id === saved.assetId)
                : undefined;
              return source ? { ...saved, path: source.path, url: source.url } : { ...saved };
            }),
            segments: recipe.schemaVersion === 2 ? recipe.segments.map((segment) => ({ ...segment })) : [],
          } satisfies SpeechSettings;
        })()
      : null,
    speechPromptEnhancement: isSpeech && params.speech?.schemaVersion === 2
      ? params.speech.enhancePrompt
      : null,
    media: {
      imageInputs,
      editImage,
      inputImage: editImage ? null : legacy.inputImage,
      inputAudio: legacy.inputAudio,
      videoToolInput,
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
