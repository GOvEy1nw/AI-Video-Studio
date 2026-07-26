import { afterEach, describe, expect, it, vi } from 'vitest'
import { importGalleryFile } from './media-import'

afterEach(() => {
  Object.defineProperty(window, 'electronAPI', {
    configurable: true,
    value: undefined,
  })
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
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      value: {
        approveLocalPath,
        getPathForFile,
        importToProjectAssets,
      } as unknown as Window['electronAPI'],
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

  it('rejects unsupported media before path approval or import', async () => {
    const approveLocalPath = vi.fn()
    const importToProjectAssets = vi.fn()
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      value: {
        approveLocalPath,
        getPathForFile: () => 'C:\\tmp\\notes.txt',
        importToProjectAssets,
      } as unknown as Window['electronAPI'],
    })
    const file = new File(['text'], 'notes.txt', { type: 'text/plain' })

    await expect(importGalleryFile('project', file)).resolves.toEqual({
      ok: false,
      reason: 'unsupported',
    })
    expect(approveLocalPath).not.toHaveBeenCalled()
    expect(importToProjectAssets).not.toHaveBeenCalled()
  })
})
