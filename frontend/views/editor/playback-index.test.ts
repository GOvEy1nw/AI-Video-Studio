import { describe, expect, it } from 'vitest'
import type { Asset, TimelineClip, Track } from '../../types/project'
import { buildPlaybackIndex, selectActiveAudioAtTime, selectDissolveAtTime, selectVisualAtTime, type IndexedClip } from './playback-index'

declare const process: { stdout: { write(value: string): void } }

function asset(id: string, type: Asset['type'], url = `file:///${id}`): Asset {
  return { id, type, path: url, url, prompt: '', resolution: '', createdAt: 0 }
}

function clip(id: string, trackIndex: number, startTime: number, duration: number, type: TimelineClip['type'] = 'video'): TimelineClip {
  return {
    id,
    assetId: id,
    type,
    startTime,
    duration,
    trimStart: 0,
    trimEnd: 0,
    speed: 1,
    reversed: false,
    muted: false,
    volume: 1,
    trackIndex,
    asset: asset(id, type === 'audio' ? 'audio' : 'video'),
    flipH: false,
    flipV: false,
    transitionIn: { type: 'none', duration: 0 },
    transitionOut: { type: 'none', duration: 0 },
    colorCorrection: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, exposure: 0, highlights: 0, shadows: 0 },
    opacity: 100,
  }
}

const tracks: Track[] = [
  { id: 'v1', name: 'V1', muted: false, locked: false, enabled: true },
  { id: 'v2', name: 'V2', muted: false, locked: false, enabled: true },
]

describe('playback index', () => {
  it('keeps topmost and later-array visual precedence while skipping disabled tracks', () => {
    const lower = clip('lower', 0, 0, 10)
    const upperFirst = clip('upper-first', 1, 0, 10)
    const upperLater = clip('upper-later', 1, 0, 10)
    const newerStart = clip('newer-start', 1, 2, 10)
    const index = buildPlaybackIndex([lower, upperFirst, newerStart, upperLater], tracks, [])

    expect(selectVisualAtTime(index, 2)?.clip.id).toBe('upper-later')
    const disabledTracks = [{ ...tracks[0], enabled: true }, { ...tracks[1], enabled: false }]
    const disabledFuture = clip('disabled-future', 1, 20, 1)
    const disabledIndex = buildPlaybackIndex([lower, upperFirst, disabledFuture], disabledTracks, [])
    expect(selectVisualAtTime(disabledIndex, 2)?.clip.id).toBe('lower')
    expect(disabledIndex.nextVideoByClipId.get('lower')).toBeNull()
  })

  it('preserves dissolve boundaries, next-video order, active takes, and linked audio lookup', () => {
    const outgoing = { ...clip('outgoing', 0, 0, 5), transitionOut: { type: 'dissolve' as const, duration: 1 } }
    const incoming = { ...clip('incoming', 0, 5, 5), transitionIn: { type: 'dissolve' as const, duration: 1 } }
    const audio = { ...clip('audio', 0, 0, 10, 'audio'), assetId: 'audio' }
    const linkedVideo = { ...clip('linked-video', 1, 0, 10), linkedClipIds: ['audio'] }
    const assetWithTakes = { ...asset('outgoing', 'video'), takes: [{ url: 'file:///first', path: '', createdAt: 0 }, { url: 'file:///second', path: '', createdAt: 0 }] }
    const takenOutgoing = { ...outgoing, takeIndex: 99 }
    const index = buildPlaybackIndex([takenOutgoing, incoming, audio, linkedVideo], tracks, [assetWithTakes])
    const audioOutput: IndexedClip[] = []

    expect(selectDissolveAtTime(index, 4)?.outgoing.clip.id).toBe('outgoing')
    expect(selectDissolveAtTime(index, 5)).toBeNull()
    expect(index.nextVideoByClipId.get('outgoing')?.clip.id).toBe('incoming')
    expect(index.clipById.get('outgoing')?.sourceUrl).toBe('file:///second')
    selectActiveAudioAtTime(index, 1, audioOutput)
    expect(audioOutput.map((entry) => entry.clip.id)).toEqual(['audio', 'linked-video'])
  })

  it('measures the deterministic 500-clip lookup fixture', () => {
    const assets = Array.from({ length: 500 }, (_, index) => asset(`asset-${index}`, 'video'))
    const fixtureClips = Array.from({ length: 500 }, (_, index) => {
      const entry = clip(`asset-${index}`, index % 20, index * 0.25, 1)
      return index % 25 === 0
        ? { ...entry, transitionOut: { type: 'dissolve' as const, duration: 0.15 } }
        : entry
    })
    const fixtureTracks = Array.from({ length: 20 }, (_, index) => ({ ...tracks[0], id: `track-${index}` }))
    const index = buildPlaybackIndex(fixtureClips, fixtureTracks, assets)
    const times = Array.from({ length: 200 }, (_, index) => (index % 100) * 0.25 + 0.1)
    const legacyTick = (time: number) => {
      const visual = fixtureClips
        .map((entry, arrayIndex) => ({ entry, arrayIndex }))
        .filter(({ entry }) => entry.type !== 'audio' && entry.type !== 'adjustment' && entry.type !== 'text' && time >= entry.startTime && time < entry.startTime + entry.duration)
        .sort((left, right) => right.entry.trackIndex - left.entry.trackIndex || right.arrayIndex - left.arrayIndex)[0]?.entry
      for (const outgoing of fixtureClips) {
        if (outgoing.transitionOut.type !== 'dissolve') continue
        const end = outgoing.startTime + outgoing.duration
        if (time < end - outgoing.transitionOut.duration || time >= end) continue
        fixtureClips.find((incoming) => incoming.id !== outgoing.id && incoming.trackIndex === outgoing.trackIndex && incoming.transitionIn.type === 'dissolve' && Math.abs(incoming.startTime - end) < 0.05)
      }
      if (visual) {
        fixtureClips.find((candidate) => candidate.type === 'video' && candidate.startTime >= visual.startTime + visual.duration - 0.01)
        assets.find((candidate) => candidate.id === visual.assetId)
      }
    }
    const indexedTick = (time: number) => {
      const visual = selectVisualAtTime(index, time)
      selectDissolveAtTime(index, time)
      if (visual) {
        index.nextVideoByClipId.get(visual.clip.id)
        index.assetById.get(visual.clip.assetId ?? '')
      }
    }
    for (let warmup = 0; warmup < 5_000; warmup += 1) {
      legacyTick(times[warmup % times.length])
      indexedTick(times[warmup % times.length])
    }
    const measure = (tick: (time: number) => void) => Array.from({ length: 150 }, () => {
      const start = performance.now()
      for (const time of times) tick(time)
      return ((performance.now() - start) * 1_000) / times.length
    }).sort((left, right) => left - right)
    const legacy = measure(legacyTick)
    const indexed = measure(indexedTick)
    const median = (samples: number[]) => samples[Math.floor(samples.length / 2)]
    const p95 = (samples: number[]) => samples[Math.floor(samples.length * 0.95)]
    process.stdout.write(`AIVS-026 benchmark legacy median=${median(legacy).toFixed(3)}us p95=${p95(legacy).toFixed(3)}us; indexed median=${median(indexed).toFixed(3)}us p95=${p95(indexed).toFixed(3)}us\n`)
  })
})
