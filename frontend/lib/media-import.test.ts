import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Asset } from '../types/project'
import {
  ensureGalleryAssetForInputFile,
  filePathToFileUrl,
  importGalleryFile,
} from './media-import'

type FileImportElectronAPI = Pick<
  NonNullable<Window['electronAPI']>,
  'approveLocalPath' | 'getPathForFile' | 'importToProjectAssets'
>

const originalCreateObjectURL = Object.getOwnPropertyDescriptor(
  URL,
  'createObjectURL',
)

function setElectronAPI(api: FileImportElectronAPI): void {
  Object.defineProperty(window, 'electronAPI', {
    configurable: true,
    value: api,
  })
}

afterEach(() => {
  Object.defineProperty(window, 'electronAPI', {
    configurable: true,
    value: undefined,
  })
  if (originalCreateObjectURL) {
    Object.defineProperty(URL, 'createObjectURL', originalCreateObjectURL)
  } else {
    Reflect.deleteProperty(URL, 'createObjectURL')
  }
})

describe('importGalleryFile', () => {
  it('approves a user-dropped path before importing it', async () => {
    const filePath = 'C:\\tmp\\drag-gallery.png'
    const approveLocalPath = vi.fn().mockResolvedValue(true)
    const getPathForFile = vi.fn().mockReturnValue(filePath)
    const importToProjectAssets = vi.fn().mockResolvedValue({
      success: true,
      path: 'C:\\Users\\rais\\Documents\\AiVS\\project\\uploads\\drag-gallery.png',
      url: 'file:///C:/Users/rais/Documents/AiVS/project/uploads/drag-gallery.png',
      fileName: 'drag-gallery.png',
    })
    setElectronAPI({
      approveLocalPath,
      getPathForFile,
      importToProjectAssets,
    })
    const file = new File(['png'], 'drag-gallery.png', { type: 'image/png' })

    const outcome = await importGalleryFile('project', file)

    expect(outcome.ok).toBe(true)
    expect(getPathForFile).toHaveBeenCalledWith(file)
    expect(approveLocalPath).toHaveBeenCalledWith(filePath)
    expect(importToProjectAssets).toHaveBeenCalledWith({
      srcPath: filePath,
      projectId: 'project',
      onDuplicate: 'prompt',
    })
    expect(approveLocalPath.mock.invocationCallOrder[0]).toBeLessThan(
      importToProjectAssets.mock.invocationCallOrder[0],
    )
  })

  it('returns no-path only when the preload bridge has no native path', async () => {
    const approveLocalPath = vi.fn()
    const importToProjectAssets = vi.fn()
    setElectronAPI({
      approveLocalPath,
      getPathForFile: () => '',
      importToProjectAssets,
    })
    const file = new File(['png'], 'drag-gallery.png', { type: 'image/png' })

    await expect(importGalleryFile('project', file)).resolves.toEqual({
      ok: false,
      reason: 'no-path',
    })
    expect(approveLocalPath).not.toHaveBeenCalled()
    expect(importToProjectAssets).not.toHaveBeenCalled()
  })

  it('rejects unsupported media before path approval or import', async () => {
    const approveLocalPath = vi.fn()
    const importToProjectAssets = vi.fn()
    setElectronAPI({
      approveLocalPath,
      getPathForFile: () => 'C:\\tmp\\notes.txt',
      importToProjectAssets,
    })
    const file = new File(['text'], 'notes.txt', { type: 'text/plain' })

    await expect(importGalleryFile('project', file)).resolves.toEqual({
      ok: false,
      reason: 'unsupported',
    })
    expect(approveLocalPath).not.toHaveBeenCalled()
    expect(importToProjectAssets).not.toHaveBeenCalled()
  })

  it.each(['reuse', 'suffix'] as const)(
    'retries duplicate imports with the %s choice',
    async (choice) => {
      const filePath = 'C:\\tmp\\duplicate.png'
      const importToProjectAssets = vi
        .fn()
        .mockResolvedValueOnce({
          success: true,
          path: 'C:\\project\\uploads\\duplicate.png',
          url: 'file:///C:/project/uploads/duplicate.png',
          fileName: 'duplicate.png',
          needsDuplicateChoice: true,
        })
        .mockResolvedValueOnce({
          success: true,
          path: `C:\\project\\uploads\\${choice === 'reuse' ? 'duplicate' : 'duplicate (1)'}.png`,
          url: `file:///C:/project/uploads/${choice === 'reuse' ? 'duplicate' : 'duplicate%20(1)'}.png`,
          fileName: choice === 'reuse' ? 'duplicate.png' : 'duplicate (1).png',
          reusedExisting: choice === 'reuse',
        })
      const resolveDuplicate = vi.fn().mockResolvedValue(choice)
      setElectronAPI({
        approveLocalPath: vi.fn().mockResolvedValue(true),
        getPathForFile: () => filePath,
        importToProjectAssets,
      })
      const file = new File(['png'], 'duplicate.png', { type: 'image/png' })

      const outcome = await importGalleryFile(
        'project',
        file,
        resolveDuplicate,
      )

      expect(outcome.ok).toBe(true)
      expect(resolveDuplicate).toHaveBeenCalledWith('duplicate.png')
      expect(importToProjectAssets).toHaveBeenNthCalledWith(1, {
        srcPath: filePath,
        projectId: 'project',
        onDuplicate: 'prompt',
      })
      expect(importToProjectAssets).toHaveBeenNthCalledWith(2, {
        srcPath: filePath,
        projectId: 'project',
        onDuplicate: choice,
      })
    },
  )

  it('does not retry a duplicate import after cancellation', async () => {
    const importToProjectAssets = vi.fn().mockResolvedValue({
      success: true,
      path: 'C:\\project\\uploads\\duplicate.png',
      url: 'file:///C:/project/uploads/duplicate.png',
      fileName: 'duplicate.png',
      needsDuplicateChoice: true,
    })
    setElectronAPI({
      approveLocalPath: vi.fn().mockResolvedValue(true),
      getPathForFile: () => 'C:\\tmp\\duplicate.png',
      importToProjectAssets,
    })
    const file = new File(['png'], 'duplicate.png', { type: 'image/png' })

    await expect(
      importGalleryFile('project', file, async () => 'cancel'),
    ).resolves.toEqual({
      ok: false,
      reason: 'cancelled',
    })
    expect(importToProjectAssets).toHaveBeenCalledOnce()
  })
})

describe('ensureGalleryAssetForInputFile', () => {
  it('reuses an existing project asset by native path without copying', async () => {
    const filePath = 'C:\\project\\uploads\\existing.png'
    const importToProjectAssets = vi.fn()
    setElectronAPI({
      approveLocalPath: vi.fn(),
      getPathForFile: () => filePath,
      importToProjectAssets,
    })
    const existingAsset: Asset = {
      id: 'existing',
      type: 'image',
      path: filePath,
      url: 'file:///C:/project/uploads/existing.png',
      prompt: '',
      resolution: '',
      createdAt: 1,
      source: 'uploaded',
    }
    const addAsset = vi.fn()

    await expect(
      ensureGalleryAssetForInputFile(
        'project',
        new File(['png'], 'existing.png', { type: 'image/png' }),
        [existingAsset],
        addAsset,
      ),
    ).resolves.toBe(existingAsset.url)
    expect(importToProjectAssets).not.toHaveBeenCalled()
    expect(addAsset).not.toHaveBeenCalled()
  })

  it('uses an owned object URL for a browser-only File', async () => {
    const createObjectURL = vi.fn(() => 'blob:browser-file')
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    })
    setElectronAPI({
      approveLocalPath: vi.fn(),
      getPathForFile: () => '',
      importToProjectAssets: vi.fn(),
    })
    const file = new File(['png'], 'browser.png', { type: 'image/png' })

    await expect(
      ensureGalleryAssetForInputFile('project', file, [], vi.fn()),
    ).resolves.toBe('blob:browser-file')
    expect(createObjectURL).toHaveBeenCalledWith(file)
  })
})

describe('filePathToFileUrl', () => {
  it('converts a Windows path to a file URL', () => {
    expect(filePathToFileUrl('C:\\project\\uploads\\image.png')).toBe(
      'file:///C:/project/uploads/image.png',
    )
  })
})
