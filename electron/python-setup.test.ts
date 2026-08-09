import { describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({
  app: {
    getPath: () => 'C:\\missing-aivs-test-state',
  },
}))

import { getModelPacks } from './python-setup'

describe('Model Manager catalog', () => {
  it('exposes the backend-owned MMAudio pack', () => {
    expect(getModelPacks()).toContainEqual({
      id: 'mmaudio',
      name: 'MMAudio Sound Effects',
      estimatedSize: '13.9 GB',
      installed: false,
      modelType: 'mmaudio',
      mediaTypes: ['audio'],
      features: ['generate'],
    })
  })
})
