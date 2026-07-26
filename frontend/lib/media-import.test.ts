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
        importToProjectAssets,
      } as unknown as Window['electronAPI'],
    })
    const file = new File(['png'], 'drag-gallery.png', { type: 'image/png' })
    Object.defineProperty(file, 'path', { value: filePath })

    const outcome = await importGalleryFile('project', file)

    expect(outcome.ok).toBe(true)
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
})
