import fs from 'fs'
import os from 'os'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { approveDirectorySubtree } from '../path-validation'
import { validateModelFolderSelection } from './model-folder-selection'

describe('model folder selection boundary', () => {
  it('requires a native-approved directory capability', () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'aivs-model-folder-'))
    const selected = path.join(base, 'selected')
    const arbitrary = path.join(base, 'arbitrary')
    fs.mkdirSync(selected)
    fs.mkdirSync(arbitrary)

    try {
      expect(() => validateModelFolderSelection(arbitrary)).toThrow('Path not allowed')
      approveDirectorySubtree(selected)
      expect(validateModelFolderSelection(selected)).toBe(fs.realpathSync.native(selected))
      expect(validateModelFolderSelection(null)).toBeNull()
    } finally {
      fs.rmSync(base, { recursive: true, force: true })
    }
  })
})
