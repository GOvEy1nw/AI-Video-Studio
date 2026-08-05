import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Video } from 'lucide-react'
import { needsBlurredBackdrop } from '../../lib/media-aspect'
import { useVideoThumbnail } from '../../lib/video-thumbnail-service'

export function VideoThumbnailCard({ url, thumbnailUrl, enabled = true }: { url: string; thumbnailUrl?: string; enabled?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [showBackdrop, setShowBackdrop] = useState(false)
  const [scrubProgress, setScrubProgress] = useState(0)
  const [scrubTime, setScrubTime] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const rafRef = useRef<number>(0)
  const sharedThumbnail = useVideoThumbnail(url, { enabled: enabled && isVisible, fallback: thumbnailUrl })

  useEffect(() => {
    if (!enabled || thumbnailUrl) return
    if (!("IntersectionObserver" in window)) {
      setIsVisible(true)
      return
    }
    const container = containerRef.current
    if (!container) return
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting))
    observer.observe(container)
    return () => observer.disconnect()
  }, [enabled, thumbnailUrl])

  const resetHoverPreview = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    setIsHovering(false)
    setVideoReady(false)
    setScrubProgress(0)
    setScrubTime('')
    const video = videoRef.current
    if (video) {
      video.currentTime = 0
      video.removeAttribute('src')
      video.load()
    }
  }, [])

  const drawFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width
      canvas.height = rect.height
    }
    const sourceWidth = video.videoWidth
    const sourceHeight = video.videoHeight
    if (!sourceWidth || !sourceHeight) return

    const coverScale = Math.max(canvas.width / sourceWidth, canvas.height / sourceHeight)
    const coverWidth = sourceWidth * coverScale
    const coverHeight = sourceHeight * coverScale
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const needsBackdrop = needsBlurredBackdrop(sourceWidth, sourceHeight)
    setShowBackdrop(needsBackdrop)
    if (!needsBackdrop) {
      ctx.drawImage(
        video,
        (canvas.width - coverWidth) / 2,
        (canvas.height - coverHeight) / 2,
        coverWidth,
        coverHeight,
      )
      return
    }

    ctx.save()
    ctx.filter = 'blur(12px) brightness(0.55)'
    ctx.drawImage(
      video,
      (canvas.width - coverWidth) / 2,
      (canvas.height - coverHeight) / 2,
      coverWidth,
      coverHeight,
    )
    ctx.restore()

    const containScale = Math.min(canvas.width / sourceWidth, canvas.height / sourceHeight)
    const containWidth = sourceWidth * containScale
    const containHeight = sourceHeight * containScale
    ctx.drawImage(
      video,
      (canvas.width - containWidth) / 2,
      (canvas.height - containHeight) / 2,
      containWidth,
      containHeight,
    )
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!enabled) return
    const video = videoRef.current
    const container = containerRef.current
    if (!video || !container || !video.duration || isNaN(video.duration)) return
    const rect = container.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const pct = x / rect.width
    const targetTime = pct * video.duration
    video.currentTime = targetTime
    setScrubProgress(pct)
    const mins = Math.floor(targetTime / 60)
    const secs = Math.floor(targetTime % 60)
    const frames = Math.floor((targetTime % 1) * 24)
    setScrubTime(`${mins}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`)
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(drawFrame)
  }, [drawFrame, enabled])

  const handleMouseEnter = useCallback(() => {
    if (!enabled) return
    setIsHovering(true)
  }, [enabled])

  const handleMouseLeave = useCallback(() => {
    resetHoverPreview()
  }, [resetHoverPreview])

  useEffect(() => {
    if (!enabled && isHovering) resetHoverPreview()
  }, [enabled, isHovering, resetHoverPreview])

  useEffect(() => {
    if (!enabled || !isHovering) return
    const video = videoRef.current
    if (!video) return
    video.src = url
    video.preload = 'auto'
    video.load()

    const onLoaded = () => {
      setVideoReady(true)
      requestAnimationFrame(drawFrame)
    }
    video.addEventListener('loadeddata', onLoaded, { once: true })
    return () => video.removeEventListener('loadeddata', onLoaded)
  }, [enabled, isHovering, url, drawFrame])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !enabled || !isHovering) return
    const onSeeked = () => requestAnimationFrame(drawFrame)
    video.addEventListener('seeked', onSeeked)
    return () => video.removeEventListener('seeked', onSeeked)
  }, [enabled, isHovering, drawFrame])

  return (
    <div
      ref={containerRef}
      className="w-full aspect-video relative overflow-hidden bg-zinc-900"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={enabled && isHovering ? handleMouseMove : undefined}
    >
      {sharedThumbnail ? (
        <>
          {showBackdrop && (
            <img
              src={sharedThumbnail}
              alt=""
              aria-hidden
              className={`absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl ${isHovering && videoReady ? 'invisible' : ''}`}
            />
          )}
          <img
            src={sharedThumbnail}
            alt=""
            onLoad={(event) =>
              setShowBackdrop(
                needsBlurredBackdrop(
                  event.currentTarget.naturalWidth,
                  event.currentTarget.naturalHeight,
                ),
              )
            }
            className={`absolute inset-0 h-full w-full ${showBackdrop ? 'object-contain' : 'object-cover'} ${isHovering && videoReady ? 'opacity-0' : 'opacity-100'} transition-opacity duration-100`}
          />
        </>
      ) : (
        <div className={`w-full h-full bg-zinc-800 absolute inset-0 flex items-center justify-center ${isHovering && videoReady ? 'opacity-0' : 'opacity-100'} transition-opacity duration-100`}>
          <Video className="h-5 w-5 text-zinc-600" />
        </div>
      )}

      <canvas
        ref={canvasRef}
        className={`w-full h-full object-cover absolute inset-0 ${isHovering && videoReady ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100`}
      />

      <video
        ref={videoRef}
        className="hidden"
        muted
        playsInline
        preload="none"
      />

      {isHovering && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/40">
          <div
            className="h-full bg-blue-500 transition-none"
            style={{ width: `${scrubProgress * 100}%` }}
          />
        </div>
      )}

      {isHovering && videoReady && scrubTime && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-sm bg-black/80 backdrop-blur-xs">
          <span className="text-[9px] text-white font-mono tabular-nums">{scrubTime}</span>
        </div>
      )}
    </div>
  )
}
