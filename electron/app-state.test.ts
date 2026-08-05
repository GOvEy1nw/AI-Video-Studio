import { describe, expect, it } from 'vitest'
import { resolveApprovedExternalFilePaths, resolveProjectAssetsPathStatus, resolveTrustedCustomModelPath } from './app-state'

const trustToken = 'main-created-token'

describe('project assets root trust migration', () => {
  it('quarantines a legacy root without deleting its recovery value', () => {
    const legacyPath = 'C:\\Users\\rais\\CustomAiVS'
    const state = { projectAssetsPath: legacyPath }

    expect(resolveProjectAssetsPathStatus(state, 'C:\\Users\\rais\\Documents\\AiVS', trustToken)).toEqual({
      path: 'C:\\Users\\rais\\Documents\\AiVS',
      needsReselection: true,
      legacyPath,
    })
    expect(state.projectAssetsPath).toBe(legacyPath)
  })

  it('uses a root selected by the trusted native picker', () => {
    expect(resolveProjectAssetsPathStatus({
      projectAssetsPath: 'C:\\Users\\rais\\CustomAiVS',
      projectAssetsPathTrustVersion: 1,
      projectAssetsPathTrustToken: trustToken,
    }, 'C:\\Users\\rais\\Documents\\AiVS', trustToken)).toEqual({
      path: 'C:\\Users\\rais\\CustomAiVS',
      needsReselection: false,
      legacyPath: undefined,
    })
  })

  it('rejects poisoned pre-hardening root and exact-file trust fields', () => {
    const poisonedState = {
      projectAssetsPath: 'C:\\poisoned-root',
      projectAssetsPathTrustVersion: 1 as const,
      projectAssetsPathTrustToken: 'renderer-forged-token',
      approvedExternalFilePaths: ['C:\\private\\secret.mp4'],
      approvedExternalFilePathsTrustToken: 'renderer-forged-token',
      checkpointsPath: 'C:\\Windows',
      checkpointsPathTrustToken: 'renderer-forged-token',
      lorasPath: 'C:\\private',
      lorasPathTrustToken: 'renderer-forged-token',
    }

    expect(resolveProjectAssetsPathStatus(
      poisonedState,
      'C:\\Users\\rais\\Documents\\AiVS',
      trustToken,
    )).toMatchObject({
      path: 'C:\\Users\\rais\\Documents\\AiVS',
      needsReselection: true,
      legacyPath: 'C:\\poisoned-root',
    })
    expect(resolveApprovedExternalFilePaths(poisonedState, trustToken)).toEqual([])
    expect(resolveTrustedCustomModelPath(
      poisonedState.checkpointsPath,
      poisonedState.checkpointsPathTrustToken,
      trustToken,
    )).toBeNull()
    expect(resolveTrustedCustomModelPath(
      poisonedState.lorasPath,
      poisonedState.lorasPathTrustToken,
      trustToken,
    )).toBeNull()
  })
})
