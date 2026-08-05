import fs from 'fs'
import os from 'os'
import path from 'path'
import { describe, expect, it, vi } from 'vitest'
import { ipcMain } from 'electron'
import { spawnSync } from 'child_process'
import { findFfmpegPath } from '../export/ffmpeg-utils'
import { approveExactFilePath, validatePath } from '../path-validation'
import { registerVideoProcessingHandlers, validateVideoFrameInput } from './video-processing-handlers'

vi.mock('electron', () => ({
  app: { isPackaged: false, getPath: () => '' },
  ipcMain: { handle: vi.fn() },
}))

vi.mock('child_process', () => {
  const spawnSync = vi.fn()
  return { default: { spawnSync }, spawnSync }
})

vi.mock('../export/ffmpeg-utils', () => ({
  findFfmpegPath: vi.fn(),
  urlToFilePath: vi.fn((value: string) => value),
}))

vi.mock('../config', () => ({ getAllowedRoots: vi.fn(() => []) }))

describe('video frame extraction path boundary', () => {
  it('rejects an unapproved renderer-controlled OS temp input path', () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'aivs-frame-input-'))
    const allowed = path.join(base, 'allowed')
    const external = path.join(base, 'external')
    fs.mkdirSync(allowed)
    fs.mkdirSync(external)
    const externalVideo = path.join(external, 'private.mp4')
    fs.writeFileSync(externalVideo, 'not-a-video')

    try {
      expect(() => validateVideoFrameInput(externalVideo, [allowed])).toThrow('Path not allowed')
    } finally {
      fs.rmSync(base, { recursive: true, force: true })
    }
  })

  it('exact-approves a successful OS temp frame output before returning it', async () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'aivs-frame-output-'))
    const inputPath = path.join(base, 'input.mp4')
    fs.writeFileSync(inputPath, 'not-a-video')
    approveExactFilePath(inputPath)
    vi.mocked(findFfmpegPath).mockReturnValue('ffmpeg')
    vi.mocked(spawnSync).mockImplementation((_command, args) => {
      const outputPath = String(args.at(-1))
      fs.writeFileSync(outputPath, 'frame')
      return {
        pid: 1,
        output: [null, Buffer.alloc(0), Buffer.alloc(0)],
        stdout: Buffer.alloc(0),
        stderr: Buffer.alloc(0),
        status: 0,
        signal: null,
      }
    })

    try {
      registerVideoProcessingHandlers()
      const registration = vi.mocked(ipcMain.handle).mock.calls.find(([channel]) => channel === 'extract-video-frame')
      expect(registration).toBeDefined()
      const handler = registration?.[1]
      const result = await handler?.({}, inputPath, 0)

      expect(result).toBeDefined()
      expect(validatePath(result?.path ?? '', [])).toBe(result?.path)
    } finally {
      fs.rmSync(base, { recursive: true, force: true })
    }
  })
})
