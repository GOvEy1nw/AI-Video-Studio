import { describe, expect, it, vi } from 'vitest'
import { exactArrayBuffer, readLocalMediaArrayBuffer } from './local-media-bytes'

describe('local media bytes', () => {
  it('copies only the typed byte view backing range', () => {
    const bytes = new Uint8Array([0, 1, 2, 3]).subarray(1, 3)
    expect([...new Uint8Array(exactArrayBuffer(bytes))]).toEqual([1, 2])
  })

  it('uses byte IPC for approved local media', async () => {
    const readLocalFileBytes = vi.fn().mockResolvedValue({ bytes: new Uint8Array([4, 5]), mimeType: 'audio/wav' })
    Object.defineProperty(window, 'electronAPI', { configurable: true, value: { readLocalFileBytes } })

    expect([...new Uint8Array(await readLocalMediaArrayBuffer('file:///approved.wav'))]).toEqual([4, 5])
    expect(readLocalFileBytes).toHaveBeenCalledWith('file:///approved.wav')
  })
})
