import {
  getCachedVideoThumbnail,
  getVideoThumbnail,
} from "./video-thumbnail-service";

/** @deprecated Use getVideoThumbnail or useVideoThumbnail directly. */
export function generateThumbnail(videoUrl: string, seekTime = 0.1) {
  return getVideoThumbnail(videoUrl, { seekTime });
}

/** @deprecated Request individual enabled thumbnails from the shared service. */
export async function generateThumbnailsBatch(videoUrls: string[], concurrency = 2) {
  const results = new Map<string, string>();
  const queue = [...videoUrls];
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    let url: string | undefined;
    while ((url = queue.shift())) {
      try { results.set(url, await generateThumbnail(url)); } catch { /* per-item fallback */ }
    }
  });
  await Promise.all(workers);
  return results;
}

export function getCachedThumbnail(videoUrl: string) {
  return getCachedVideoThumbnail(videoUrl);
}

export function warmThumbnail(videoUrl: string) {
  void generateThumbnail(videoUrl).catch(() => undefined);
}
