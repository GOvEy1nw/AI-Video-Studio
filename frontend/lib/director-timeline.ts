import type {
  DirectorKeyframePoint,
  DirectorPromptSegmentV1,
  DirectorSequenceV1,
} from '@/types/director'
import type { Asset } from '@/types/project'

export interface DirectorGenerationTakeSelection {
  url: string
  path: string
  thumbnail?: string
  index: number
  count: number
}

export function resolveDirectorGenerationTake(
  sequence: DirectorSequenceV1,
  asset: Asset | undefined,
): DirectorGenerationTakeSelection | undefined {
  if (!asset) return undefined
  const takes = asset.takes?.length ? asset.takes : [{
    url: asset.url,
    path: asset.path,
    thumbnail: asset.thumbnail,
    createdAt: asset.createdAt,
  }]
  const requestedIndex = sequence.latestGenerationTakeIndex ?? takes.length - 1
  const index = Math.max(0, Math.min(requestedIndex, takes.length - 1))
  return { ...takes[index], index, count: takes.length }
}

export function snapLtxFramesUp(requestedFrames: number): number {
  const safe = Math.max(1, Math.ceil(requestedFrames))
  return Math.max(9, Math.ceil((safe - 1) / 8) * 8 + 1)
}

export function snapLtxFramesDown(requestedFrames: number): number {
  const safe = Math.max(9, Math.floor(requestedFrames))
  return Math.max(9, Math.floor((safe - 1) / 8) * 8 + 1)
}

export function resolveKeyframeFrame(segment: DirectorPromptSegmentV1): number {
  if (!segment.keyframe) throw new Error('Segment does not contain a keyframe')
  const lastFrame = segment.endFrameExclusive - 1
  if (segment.keyframe.point === 'start') return segment.startFrame
  if (segment.keyframe.point === 'centre') {
    return Math.floor((segment.startFrame + lastFrame) / 2)
  }
  return lastFrame
}

export function createDirectorSequence(
  modelProfileId: string,
  resolutionTier: string,
  aspectRatio: string,
  requestedDurationSeconds = 5,
): DirectorSequenceV1 {
  const fps = 24
  const durationFrames = snapLtxFramesUp(requestedDurationSeconds * fps)
  return {
    schemaVersion: 1,
    globalPrompt: '',
    output: {
      modelProfileId,
      resolutionTier,
      aspectRatio,
      fps,
      requestedDurationSeconds,
      durationFrames,
      generateAudio: true,
    },
    promptSegments: [{
      id: crypto.randomUUID(),
      startFrame: 0,
      endFrameExclusive: durationFrames,
      prompt: '',
    }],
    updatedAt: Date.now(),
  }
}

export function normalizeDirectorSequence(
  value: DirectorSequenceV1 | undefined,
): DirectorSequenceV1 | undefined {
  if (!value || value.schemaVersion !== 1 || !Array.isArray(value.promptSegments)) {
    return undefined
  }
  const durationFrames = snapLtxFramesUp(value.output.durationFrames)
  return {
    ...value,
    schemaVersion: 1,
    output: {
      ...value.output,
      fps: 24,
      durationFrames,
      requestedDurationSeconds: Math.max(1 / 24, value.output.requestedDurationSeconds),
    },
    promptSegments: value.promptSegments.map((segment) => ({
      ...segment,
      keyframe: segment.keyframe ? { ...segment.keyframe } : undefined,
    })),
    continueVideo: value.continueVideo ? { ...value.continueVideo } : undefined,
    guideAudio: value.guideAudio ? { ...value.guideAudio } : undefined,
    guidance: value.guidance ? { ...value.guidance } : undefined,
  }
}

export function cloneDirectorSequence(
  value: DirectorSequenceV1,
): DirectorSequenceV1 {
  return {
    ...value,
    promptSegments: value.promptSegments.map((segment) => ({
      ...segment,
      id: crypto.randomUUID(),
      keyframe: segment.keyframe ? { ...segment.keyframe } : undefined,
    })),
    continueVideo: value.continueVideo ? { ...value.continueVideo } : undefined,
    guideAudio: value.guideAudio ? { ...value.guideAudio } : undefined,
    guidance: value.guidance ? { ...value.guidance } : undefined,
    latestGenerationAssetId: undefined,
    latestGenerationVisible: undefined,
    latestGenerationTakeIndex: undefined,
    updatedAt: Date.now(),
  }
}

export function splitPromptSegment(
  segments: DirectorPromptSegmentV1[],
  segmentId: string,
  splitFrame: number,
): DirectorPromptSegmentV1[] {
  const index = segments.findIndex((segment) => segment.id === segmentId)
  if (index < 0) return segments
  const segment = segments[index]
  if (splitFrame <= segment.startFrame || splitFrame >= segment.endFrameExclusive) {
    return segments
  }
  const keyframeFrame = segment.keyframe ? resolveKeyframeFrame(segment) : null
  const left: DirectorPromptSegmentV1 = {
    ...segment,
    endFrameExclusive: splitFrame,
    keyframe: undefined,
  }
  const right: DirectorPromptSegmentV1 = {
    ...segment,
    id: crypto.randomUUID(),
    startFrame: splitFrame,
    keyframe: undefined,
  }
  if (segment.keyframe && keyframeFrame !== null) {
    const child = keyframeFrame < splitFrame ? left : right
    const point: DirectorKeyframePoint = keyframeFrame === child.startFrame
      ? 'start'
      : keyframeFrame === child.endFrameExclusive - 1
        ? 'end'
        : 'centre'
    child.keyframe = { ...segment.keyframe, point }
  }
  return [...segments.slice(0, index), left, right, ...segments.slice(index + 1)]
}

export function deletePromptSegment(
  segments: DirectorPromptSegmentV1[],
  segmentId: string,
): DirectorPromptSegmentV1[] {
  if (segments.length <= 1) return segments
  const index = segments.findIndex((segment) => segment.id === segmentId)
  if (index < 0) return segments
  const removed = segments[index]
  const next = segments.map((segment) => ({ ...segment }))
  next.splice(index, 1)
  if (index > 0) next[index - 1].endFrameExclusive = removed.endFrameExclusive
  else next[0].startFrame = removed.startFrame
  return next
}

export function movePromptBoundary(
  segments: DirectorPromptSegmentV1[],
  leftSegmentId: string,
  frame: number,
): DirectorPromptSegmentV1[] {
  const index = segments.findIndex((segment) => segment.id === leftSegmentId)
  if (index < 0 || index >= segments.length - 1) return segments
  const min = segments[index].startFrame + 1
  const max = segments[index + 1].endFrameExclusive - 1
  const boundary = Math.max(min, Math.min(max, Math.round(frame)))
  return segments.map((segment, segmentIndex) => {
    if (segmentIndex === index) return { ...segment, endFrameExclusive: boundary }
    if (segmentIndex === index + 1) return { ...segment, startFrame: boundary }
    return segment
  })
}

export function resizeDirectorDuration(
  sequence: DirectorSequenceV1,
  requestedDurationSeconds: number,
): DirectorSequenceV1 {
  const durationFrames = snapLtxFramesUp(
    requestedDurationSeconds * sequence.output.fps,
  )
  const minimumStart = sequence.continueVideo?.timelineDurationFrames ?? 0
  const segments = sequence.promptSegments.map((segment) => ({ ...segment }))
  if (segments.length === 0) {
    segments.push({
      id: crypto.randomUUID(),
      startFrame: minimumStart,
      endFrameExclusive: durationFrames,
      prompt: '',
    })
  } else {
    segments[segments.length - 1].endFrameExclusive = durationFrames
  }
  return {
    ...sequence,
    output: { ...sequence.output, requestedDurationSeconds, durationFrames },
    promptSegments: segments,
    guidance: sequence.guidance && sequence.guidance.mode !== 'ingredients'
      ? { ...sequence.guidance, timelineDurationFrames: durationFrames }
      : sequence.guidance,
    updatedAt: Date.now(),
  }
}

export function resizeContinueVideoTrim(
  sequence: DirectorSequenceV1,
  trimDuration: number,
): DirectorSequenceV1 {
  if (!sequence.continueVideo) return sequence
  const safeDuration = Math.max(1 / sequence.output.fps, trimDuration)
  const previousFrames = sequence.continueVideo.timelineDurationFrames
  const timelineDurationFrames = snapLtxFramesUp(safeDuration * sequence.output.fps)
  const delta = timelineDurationFrames - previousFrames
  const durationFrames = sequence.output.durationFrames + delta
  return {
    ...sequence,
    output: {
      ...sequence.output,
      durationFrames,
      requestedDurationSeconds: (durationFrames - 1) / sequence.output.fps,
    },
    continueVideo: {
      ...sequence.continueVideo,
      timelineDurationFrames,
      trimDuration: safeDuration,
    },
    promptSegments: sequence.promptSegments.map((segment) => ({
      ...segment,
      startFrame: segment.startFrame + delta,
      endFrameExclusive: segment.endFrameExclusive + delta,
    })),
    guidance: sequence.guidance && sequence.guidance.mode !== 'ingredients'
      ? { ...sequence.guidance, timelineDurationFrames: durationFrames }
      : sequence.guidance,
    updatedAt: Date.now(),
  }
}
