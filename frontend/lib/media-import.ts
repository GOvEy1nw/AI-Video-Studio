import { logger } from './logger'
import type { Asset } from '../types/project'

export type MediaImportPolicy = 'copy-into-project' | 'reference-in-place'
export type DuplicateStrategy = 'reuse' | 'suffix' | 'overwrite' | 'prompt'
export type DuplicateFilenameChoice = 'reuse' | 'suffix' | 'cancel'
export type ResolveDuplicateFilename = (
  fileName: string,
) => Promise<DuplicateFilenameChoice>

export type ImportMediaOptions = {
  projectId: string
  filePath: string
  fileName?: string
  mimeType?: string
  policy?: MediaImportPolicy
  onDuplicate?: DuplicateStrategy
}

export type ImportMediaResult = {
  path: string
  url: string
  fileName: string
  mediaType: 'image' | 'video' | 'audio'
  alreadyExisted: boolean
  reusedExisting: boolean
  needsDuplicateChoice: boolean
}

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif'])
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mkv', 'mov', 'avi'])
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'])

export function detectMediaType(
  fileName: string,
  mimeType?: string,
): 'image' | 'video' | 'audio' | null {
  if (mimeType?.startsWith('image/')) return 'image'
  if (mimeType?.startsWith('video/')) return 'video'
  if (mimeType?.startsWith('audio/')) return 'audio'

  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (IMAGE_EXTENSIONS.has(ext)) return 'image'
  if (VIDEO_EXTENSIONS.has(ext)) return 'video'
  if (AUDIO_EXTENSIONS.has(ext)) return 'audio'
  return null
}

export function defaultGuideRoleForMediaType(
  mediaType: 'image' | 'video' | 'audio',
): string {
  if (mediaType === 'video') return 'human_motion'
  if (mediaType === 'audio') return 'audio_to_video'
  return 'reference_subject'
}

export function filePathToFileUrl(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/')
  return normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`
}

export function buildSuffixedFileName(fileName: string, suffix: number): string {
  const lastDot = fileName.lastIndexOf('.')
  if (lastDot <= 0) {
    return `${fileName} (${suffix})`
  }
  const stem = fileName.slice(0, lastDot)
  const ext = fileName.slice(lastDot)
  return `${stem} (${suffix})${ext}`
}

/**
 * GenSpace import path: copy into project assets with duplicate handling.
 * Editor in-place imports should use policy `reference-in-place` via this helper
 * so path approval stays centralized without copying.
 */
export async function importMediaAsset(
  options: ImportMediaOptions,
): Promise<ImportMediaResult | null> {
  const {
    projectId,
    filePath,
    policy = 'copy-into-project',
    onDuplicate = 'suffix',
  } = options

  if (!projectId || !filePath) return null

  const fileName = options.fileName ?? filePath.split(/[/\\]/).pop() ?? filePath
  const mediaType = detectMediaType(fileName, options.mimeType)
  if (!mediaType) {
    logger.warn(`Unsupported media type for import: ${fileName}`)
    return null
  }

  if (policy === 'reference-in-place') {
    if (window.electronAPI?.approveLocalPath) {
      await window.electronAPI.approveLocalPath(filePath)
    }
    return {
      path: filePath,
      url: filePathToFileUrl(filePath),
      fileName,
      mediaType,
      alreadyExisted: false,
      reusedExisting: false,
      needsDuplicateChoice: false,
    }
  }

  if (!window.electronAPI?.importToProjectAssets) {
    logger.warn('importToProjectAssets is unavailable outside Electron')
    return null
  }

  try {
    const result = await window.electronAPI.importToProjectAssets({
      srcPath: filePath,
      projectId,
      onDuplicate,
    })

    if (!result.success || !result.path || !result.url) {
      if (result.error) {
        logger.warn(`Failed to import media asset: ${result.error}`)
      }
      return null
    }

    if (result.needsDuplicateChoice) {
      return {
        path: result.path,
        url: result.url,
        fileName: result.fileName ?? fileName,
        mediaType,
        alreadyExisted: true,
        reusedExisting: false,
        needsDuplicateChoice: true,
      }
    }

    return {
      path: result.path,
      url: result.url,
      fileName: result.fileName ?? fileName,
      mediaType,
      alreadyExisted: result.alreadyExisted ?? false,
      reusedExisting: result.reusedExisting ?? false,
      needsDuplicateChoice: result.needsDuplicateChoice ?? false,
    }
  } catch (error) {
    logger.warn(`Failed to import media asset: ${error}`)
    return null
  }
}

export function buildUploadedAssetFromImport(
  result: ImportMediaResult,
): Omit<Asset, 'id' | 'createdAt'> {
  const stem = result.fileName.replace(/\.[^.]+$/, '')
  return {
    type: result.mediaType,
    path: result.path,
    url: result.url,
    prompt: stem || result.fileName,
    resolution: '',
    source: 'uploaded',
  }
}

export function findAssetByPath(
  assets: Asset[],
  filePath: string,
): Asset | undefined {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase()
  return assets.find(
    (asset) => asset.path.replace(/\\/g, '/').toLowerCase() === normalized,
  )
}

export function findAssetByFileName(
  assets: Asset[],
  fileName: string,
): Asset | undefined {
  const normalized = fileName.toLowerCase()
  return assets.find((asset) => {
    const base = asset.path.split(/[/\\]/).pop()?.toLowerCase()
    return base === normalized
  })
}

/**
 * Import a filesystem pick/drop into the project gallery when needed, then return
 * the file URL to attach to an input slot. Gallery drags should bypass this.
 */
export async function ensureGalleryAssetForInputFile(
  projectId: string,
  file: File,
  existingAssets: Asset[],
  addAssetFn: (projectId: string, asset: Omit<Asset, 'id' | 'createdAt'>) => Asset,
  resolveDuplicate?: ResolveDuplicateFilename,
): Promise<string | null> {
  const filePath = (file as File & { path?: string }).path
  if (!filePath) {
    return URL.createObjectURL(file)
  }

  const existing = findAssetByPath(existingAssets, filePath)
  if (existing) {
    return existing.url
  }

  if (!detectMediaType(file.name, file.type)) {
    return filePathToFileUrl(filePath)
  }

  const outcome = await importGalleryFile(
    projectId,
    file,
    resolveDuplicate,
  )
  if (!outcome.ok) {
    if (outcome.reason === 'cancelled') {
      return null
    }
    return filePathToFileUrl(filePath)
  }

  const existingByPath = findAssetByPath(existingAssets, outcome.asset.path)
  const existingByName = findAssetByFileName(
    existingAssets,
    outcome.asset.path.split(/[/\\]/).pop() ?? outcome.asset.path,
  )
  const existingAsset = existingByPath ?? existingByName

  if (existingAsset) {
    return existingAsset.url
  }

  addAssetFn(projectId, outcome.asset)
  return outcome.asset.url
}

export type GalleryFileImportOutcome =
  | { ok: true; asset: Omit<Asset, 'id' | 'createdAt'>; reusedExisting: boolean }
  | { ok: false; reason: 'unsupported' | 'no-path' | 'import-failed' | 'cancelled' }

export async function importGalleryFile(
  projectId: string,
  file: File,
  resolveDuplicate?: ResolveDuplicateFilename,
): Promise<GalleryFileImportOutcome> {
  const filePath = (file as File & { path?: string }).path
  if (!filePath) {
    return { ok: false, reason: 'no-path' }
  }

  const mediaType = detectMediaType(file.name, file.type)
  if (!mediaType) {
    return { ok: false, reason: 'unsupported' }
  }

  let result = await importMediaAsset({
    projectId,
    filePath,
    fileName: file.name,
    mimeType: file.type,
    onDuplicate: 'prompt',
  })

  if (!result) {
    return { ok: false, reason: 'import-failed' }
  }

  if (result.needsDuplicateChoice) {
    const choice = resolveDuplicate
      ? await resolveDuplicate(result.fileName)
      : 'suffix'
    if (choice === 'cancel') {
      return { ok: false, reason: 'cancelled' }
    }
    result = await importMediaAsset({
      projectId,
      filePath,
      fileName: file.name,
      mimeType: file.type,
      onDuplicate: choice,
    })
    if (!result) {
      return { ok: false, reason: 'import-failed' }
    }
  }

  return {
    ok: true,
    asset: buildUploadedAssetFromImport(result),
    reusedExisting: result.reusedExisting,
  }
}
