import type { GenerateSfxRequest, SfxGenerationRecipeV1, SfxSettings } from "../../../types/sfx"

export function buildSfxGenerationCommand(prompt: string, settings: SfxSettings): { request: GenerateSfxRequest; recipe: SfxGenerationRecipeV1 } | null {
  if (!prompt.trim() || !settings.profileId) return null
  const request: GenerateSfxRequest = {
    modelProfileId: settings.profileId, prompt: prompt.trim(), negativePrompt: settings.negativePrompt.trim(),
    durationSeconds: settings.durationSeconds, seed: settings.seed,
    ...(settings.video ? { video: { path: settings.video.path, trimStartTime: settings.video.trimStartTime, trimDuration: settings.video.trimDuration } } : {}),
  }
  return { request, recipe: { ...request, schemaVersion: 1, processor: "mmaudio", processorRevision: "WanGP MMAudio", video: settings.video ? { ...settings.video } : null } }
}
