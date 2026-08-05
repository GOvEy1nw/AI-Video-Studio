import fs from 'fs'
import os from 'os'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { projectAssetCategoryDir, validateProjectId } from './project-asset-import'

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
