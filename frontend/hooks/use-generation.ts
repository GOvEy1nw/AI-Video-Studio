import { useCallback, useRef, useState } from 'react'
import type { GenerateDirectorRequest } from '../types/director'
import type { GenerationSettings } from '../types/generation'
import type { ImageEditRequest } from '../types/image-edit'
import type { ComposeMusicLyricsRequest, GenerateMusicRequest } from '../types/music'
import type { GenerateSfxRequest } from '../types/sfx'
import type { GenerateSpeechRequest } from '../types/speech'
import type { SubmittedVideoToolId } from '../types/video-tools'
import type { UpscaleMediaKind, UpscaleMethodId } from '../types/upscale'
import { useProjects } from '../contexts/ProjectContext'
import { useGenerationQueue, type GenerationQueueDraft, type QueueClientContext, type QueuePersistenceIntent } from '../contexts/GenerationQueueContext'
import type { ImageSubmissionSnapshot, VideoSubmissionSnapshot } from '../views/genspace/types'
import { backendFetch } from '../lib/backend'
import {
  buildDirectorRequestBody,
  buildImageRequestBody,
  buildMusicRequestBody,
  buildSfxRequestBody,
  buildSpeechRequestBody,
  buildVideoRequestBody,
  type GenerationInputMediaRequest,
  type GenerationReframeOptions,
} from './generation/request-builders'
import { emptyGenerationState, type GenerateMusicResult, type GenerateSfxResult, type GenerateSpeechResult, type GenerationState, type MusicOutput } from './generation/types'

export type { GenerateMusicResult, MusicOutput, GenerateSfxResult, GenerateSpeechResult }
export type InputMediaRequest = GenerationInputMediaRequest
export type ReframeGenerateOptions = GenerationReframeOptions

export interface UseGenerationReturn extends GenerationState {
  isComposingLyrics: boolean
  generate: (prompt: string, imagePath: string | null, settings: GenerationSettings, audioPath?: string | null, inputMedia?: InputMediaRequest[], useAudioTrack?: boolean, shotPrompts?: { seconds: number; prompt: string }[], reframe?: ReframeGenerateOptions, videoTool?: SubmittedVideoToolId, intent?: QueuePersistenceIntent) => Promise<void>
  generateDirector: (request: GenerateDirectorRequest, intent?: Extract<QueueClientContext['intent'], { kind: 'director-output' }>) => Promise<void>
  generateImage: (prompt: string, settings: GenerationSettings, inputMedia?: InputMediaRequest[], edit?: ImageEditRequest, intent?: QueuePersistenceIntent) => Promise<void>
  generateUpscale: (request: { sourcePath: string; mediaKind: UpscaleMediaKind; method: UpscaleMethodId; scale: number }, snapshot?: ImageSubmissionSnapshot | VideoSubmissionSnapshot) => Promise<void>
  generateMusic: (request: GenerateMusicRequest, intent?: QueuePersistenceIntent) => Promise<GenerateMusicResult | null>
  generateSfx: (request: GenerateSfxRequest, intent?: QueuePersistenceIntent) => Promise<GenerateSfxResult | null>
  generateSpeech: (request: GenerateSpeechRequest, intent?: QueuePersistenceIntent) => Promise<GenerateSpeechResult | null>
  composeMusicLyrics: (request: ComposeMusicLyricsRequest) => Promise<string | null>
  cancel: () => Promise<void>
  reset: () => void
}

export function generatedPathToFileUrl(path: string): string {
  const normalized = path.replace(/\\/g, '/')
  return normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`
}

export function useGeneration(): UseGenerationReturn {
  const { currentProject, currentProjectId } = useProjects()
  const queue = useGenerationQueue()
  const [state, setState] = useState<GenerationState>(emptyGenerationState)
  const [isComposingLyrics, setIsComposingLyrics] = useState(false)
  const submittedJobId = useRef<string | null>(null)

  const submit = useCallback(async (draft: Omit<GenerationQueueDraft, 'clientContext'> & { clientContext?: Omit<QueueClientContext, 'schemaVersion' | 'projectId'> }) => {
    if (!currentProjectId) throw new Error('Select a project before generating')
    submittedJobId.current = null
    setState((previous) => ({ ...previous, isGenerating: true, error: null, statusMessage: 'Adding to queue…', phase: 'queued' }))
    try {
      const admission = await queue.submit({ ...draft, clientContext: { schemaVersion: 1, projectId: currentProjectId, ...draft.clientContext } })
      submittedJobId.current = admission.jobId
      setState(emptyGenerationState())
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setState({ ...emptyGenerationState(), error: message })
      throw error
    }
  }, [currentProjectId, queue])

  const generate = useCallback<UseGenerationReturn['generate']>(async (prompt, imagePath, settings, audioPath, inputMedia, useAudioTrack, shotPrompts, reframe, videoTool, intent) => {
    const request = buildVideoRequestBody({ prompt, imagePath, settings, audioPath, inputMedia, useAudioTrack, shotPrompts, reframe, videoTool })
    await submit({ kind: 'video.generate', payload: request.body as Record<string, unknown>, summary: { label: 'Video generation', mediaKind: 'video', operation: 'video.generate', promptPreview: prompt }, ...(intent ? { clientContext: { intent } } : {}) })
  }, [submit])

  const generateDirector = useCallback(async (request: GenerateDirectorRequest, intent?: Extract<QueueClientContext['intent'], { kind: 'director-output' }>) => {
    const built = buildDirectorRequestBody(request)
    await submit({ kind: 'director.generate', payload: built.body as Record<string, unknown>, summary: { label: 'Director generation', mediaKind: 'video', operation: 'director.generate', promptPreview: request.globalPrompt }, ...(intent ? { clientContext: { intent } } : {}) })
  }, [submit])

  const generateImage = useCallback<UseGenerationReturn['generateImage']>(async (prompt, settings, inputMedia, edit, intent) => {
    await submit({ kind: 'image.generate', payload: buildImageRequestBody(prompt, settings, inputMedia, edit) as Record<string, unknown>, summary: { label: 'Image generation', mediaKind: 'image', operation: 'image.generate', promptPreview: prompt, variationCount: settings.variations || 1 }, ...(intent ? { clientContext: { intent } } : {}) })
  }, [submit])

  const generateUpscale = useCallback<UseGenerationReturn['generateUpscale']>(async (request, snapshot) => {
    const parent = currentProject?.assets.find((asset) =>
      asset.path === request.sourcePath || asset.takes?.some((take) => take.path === request.sourcePath),
    )
    await submit({
      kind: 'media.upscale',
      payload: request,
      summary: { label: 'Upscale', mediaKind: request.mediaKind, operation: 'media.upscale' },
      ...(parent ? { clientContext: { intent: snapshot
        ? request.mediaKind === 'image'
          ? { kind: 'add-take' as const, parentAssetId: parent.id, mediaKind: 'image' as const, snapshot: snapshot as ImageSubmissionSnapshot }
          : { kind: 'add-take' as const, parentAssetId: parent.id, mediaKind: 'video' as const, snapshot: snapshot as VideoSubmissionSnapshot }
        : { kind: 'add-take' as const, parentAssetId: parent.id } } } : {}),
    })
  }, [currentProject?.assets, submit])

  const generateMusic = useCallback(async (request: GenerateMusicRequest, intent?: QueuePersistenceIntent): Promise<GenerateMusicResult | null> => {
    const built = buildMusicRequestBody(request)
    await submit({ kind: 'audio.music', payload: built.body as unknown as Record<string, unknown>, summary: { label: 'Music generation', mediaKind: 'audio', operation: 'audio.music', promptPreview: request.description }, ...(intent ? { clientContext: { intent } } : {}) })
    return null
  }, [submit])

  const generateSfx = useCallback(async (request: GenerateSfxRequest, intent?: QueuePersistenceIntent): Promise<GenerateSfxResult | null> => {
    const built = buildSfxRequestBody(request)
    await submit({ kind: 'audio.sfx', payload: built.body as unknown as Record<string, unknown>, summary: { label: 'Sound effect generation', mediaKind: 'audio', operation: 'audio.sfx', promptPreview: request.prompt }, ...(intent ? { clientContext: { intent } } : {}) })
    return null
  }, [submit])

  const generateSpeech = useCallback(async (request: GenerateSpeechRequest, intent?: QueuePersistenceIntent): Promise<GenerateSpeechResult | null> => {
    const built = buildSpeechRequestBody(request)
    await submit({ kind: 'audio.speech', payload: built.body as unknown as Record<string, unknown>, summary: { label: 'Speech generation', mediaKind: 'audio', operation: 'audio.speech', promptPreview: request.text }, ...(intent ? { clientContext: { intent } } : {}) })
    return null
  }, [submit])

  const composeMusicLyrics = useCallback(async (request: ComposeMusicLyricsRequest) => {
    setIsComposingLyrics(true)
    try {
      const response = await backendFetch('/api/music/compose-lyrics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) })
      if (!response.ok) throw new Error(await response.text())
      return (await response.json() as { lyrics?: string }).lyrics ?? null
    } finally {
      setIsComposingLyrics(false)
    }
  }, [])

  const cancel = useCallback(async () => {
    if (submittedJobId.current) await queue.cancel(submittedJobId.current)
  }, [queue])
  const reset = useCallback(() => setState(emptyGenerationState()), [])

  return { ...state, isComposingLyrics, generate, generateDirector, generateImage, generateUpscale, generateMusic, generateSfx, generateSpeech, composeMusicLyrics, cancel, reset }
}
