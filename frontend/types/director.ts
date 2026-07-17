export const DIRECTOR_SCHEMA_VERSION = 1 as const

export type DirectorKeyframePoint = 'start' | 'centre' | 'end'
export type DirectorGuidanceMode = 'human-motion' | 'depth' | 'ingredients'
export type DirectorAudioSource =
  | 'generated'
  | 'guide-audio'
  | 'continue-video'
  | 'guidance-video'

export interface DirectorImageKeyframeV1 {
  assetId: string
  point: DirectorKeyframePoint
  strength: number
}

export interface DirectorPromptSegmentV1 {
  id: string
  startFrame: number
  endFrameExclusive: number
  prompt: string
  keyframe?: DirectorImageKeyframeV1
}

export interface DirectorContinueVideoV1 {
  assetId: string
  timelineDurationFrames: number
  trimStartTime: number
  trimDuration: number
  useSourceAudio: boolean
}

export interface DirectorGuideAudioV1 {
  assetId: string
  trimStartTime: number
  trimDuration: number
  strength: number
}

export interface DirectorVideoGuidanceV1 {
  mode: 'human-motion' | 'depth'
  assetId: string
  trimStartTime: number
  trimDuration: number
  timelineDurationFrames: number
  strength: number
  useSourceAudio: boolean
}

export interface DirectorIngredientsGuidanceV1 {
  mode: 'ingredients'
  assetId: string
  referenceDescription: string
  strength: number
}

export type DirectorGuidanceV1 =
  | DirectorVideoGuidanceV1
  | DirectorIngredientsGuidanceV1

export interface DirectorOutputSettingsV1 {
  modelProfileId: string
  resolutionTier: string
  aspectRatio: string
  fps: number
  requestedDurationSeconds: number
  durationFrames: number
  generateAudio: boolean
}

export interface DirectorSequenceV1 {
  schemaVersion: typeof DIRECTOR_SCHEMA_VERSION
  globalPrompt: string
  output: DirectorOutputSettingsV1
  promptSegments: DirectorPromptSegmentV1[]
  continueVideo?: DirectorContinueVideoV1
  guideAudio?: DirectorGuideAudioV1
  guidance?: DirectorGuidanceV1
  latestGenerationAssetId?: string
  latestGenerationVisible?: boolean
  latestGenerationTakeIndex?: number
  updatedAt: number
}

export interface DirectorGenerationMetadata {
  schemaVersion: typeof DIRECTOR_SCHEMA_VERSION
  timelineId: string
  compiledPrompt: string
  resolvedFrameCount: number
  modelProfileId: string
  generatedAt: number
}

export interface DirectorImageKeyframeRequest extends DirectorImageKeyframeV1 {
  path: string
}

export interface DirectorPromptSegmentRequest
  extends Omit<DirectorPromptSegmentV1, 'keyframe'> {
  keyframe?: DirectorImageKeyframeRequest
}

export interface GenerateDirectorRequest {
  schemaVersion: typeof DIRECTOR_SCHEMA_VERSION
  modelProfileId: string
  resolutionTier: string
  aspectRatio: string
  fps: number
  requestedDurationSeconds: number
  durationFrames: number
  generateAudio: boolean
  globalPrompt: string
  promptSegments: DirectorPromptSegmentRequest[]
  continueVideo?: DirectorContinueVideoV1 & { path: string }
  guideAudio?: DirectorGuideAudioV1 & { path: string }
  guidance?:
    | (Omit<DirectorVideoGuidanceV1, 'mode'> & { mode: 'human_motion' | 'depth'; path: string })
    | (DirectorIngredientsGuidanceV1 & { path: string })
}

export interface GenerateDirectorResponse {
  status: string
  video_path?: string
  seed?: number
  resolvedFrameCount?: number
  compiledPrompt?: string
  warnings: string[]
}
