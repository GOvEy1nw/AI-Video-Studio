import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Asset, TimelineClip, Track } from '../../types/project'
import { buildPlaybackIndex } from './playback-index'
import { usePlaybackEngine, type UsePlaybackEngineParams } from './usePlaybackEngine'

const asset: Asset = {
  id: 'asset-1',
  type: 'video',
  path: 'C:\\video.mp4',
  url: 'file:///video.mp4',
  prompt: '',
  resolution: '1920x1080',
  createdAt: 0,
}

const track: Track = { id: 'track-1', name: 'V1', muted: false, locked: false }

const clip: TimelineClip = {
  id: 'clip-1',
  assetId: asset.id,
  type: 'video',
  startTime: 0,
  duration: 10,
  trimStart: 0,
  trimEnd: 0,
  speed: 1,
  reversed: false,
  muted: false,
  volume: 1,
  trackIndex: 0,
  asset,
  flipH: false,
  flipV: false,
  transitionIn: { type: 'none', duration: 0 },
  transitionOut: { type: 'none', duration: 0 },
  colorCorrection: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, exposure: 0, highlights: 0, shadows: 0 },
  opacity: 100,
}

function createParams(playbackResolution: number): UsePlaybackEngineParams {
  const playbackIndex = buildPlaybackIndex([clip], [track], [asset])
  return {
    isActive: true,
    playbackIndex,
    isPlaying: true,
    setIsPlaying: vi.fn(),
    shuttleSpeed: 1,
    setShuttleSpeed: vi.fn(),
    currentTime: 0,
    setCurrentTime: vi.fn(),
    duration: 10,
    pixelsPerSecond: 100,
    clips: [clip],
    tracks: [track],
    assets: [asset],
    activeClip: clip,
    crossDissolveState: null,
    playbackResolution,
    playingInOut: false,
    setPlayingInOut: vi.fn(),
    resolveClipSrc: () => asset.url,
    videoPoolRef: { current: new Map() },
    playbackTimeRef: { current: 0 },
    isPlayingRef: { current: true },
    activePoolSrcRef: { current: '' },
    previewVideoRef: { current: null },
    dissolveOutVideoRef: { current: null },
    trackContainerRef: { current: null },
    rulerScrollRef: { current: null },
    centerOnPlayheadRef: { current: false },
    clipsRef: { current: [clip] },
    tracksRef: { current: [track] },
    assetsRef: { current: [asset] },
    playheadOverlayRef: { current: null },
    playheadRulerRef: { current: null },
    lastStateUpdateRef: { current: 0 },
    preSeekDoneRef: { current: null },
    rafActiveClipIdRef: { current: null },
    inPoint: null,
    outPoint: null,
    totalDuration: 10,
    zoom: 1,
    setPlaybackActiveClipId: vi.fn(),
  }
}

describe('usePlaybackEngine', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps playback rAF alive when preview quality changes', () => {
    const requestFrame = vi.fn(() => 1)
    const cancelFrame = vi.fn()
    vi.stubGlobal('requestAnimationFrame', requestFrame)
    vi.stubGlobal('cancelAnimationFrame', cancelFrame)
    const initialParams = createParams(1)
    const { rerender } = renderHook(({ playbackResolution }) => usePlaybackEngine({ ...initialParams, playbackResolution }), {
      initialProps: { playbackResolution: 1 },
    })

    act(() => {
      rerender({ playbackResolution: 0.5 })
    })

    expect(requestFrame).toHaveBeenCalledTimes(1)
    expect(cancelFrame).not.toHaveBeenCalled()
  })
})
