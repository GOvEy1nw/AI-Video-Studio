import os from 'os'
import path from 'path'
import { describe, expect, it, vi } from 'vitest'

const mockedPaths = vi.hoisted(() => ({
  userData: process.platform === 'win32' ? 'C:\\Users\\Test\\AppData\\Local\\AiVS' : '/var/tmp/aivs-user-data',
  projectAssets: process.platform === 'win32' ? 'C:\\Users\\Test\\Documents\\AiVS' : '/var/tmp/aivs-projects',
}))

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    getPath: (name: string) => name === 'userData' ? mockedPaths.userData : '',
  },
}))

vi.mock('./app-state', () => ({
  getProjectAssetsPath: () => mockedPaths.projectAssets,
}))

import { getAllowedRoots } from './config'

describe('renderer filesystem roots', () => {
  it('allows app-owned backend outputs without granting the OS temp directory', () => {
    const roots = getAllowedRoots()

    expect(roots).toContain(path.join(mockedPaths.userData, 'outputs'))
    expect(roots).toContain(mockedPaths.projectAssets)
    expect(roots).not.toContain(os.tmpdir())
  })
})
