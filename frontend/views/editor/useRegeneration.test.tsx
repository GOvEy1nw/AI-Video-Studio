import { act, renderHook } from '@testing-library/react'
import { useState } from 'react'
import { expect, it, vi } from 'vitest'
import { DEFAULT_COLOR_CORRECTION, type Asset, type TimelineClip } from '../../types/project'
import { useRegeneration } from './useRegeneration'

it('clears the clip regeneration marker when queue admission fails', async () => {
  const asset: Asset = {
    id: 'asset-1', type: 'video', path: 'C:\\source.mp4', url: 'file:///C:/source.mp4',
    prompt: 'scene', resolution: '540p', createdAt: 1,
    generationParams: { mode: 'text-to-video', prompt: 'scene', model: 'fast', duration: 5, resolution: '540p', fps: 24, audio: false, cameraMotion: 'none' },
  }
  const clip: TimelineClip = {
    id: 'clip-1', assetId: asset.id, asset, type: 'video', startTime: 0, duration: 5,
    trimStart: 0, trimEnd: 0, speed: 1, reversed: false, muted: false, volume: 1,
    trackIndex: 0, flipH: false, flipV: false, transitionIn: { type: 'none', duration: 0 },
    transitionOut: { type: 'none', duration: 0 }, colorCorrection: DEFAULT_COLOR_CORRECTION, opacity: 100,
  }
  const generate = vi.fn().mockRejectedValue(new Error('queue unavailable'))
  const { result } = renderHook(() => {
    const [clips, setClips] = useState([clip])
    return {
      clips,
      regeneration: useRegeneration({
        clips, setClips, assets: [asset], currentProjectId: 'project', timelineId: 'timeline',
        updateAsset: vi.fn(), deleteTakeFromAsset: vi.fn(), resolveClipSrc: () => asset.url,
        regenGenerate: generate, regenGenerateImage: vi.fn(), isRegenerating: false,
        regenProgress: 0, regenStatusMessage: '', regenCancel: vi.fn(), regenReset: vi.fn(),
      }),
    }
  })

  await act(() => result.current.regeneration.handleRegenerate(asset.id, clip.id))

  expect(generate).toHaveBeenCalledOnce()
  expect(result.current.clips[0].isRegenerating).toBe(false)
})
