import type { Asset } from '@/types/project'
import type { ModelProfile } from '@/types/model-profiles'
import type {
  DirectorAudioSource,
  DirectorSequenceV1,
} from '@/types/director'
import {
  ltxFrameCountToTimelineFrames,
  resolveKeyframeFrame,
  snapLtxFramesUp,
} from './director-timeline'

export interface DirectorIssue {
  code: string
  message: string
  segmentId?: string
  track?: 'prompt' | 'audio' | 'guidance'
}

export interface DirectorValidationResult {
  errors: DirectorIssue[]
  warnings: DirectorIssue[]
  disabledTracks: { audio?: string; guidance?: string }
  activeAudioSource: DirectorAudioSource
  canGenerate: boolean
}

const RELAY_MARKER = /\[(?:\d+(?:\.\d+)?(?:s|%)?):(?:\d+(?:\.\d+)?(?:s|%)?)?\]/i

export function resolveDirectorAudioSource(
  sequence: DirectorSequenceV1,
): DirectorAudioSource {
  if (sequence.continueVideo?.useSourceAudio) return 'continue-video'
  if (sequence.guidance?.mode !== 'ingredients' && sequence.guidance?.useSourceAudio) {
    return 'guidance-video'
  }
  if (sequence.guideAudio) return 'guide-audio'
  return 'generated'
}

export function validateDirectorSequence(
  sequence: DirectorSequenceV1,
  profile: ModelProfile | undefined,
  assets: Asset[],
): DirectorValidationResult {
  const errors: DirectorIssue[] = []
  const warnings: DirectorIssue[] = []
  const disabledTracks: DirectorValidationResult['disabledTracks'] = {}
  const byId = new Map(assets.map((asset) => [asset.id, asset]))
  const policy = profile?.director
  const add = (code: string, message: string, extra: Partial<DirectorIssue> = {}) => {
    errors.push({ code, message, ...extra })
  }

  if (!profile || !policy?.enabled) {
    add('DIRECTOR_PROFILE_NOT_SUPPORTED', 'Selected model does not support Director Mode.')
  } else if (profile.availability !== 'available' && profile.availability !== 'experimental') {
    add('DIRECTOR_MODEL_UNAVAILABLE', 'Selected Director model is not available.')
  }
  if (policy && sequence.output.requestedDurationSeconds > policy.maxDurationSeconds) {
    add('DIRECTOR_DURATION_TOO_LONG', `Maximum Director duration is ${policy.maxDurationSeconds}s.`)
  }
  if (sequence.output.durationFrames < 9 || (sequence.output.durationFrames - 1) % 8 !== 0) {
    add('DIRECTOR_INVALID_FRAME_RANGE', 'Output frame count must satisfy 8n+1.')
  }
  if (sequence.output.fps !== 24) {
    add('DIRECTOR_WANGP_MAPPING_UNAVAILABLE', 'Director V1 requires 24 fps.')
  }
  if (!sequence.output.generateAudio) {
    add('DIRECTOR_WANGP_MAPPING_UNAVAILABLE', 'Audio-disabled Director output is not verified.')
  }
  if (sequence.guideAudio) {
    add('DIRECTOR_TRACK_DEFERRED', 'Guide Audio is read-only in this Director V1 release. Remove it before generation.', { track: 'audio' })
  }
  if (sequence.guidance) {
    add('DIRECTOR_TRACK_DEFERRED', 'Control Media is read-only in this Director V1 release. Remove it before generation.', { track: 'guidance' })
  }

  const expectedStart = sequence.continueVideo
    ? ltxFrameCountToTimelineFrames(sequence.continueVideo.timelineDurationFrames)
    : 0
  const sorted = [...sequence.promptSegments].sort((a, b) => a.startFrame - b.startFrame)
  if (sorted.length > 1 && policy && !policy.promptRelay) {
    add('DIRECTOR_WANGP_MAPPING_UNAVAILABLE', 'Selected model does not support Prompt Relay.')
  }
  let previousEnd = expectedStart
  const frames = new Map<number, string>()
  const injectedStrengths = new Set<number>()
  for (const segment of sorted) {
    if (segment.startFrame < previousEnd) add('DIRECTOR_PROMPT_OVERLAP', 'Prompt segments overlap.', { segmentId: segment.id, track: 'prompt' })
    if (segment.endFrameExclusive <= segment.startFrame || segment.endFrameExclusive > sequence.output.durationFrames - 1) {
      add('DIRECTOR_INVALID_FRAME_RANGE', 'Prompt segment has an invalid frame range.', { segmentId: segment.id, track: 'prompt' })
    }
    if (RELAY_MARKER.test(segment.prompt) || RELAY_MARKER.test(sequence.globalPrompt)) {
      add('DIRECTOR_MANUAL_RELAY_NOT_ALLOWED', 'Director owns Prompt Relay timing.', { segmentId: segment.id, track: 'prompt' })
    }
    if (segment.keyframe) {
      const asset = byId.get(segment.keyframe.assetId)
      if (!asset) add('DIRECTOR_MISSING_ASSET', 'Keyframe image is missing.', { segmentId: segment.id, track: 'prompt' })
      else if (asset.type !== 'image') add('DIRECTOR_MEDIA_TYPE_MISMATCH', 'Keyframe asset must be an image.', { segmentId: segment.id, track: 'prompt' })
      const frame = resolveKeyframeFrame(segment)
      injectedStrengths.add(segment.keyframe.strength)
      if (policy && !policy.injectedFrames) add('DIRECTOR_WANGP_MAPPING_UNAVAILABLE', 'Selected model does not support injected frames.', { segmentId: segment.id, track: 'prompt' })
      const previous = frames.get(frame)
      if (previous) add('DIRECTOR_DUPLICATE_KEYFRAME_FRAME', `Keyframes ${previous} and ${segment.id} resolve to frame ${frame}.`, { segmentId: segment.id, track: 'prompt' })
      frames.set(frame, segment.id)
    }
    previousEnd = segment.endFrameExclusive
  }
  if (injectedStrengths.size > 1) add('DIRECTOR_WANGP_MAPPING_UNAVAILABLE', 'Injected keyframes require one shared strength.', { track: 'prompt' })

  const keyframeCount = sorted.filter((segment) => segment.keyframe).length
  const activeAudioSource = resolveDirectorAudioSource(sequence)
  if (policy?.maxImageKeyframes !== null && policy?.maxImageKeyframes !== undefined && keyframeCount > policy.maxImageKeyframes) {
    add('DIRECTOR_TOO_MANY_KEYFRAMES', `Model supports at most ${policy.maxImageKeyframes} keyframes.`)
  }
  if (sequence.continueVideo) {
    const asset = byId.get(sequence.continueVideo.assetId)
    if (!asset) add('DIRECTOR_MISSING_ASSET', 'Continue Video source is missing.', { track: 'prompt' })
    else if (asset.type !== 'video') add('DIRECTOR_MEDIA_TYPE_MISMATCH', 'Continue Video source must be video.', { track: 'prompt' })
    else if (sequence.continueVideo.trimDuration <= 0 || sequence.continueVideo.trimStartTime < 0 || (asset.duration && sequence.continueVideo.trimStartTime + sequence.continueVideo.trimDuration > asset.duration + 0.05)) add('DIRECTOR_INVALID_FRAME_RANGE', 'Continue Video trim is outside source duration.', { track: 'prompt' })
    if (sequence.continueVideo.timelineDurationFrames !== snapLtxFramesUp(sequence.continueVideo.trimDuration * sequence.output.fps)) add('DIRECTOR_INVALID_FRAME_RANGE', 'Continue Video trim and timeline duration do not match.', { track: 'prompt' })
    if (!policy?.continueVideo) add('DIRECTOR_GUIDANCE_COMBINATION_NOT_SUPPORTED', 'Selected model does not support Continue Video.')
  }
  if (sequence.guideAudio) {
    const asset = byId.get(sequence.guideAudio.assetId)
    if (!asset) {
      const issue = { code: 'DIRECTOR_MISSING_ASSET', message: 'Stored Guide Audio source is missing.', track: 'audio' as const }
      if (activeAudioSource === 'guide-audio') errors.push(issue); else warnings.push(issue)
    } else if (asset.type !== 'audio') {
      const issue = { code: 'DIRECTOR_MEDIA_TYPE_MISMATCH', message: 'Stored Guide Audio source must be audio.', track: 'audio' as const }
      if (activeAudioSource === 'guide-audio') errors.push(issue); else warnings.push(issue)
    } else if (activeAudioSource === 'guide-audio' && (sequence.guideAudio.trimDuration <= 0 || sequence.guideAudio.trimStartTime < 0 || (asset.duration && sequence.guideAudio.trimStartTime + sequence.guideAudio.trimDuration > asset.duration + 0.05))) {
      add('DIRECTOR_INVALID_FRAME_RANGE', 'Guide Audio trim is outside source duration.', { track: 'audio' })
    }
    if (activeAudioSource === 'guide-audio') {
      if (policy && !policy.guideAudioStartOnly) add('DIRECTOR_GUIDANCE_NOT_SUPPORTED', 'Selected model does not support Guide Audio.', { track: 'audio' })
      if (sequence.guideAudio.strength !== 1) add('DIRECTOR_WANGP_MAPPING_UNAVAILABLE', 'Guide Audio strength is fixed in V1.', { track: 'audio' })
    }
  }
  if (sequence.guidance) {
    const asset = byId.get(sequence.guidance.assetId)
    const expected = sequence.guidance.mode === 'ingredients' ? 'image' : 'video'
    if (!asset) add('DIRECTOR_MISSING_ASSET', 'Guidance source is missing.', { track: 'guidance' })
    else if (asset.type !== expected) add('DIRECTOR_MEDIA_TYPE_MISMATCH', `${sequence.guidance.mode} guidance requires ${expected} media.`, { track: 'guidance' })
    else if (sequence.guidance.mode !== 'ingredients' && (sequence.guidance.trimDuration <= 0 || sequence.guidance.trimStartTime < 0 || (asset.duration && sequence.guidance.trimStartTime + sequence.guidance.trimDuration > asset.duration + 0.05))) add('DIRECTOR_INVALID_FRAME_RANGE', 'Guidance trim is outside source duration.', { track: 'guidance' })
    const apiMode = sequence.guidance.mode.replace('-', '_') as 'human_motion' | 'depth' | 'ingredients'
    if (!policy?.guidanceModes.includes(apiMode)) add('DIRECTOR_GUIDANCE_NOT_SUPPORTED', 'Selected guidance mode is unavailable.', { track: 'guidance' })
    if (sequence.guidance.mode === 'ingredients' && !sequence.guidance.referenceDescription.trim()) {
      add('DIRECTOR_INGREDIENTS_DESCRIPTION_REQUIRED', 'Ingredients needs Reference Description.', { track: 'guidance' })
    }
    if (sequence.guidance.mode !== 'ingredients' && sequence.guidance.timelineDurationFrames !== sequence.output.durationFrames) add('DIRECTOR_INVALID_FRAME_RANGE', 'Guidance duration must match Director output.', { track: 'guidance' })
    if (sequence.guidance.strength !== 1) add('DIRECTOR_WANGP_MAPPING_UNAVAILABLE', 'Guidance strength is fixed in V1.', { track: 'guidance' })
    if (keyframeCount > 0) {
      const allowed = sequence.guidance.mode === 'ingredients'
        ? policy?.allowKeyframesWithIngredients
        : policy?.allowKeyframesWithVideoGuidance
      if (!allowed) add('DIRECTOR_GUIDANCE_COMBINATION_NOT_SUPPORTED', 'Keyframes cannot be combined with selected guidance mode.', { track: 'guidance' })
    }
    if (sequence.continueVideo) add('DIRECTOR_GUIDANCE_COMBINATION_NOT_SUPPORTED', 'Continue Video cannot be combined with guidance in V1.', { track: 'guidance' })
  }

  const providers = [
    Boolean(sequence.continueVideo?.useSourceAudio),
    Boolean(sequence.guidance?.mode !== 'ingredients' && sequence.guidance?.useSourceAudio),
  ].filter(Boolean).length
  if (providers > 1) add('DIRECTOR_AUDIO_SOURCE_CONFLICT', 'Only one source-audio provider can be active.', { track: 'audio' })
  if (activeAudioSource === 'continue-video') disabledTracks.audio = 'Continue Video owns source audio.'
  else if (activeAudioSource === 'guidance-video') disabledTracks.audio = 'Guidance video owns source audio.'
  if (sequence.guidance && sequence.guideAudio && activeAudioSource === 'guide-audio' && !policy?.allowGuideAudioWithGuidance) {
    add('DIRECTOR_GUIDANCE_COMBINATION_NOT_SUPPORTED', 'Guide Audio cannot be combined with guidance.', { track: 'audio' })
  }

  return { errors, warnings, disabledTracks, activeAudioSource, canGenerate: errors.length === 0 }
}

const DIRECTOR_ERROR_MESSAGES: Record<string, string> = {
  DIRECTOR_PROFILE_NOT_SUPPORTED: 'Selected model does not support Director Mode.',
  DIRECTOR_MODEL_UNAVAILABLE: 'Director model is unavailable. Check WanGP runtime and model files.',
  DIRECTOR_INVALID_FRAME_RANGE: 'Director sequence contains an invalid frame range.',
  DIRECTOR_PROMPT_GAP: 'Prompt track contains a gap.',
  DIRECTOR_PROMPT_OVERLAP: 'Prompt segments overlap.',
  DIRECTOR_PROMPT_REQUIRED: 'Add local or global prompt text.',
  DIRECTOR_MISSING_ASSET: 'Referenced project media is missing.',
  DIRECTOR_MEDIA_TYPE_MISMATCH: 'Referenced media has wrong type.',
  DIRECTOR_DUPLICATE_KEYFRAME_FRAME: 'Two keyframes resolve to same frame.',
  DIRECTOR_AUDIO_SOURCE_CONFLICT: 'Continue Video and guidance cannot both use source audio.',
  DIRECTOR_GUIDANCE_NOT_SUPPORTED: 'Selected guidance mode is unavailable.',
  DIRECTOR_GUIDANCE_COMBINATION_NOT_SUPPORTED: 'Selected Director inputs cannot be combined.',
  DIRECTOR_INGREDIENTS_DESCRIPTION_REQUIRED: 'Ingredients needs Reference Description.',
  DIRECTOR_DURATION_TOO_LONG: 'Director sequence exceeds model duration limit.',
  DIRECTOR_WANGP_MAPPING_UNAVAILABLE: 'WanGP mapping for this Director input is unavailable.',
  DIRECTOR_TRACK_DEFERRED: 'Stored media belongs to a deferred Director track. Remove it before generation.',
}

export function formatDirectorError(raw: string): string {
  const code = Object.keys(DIRECTOR_ERROR_MESSAGES).find((candidate) => raw.includes(candidate))
  return code ? DIRECTOR_ERROR_MESSAGES[code] : raw
}
