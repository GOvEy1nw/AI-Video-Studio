import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { logger } from '../lib/logger'

export const MIN_TRIM_DURATION = 2

export interface VideoTrimState {
  selStart: number
  selEnd: number
  videoDuration: number
  currentTime: number
  thumbnails: string[]
}

interface VideoTrimPanelProps {
  videoUrl: string | null
  videoDuration: number
  defaultToFullClip?: boolean
  onTimeUpdate?: (currentTime: number) => void
  onSelectionChange?: (selStart: number, selEnd: number) => void
}

function formatTimecode(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`
}

export function VideoTrimPanel({
  videoUrl,
  videoDuration,
  defaultToFullClip = false,
  onTimeUpdate,
  onSelectionChange,
}: VideoTrimPanelProps) {
  const filmstripRef = useRef<HTMLDivElement>(null)
  const [selStart, setSelStart] = useState(0)
  const [selEnd, setSelEnd] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [draggingHandle, setDraggingHandle] = useState<'start' | 'end' | 'range' | null>(null)
  const dragStartRef = useRef<{ mouseX: number; selStart: number; selEnd: number } | null>(null)
  const initialSelectionAppliedRef = useRef(false)
  const extractingRef = useRef(false)
  const [thumbnails, setThumbnails] = useState<string[]>([])
  const [thumbCount] = useState(20)

  useEffect(() => {
    initialSelectionAppliedRef.current = false
    setSelStart(0)
    setSelEnd(0)
    setThumbnails([])
    extractingRef.current = false
  }, [videoUrl])

  useEffect(() => {
    if (!videoUrl || videoDuration <= 0 || initialSelectionAppliedRef.current) return
    setSelStart(0)
    setSelEnd(defaultToFullClip ? videoDuration : Math.min(videoDuration, 5))
    initialSelectionAppliedRef.current = true
  }, [videoDuration, videoUrl, defaultToFullClip])

  useEffect(() => {
    onSelectionChange?.(selStart, selEnd)
  }, [selStart, selEnd, onSelectionChange])

  useEffect(() => {
    onTimeUpdate?.(currentTime)
  }, [currentTime, onTimeUpdate])

  useEffect(() => {
    if (!videoUrl || extractingRef.current || videoDuration <= 0) return
    extractingRef.current = true

    const extractThumbnails = async () => {
      const video = document.createElement('video')
      video.crossOrigin = 'anonymous'
      video.preload = 'auto'
      video.muted = true
      video.src = videoUrl

      await new Promise<void>((resolve, reject) => {
        video.onloadeddata = () => resolve()
        video.onerror = () => reject(new Error('Failed to load video for thumbnails'))
        setTimeout(() => reject(new Error('Timeout loading video')), 10000)
      })

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const thumbWidth = 80
      const thumbHeight = Math.round(thumbWidth * (video.videoHeight / video.videoWidth))
      canvas.width = thumbWidth
      canvas.height = thumbHeight

      const frames: string[] = []
      const count = Math.min(thumbCount, Math.max(5, Math.floor(videoDuration / 0.25)))

      for (let i = 0; i < count; i++) {
        const seekTime = (i / count) * videoDuration
        video.currentTime = seekTime
        await new Promise<void>((resolve) => {
          video.onseeked = () => resolve()
          setTimeout(resolve, 500)
        })
        ctx.drawImage(video, 0, 0, thumbWidth, thumbHeight)
        frames.push(canvas.toDataURL('image/jpeg', 0.6))
      }

      video.src = ''
      video.load()
      setThumbnails(frames)
    }

    extractThumbnails().catch((err) => {
      logger.warn(`Filmstrip extraction failed: ${err}`)
    })
  }, [videoUrl, videoDuration, thumbCount])

  const selStartRef = useRef(selStart)
  selStartRef.current = selStart
  const selEndRef = useRef(selEnd)
  selEndRef.current = selEnd

  const handleFilmstripMouseDown = useCallback(
    (event: React.MouseEvent, handle: 'start' | 'end' | 'range') => {
      event.preventDefault()
      event.stopPropagation()
      dragStartRef.current = {
        mouseX: event.clientX,
        selStart: selStartRef.current,
        selEnd: selEndRef.current,
      }
      setDraggingHandle(handle)
    },
    [],
  )

  useEffect(() => {
    if (!draggingHandle) return

    const handleMouseMove = (event: MouseEvent) => {
      const strip = filmstripRef.current
      const origin = dragStartRef.current
      if (!strip || !origin) return
      const rect = strip.getBoundingClientRect()

      if (draggingHandle === 'range') {
        const dx = event.clientX - origin.mouseX
        const dtSeconds = (dx / rect.width) * videoDuration
        const rangeDuration = origin.selEnd - origin.selStart
        let newStart = origin.selStart + dtSeconds
        let newEnd = origin.selEnd + dtSeconds
        if (newStart < 0) {
          newStart = 0
          newEnd = rangeDuration
        }
        if (newEnd > videoDuration) {
          newEnd = videoDuration
          newStart = videoDuration - rangeDuration
        }
        setSelStart(Math.max(0, newStart))
        setSelEnd(Math.min(videoDuration, newEnd))
      } else {
        const fraction = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
        const time = fraction * videoDuration
        if (draggingHandle === 'start') {
          const maxStart = selEndRef.current - MIN_TRIM_DURATION
          setSelStart(Math.max(0, Math.min(maxStart, time)))
        } else {
          const minEnd = selStartRef.current + MIN_TRIM_DURATION
          setSelEnd(Math.min(videoDuration, Math.max(minEnd, time)))
        }
      }
    }

    const handleMouseUp = () => {
      setDraggingHandle(null)
      dragStartRef.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggingHandle, videoDuration])

  const handleFilmstripClick = useCallback(
    (event: React.MouseEvent) => {
      if (draggingHandle) return
      const strip = filmstripRef.current
      if (!strip) return
      const rect = strip.getBoundingClientRect()
      const fraction = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
      setCurrentTime(fraction * videoDuration)
    },
    [draggingHandle, videoDuration],
  )

  if (!videoUrl || videoDuration <= 0) return null

  const selStartFrac = selStart / videoDuration
  const selEndFrac = selEnd / videoDuration
  const playheadFrac = currentTime / videoDuration
  const selDuration = selEnd - selStart

  return (
    <div className="flex-shrink-0">
      <div className="px-4 pt-3 pb-1">
        <p className="text-xs font-semibold text-white">Select the video part to reframe</p>
        <p className="text-[10px] text-zinc-500 mt-0.5">
          Drag the frame edges to expand; trim below if needed
        </p>
      </div>

      <div className="px-4 pb-4">
        <div className="relative h-3 mb-0">
          <div
            className="absolute pointer-events-none z-10"
            style={{ left: `${playheadFrac * 100}%`, transform: 'translateX(-50%)' }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <polygon points="0,0 10,0 5,8" fill="#fff" />
            </svg>
          </div>
        </div>
        <div
          ref={filmstripRef}
          className="relative h-14 rounded-md overflow-hidden cursor-pointer select-none"
          onClick={handleFilmstripClick}
        >
          <div className="absolute inset-0 flex">
            {thumbnails.length > 0 ? (
              thumbnails.map((thumb, i) => (
                <img
                  key={i}
                  src={thumb}
                  alt=""
                  className="h-full flex-1 object-cover"
                  style={{ minWidth: 0 }}
                  draggable={false}
                />
              ))
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                <Loader2 className="h-4 w-4 text-zinc-600 animate-spin" />
              </div>
            )}
          </div>

          <div
            className="absolute top-0 bottom-0 left-0 bg-black/75 pointer-events-none"
            style={{ width: `${selStartFrac * 100}%` }}
          />
          <div
            className="absolute top-0 bottom-0 right-0 bg-black/75 pointer-events-none"
            style={{ width: `${(1 - selEndFrac) * 100}%` }}
          />

          <div
            className="absolute top-0 bottom-0 bg-white pointer-events-none"
            style={{
              left: `${selStartFrac * 100}%`,
              width: `${(selEndFrac - selStartFrac) * 100}%`,
            }}
          />

          <div
            className={`absolute top-0 bottom-0 z-[12] ${draggingHandle === 'range' ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
              left: `calc(${selStartFrac * 100}% + 14px)`,
              width: `calc(${(selEndFrac - selStartFrac) * 100}% - 28px)`,
            }}
            onMouseDown={(e) => handleFilmstripMouseDown(e, 'range')}
          />

          <div
            className="absolute top-0 bottom-0 border-2 border-blue-500 pointer-events-none"
            style={{
              left: `${selStartFrac * 100}%`,
              width: `${(selEndFrac - selStartFrac) * 100}%`,
            }}
          />

          <div
            className="absolute top-0 bottom-0 cursor-ew-resize z-20 group"
            style={{ left: `calc(${selStartFrac * 100}% - 6px)`, width: '20px' }}
            onMouseDown={(e) => handleFilmstripMouseDown(e, 'start')}
          >
            <div
              className="absolute top-0 bottom-0 bg-blue-500 group-hover:bg-blue-400 transition-colors"
              style={{ left: '5px', width: '4px', borderRadius: '2px 0 0 2px' }}
            />
          </div>

          <div
            className="absolute top-0 bottom-0 cursor-ew-resize z-20 group"
            style={{ left: `calc(${selEndFrac * 100}% - 14px)`, width: '20px' }}
            onMouseDown={(e) => handleFilmstripMouseDown(e, 'end')}
          >
            <div
              className="absolute top-0 bottom-0 bg-blue-500 group-hover:bg-blue-400 transition-colors"
              style={{ right: '5px', width: '4px', borderRadius: '0 2px 2px 0' }}
            />
          </div>

          <div
            className="absolute top-1/2 pointer-events-none z-10"
            style={{
              left: `${((selStartFrac + selEndFrac) / 2) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span className="text-[11px] font-mono text-zinc-700 bg-white/90 rounded px-2 py-0.5 font-semibold shadow">
              {formatTimecode(selDuration)}
            </span>
          </div>
        </div>

        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] font-mono text-blue-400">{formatTimecode(selStart)}</span>
          <span className="text-[10px] font-mono text-zinc-500">
            Duration: {formatTimecode(selDuration)}
          </span>
          <span className="text-[10px] font-mono text-blue-400">{formatTimecode(selEnd)}</span>
        </div>
      </div>
    </div>
  )
}

export { formatTimecode as formatTrimTimecode }
