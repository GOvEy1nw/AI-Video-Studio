import type { Asset, GenerationParams } from '../types/project'
import { fileUrlToPath } from './url-to-path'

export type GenSpaceImageInput = {
  id: string
  url: string
  role: string
  type?: 'image' | 'video' | 'audio'
  trimStartTime?: number
  trimDuration?: number
  mediaDuration?: number
}

export type GenSpaceSettingsPatch = {
  model: string
  videoProfileId: string
  duration: number
  videoResolution: string
  fps: number
  aspectRatio: string
  imageResolution: string
  imageAspectRatio: string
  imageProfileId: string
  imageSteps: number
  variations: number
  audio: boolean
  imageInputRole: string | undefined
}

const VIDEO_GUIDE_ROLES = new Set([
  'control_video',
  'human_motion',
  'human_motion_pose',
  'depth',
  'canny_edges',
  'sdr_to_hdr',
  'continue_video',
  'audio_guide',
  'audio_to_video',
  'reference_voice',
])

const AUDIO_ROLES = new Set([
  'audio_guide',
  'audio_to_video',
  'reference_voice',
])

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').toLowerCase()
}

function isUsableMediaUrl(url: string | null | undefined): url is string {
  return !!url && !url.startsWith('blob:')
}

function inferInputType(role: string): 'image' | 'video' | 'audio' {
  if (AUDIO_ROLES.has(role)) return 'audio'
  if (VIDEO_GUIDE_ROLES.has(role)) return 'video'
  return 'image'
}

/** Resolve a stored input URL against project assets (handles stale blob: URLs via path). */
export function resolveGenerationInputUrl(
  storedUrl: string | undefined,
  storedPath: string | undefined,
  assets: Asset[],
): string | null {
  if (storedUrl) {
    const byUrl = assets.find((asset) => asset.url === storedUrl)
    if (byUrl) return byUrl.url
    if (isUsableMediaUrl(storedUrl)) return storedUrl
  }

  const pathToMatch =
    storedPath ||
    (storedUrl?.startsWith('file://') ? fileUrlToPath(storedUrl) : null)
  if (!pathToMatch) {
    return isUsableMediaUrl(storedUrl) ? storedUrl : null
  }

  const normalizedTarget = normalizePath(pathToMatch)
  const byPath = assets.find(
    (asset) => normalizePath(asset.path) === normalizedTarget,
  )
  if (byPath) return byPath.url

  const baseName = normalizedTarget.split('/').pop()
  if (baseName) {
    const byBaseName = assets.find((asset) => {
      const assetPath = normalizePath(asset.path)
      return assetPath.endsWith(`/${baseName}`) || assetPath === baseName
    })
    if (byBaseName) return byBaseName.url
  }

  if (storedUrl?.startsWith('file://')) return storedUrl
  return null
}

export function resolveInputMediaPath(
  url: string | undefined,
  projectAssets: Asset[],
): string | undefined {
  if (!url) return undefined
  const fromUrl = fileUrlToPath(url)
  if (fromUrl) return fromUrl
  return projectAssets.find((asset) => asset.url === url)?.path
}

export function toStoredInputMediaEntry(
  item: {
    url: string
    role: string
    type?: 'image' | 'video' | 'audio'
    trimStartTime?: number
    trimDuration?: number
    mediaDuration?: number
  },
  projectAssets: Asset[],
): NonNullable<GenerationParams['imageInputMedia']>[number] {
  const path = resolveInputMediaPath(item.url, projectAssets)
  const entry: NonNullable<GenerationParams['imageInputMedia']>[number] = {
    url: item.url,
    role: item.role,
  }
  if (path) entry.path = path
  if (item.type) entry.type = item.type
  if (item.trimStartTime !== undefined) entry.trimStartTime = item.trimStartTime
  if (item.trimDuration !== undefined) entry.trimDuration = item.trimDuration
  if (item.mediaDuration !== undefined) entry.mediaDuration = item.mediaDuration
  return entry
}

/** Repair generationParams input URLs when loading projects from localStorage. */
export function recoverGenerationParamsMedia(
  params: GenerationParams,
  assets: Asset[],
): GenerationParams {
  let changed = false
  const next: GenerationParams = { ...params }

  if (params.imageInputMedia?.length) {
    const repairedMedia = params.imageInputMedia.map((item) => {
      const resolvedUrl = resolveGenerationInputUrl(
        item.url,
        item.path,
        assets,
      )
      if (!resolvedUrl || resolvedUrl === item.url) {
        return item
      }
      changed = true
      return { ...item, url: resolvedUrl }
    })
    next.imageInputMedia = repairedMedia
  }

  if (params.inputImageUrl || params.inputImagePath) {
    const resolved = resolveGenerationInputUrl(
      params.inputImageUrl,
      params.inputImagePath,
      assets,
    )
    if (resolved && resolved !== params.inputImageUrl) {
      changed = true
      next.inputImageUrl = resolved
    } else if (
      params.inputImageUrl?.startsWith('blob:') &&
      resolved &&
      isUsableMediaUrl(resolved)
    ) {
      changed = true
      next.inputImageUrl = resolved
    }
  }

  if (params.inputAudioUrl || params.inputAudioPath) {
    const resolved = resolveGenerationInputUrl(
      params.inputAudioUrl,
      params.inputAudioPath,
      assets,
    )
    if (resolved && resolved !== params.inputAudioUrl) {
      changed = true
      next.inputAudioUrl = resolved
    } else if (
      params.inputAudioUrl?.startsWith('blob:') &&
      resolved &&
      isUsableMediaUrl(resolved)
    ) {
      changed = true
      next.inputAudioUrl = resolved
    }
  }

  return changed ? next : params
}

export function buildImageInputsFromParams(
  params: GenerationParams,
  assets: Asset[] = [],
): GenSpaceImageInput[] {
  const items: GenSpaceImageInput[] = []

  if (params.imageInputMedia?.length) {
    for (const item of params.imageInputMedia) {
      const url = resolveGenerationInputUrl(item.url, item.path, assets)
      if (!isUsableMediaUrl(url)) continue
      items.push({
        id: crypto.randomUUID(),
        url,
        role: item.role,
        type: item.type ?? inferInputType(item.role),
        trimStartTime: item.trimStartTime,
        trimDuration: item.trimDuration,
        mediaDuration: item.mediaDuration,
      })
    }
  }

  if (items.length === 0) {
    const imageUrl = resolveGenerationInputUrl(
      params.inputImageUrl,
      params.inputImagePath,
      assets,
    )
    if (isUsableMediaUrl(imageUrl)) {
      const role =
        params.imageInputRole ||
        (params.mode === 'text-to-image' ? 'reference_subject' : 'start_image')
      items.push({
        id: crypto.randomUUID(),
        url: imageUrl,
        role,
        type: 'image',
      })
    }
  }

  const audioUrl = resolveGenerationInputUrl(
    params.inputAudioUrl,
    params.inputAudioPath,
    assets,
  )
  if (isUsableMediaUrl(audioUrl) && !items.some((item) => item.url === audioUrl)) {
    items.push({
      id: crypto.randomUUID(),
      url: audioUrl,
      role:
        params.mode === 'audio-to-video' ? 'audio_to_video' : 'audio_guide',
      type: 'audio',
    })
  }

  return items
}

export function settingsPatchFromGenerationParams(
  params: GenerationParams,
  current: GenSpaceSettingsPatch,
): GenSpaceSettingsPatch {
  if (params.mode === 'text-to-image') {
    const imageProfileId =
      params.imageProfileId ||
      (params.model !== 'fast' && params.model !== 'pro'
        ? params.model
        : undefined) ||
      current.imageProfileId
    return {
      ...current,
      imageProfileId,
      imageResolution: params.resolution || current.imageResolution,
      imageAspectRatio: params.imageAspectRatio || current.imageAspectRatio,
      imageSteps: params.imageSteps ?? current.imageSteps,
      imageInputRole: params.imageInputRole ?? current.imageInputRole,
    }
  }

  const model =
    params.model === 'fast' || params.model === 'pro'
      ? params.model
      : current.model

  return {
    ...current,
    model,
    videoProfileId: params.videoProfileId || current.videoProfileId,
    duration: params.duration ?? current.duration,
    videoResolution: params.resolution || current.videoResolution,
    fps: params.fps ?? current.fps,
    audio: params.audio ?? current.audio,
    aspectRatio: params.imageAspectRatio || current.aspectRatio,
    imageAspectRatio: params.imageAspectRatio || current.imageAspectRatio,
    imageSteps: params.imageSteps ?? current.imageSteps,
  }
}

export function resolveLegacyInputMedia(
  params: GenerationParams,
  imageInputs: GenSpaceImageInput[],
  assets: Asset[] = [],
): { inputImage: string | null; inputAudio: string | null } {
  const startImage = imageInputs.find((item) => item.role === 'start_image')
  const audioItem = imageInputs.find((item) => AUDIO_ROLES.has(item.role))

  const inputImage =
    startImage?.url ??
    resolveGenerationInputUrl(
      params.inputImageUrl,
      params.inputImagePath,
      assets,
    )
  const inputAudio =
    audioItem?.url ??
    resolveGenerationInputUrl(
      params.inputAudioUrl,
      params.inputAudioPath,
      assets,
    )

  return {
    inputImage: isUsableMediaUrl(inputImage) ? inputImage : null,
    inputAudio: isUsableMediaUrl(inputAudio) ? inputAudio : null,
  }
}

export function genSpaceModeFromParams(
  params: GenerationParams,
): 'image' | 'video' | 'retake' | 'reframe' {
  if (params.mode === 'text-to-image') return 'image'
  if (params.mode === 'retake') return 'retake'
  if (params.mode === 'reframe') return 'reframe'
  return 'video'
}
