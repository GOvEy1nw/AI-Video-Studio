/**
 * Curated model profile types — mirror the backend's
 * `ModelProfileResponse` / `ModelProfileListResponse` shapes from
 * `api_types.py`. The backend is the source of truth for which models
 * appear in the AiVS UI; the frontend reads this list via
 * `GET /api/model-profiles`.
 */

export type ModelProfileAvailability =
  | 'available'
  | 'missing_model_files'
  | 'partially_installed'
  | 'unsupported'
  | 'experimental'
  | 'hidden'

export type ModelProfileStatus = 'stable' | 'experimental' | 'hidden'

export interface ModelProfileCapabilities {
  textToImage: boolean
  textToVideo: boolean
  imageToVideo: boolean
  videoToVideo: boolean
  audioToVideo: boolean
  audioOutput: boolean
  textToAudio: boolean
  audioToAudio: boolean
  startImage: boolean
  endImage: boolean
  controlVideo: boolean
  videoContinuation: boolean
  slidingWindow: boolean
  referenceImages: boolean
  controlImage: boolean
  inpainting: boolean
  lora: 'supported' | 'unsupported' | 'future' | 'experimental'
}

export interface ModelProfileInputMediaRole {
  role: string
  label: string
  description: string
  kind: 'reference' | 'control' | 'inpaint'
}

export interface ModelProfileInputMedia {
  supportsImageInputs: boolean
  tooltipLabel: string
  maxImages: number
  defaultRole: string | null
  roles: ModelProfileInputMediaRole[]
}

export interface ModelProfileUi {
  defaultAspectRatio: string
  defaultResolutionTier: string
  allowedAspectRatios: string[]
  allowedResolutionTiers: string[]
}

export interface ModelProfileDirectorPolicy {
  enabled: boolean
  promptRelay: boolean
  injectedFrames: boolean
  continueVideo: boolean
  guideAudioStartOnly: boolean
  maxImageKeyframes: number | null
  maxGuidanceSegments: number
  guidanceModes: Array<'human_motion' | 'depth' | 'ingredients'>
  maxDurationSeconds: number
  allowKeyframesWithVideoGuidance: boolean
  allowKeyframesWithIngredients: boolean
  allowGuideAudioWithGuidance: boolean
}

export interface ModelProfileMusicPolicy {
  enabled: boolean
  supportsInstrumental: boolean
  supportsAutoLyrics: boolean
  supportsCustomLyrics: boolean
  autoLyricsRequiresPromptEnhancer: boolean
  autoFillMetadata: boolean
  durationMinSeconds: number
  durationMaxSeconds: number
  durationStepSeconds: number
  defaultDurationSeconds: number
  supportsBpm: boolean
  bpmMin: number
  bpmMax: number
  supportsKeyScale: boolean
  supportsTimeSignature: boolean
  timeSignatures: string[]
  defaultVocalMode: string
  maxVariations: number
}

export interface ModelProfileLicenseInfo {
  projectLicense: string
  weightsLicense: string
  commercialUse: 'permitted' | 'restricted' | 'unknown'
  attributionRequired: boolean
  sourceProject: string
  sourceRevision: string | null
  notes: string
}

export type ModelProfileJsonValue =
  | string
  | number
  | boolean
  | null
  | ModelProfileJsonValue[]
  | { [key: string]: ModelProfileJsonValue }

export interface ModelProfileWanGPMetadata {
  modelType: string
  family: string
  familyLabel: string
  baseModelType: string
  finetune: boolean
  mainOutput: string[]
  outputs: string[]
  inputs: string[]
  mediaInputs: Record<string, Record<string, boolean>>
  capabilities: Record<string, boolean>
  settingValues: Record<string, ModelProfileJsonValue>
}

export interface ModelProfile {
  id: string
  displayName: string
  mediaType: string
  visible: boolean
  status: ModelProfileStatus
  wangpModelType: string
  wangpMetadata: ModelProfileWanGPMetadata
  capabilities: ModelProfileCapabilities
  ui: ModelProfileUi
  inputMedia: ModelProfileInputMedia
  director: ModelProfileDirectorPolicy
  music: ModelProfileMusicPolicy
  license: ModelProfileLicenseInfo | null
  availability: ModelProfileAvailability
}

export interface ModelProfileListResponse {
  profiles: ModelProfile[]
}
