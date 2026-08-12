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
export type ModelProfileHandlerOwner = 'video_generation' | 'director_generation' | 'retake' | 'sfx_generation' | 'speech_generation'

export interface ModelProfileSystemDependency {
  id: string
  kind: 'lora' | 'checkpoint'
  requiredBy: string[]
  userSelectable: false
}

export interface ModelProfileVideoAudioPolicy {
  status: ModelProfileStatus
  handler: ModelProfileHandlerOwner | null
  requiredPackIds: string[]
  soundtrack: boolean
  audioConditioning: boolean
  controlVideoAudio: boolean
  outputAudio: boolean
  maxAudioInputs: number
}

export interface ModelProfileSpeechPolicy {
  status: ModelProfileStatus
  handler: ModelProfileHandlerOwner | null
  requiredPackIds: string[]
  referenceVoice: boolean
  tts: boolean
  maxReferenceInputs: number
  referenceRequired?: boolean
}

export interface ModelProfileSfxPolicy {
  status: ModelProfileStatus
  handler: ModelProfileHandlerOwner | null
  requiredPackIds: string[]
  text: boolean
  controlVideoAudio: boolean
  maxDurationSeconds: number | null
}

export interface ModelProfileVideoEditOperationPolicy {
  id: string
  status: ModelProfileStatus
  handler: ModelProfileHandlerOwner | null
  requiredPackIds: string[]
  systemDependencyIds: string[]
  sourceBehavior: 'control_video' | 'continue_video' | 'source_video'
  durationBehavior: 'source_duration' | 'extend_by'
  disabledReason: string | null
}

export interface ModelProfileVideoEditPolicy {
  operations: ModelProfileVideoEditOperationPolicy[]
}

export interface ModelProfileDirectorRenderStrategyPolicy {
  id: string
  status: ModelProfileStatus
  handler: ModelProfileHandlerOwner | null
  requiredPackIds: string[]
  maxDurationSeconds: number | null
}

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
  outpainting: boolean
  maskedEditReferences: boolean
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
  maxReferenceImages?: number
  maxReferenceVideos?: number
  maxReferenceAudios?: number
  maxCombinedReferences?: number
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
  renderStrategies: ModelProfileDirectorRenderStrategyPolicy[]
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
  supportsAutoDuration: boolean
  autoDurationFallbackSeconds: number
  supportsDescriptionEnhancement: boolean
  supportsVocalLanguage: boolean
  supportedLanguages: string[]
  defaultVocalLanguage: string
  supportsVocalGenderConditioning: boolean
  supportsCover: boolean
  supportsReferenceTimbre: boolean
  supportsComposeLyrics: boolean
  supportsComposeThinking: boolean
  defaultCoverStrength: number
  defaultWeirdness: number
  defaultPromptInfluence: number
}

export interface ModelProfileLicenseInfo {
  projectLicense: string
  weightsLicense: string
  commercialUse: 'permitted' | 'restricted' | 'unknown'
  attributionRequired: boolean
  sourceProject: string
  sourceRevision: string | null
  licenseUrl?: string | null
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
  requiredPackIds: string[]
  systemDependencies: ModelProfileSystemDependency[]
  videoAudio: ModelProfileVideoAudioPolicy
  speech: ModelProfileSpeechPolicy
  sfx: ModelProfileSfxPolicy
  videoEdits: ModelProfileVideoEditPolicy
  director: ModelProfileDirectorPolicy
  music: ModelProfileMusicPolicy
  license: ModelProfileLicenseInfo | null
  availability: ModelProfileAvailability
}

export interface ModelProfileListResponse {
  profiles: ModelProfileWire[]
}

export type ModelProfileWire = Omit<
  ModelProfile,
  'requiredPackIds' | 'systemDependencies' | 'videoAudio' | 'speech' | 'sfx' | 'videoEdits' | 'director'
> & {
  requiredPackIds?: string[]
  systemDependencies?: ModelProfileSystemDependency[]
  videoAudio?: ModelProfileVideoAudioPolicy
  speech?: ModelProfileSpeechPolicy
  sfx?: ModelProfileSfxPolicy
  videoEdits?: ModelProfileVideoEditPolicy
  director: Omit<ModelProfileDirectorPolicy, 'renderStrategies'> & {
    renderStrategies?: ModelProfileDirectorRenderStrategyPolicy[]
  }
}
