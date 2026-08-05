import fs from 'fs'
import os from 'os'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { searchDirectoryForFiles } from './directory-search'

describe('searchDirectoryForFiles', () => {
  it('keeps prior depth-first duplicate-name selection', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aivs-directory-search-'))
    const nested = path.join(root, 'a')
    fs.mkdirSync(nested)
    fs.writeFileSync(path.join(nested, 'target.mp4'), 'nested')
    fs.writeFileSync(path.join(root, 'target.mp4'), 'root')

    const matches = await searchDirectoryForFiles(root, ['target.mp4'])

    expect(matches['target.mp4']).toBe(path.join(nested, 'target.mp4'))
    fs.rmSync(root, { recursive: true, force: true })
  })
})
