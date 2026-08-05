import fs from 'fs'
import os from 'os'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { approveDirectorySubtree, approveExactFilePath, approveExactWritePath, filterMatchingCanonicalPaths, validateExactWritePath, validatePath } from './path-validation'

describe('path validation approvals', () => {
  it('allows an approved external file but not its sibling or child paths', () => {
    const root = path.resolve('C:\\AiVS')
    const approvedFile = path.resolve('C:\\external\\clip.mp4')
    approveExactFilePath(approvedFile)

    expect(validatePath(approvedFile, [root])).toBe(approvedFile)
    expect(() => validatePath(path.resolve('C:\\external\\other.mp4'), [root])).toThrow('Path not allowed')
    expect(() => validatePath(path.resolve('C:\\external\\clip.mp4\\child'), [root])).toThrow('Path not allowed')
  })

  it('allows a native-approved directory subtree', () => {
    const root = path.resolve('C:\\AiVS')
    const directory = path.resolve('C:\\external\\search')
    approveDirectorySubtree(directory)

    expect(validatePath(path.join(directory, 'nested', 'clip.mp4'), [root])).toBe(path.join(directory, 'nested', 'clip.mp4'))
  })

  it('requires an exact native output approval for writes', () => {
    const output = path.resolve('C:\\exports\\video.mp4')
    expect(() => validateExactWritePath(output)).toThrow('Path not approved for writing')
    approveExactWritePath(output)
    expect(validateExactWritePath(output)).toBe(output)
    expect(() => validateExactWritePath(path.resolve('C:\\exports\\sibling.mp4'))).toThrow('Path not approved for writing')
  })

  it('rejects a symlink escape beneath an allowed root', () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'aivs-path-'))
    const allowed = path.join(base, 'allowed')
    const external = path.join(base, 'external')
    const link = path.join(allowed, 'escape')
    fs.mkdirSync(allowed)
    fs.mkdirSync(external)
    fs.writeFileSync(path.join(external, 'secret.txt'), 'secret')
    fs.symlinkSync(external, link, process.platform === 'win32' ? 'junction' : 'dir')

    expect(() => validatePath(path.join(link, 'secret.txt'), [allowed])).toThrow('Path not allowed')
    fs.rmSync(base, { recursive: true, force: true })
  })

  it('only restores native-picker files already referenced by a project', () => {
    const candidate = path.resolve('C:\\external\\project-clip.mp4')
    const other = path.resolve('C:\\external\\unrelated.mp4')

    expect(filterMatchingCanonicalPaths([candidate], [candidate, other])).toEqual([candidate])
  })
})
