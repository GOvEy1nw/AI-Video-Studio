import path from 'path'
import { describe, expect, it } from 'vitest'
import {
  directoryForDialogSelection,
  firstUsableDirectory,
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
})
