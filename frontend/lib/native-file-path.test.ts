import { afterEach, describe, expect, it } from 'vitest'
import { getNativeFilePath } from './native-file-path'

type NativePathElectronAPI = Pick<
  NonNullable<Window['electronAPI']>,
  'getPathForFile'
>

function setElectronAPI(api: NativePathElectronAPI): void {
  Object.defineProperty(window, 'electronAPI', {
    configurable: true,
    value: api,
  })
}

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
    setElectronAPI({
      getPathForFile: () => 'C:\\bridged\\image.png',
    })

    expect(getNativeFilePath(file)).toBe('C:\\bridged\\image.png')
  })

  it('does not read the removed legacy path when the bridge is unavailable', () => {
    const file = new File(['image'], 'image.png', { type: 'image/png' })
    Object.defineProperty(file, 'path', { value: 'C:\\legacy\\image.png' })

    expect(getNativeFilePath(file)).toBeNull()
  })

  it('returns null when no native path is available', () => {
    const file = new File(['image'], 'image.png', { type: 'image/png' })

    expect(getNativeFilePath(file)).toBeNull()
  })

  it('rejects a whitespace-only bridge path', () => {
    const file = new File(['image'], 'image.png', { type: 'image/png' })
    setElectronAPI({
      getPathForFile: () => '   ',
    })

    expect(getNativeFilePath(file)).toBeNull()
  })
})
