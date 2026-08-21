import { useCallback, useState } from 'react'
import { useGenerationQueue } from '../contexts/GenerationQueueContext'
import { useProjects } from '../contexts/ProjectContext'
import type { RetakeSubmissionSnapshot } from '../views/genspace/types'

export type RetakeMode = 'replace_audio_and_video' | 'replace_video' | 'replace_audio'

export interface RetakeSubmitParams {
  videoPath: string
  startTime: number
  duration: number
  prompt: string
  mode: RetakeMode
}

export interface RetakeResult {
  videoPath: string
  videoUrl: string
}

interface UseRetakeState {
  isRetaking: boolean
  retakeStatus: string
  retakeError: string | null
  result: RetakeResult | null
}

export function useRetake() {
  const { currentProject, currentProjectId, genSpaceRetakeSource } = useProjects()
  const queue = useGenerationQueue()
  const [state, setState] = useState<UseRetakeState>({
    isRetaking: false,
    retakeStatus: '',
    retakeError: null,
    result: null,
  })

  const submitRetake = useCallback(async (params: RetakeSubmitParams, submittedSnapshot?: RetakeSubmissionSnapshot | null) => {
    if (!params.videoPath) return

    setState({
      isRetaking: true,
      retakeStatus: 'Generating',
      retakeError: null,
      result: null,
    })

    try {
      if (!currentProjectId) throw new Error('Select a project before generating')
      const snapshot = submittedSnapshot ?? {
        projectId: currentProjectId,
        submittedAt: Date.now(),
        prompt: params.prompt,
        input: { videoPath: params.videoPath, startTime: params.startTime, duration: params.duration, videoDuration: params.duration },
      }
      const parent = currentProject?.assets.find((asset) => asset.id === genSpaceRetakeSource?.assetId)
        ?? currentProject?.assets.find((asset) => asset.path === params.videoPath || asset.takes?.some((take) => take.path === params.videoPath))
      await queue.submit({
        kind: 'video.retake',
        payload: { video_path: params.videoPath, start_time: params.startTime, duration: params.duration, prompt: params.prompt, mode: params.mode },
        summary: { label: 'Video retake', mediaKind: 'video', operation: 'video.retake', promptPreview: params.prompt },
        clientContext: {
          schemaVersion: 1,
          projectId: currentProjectId,
          intent: {
            kind: 'retake-output',
            snapshot,
            ...(parent ? { parentAssetId: parent.id } : {}),
            ...(genSpaceRetakeSource?.linkedClipIds?.length ? { clipIds: genSpaceRetakeSource.linkedClipIds } : {}),
          },
        },
      })
      setState({ isRetaking: false, retakeStatus: '', retakeError: null, result: null })
    } catch (error) {
      const message = (error as Error).message || 'Unknown error'
      setState({
        isRetaking: false,
        retakeStatus: '',
        retakeError: message,
        result: null,
      })
    }
  }, [currentProject?.assets, currentProjectId, genSpaceRetakeSource?.assetId, genSpaceRetakeSource?.linkedClipIds, queue])

  const resetRetake = useCallback(() => {
    setState({
      isRetaking: false,
      retakeStatus: '',
      retakeError: null,
      result: null,
    })
  }, [])

  return {
    submitRetake,
    resetRetake,
    isRetaking: state.isRetaking,
    retakeStatus: state.retakeStatus,
    retakeError: state.retakeError,
    retakeResult: state.result,
  }
}
