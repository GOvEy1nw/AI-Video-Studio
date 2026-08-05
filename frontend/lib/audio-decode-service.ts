import { readLocalMediaArrayBuffer } from "./local-media-bytes";

const MAX_BUFFER_ENTRIES = 12;
const MAX_BUFFER_BYTES = 96 * 1024 * 1024;
const MAX_WAVEFORM_ENTRIES = 48;
const MAX_WAVEFORM_BYTES = 2 * 1024 * 1024;
const CANONICAL_BUCKETS = 2048;
const MAX_CONCURRENT_DECODES = 2;

type BufferEntry = { buffer: AudioBuffer; bytes: number };
type WaveformEntry = { peaks: Float32Array; bytes: number };

const bufferCache = new Map<string, BufferEntry>();
const waveformCache = new Map<string, WaveformEntry>();
const pendingBuffers = new Map<string, Promise<AudioBuffer>>();
const pendingWaveforms = new Map<string, Promise<Float32Array>>();
const activeBuffers = new Map<string, number>();
const decodeQueue: Array<() => void> = [];
let activeDecodes = 0;
let audioContext: AudioContext | null = null;

function touch<T>(cache: Map<string, T>, key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  cache.delete(key);
  cache.set(key, entry);
  return entry;
}

function bytesOf<T extends { bytes: number }>(cache: Map<string, T>) {
  let total = 0;
  for (const entry of cache.values()) total += entry.bytes;
  return total;
}

function trimBuffers() {
  while (
    bufferCache.size > MAX_BUFFER_ENTRIES ||
    bytesOf(bufferCache) > MAX_BUFFER_BYTES
  ) {
    const key = [...bufferCache.keys()].find((candidate) => !activeBuffers.has(candidate));
    if (!key) return;
    bufferCache.delete(key);
  }
}

function trimWaveforms() {
  while (
    waveformCache.size > MAX_WAVEFORM_ENTRIES ||
    bytesOf(waveformCache) > MAX_WAVEFORM_BYTES
  ) {
    const key = waveformCache.keys().next().value as string | undefined;
    if (!key) return;
    waveformCache.delete(key);
  }
}

function enqueueDecode<T>(work: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = () => {
      activeDecodes += 1;
      void work().then(resolve, reject).finally(() => {
        activeDecodes -= 1;
        decodeQueue.shift()?.();
      });
    };
    if (activeDecodes < MAX_CONCURRENT_DECODES) run();
    else decodeQueue.push(run);
  });
}

export function getSharedAudioContext(): AudioContext {
  if (audioContext) return audioContext;
  const AudioContextConstructor = window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) throw new Error("Web Audio is unavailable");
  audioContext = new AudioContextConstructor();
  return audioContext;
}

export async function getAudioBuffer(url: string): Promise<AudioBuffer> {
  const cached = touch(bufferCache, url);
  if (cached) return cached.buffer;
  const pending = pendingBuffers.get(url);
  if (pending) return pending;

  const pendingDecode = enqueueDecode(async () => {
    const bytes = await readLocalMediaArrayBuffer(url);
    const buffer = await getSharedAudioContext().decodeAudioData(bytes);
    bufferCache.set(url, {
      buffer,
      bytes: buffer.numberOfChannels * buffer.length * Float32Array.BYTES_PER_ELEMENT,
    });
    trimBuffers();
    return buffer;
  });
  pendingBuffers.set(url, pendingDecode);
  try {
    return await pendingDecode;
  } finally {
    pendingBuffers.delete(url);
  }
}

export async function acquireAudioBuffer(url: string) {
  const buffer = await getAudioBuffer(url);
  activeBuffers.set(url, (activeBuffers.get(url) ?? 0) + 1);
  let released = false;
  return {
    buffer,
    release() {
      if (released) return;
      released = true;
      const count = activeBuffers.get(url) ?? 0;
      if (count <= 1) activeBuffers.delete(url);
      else activeBuffers.set(url, count - 1);
      trimBuffers();
    },
  };
}

export function extractPeakEnvelope(channelData: Float32Array, buckets: number) {
  const result = new Float32Array(Math.max(1, buckets));
  for (let bucket = 0; bucket < result.length; bucket += 1) {
    const start = Math.floor((bucket * channelData.length) / result.length);
    const end = Math.max(start + 1, Math.floor(((bucket + 1) * channelData.length) / result.length));
    let peak = 0;
    for (let sample = start; sample < Math.min(end, channelData.length); sample += 1) {
      peak = Math.max(peak, Math.abs(channelData[sample]));
    }
    result[bucket] = peak;
  }
  return result;
}

export function downsamplePeakEnvelope(peaks: Float32Array, buckets: number) {
  if (buckets >= peaks.length) return peaks;
  const result = new Float32Array(Math.max(1, buckets));
  for (let bucket = 0; bucket < result.length; bucket += 1) {
    const start = Math.floor((bucket * peaks.length) / result.length);
    const end = Math.max(start + 1, Math.floor(((bucket + 1) * peaks.length) / result.length));
    let peak = 0;
    for (let sample = start; sample < Math.min(end, peaks.length); sample += 1) {
      peak = Math.max(peak, peaks[sample]);
    }
    result[bucket] = peak;
  }
  return result;
}

export async function getWaveform(url: string, buckets = CANONICAL_BUCKETS) {
  const cached = touch(waveformCache, url);
  if (cached) return downsamplePeakEnvelope(cached.peaks, buckets);
  const pending = pendingWaveforms.get(url);
  if (pending) return downsamplePeakEnvelope(await pending, buckets);

  const pendingWaveform = getAudioBuffer(url).then((buffer) => {
    const peaks = extractPeakEnvelope(buffer.getChannelData(0), CANONICAL_BUCKETS);
    waveformCache.set(url, { peaks, bytes: peaks.byteLength });
    trimWaveforms();
    return peaks;
  });
  pendingWaveforms.set(url, pendingWaveform);
  try {
    return downsamplePeakEnvelope(await pendingWaveform, buckets);
  } finally {
    pendingWaveforms.delete(url);
  }
}

export async function suspendSharedAudioContext() {
  if (audioContext?.state === "running") await audioContext.suspend();
}

export function clearAudioDecodeCache() {
  bufferCache.clear();
  waveformCache.clear();
}

export function getAudioDecodeCacheStats() {
  return {
    buffers: { entries: bufferCache.size, bytes: bytesOf(bufferCache) },
    waveforms: { entries: waveformCache.size, bytes: bytesOf(waveformCache) },
  };
}
