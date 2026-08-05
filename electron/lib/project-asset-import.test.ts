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
})
