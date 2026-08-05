import { useEffect, useState } from "react";

const MAX_ENTRIES = 80;
const MAX_CONCURRENT_GENERATIONS = 2;
const DEFAULT_WIDTH = 320;
const DEFAULT_SEEK_TIME = 0.1;

type ThumbnailOptions = { seekTime?: number; width?: number };
type ThumbnailEntry = { url: string; leases: number; evicted: boolean; revoked: boolean };

const cache = new Map<string, ThumbnailEntry>();
const pending = new Map<string, Promise<ThumbnailEntry>>();
const queue: Array<() => void> = [];
let activeGenerations = 0;

function keyFor(url: string, { seekTime = DEFAULT_SEEK_TIME, width = DEFAULT_WIDTH }: ThumbnailOptions) {
  return `${url}\u0000${seekTime}\u0000${width}`;
}

function touch(key: string) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  cache.delete(key);
  cache.set(key, entry);
  return entry;
}

function releaseEntry(entry: ThumbnailEntry) {
  entry.leases = Math.max(0, entry.leases - 1);
  if (entry.evicted && entry.leases === 0 && !entry.revoked) {
    entry.revoked = true;
    URL.revokeObjectURL(entry.url);
  }
}

function evict(entry: ThumbnailEntry) {
  entry.evicted = true;
  if (entry.leases === 0 && !entry.revoked) {
    entry.revoked = true;
    URL.revokeObjectURL(entry.url);
  }
}

function trim() {
  while (cache.size > MAX_ENTRIES) {
    const first = cache.entries().next().value as [string, ThumbnailEntry] | undefined;
    if (!first) return;
    cache.delete(first[0]);
    evict(first[1]);
  }
}

function enqueue<T>(work: () => Promise<T>) {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      activeGenerations += 1;
      void work().then(resolve, reject).finally(() => {
        activeGenerations -= 1;
        queue.shift()?.();
      });
    };
    if (activeGenerations < MAX_CONCURRENT_GENERATIONS) run();
    else queue.push(run);
  });
}

function createThumbnail(videoUrl: string, options: Required<ThumbnailOptions>) {
  return new Promise<string>((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
    };
    const fail = (error: Error) => {
      cleanup();
      reject(error);
    };
    video.addEventListener("error", () => fail(new Error(`Failed to load video for thumbnail: ${videoUrl}`)), { once: true });
    video.addEventListener("loadedmetadata", () => {
      video.currentTime = Math.min(options.seekTime, Math.max(0, video.duration || 0));
    }, { once: true });
    video.addEventListener("seeked", () => {
      try {
        const canvas = document.createElement("canvas");
        const aspect = video.videoWidth / video.videoHeight;
        canvas.width = options.width;
        canvas.height = Math.round(options.width / aspect) || options.width;
        const context = canvas.getContext("2d");
        if (!context) return fail(new Error("canvas 2d context unavailable"));
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          cleanup();
          if (!blob) return reject(new Error("toBlob returned null"));
          resolve(URL.createObjectURL(blob));
        }, "image/jpeg", 0.7);
      } catch (error) {
        fail(error instanceof Error ? error : new Error("Failed to draw video thumbnail"));
      }
    }, { once: true });
    video.src = videoUrl;
  });
}

async function getVideoThumbnailEntry(videoUrl: string, options: ThumbnailOptions = {}) {
  const key = keyFor(videoUrl, options);
  const cached = touch(key);
  if (cached) return cached;
  const inFlight = pending.get(key);
  if (inFlight) return await inFlight;
  const resolved = { seekTime: options.seekTime ?? DEFAULT_SEEK_TIME, width: options.width ?? DEFAULT_WIDTH };
  const thumbnail = enqueue(() => createThumbnail(videoUrl, resolved)).then((url) => {
    const entry = { url, leases: 0, evicted: false, revoked: false };
    cache.set(key, entry);
    trim();
    return entry;
  });
  pending.set(key, thumbnail);
  return await thumbnail.finally(() => pending.delete(key));
}

export async function getVideoThumbnail(videoUrl: string, options: ThumbnailOptions = {}) {
  return (await getVideoThumbnailEntry(videoUrl, options)).url;
}

export async function acquireVideoThumbnail(videoUrl: string, options: ThumbnailOptions = {}) {
  const entry = await getVideoThumbnailEntry(videoUrl, options);
  entry.leases += 1;
  let released = false;
  return {
    url: entry.url,
    release() {
      if (released) return;
      released = true;
      releaseEntry(entry);
    },
  };
}

export function getCachedVideoThumbnail(videoUrl: string, options: ThumbnailOptions = {}) {
  return touch(keyFor(videoUrl, options))?.url;
}

export function clearVideoThumbnailCache() {
  for (const entry of cache.values()) evict(entry);
  cache.clear();
}

export function getVideoThumbnailCacheStats() {
  return { entries: cache.size, pending: pending.size };
}

export function useVideoThumbnail(
  videoUrl: string | undefined,
  { enabled, fallback, ...options }: ThumbnailOptions & { enabled: boolean; fallback?: string },
) {
  const key = videoUrl ? keyFor(videoUrl, options) : "";
  const [thumbnail, setThumbnail] = useState<{ key: string; url?: string }>(() => ({
    key,
    url: fallback ?? (videoUrl ? getCachedVideoThumbnail(videoUrl, options) : undefined),
  }));
  useEffect(() => {
    let release: (() => void) | undefined;
    let cancelled = false;
    if (fallback) {
      setThumbnail({ key, url: fallback });
      return () => { cancelled = true; };
    }
    setThumbnail({ key, url: undefined });
    if (!enabled || !videoUrl) return () => { cancelled = true; };
    void acquireVideoThumbnail(videoUrl, options).then(
      (lease) => {
        if (cancelled) lease.release();
        else {
          release = lease.release;
          setThumbnail({ key, url: lease.url });
        }
      },
      () => { if (!cancelled) setThumbnail({ key, url: undefined }); },
    );
    return () => { cancelled = true; release?.(); };
  }, [enabled, fallback, key, options.seekTime, options.width, videoUrl]);
  return fallback ?? (thumbnail.key === key ? thumbnail.url : undefined);
}
