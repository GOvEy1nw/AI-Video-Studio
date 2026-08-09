export interface SfxVideoInput {
  assetId?: string
  path: string
  url: string
  trimStartTime?: number
  trimDuration?: number
}

export interface SfxSettings {
  profileId: string
  negativePrompt: string
  durationSeconds: number
  seed: number | null
  video: SfxVideoInput | null
}

export interface GenerateSfxRequest {
  modelProfileId: string
  prompt: string
  negativePrompt: string
  durationSeconds: number
  seed: number | null
  video?: { path: string; trimStartTime?: number; trimDuration?: number }
}

export interface SfxGenerationRecipeV1 extends Omit<GenerateSfxRequest, "video"> {
  schemaVersion: 1
  processor: "mmaudio"
  processorRevision: string
  video: SfxVideoInput | null
}
