import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({
  app: {
    getPath: () => 'C:\\missing-aivs-test-state',
  },
}))

import { getModelPacks, migrateLegacyModelDirectories } from './python-setup'

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) fs.rmSync(directory, { recursive: true, force: true })
})

describe('Model Manager catalog', () => {
  it('exposes LTX 2.5 Base and Turbo packs on the same checkpoint', () => {
    expect(getModelPacks()).toContainEqual({
      id: 'ltx2_base',
      name: 'LTX 2.5 Base',
      estimatedSize: '',
      installed: false,
      modelType: 'ltx2_25_22B',
      groupId: 'ltx2_25',
      groupName: 'LTX 2.5',
      variantName: 'Base',
      mediaTypes: ['video'],
      features: ['generate', 'reframe'],
    })
    expect(getModelPacks()).toContainEqual({
      id: 'ltx2_turbo',
      name: 'LTX 2.5 Turbo',
      estimatedSize: '',
      installed: false,
      modelType: 'ltx2_25_22B',
      groupId: 'ltx2_25',
      groupName: 'LTX 2.5',
      variantName: 'Turbo',
      mediaTypes: ['video'],
      features: ['generate', 'reframe'],
    })
  })

  it('exposes the backend-owned MMAudio pack', () => {
    expect(getModelPacks()).toContainEqual({
      id: 'mmaudio',
      name: 'MMAudio Sound Effects',
      estimatedSize: '~10.7 GB',
      installed: false,
      modelType: 'mmaudio',
      mediaTypes: ['audio'],
      features: ['generate'],
    })
  })
})

describe('legacy model migration', () => {
  it('moves legacy packaged defaults without overwriting collisions', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aivs-model-migration-'))
    temporaryDirectories.push(root)
    const legacy = path.join(root, 'legacy')
    const models = path.join(root, 'models')
    fs.mkdirSync(path.join(legacy, 'ckpts', 'nested'), { recursive: true })
    fs.mkdirSync(path.join(legacy, 'loras'), { recursive: true })
    fs.mkdirSync(path.join(models, 'checkpoints'), { recursive: true })
    fs.writeFileSync(path.join(legacy, 'ckpts', 'nested', 'moved.safetensors'), 'legacy')
    fs.writeFileSync(path.join(legacy, 'ckpts', 'collision.safetensors'), 'legacy')
    fs.writeFileSync(path.join(models, 'checkpoints', 'collision.safetensors'), 'new')
    fs.writeFileSync(path.join(legacy, 'loras', 'voice.safetensors'), 'lora')

    migrateLegacyModelDirectories(legacy, models)
    migrateLegacyModelDirectories(legacy, models)

    expect(fs.readFileSync(path.join(models, 'checkpoints', 'nested', 'moved.safetensors'), 'utf8')).toBe('legacy')
    expect(fs.readFileSync(path.join(models, 'checkpoints', 'collision.safetensors'), 'utf8')).toBe('new')
    expect(fs.existsSync(path.join(legacy, 'ckpts', 'collision.safetensors'))).toBe(true)
    expect(fs.readFileSync(path.join(models, 'loras', 'voice.safetensors'), 'utf8')).toBe('lora')
  })
})
