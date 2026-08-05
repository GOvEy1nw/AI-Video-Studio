import { ipcMain } from 'electron'
import { spawnSync } from 'child_process'
import os from 'os'
import path from 'path'
import fs from 'fs'
import { findFfmpegPath, urlToFilePath } from '../export/ffmpeg-utils'
import { getAllowedRoots } from '../config'
import { logger } from '../logger'
import { approveExactFilePath, validatePath } from '../path-validation'

export function validateVideoFrameInput(videoUrl: string, allowedRoots = getAllowedRoots()): string {
  return validatePath(urlToFilePath(videoUrl), allowedRoots)
}

export function registerVideoProcessingHandlers(): void {
  ipcMain.handle(
    'extract-video-frame',
    async (
      _event,
      videoUrl: string,
      seekTime: number,
      width?: number,
      quality?: number,
    ): Promise<{ path: string; url: string }> => {
      const inputPath = validateVideoFrameInput(videoUrl)
      const ffmpeg = findFfmpegPath()
      if (!ffmpeg) {
        throw new Error('ffmpeg not found')
      }

      if (!fs.existsSync(inputPath)) {
        throw new Error(`Video file not found: ${inputPath}`)
      }

      const outputName = `ltx_frame_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`
      const outputPath = path.join(os.tmpdir(), outputName)

      const args: string[] = [
        '-ss', String(Math.max(0, seekTime)),
        '-i', inputPath,
        ...(width ? ['-vf', `scale=${width}:-2`] : []),
        '-frames:v', '1',
        '-q:v', String(quality ?? 2),
        '-y',
        outputPath,
      ]

      logger.info(`[extract-frame] ${args.join(' ').slice(0, 300)}`)

      const result = spawnSync(ffmpeg, args, { timeout: 10000 })

      if (result.status !== 0) {
        const stderr = result.stderr?.toString().slice(-300) || ''
        throw new Error(`ffmpeg frame extraction failed (code ${result.status}): ${stderr}`)
      }

      if (!fs.existsSync(outputPath)) {
        throw new Error('ffmpeg produced no output file')
      }

      const approvedOutputPath = approveExactFilePath(outputPath)
      const fileUrl = `file://${approvedOutputPath}`
      return { path: approvedOutputPath, url: fileUrl }
    },
  )
}
