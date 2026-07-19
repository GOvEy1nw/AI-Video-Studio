import type { Asset } from '@/types/project'
import type { DirectorSequenceV1, GenerateDirectorRequest } from '@/types/director'

export function buildDirectorRequest(
  sequence: DirectorSequenceV1,
  assets: Asset[],
): GenerateDirectorRequest {
  const byId = new Map(assets.map((asset) => [asset.id, asset]))
  const pathFor = (assetId: string): string => {
    const asset = byId.get(assetId)
    if (!asset) throw new Error(`DIRECTOR_MISSING_ASSET: ${assetId}`)
    return asset.path
  }
  const guidance: GenerateDirectorRequest['guidance'] = !sequence.guidance
    ? undefined
    : sequence.guidance.mode === 'ingredients'
      ? { ...sequence.guidance, path: pathFor(sequence.guidance.assetId) }
      : {
          ...sequence.guidance,
          mode: sequence.guidance.mode === 'human-motion' ? 'human_motion' : 'depth',
          path: pathFor(sequence.guidance.assetId),
        }
  return {
    schemaVersion: 1,
    modelProfileId: sequence.output.modelProfileId,
    resolutionTier: sequence.output.resolutionTier,
    aspectRatio: sequence.output.aspectRatio,
    fps: sequence.output.fps,
    requestedDurationSeconds: sequence.output.requestedDurationSeconds,
    durationFrames: sequence.output.durationFrames,
    generateAudio: sequence.output.generateAudio,
    promptRelayEpsilon: sequence.output.promptRelayEpsilon ?? 0.001,
    globalPrompt: sequence.globalPrompt,
    promptSegments: sequence.promptSegments.map((segment) => ({
      ...segment,
      keyframe: segment.keyframe
        ? { ...segment.keyframe, path: pathFor(segment.keyframe.assetId) }
        : undefined,
    })),
    continueVideo: sequence.continueVideo
      ? { ...sequence.continueVideo, path: pathFor(sequence.continueVideo.assetId) }
      : undefined,
    guideAudio: sequence.guideAudio
      ? { ...sequence.guideAudio, path: pathFor(sequence.guideAudio.assetId) }
      : undefined,
    guidance,
  }
}
