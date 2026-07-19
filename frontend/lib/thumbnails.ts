/**
 * Thumbnail generation and video frame extraction utilities.
 *
 * Uses an off-screen <video> + <canvas> to capture a single frame
 * and return it as a small JPEG blob URL, suitable for fast grid thumbnails.
 */

const THUMB_WIDTH = 320 // px – sufficient for 2-col grid at ~160px card width
const THUMB_QUALITY = 0.7

/** Cache: videoUrl → thumbnailBlobUrl  (avoids regenerating on re-render) */
const thumbnailCache = new Map<string, string>()
const thumbnailPromiseCache = new Map<string, Promise<string>>()

/**
 * Extract a single frame from a video URL at the given time (default 0 s)
 * and return a lightweight blob: URL pointing to a JPEG snapshot.
 *
 * The result is cached so subsequent calls with the same `videoUrl` are instant.
 */
export function generateThumbnail(
  videoUrl: string,
  seekTime = 0.1, // slight offset avoids occasional black first-frame
): Promise<string> {
  const cached = thumbnailCache.get(videoUrl)
  if (cached) return Promise.resolve(cached)
  const pending = thumbnailPromiseCache.get(videoUrl)
  if (pending) return pending

  const thumbnailPromise = new Promise<string>((resolve, reject) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true

    const cleanup = () => {
      video.removeAttribute('src')
      video.load() // release resources
    }

    const onSeeked = () => {
      try {
        const canvas = document.createElement('canvas')
        const aspect = video.videoWidth / video.videoHeight
        canvas.width = THUMB_WIDTH
        canvas.height = Math.round(THUMB_WIDTH / aspect) || THUMB_WIDTH
        const ctx = canvas.getContext('2d')
        if (!ctx) { cleanup(); reject(new Error('canvas 2d context unavailable')); return }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            cleanup()
            if (!blob) { reject(new Error('toBlob returned null')); return }
            const blobUrl = URL.createObjectURL(blob)
            thumbnailCache.set(videoUrl, blobUrl)
            resolve(blobUrl)
          },
          'image/jpeg',
          THUMB_QUALITY,
        )
      } catch (err) {
        cleanup()
        reject(err)
      }
    }

    const onError = () => {
      cleanup()
      reject(new Error(`Failed to load video for thumbnail: ${videoUrl}`))
    }

    video.addEventListener('seeked', onSeeked, { once: true })
    video.addEventListener('error', onError, { once: true })

    video.addEventListener(
      'loadeddata',
      () => {
        // Seek to the requested time (clamped to duration)
        video.currentTime = Math.min(seekTime, video.duration || 0)
      },
      { once: true },
    )

    video.src = videoUrl
  })

  const trackedPromise = thumbnailPromise.then(
    (thumbnail) => {
      thumbnailPromiseCache.delete(videoUrl)
      return thumbnail
    },
    (error: unknown) => {
      thumbnailPromiseCache.delete(videoUrl)
      throw error
    },
  )
  thumbnailPromiseCache.set(videoUrl, trackedPromise)
  return trackedPromise
}

/**
 * Batch-generate thumbnails for multiple video URLs.
 * Returns a map of videoUrl → blobUrl for all that succeeded.
 * Failures are silently skipped (the caller can fall back to the original URL).
 *
 * Limits concurrency to avoid overwhelming the browser's media decoder.
 */
export async function generateThumbnailsBatch(
  videoUrls: string[],
  concurrency = 3,
): Promise<Map<string, string>> {
  const results = new Map<string, string>()
  const queue = [...videoUrls]

  const worker = async () => {
    while (queue.length > 0) {
      const url = queue.shift()!
      try {
        const thumb = await generateThumbnail(url)
        results.set(url, thumb)
      } catch {
        // skip – caller will fall back to original url
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, () => worker()))
  return results
}

/**
 * Look up a cached thumbnail. Returns undefined if not yet generated.
 */
export function getCachedThumbnail(videoUrl: string): string | undefined {
  return thumbnailCache.get(videoUrl)
}

/**
 * Warm the cache for a single URL (fire-and-forget).
 * Safe to call multiple times – subsequent calls are no-ops.
 */
export function warmThumbnail(videoUrl: string): void {
  if (thumbnailCache.has(videoUrl) || thumbnailPromiseCache.has(videoUrl)) return
  generateThumbnail(videoUrl).catch(() => {})
}

