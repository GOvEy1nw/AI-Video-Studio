import type { Asset, TimelineClip, Track } from '../../types/project'

export type IndexedClip = {
  clip: TimelineClip
  arrayIndex: number
  start: number
  end: number
  sourceUrl: string
}

type IndexedDissolve = {
  outgoing: IndexedClip
  incoming: IndexedClip
  start: number
  end: number
  duration: number
}

type DissolveSegment = {
  start: number
  end: number
  dissolve: IndexedDissolve
}

type VisualSegment = {
  start: number
  end: number
  clip: IndexedClip
}

type AudioSegment = {
  start: number
  end: number
  clips: readonly IndexedClip[]
}

export type PlaybackIndex = {
  assetById: ReadonlyMap<string, Asset>
  trackByIndex: ReadonlyMap<number, Track>
  clipById: ReadonlyMap<string, IndexedClip>
  visualTracks: readonly (readonly VisualSegment[])[]
  audioTracks: readonly (readonly AudioSegment[])[]
  anySoloed: boolean
  dissolveSegments: readonly DissolveSegment[]
  nextVideoByClipId: ReadonlyMap<string, IndexedClip | null>
}

function sourceForClip(clip: TimelineClip, assetById: ReadonlyMap<string, Asset>) {
  const asset = clip.assetId ? assetById.get(clip.assetId) : undefined
  if (asset) {
    if (asset.takes && asset.takes.length > 0 && clip.takeIndex !== undefined) {
      return asset.takes[Math.max(0, Math.min(clip.takeIndex, asset.takes.length - 1))]?.url ?? ''
    }
    return asset.url
  }
  return clip.asset?.url || clip.importedUrl || ''
}

function firstStartAtOrAfter(clips: readonly IndexedClip[], time: number) {
  let low = 0
  let high = clips.length
  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    if (clips[mid].start < time) low = mid + 1
    else high = mid
  }
  return low
}

function isVisual(clip: TimelineClip) {
  return clip.type !== 'audio' && clip.type !== 'adjustment' && clip.type !== 'text'
}

function isAudioCandidate(clip: TimelineClip, linkedAudioIds: ReadonlySet<string>) {
  if (clip.type === 'adjustment' || clip.type === 'text' || clip.type === 'image') return false
  return clip.type !== 'video' || Boolean(clip.linkedClipIds?.some((id) => linkedAudioIds.has(id)))
}

function buildVisualSegments(entries: readonly IndexedClip[]) {
  const boundaries = [...new Set(entries.flatMap(({ start, end }) => [start, end]))].sort((left, right) => left - right)
  const segments: VisualSegment[] = []
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const start = boundaries[index]
    const end = boundaries[index + 1]
    let selected: IndexedClip | null = null
    for (const entry of entries) {
      if (entry.start <= start && entry.end > start && (!selected || entry.arrayIndex > selected.arrayIndex)) selected = entry
    }
    if (!selected) continue
    const previous = segments[segments.length - 1]
    if (previous?.clip === selected && previous.end === start) previous.end = end
    else segments.push({ start, end, clip: selected })
  }
  return segments
}

function buildAudioSegments(entries: readonly IndexedClip[]) {
  const boundaries = [...new Set(entries.flatMap(({ start, end }) => [start, end]))].sort((left, right) => left - right)
  const segments: AudioSegment[] = []
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const start = boundaries[index]
    const end = boundaries[index + 1]
    const active = entries.filter((entry) => entry.start <= start && entry.end > start)
    if (active.length > 0) segments.push({ start, end, clips: active })
  }
  return segments
}

function segmentAtTime<T extends { start: number; end: number }>(segments: readonly T[], time: number) {
  let low = 0
  let high = segments.length
  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    if (segments[mid].start <= time) low = mid + 1
    else high = mid
  }
  const segment = segments[low - 1]
  return segment && time < segment.end ? segment : null
}

export function buildPlaybackIndex(clips: readonly TimelineClip[], tracks: readonly Track[], assets: readonly Asset[]): PlaybackIndex {
  const assetById = new Map(assets.map((asset) => [asset.id, asset]))
  const trackByIndex = new Map(tracks.map((track, index) => [index, track]))
  const indexed = clips.map((clip, arrayIndex) => ({
    clip,
    arrayIndex,
    start: clip.startTime,
    end: clip.startTime + clip.duration,
    sourceUrl: sourceForClip(clip, assetById),
  }))
  const clipById = new Map(indexed.map((entry) => [entry.clip.id, entry]))
  const linkedAudioIds = new Set(clips.filter((clip) => clip.type === 'audio').map((clip) => clip.id))
  const byTrack = new Map<number, IndexedClip[]>()
  for (const entry of indexed) {
    const trackEntries = byTrack.get(entry.clip.trackIndex)
    if (trackEntries) trackEntries.push(entry)
    else byTrack.set(entry.clip.trackIndex, [entry])
  }
  for (const entries of byTrack.values()) entries.sort((left, right) => left.start - right.start || left.arrayIndex - right.arrayIndex)

  const visualTracks = [...byTrack.entries()]
    .filter(([trackIndex]) => tracks[trackIndex]?.enabled !== false)
    .sort(([left], [right]) => right - left)
    .map(([, entries]) => buildVisualSegments(entries.filter(({ clip }) => isVisual(clip))))
    .filter((entries) => entries.length > 0)
  const audioTracks = [...byTrack.entries()]
    .filter(([trackIndex]) => tracks[trackIndex]?.enabled !== false)
    .map(([, entries]) => buildAudioSegments(entries.filter(({ clip }) => isAudioCandidate(clip, linkedAudioIds))))
    .filter((entries) => entries.length > 0)

  const dissolves: IndexedDissolve[] = []
  for (const outgoing of indexed) {
    const transition = outgoing.clip.transitionOut
    if (transition?.type !== 'dissolve' || transition.duration <= 0) continue
    const incoming = indexed.find((candidate) =>
      candidate.clip.id !== outgoing.clip.id &&
      candidate.clip.trackIndex === outgoing.clip.trackIndex &&
      candidate.clip.transitionIn?.type === 'dissolve' &&
      Math.abs(candidate.start - outgoing.end) < 0.05,
    )
    if (incoming) {
      dissolves.push({ outgoing, incoming, start: outgoing.end - transition.duration, end: outgoing.end, duration: transition.duration })
    }
  }
  const boundaries = [...new Set(dissolves.flatMap(({ start, end }) => [start, end]))].sort((left, right) => left - right)
  const dissolveSegments: DissolveSegment[] = []
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const start = boundaries[index]
    const end = boundaries[index + 1]
    const dissolve = dissolves.find((candidate) => candidate.start <= start && candidate.end > start)
    if (!dissolve) continue
    const previous = dissolveSegments[dissolveSegments.length - 1]
    if (previous?.dissolve === dissolve && previous.end === start) previous.end = end
    else dissolveSegments.push({ start, end, dissolve })
  }

  const videos = indexed
    .filter(({ clip }) => isVisual(clip) && clip.asset?.type === 'video' && tracks[clip.trackIndex]?.enabled !== false)
    .sort((left, right) => left.start - right.start || left.arrayIndex - right.arrayIndex)
  const nextVideoByClipId = new Map<string, IndexedClip | null>()
  for (const entry of indexed) {
    nextVideoByClipId.set(entry.clip.id, videos[firstStartAtOrAfter(videos, entry.end - 0.01)] ?? null)
  }

  return {
    assetById,
    trackByIndex,
    clipById,
    visualTracks,
    audioTracks,
    anySoloed: tracks.some((track) => track.solo),
    dissolveSegments,
    nextVideoByClipId,
  }
}

export function selectVisualAtTime(index: PlaybackIndex, time: number) {
  for (const track of index.visualTracks) {
    const segment = segmentAtTime(track, time)
    if (segment) return segment.clip
  }
  return null
}

export function selectDissolveAtTime(index: PlaybackIndex, time: number) {
  return segmentAtTime(index.dissolveSegments, time)?.dissolve ?? null
}

export function selectActiveAudioAtTime(index: PlaybackIndex, time: number, output: IndexedClip[]) {
  output.length = 0
  for (const track of index.audioTracks) {
    const segment = segmentAtTime(track, time)
    if (segment) output.push(...segment.clips)
  }
}
