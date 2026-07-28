import path from 'path'
import { describe, expect, it } from 'vitest'
import {
  directoryForDialogSelection,
  firstUsableDirectory,
  resolveSaveDialogDefaultPath,
} from './dialog-paths'

describe('dialog path selection', () => {
  it('uses the first available remembered or fallback directory', () => {
    expect(
      firstUsableDirectory(
        ['', 'missing', 'available', 'later'],
        (candidate) => candidate === 'available' || candidate === 'later',
      ),
    ).toBe('available')
  })

  it('returns null when stored directories are unavailable', () => {
    expect(firstUsableDirectory(['missing'], () => false)).toBeNull()
  })

  it('stores a selected file parent and a selected directory itself', () => {
    const directory = path.join('root', 'folder')
    const file = path.join(directory, 'output.mp4')

    expect(directoryForDialogSelection(file, 'file')).toBe(directory)
    expect(directoryForDialogSelection(directory, 'directory')).toBe(directory)
  })

  it('combines a filename-only save default with the remembered directory', () => {
    const remembered = path.join('root', 'remembered')
    const fallback = path.join('root', 'fallback')

    expect(
      resolveSaveDialogDefaultPath('output.mp4', remembered, fallback),
    ).toBe(path.join(remembered, 'output.mp4'))
    expect(
      resolveSaveDialogDefaultPath('output.mp4', null, fallback),
    ).toBe(path.join(fallback, 'output.mp4'))
  })

  it('preserves save defaults that already include a directory', () => {
    const requested = path.join('caller', 'output.mp4')

    expect(
      resolveSaveDialogDefaultPath(requested, 'remembered', 'fallback'),
    ).toBe(requested)
  })
})
