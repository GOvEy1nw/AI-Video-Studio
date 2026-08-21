import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import type { TimelineClip, Track, SubtitleClip } from '../../types/project'
import type { GenerationSettings } from '../../types/generation'
import type { UseGenerationReturn } from '../../hooks/use-generation'
import type { QueuePersistenceIntent } from '../../contexts/GenerationQueueContext'
import { backendFetch } from '../../lib/backend'
import { fileUrlToPath } from '../../lib/url-to-path'
import { getNativeFilePath } from '../../lib/native-file-path'

export interface UseGapGenerationParams {
  clips: TimelineClip[]
  tracks: Track[]
  setClips: React.Dispatch<React.SetStateAction<TimelineClip[]>>
  setSubtitles: React.Dispatch<React.SetStateAction<SubtitleClip[]>>
  currentProjectId: string | null
  timelineId: string | null
  resolveClipSrc: (clip: TimelineClip | null) => string
  regenGenerate: UseGenerationReturn['generate']
  regenGenerateImage: UseGenerationReturn['generateImage']
  isRegenerating: boolean
  regenProgress: number
  regenCancel: () => void
  regenReset: () => void
}

export function useGapGeneration({
  clips,
  tracks,
  setClips,
  setSubtitles,
  currentProjectId,
  timelineId,
  resolveClipSrc,
  regenGenerate,
  regenGenerateImage,
  isRegenerating,
  regenProgress,
  regenCancel,
  regenReset,
}: UseGapGenerationParams) {
  // Gap selection and generation
  const [selectedGap, setSelectedGap] = useState<{ trackIndex: number; startTime: number; endTime: number } | null>(null)
  const [gapGenerateMode, setGapGenerateMode] = useState<'text-to-video' | 'image-to-video' | 'text-to-image' | null>(null)
  const gapGenerateModeRef = useRef(gapGenerateMode)
  gapGenerateModeRef.current = gapGenerateMode
  const [gapPrompt, setGapPrompt] = useState('')
  const [gapSettings, setGapSettings] = useState<GenerationSettings>({
    model: 'fast',
    duration: 5,
    videoResolution: '540p',
    fps: 24,
    audio: true,
    cameraMotion: 'none',
    imageResolution: '1080p',
    imageAspectRatio: '16:9',
    imageSteps: 30,
  })
  const [gapImageFile, setGapImageFile] = useState<File | null>(null)
  const gapImageInputRef = useRef<HTMLInputElement>(null)
  const [gapApplyAudioToTrack, setGapApplyAudioToTrack] = useState(true)

  useEffect(() => {
    if (gapGenerateMode === 'text-to-image' && gapImageFile) {
      setGapImageFile(null)
    }
  }, [gapGenerateMode, gapImageFile])

  // Tracks the gap currently being generated in the background (after modal closes)
  const [generatingGap, setGeneratingGap] = useState<{
    trackIndex: number; startTime: number; endTime: number
    mode: 'text-to-video' | 'image-to-video' | 'text-to-image'
    prompt: string; settings: GenerationSettings
    imageFile: File | null; applyAudio: boolean
  } | null>(null)

  // Gap context-aware prompt suggestion
  const [gapSuggesting, setGapSuggesting] = useState(false)
  const [gapSuggestion, setGapSuggestion] = useState<string | null>(null)
  const [gapSuggestionError, setGapSuggestionError] = useState(false)
  const [gapSuggestionNoApiKey, setGapSuggestionNoApiKey] = useState(false)
  const gapSuggestionAbortRef = useRef<AbortController | null>(null)
  // Frames extracted from neighboring clips for the gap animation header
  const [gapBeforeFrame, setGapBeforeFrame] = useState<string | null>(null)
  const [gapAfterFrame, setGapAfterFrame] = useState<string | null>(null)

  // --- Gap detection: find empty spaces between clips on each non-subtitle track ---
  const timelineGaps = useMemo(() => {
    const gaps: { trackIndex: number; startTime: number; endTime: number }[] = []
    
    tracks.forEach((track, trackIdx) => {
      if (track.type === 'subtitle') return
      
      const trackClips = clips
        .filter(c => c.trackIndex === trackIdx)
        .sort((a, b) => a.startTime - b.startTime)
      
      if (trackClips.length === 0) return
      
      if (trackClips[0].startTime > 0.05) {
        gaps.push({ trackIndex: trackIdx, startTime: 0, endTime: trackClips[0].startTime })
      }
      
      for (let i = 0; i < trackClips.length - 1; i++) {
        const endOfCurrent = trackClips[i].startTime + trackClips[i].duration
        const startOfNext = trackClips[i + 1].startTime
        if (startOfNext - endOfCurrent > 0.05) {
          gaps.push({ trackIndex: trackIdx, startTime: endOfCurrent, endTime: startOfNext })
        }
      }
    })
    
    return gaps
  }, [clips, tracks])

  // Delete gap: ripple all clips on the same track (and optionally all tracks) to close it
  const deleteGap = useCallback((gap: { trackIndex: number; startTime: number; endTime: number }) => {
    const gapDuration = gap.endTime - gap.startTime
    
    setClips(prev => prev.map(c => {
      if (c.startTime >= gap.endTime) {
        return { ...c, startTime: Math.max(0, c.startTime - gapDuration) }
      }
      return c
    }))
    
    setSubtitles(prev => prev.map(s => {
      if (s.startTime >= gap.endTime) {
        return { ...s, startTime: Math.max(0, s.startTime - gapDuration), endTime: Math.max(0.1, s.endTime - gapDuration) }
      }
      return s
    }))
    
    setSelectedGap(null)
  }, [])

  // Handle starting generation in a gap
  const handleGapGenerate = useCallback(async () => {
    if (!selectedGap || !gapGenerateMode || !gapPrompt.trim() || !currentProjectId || !timelineId) return
    
    const gap = selectedGap
    const mode = gapGenerateMode
    const gapDuration = gap.endTime - gap.startTime
    
    const finalPrompt = gapPrompt.trim()
    
    const settings: GenerationSettings = {
      ...gapSettings,
      duration: Math.min(Math.max(1, Math.round(gapDuration)), gapSettings.model === 'pro' ? 10 : 20),
    }
    const targetTrack = tracks[gap.trackIndex]
    if (!targetTrack) return
    const existingAudioTrack = tracks.find((track) => track.kind === 'audio' && !track.locked && track.sourcePatched !== false)
    const clipId = crypto.randomUUID()
    const audioClipId = crypto.randomUUID()
    const createAudioTrack = !existingAudioTrack && mode !== 'text-to-image' && gapApplyAudioToTrack && settings.audio
      ? { id: crypto.randomUUID(), name: `A${tracks.filter((track) => track.kind === 'audio').length + 1}` }
      : undefined
    const intent: QueuePersistenceIntent = {
      kind: 'editor-gap-output', timelineId, trackId: targetTrack.id, clipId, audioClipId,
      ...(existingAudioTrack ? { audioTrackId: existingAudioTrack.id } : {}),
      ...(createAudioTrack ? { audioTrackId: createAudioTrack.id, createAudioTrack } : {}),
      startTime: gap.startTime, endTime: gap.endTime, mode, prompt: finalPrompt, settings, applyAudio: gapApplyAudioToTrack,
    }

    // Save generating gap state so we can show indicator and place result later
    setGeneratingGap({
      trackIndex: gap.trackIndex,
      startTime: gap.startTime,
      endTime: gap.endTime,
      mode,
      prompt: finalPrompt,
      settings,
      imageFile: gapImageFile,
      applyAudio: gapApplyAudioToTrack,
    })

    // Close the modal immediately so user can keep editing
    setSelectedGap(null)
    setGapGenerateMode(null)
    
    try {
      if (mode === 'text-to-image') {
        await regenGenerateImage(finalPrompt, settings, undefined, undefined, intent)
      } else {
        // Convert File to filesystem path for the JSON-based generate API
        let imagePath: string | null = null
        if (gapImageFile) {
          const electronPath = getNativeFilePath(gapImageFile)
          if (electronPath) {
            imagePath = electronPath
          } else {
            // In-memory file (e.g. canvas capture) — save to temp file
            const buf = await gapImageFile.arrayBuffer()
            const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
            imagePath = await window.electronAPI.saveTemporaryFile(b64, '.png', 'base64')
          }
        }
        await regenGenerate(finalPrompt, imagePath, settings, undefined, undefined, undefined, undefined, undefined, undefined, intent)
      }
      setGeneratingGap(null)
      setGapPrompt('')
      setGapImageFile(null)
    } catch (err) {
      console.error('Gap generation failed:', err)
      setGeneratingGap(null)
    }
  }, [selectedGap, gapGenerateMode, gapPrompt, gapSettings, gapImageFile, gapApplyAudioToTrack, currentProjectId, timelineId, tracks, regenGenerate, regenGenerateImage])

  // --- Gap context-aware prompt suggestion ---
  // Use refs so the async function always reads the latest values without re-creating
  const gapPromptRef = useRef(gapPrompt)
  gapPromptRef.current = gapPrompt
  const selectedGapRef = useRef(selectedGap)
  selectedGapRef.current = selectedGap
  const gapGenerateModeLocalRef = useRef(gapGenerateMode)
  gapGenerateModeLocalRef.current = gapGenerateMode
  const clipsRef = useRef(clips)
  clipsRef.current = clips
  const gapImageFileRef = useRef(gapImageFile)
  gapImageFileRef.current = gapImageFile

  // Stable function that never changes identity — reads everything from refs
  const runSuggestion = useCallback(async (forceReplace: boolean = false) => {
    const gap = selectedGapRef.current
    const mode = gapGenerateModeLocalRef.current
    if (!gap || !mode) return
    
    gapSuggestionAbortRef.current?.abort()
    const abortController = new AbortController()
    gapSuggestionAbortRef.current = abortController
    
    try {
      setGapSuggesting(true)
      setGapSuggestion(null)
      setGapSuggestionError(false)
      setGapSuggestionNoApiKey(false)
      
      const trackClips = clipsRef.current
        .filter(c => c.trackIndex === gap.trackIndex && c.type !== 'audio')
        .sort((a, b) => a.startTime - b.startTime)

      const clipBefore = trackClips.find(c => {
        const clipEnd = c.startTime + c.duration
        return Math.abs(clipEnd - gap.startTime) < 0.05
      })

      const clipAfter = trackClips.find(c => {
        return Math.abs(c.startTime - gap.endTime) < 0.05
      })

      if (!clipBefore && !clipAfter) {
        setGapSuggesting(false)
        return
      }

      // beforeFrame/afterFrame are now file paths (sent to backend which reads the file)
      let beforeFrame = ''
      let afterFrame = ''
      let beforePrompt = ''
      let afterPrompt = ''
      // file:// URLs for displaying frames in the UI
      let beforeFrameUrl = ''
      let afterFrameUrl = ''

      const framePromises: Promise<void>[] = []

      if (clipBefore) {
        const clipSrc = resolveClipSrc(clipBefore)
        beforePrompt = clipBefore.asset?.prompt || ''
        if (clipSrc) {
          if (clipBefore.asset?.type === 'video') {
            const seekTime = clipBefore.trimStart + clipBefore.duration * clipBefore.speed - 0.1
            framePromises.push(
              window.electronAPI.extractVideoFrame(clipSrc, Math.max(0, seekTime), 512, 3)
                .then(result => { beforeFrame = result.path; beforeFrameUrl = result.url })
                .catch(() => {})
            )
          } else if (clipBefore.asset?.type === 'image') {
            beforeFrame = fileUrlToPath(clipSrc) || ''
            beforeFrameUrl = clipSrc
          }
        }
      }

      if (clipAfter) {
        const clipSrc = resolveClipSrc(clipAfter)
        afterPrompt = clipAfter.asset?.prompt || ''
        if (clipSrc) {
          if (clipAfter.asset?.type === 'video') {
            framePromises.push(
              window.electronAPI.extractVideoFrame(clipSrc, clipAfter.trimStart + 0.1, 512, 3)
                .then(result => { afterFrame = result.path; afterFrameUrl = result.url })
                .catch(() => {})
            )
          } else if (clipAfter.asset?.type === 'image') {
            afterFrame = fileUrlToPath(clipSrc) || ''
            afterFrameUrl = clipSrc
          }
        }
      }

      await Promise.all(framePromises)

      if (abortController.signal.aborted) return

      if (beforeFrameUrl) setGapBeforeFrame(beforeFrameUrl)
      if (afterFrameUrl) setGapAfterFrame(afterFrameUrl)
      
      if (!beforeFrame && !afterFrame && !beforePrompt && !afterPrompt) {
        setGapSuggesting(false)
        return
      }
      
      // Extract file path from the user's input image if present (for I2V suggestions)
      let inputImagePath = ''
      const imageFile = gapImageFileRef.current
      if (imageFile && mode === 'image-to-video') {
        const electronPath = getNativeFilePath(imageFile)
        if (electronPath) {
          inputImagePath = electronPath
        }
      }
      
      const response = await backendFetch('/api/suggest-gap-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gapDuration: gap.endTime - gap.startTime,
          mode,
          beforePrompt,
          afterPrompt,
          beforeFrame,
          afterFrame,
          ...(inputImagePath ? { inputImage: inputImagePath } : {}),
        }),
        signal: abortController.signal,
      })
      
      if (abortController.signal.aborted) return

      if (!response.ok) {
        let isApiKeyError = response.status === 401 || response.status === 403
        try {
          const errData = await response.json()
          const errStr = JSON.stringify(errData).toLowerCase()
          if (errStr.includes('api_key') || errStr.includes('gemini') || errStr.includes('no api key') || errStr.includes('api key')) {
            isApiKeyError = true
          }
        } catch {}
        if (isApiKeyError) setGapSuggestionNoApiKey(true)
        else setGapSuggestionError(true)
      } else {
        const data = await response.json()
        if (data.suggested_prompt && !abortController.signal.aborted) {
          setGapSuggestion(data.suggested_prompt)
          if (forceReplace || !gapPromptRef.current.trim()) {
            setGapPrompt(data.suggested_prompt)
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      console.warn('Gap prompt suggestion failed:', err)
      setGapSuggestionError(true)
    } finally {
      if (!abortController.signal.aborted) {
        setGapSuggesting(false)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolveClipSrc])

  // Track whether we've already fired the initial suggestion for this gap+mode combo
  const suggestionFiredKeyRef = useRef<string | null>(null)

  // Auto-run suggestion ONCE when the panel opens (gap + mode set)
  useEffect(() => {
    if (!selectedGap || !gapGenerateMode) {
      setGapSuggesting(false)
      setGapSuggestion(null)
      setGapSuggestionError(false)
      setGapSuggestionNoApiKey(false)
      setGapBeforeFrame(null)
      setGapAfterFrame(null)
      gapSuggestionAbortRef.current?.abort()
      suggestionFiredKeyRef.current = null
      return
    }
    
    // Build a key from the gap identity + mode so we only fire once per unique open
    const key = `${selectedGap.trackIndex}:${selectedGap.startTime}:${selectedGap.endTime}:${gapGenerateMode}`
    if (suggestionFiredKeyRef.current === key) return
    suggestionFiredKeyRef.current = key
    
    runSuggestion(false)
    
    return () => { gapSuggestionAbortRef.current?.abort() }
  }, [selectedGap, gapGenerateMode, runSuggestion])

  // Auto re-analyze when the user adds/removes an input image in I2V mode
  const prevImageFileRef = useRef<File | null>(null)
  useEffect(() => {
    const prev = prevImageFileRef.current
    prevImageFileRef.current = gapImageFile
    
    // Only trigger when the image actually changed (not on initial mount) and in I2V mode
    if (prev === gapImageFile) return
    if (gapGenerateMode !== 'image-to-video') return
    if (!selectedGap) return
    
    // Re-run suggestion with force replace since context changed
    runSuggestion(true)
  }, [gapImageFile, gapGenerateMode, selectedGap, runSuggestion])

  // Manual regenerate: force-replaces the prompt with the new suggestion
  const regenerateSuggestion = useCallback(() => {
    runSuggestion(true)
  }, [runSuggestion])

  // Cancel an in-progress gap generation
  const cancelGapGeneration = useCallback(() => {
    regenCancel()
    regenReset()
    setGeneratingGap(null)
  }, [regenCancel, regenReset])

  return {
    // State
    selectedGap,
    setSelectedGap,
    gapGenerateMode,
    setGapGenerateMode,
    gapGenerateModeRef,
    gapPrompt,
    setGapPrompt,
    gapSettings,
    setGapSettings,
    gapImageFile,
    setGapImageFile,
    gapImageInputRef,
    gapSuggesting,
    gapSuggestion,
    gapSuggestionError,
    gapSuggestionNoApiKey,
    gapBeforeFrame,
    gapAfterFrame,
    gapApplyAudioToTrack,
    setGapApplyAudioToTrack,
    regenerateSuggestion,
    // Background generation tracking
    generatingGap,
    isRegenerating,
    regenProgress,
    cancelGapGeneration,
    // Computed
    timelineGaps,
    // Actions
    deleteGap,
    handleGapGenerate,
  }
}
