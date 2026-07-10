export const FORCED_API_VIDEO_RESOLUTIONS = ['1080p', '1440p', '2160p'] as const
export const FORCED_API_VIDEO_DURATIONS_STANDARD = [6, 8, 10] as const
export const FORCED_API_VIDEO_DURATIONS_EXTENDED = [6, 8, 10, 12, 14, 16, 18, 20] as const
export const FORCED_API_VIDEO_FPS = [24, 25, 48, 50] as const
export const FORCED_API_VIDEO_MODELS = ['fast', 'pro'] as const
export const FORCED_API_VIDEO_ASPECT_RATIOS = ['16:9', '1:1', '9:16'] as const

export type ForcedApiVideoResolution = (typeof FORCED_API_VIDEO_RESOLUTIONS)[number]
export type ForcedApiVideoFps = (typeof FORCED_API_VIDEO_FPS)[number]
export type ForcedApiVideoModel = (typeof FORCED_API_VIDEO_MODELS)[number]
export type ForcedApiVideoAspectRatio = (typeof FORCED_API_VIDEO_ASPECT_RATIOS)[number]

export const A2V_FORCED_RESOLUTION: ForcedApiVideoResolution = '1080p'
export const A2V_FORCED_ASPECT_RATIO: ForcedApiVideoAspectRatio = '16:9'

type ForcedVideoSettingsShape = {
  model: string
  duration: number
  videoResolution: string
  fps: number
  aspectRatio?: string
}

function nearestNumber(value: number, candidates: readonly number[]): number {
  let best = candidates[0]
  let minDiff = Math.abs(value - best)
  for (const candidate of candidates.slice(1)) {
    const diff = Math.abs(value - candidate)
    if (diff < minDiff) {
      best = candidate
      minDiff = diff
    }
  }
  return best
}

export function getAllowedForcedApiDurations(
  model: string,
  resolution: string,
  fps: number,
): readonly number[] {
  if (model === 'fast' && resolution === '1080p' && (fps === 24 || fps === 25)) {
    return FORCED_API_VIDEO_DURATIONS_EXTENDED
  }
  return FORCED_API_VIDEO_DURATIONS_STANDARD
}

export function normalizeForcedModel(value: string): ForcedApiVideoModel {
  if (FORCED_API_VIDEO_MODELS.includes(value as ForcedApiVideoModel)) {
    return value as ForcedApiVideoModel
  }
  return 'fast'
}

export function normalizeForcedResolution(value: string): ForcedApiVideoResolution {
  if (FORCED_API_VIDEO_RESOLUTIONS.includes(value as ForcedApiVideoResolution)) {
    return value as ForcedApiVideoResolution
  }
  return '1080p'
}

export function normalizeForcedAspectRatio(value: string | undefined): ForcedApiVideoAspectRatio {
  if (value && FORCED_API_VIDEO_ASPECT_RATIOS.includes(value as ForcedApiVideoAspectRatio)) {
    return value as ForcedApiVideoAspectRatio
  }
  return '16:9'
}

export function normalizeForcedFps(value: number): ForcedApiVideoFps {
  const rounded = Math.round(value)
  return nearestNumber(rounded, FORCED_API_VIDEO_FPS) as ForcedApiVideoFps
}

function clampDuration(value: number, allowed: readonly number[]): number {
  const rounded = Math.round(value)
  return nearestNumber(rounded, allowed)
}

export function sanitizeForcedApiVideoSettings<T extends ForcedVideoSettingsShape>(
  settings: T,
  options?: { hasAudio?: boolean },
): T {
  let nextModel = normalizeForcedModel(settings.model)
  let nextResolution = normalizeForcedResolution(settings.videoResolution)
  let nextAspectRatio = normalizeForcedAspectRatio(settings.aspectRatio)

  if (options?.hasAudio) {
    nextModel = 'pro'
    nextResolution = A2V_FORCED_RESOLUTION
    nextAspectRatio = A2V_FORCED_ASPECT_RATIO
  }

  const nextFps = normalizeForcedFps(settings.fps)
  const allowedDurations = getAllowedForcedApiDurations(nextModel, nextResolution, nextFps)
  const nextDuration = clampDuration(settings.duration, allowedDurations)

  if (
    nextResolution === settings.videoResolution &&
    nextDuration === settings.duration &&
    nextFps === settings.fps &&
    nextModel === settings.model &&
    nextAspectRatio === (settings.aspectRatio ?? '16:9')
  ) {
    return settings
  }

  return {
    ...settings,
    model: nextModel,
    videoResolution: nextResolution,
    duration: nextDuration,
    fps: nextFps,
    aspectRatio: nextAspectRatio,
  }
}
