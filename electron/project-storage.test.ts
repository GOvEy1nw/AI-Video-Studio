import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const userDataPath = vi.hoisted(() => {
  const nodeFs = require('fs') as typeof import('fs')
  const nodeOs = require('os') as typeof import('os')
  const nodePath = require('path') as typeof import('path')
  return nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), 'aivs-project-storage-'))
})

vi.mock('electron', () => ({
  app: { getPath: () => userDataPath },
}))

import { deleteStoredProject, loadStoredProjects, saveStoredProject } from './project-storage'

afterEach(() => {
  fs.rmSync(userDataPath, { recursive: true, force: true })
  fs.mkdirSync(userDataPath, { recursive: true })
})

describe('project storage', () => {
  it('serializes concurrent index mutations and reloads remaining projects in index order', async () => {
    const project = (id: string) => ({ id, name: id })

    await Promise.all([
      saveStoredProject(project('a'), 0),
      saveStoredProject(project('b'), 1),
      saveStoredProject(project('c'), 1),
      deleteStoredProject('c'),
    ])

    await expect(loadStoredProjects()).resolves.toEqual([project('a'), project('b')])
    const storageDir = path.join(userDataPath, 'projects')
    expect(fs.existsSync(path.join(storageDir, 'c.json'))).toBe(false)
    expect(fs.readFileSync(path.join(storageDir, 'index.json'), 'utf8')).not.toContain('\n')
  })
})
