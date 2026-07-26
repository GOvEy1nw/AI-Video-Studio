import { afterEach, describe, expect, it } from 'vitest'
import { getNativeFilePath } from './native-file-path'

afterEach(() => {
  Object.defineProperty(window, 'electronAPI', {
    configurable: true,
    value: undefined,
  })
})

describe('getNativeFilePath', () => {
  it('prefers the preload bridge path', () => {
    const file = new File(['image'], 'image.png', { type: 'image/png' })
    Object.defineProperty(file, 'path', { value: 'C:\\legacy\\image.png' })
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      value: {
        getPathForFile: () => 'C:\\bridged\\image.png',
      } as unknown as Window['electronAPI'],
    })

    expect(getNativeFilePath(file)).toBe('C:\\bridged\\image.png')
  })

  it('uses the Electron 31 legacy path when the bridge is unavailable', () => {
    const file = new File(['image'], 'image.png', { type: 'image/png' })
    Object.defineProperty(file, 'path', { value: 'C:\\legacy\\image.png' })

    expect(getNativeFilePath(file)).toBe('C:\\legacy\\image.png')
  })

  it('returns null when no native path is available', () => {
    const file = new File(['image'], 'image.png', { type: 'image/png' })

    expect(getNativeFilePath(file)).toBeNull()
  })
})
