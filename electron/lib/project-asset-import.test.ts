import fs from 'fs'
import * as fsPromises from 'fs/promises'
import os from 'os'
import path from 'path'
import { describe, expect, it, vi } from 'vitest'
import { importProjectAsset, projectAssetCategoryDir, transferFile, validateProjectId } from './project-asset-import'

describe('project asset path boundary', () => {
  it('keeps valid project category directories below the assets root', () => {
    const root = path.resolve('C:\\projects\\AiVS')
    const destination = projectAssetCategoryDir(root, 'project-123', 'uploads')

    expect(path.relative(root, destination).startsWith('..')).toBe(false)
    expect(destination).toBe(path.resolve(root, 'project-123', 'uploads'))
  })

  it.each(['', '.', '..', '../escape', 'nested/project', 'C:\\escape', 'project name', 'project.name'])('rejects unsafe project ID %j', (projectId) => {
    expect(() => validateProjectId(projectId)).toThrow('Invalid project ID')
  })

  it('rejects a project directory junction that escapes the assets root', () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'aivs-project-'))
    const root = path.join(base, 'assets')
    const external = path.join(base, 'external')
    fs.mkdirSync(root)
    fs.mkdirSync(external)
    fs.symlinkSync(external, path.join(root, 'project-123'), process.platform === 'win32' ? 'junction' : 'dir')

    expect(() => projectAssetCategoryDir(root, 'project-123', 'uploads')).toThrow('outside the project root')
    fs.rmSync(base, { recursive: true, force: true })
  })
})

describe('project asset import', () => {
  it('preserves duplicate strategies through asynchronous production import', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aivs-project-import-'))
    const source = path.join(root, 'source.mp4')
    const destination = path.join(root, 'uploads')
    fs.writeFileSync(source, 'first')

    const initial = await importProjectAsset(source, destination, 'suffix')
    const suffixed = await importProjectAsset(source, destination, 'suffix')
    const reused = await importProjectAsset(source, destination, 'reuse')
    const prompt = await importProjectAsset(source, destination, 'prompt')
    fs.writeFileSync(source, 'replacement')
    const overwritten = await importProjectAsset(source, destination, 'overwrite')

    expect(initial.fileName).toBe('source.mp4')
    expect(suffixed.fileName).toBe('source (2).mp4')
    expect(reused.reusedExisting).toBe(true)
    expect(prompt.needsDuplicateChoice).toBe(true)
    expect(fs.readFileSync(overwritten.destPath, 'utf8')).toBe('replacement')
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('serializes concurrent suffix imports into distinct destinations', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aivs-project-concurrent-import-'))
    const firstSourceDir = path.join(root, 'first')
    const secondSourceDir = path.join(root, 'second')
    const destination = path.join(root, 'uploads')
    fs.mkdirSync(firstSourceDir)
    fs.mkdirSync(secondSourceDir)
    const firstSource = path.join(firstSourceDir, 'same.mp4')
    const secondSource = path.join(secondSourceDir, 'same.mp4')
    fs.writeFileSync(firstSource, 'first')
    fs.writeFileSync(secondSource, 'second')

    const imported = await Promise.all([
      importProjectAsset(firstSource, destination, 'suffix'),
      importProjectAsset(secondSource, destination, 'suffix'),
    ])

    expect(new Set(imported.map((result) => result.fileName))).toEqual(new Set(['same.mp4', 'same (2).mp4']))
    expect(new Set(imported.map((result) => fs.readFileSync(result.destPath, 'utf8')))).toEqual(new Set(['first', 'second']))
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('falls back to copy and unlink when a move crosses devices', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aivs-project-move-'))
    const source = path.join(root, 'source.mp4')
    const destination = path.join(root, 'generated')
    fs.writeFileSync(source, 'video')
    fs.mkdirSync(destination)
    await transferFile(source, path.join(destination, 'source.mp4'), 'move', {
      copyFile: fsPromises.copyFile,
      unlink: fsPromises.unlink,
      rename: vi.fn().mockRejectedValue(Object.assign(new Error('cross-device'), { code: 'EXDEV' })),
    })

    expect(fs.existsSync(source)).toBe(false)
    expect(fs.readFileSync(path.join(destination, 'source.mp4'), 'utf8')).toBe('video')
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('stages a same-named source without overwriting existing project media', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aivs-project-stage-'))
    const existingDir = path.join(root, 'existing')
    const sourceDir = path.join(root, 'source')
    const destination = path.join(root, 'generated')
    fs.mkdirSync(existingDir)
    fs.mkdirSync(sourceDir)
    const existing = path.join(destination, 'beth.png')
    const source = path.join(sourceDir, 'beth.png')
    fs.mkdirSync(destination)
    fs.writeFileSync(existing, 'project-original')
    fs.writeFileSync(source, 'library-copy')

    const staged = await importProjectAsset(source, destination, 'suffix', 'copy')

    expect(staged.destPath).not.toBe(existing)
    expect(fs.readFileSync(existing, 'utf8')).toBe('project-original')
    expect(fs.readFileSync(staged.destPath, 'utf8')).toBe('library-copy')
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('retries a transient Windows move failure', async () => {
    const rename = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(Object.assign(new Error('locked'), { code: 'EPERM' }))
      .mockResolvedValueOnce(undefined)

    await transferFile('C:\\staging\\output.mp4', 'C:\\project\\generated\\output.mp4', 'move', {
      copyFile: vi.fn(),
      unlink: vi.fn(),
      rename,
    })

    expect(rename).toHaveBeenCalledTimes(2)
  })

  it('restores an existing destination when an overwrite move fails', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aivs-project-restore-'))
    const source = path.join(root, 'source.mp4')
    const destination = path.join(root, 'generated.mp4')
    fs.writeFileSync(source, 'new')
    fs.writeFileSync(destination, 'existing')

    const rename = vi.fn(async (from: string, to: string) => {
      if (from === source) {
        throw Object.assign(new Error('rename failed'), { code: 'EIO' })
      }
      await fsPromises.rename(from, to)
    })

    await expect(transferFile(source, destination, 'move', {
      copyFile: fsPromises.copyFile,
      unlink: fsPromises.unlink,
      rename,
    })).rejects.toThrow('rename failed')

    expect(fs.readFileSync(destination, 'utf8')).toBe('existing')
    expect(fs.readFileSync(source, 'utf8')).toBe('new')
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('keeps a successful overwrite when backup cleanup fails', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aivs-project-cleanup-'))
    const source = path.join(root, 'source.mp4')
    const destination = path.join(root, 'generated.mp4')
    fs.writeFileSync(source, 'new')
    fs.writeFileSync(destination, 'existing')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    await transferFile(source, destination, 'move', {
      copyFile: fsPromises.copyFile,
      rename: fsPromises.rename,
      unlink: vi.fn(async (filePath: string) => {
        if (filePath.includes('.aivs-backup')) {
          throw Object.assign(new Error('cleanup failed'), { code: 'EIO' })
        }
        await fsPromises.unlink(filePath)
      }),
    })

    expect(fs.readFileSync(destination, 'utf8')).toBe('new')
    expect(fs.existsSync(source)).toBe(false)
    expect(fs.readdirSync(root).some((fileName) => fileName.includes('.aivs-backup'))).toBe(true)
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
    fs.rmSync(root, { recursive: true, force: true })
  })
})
