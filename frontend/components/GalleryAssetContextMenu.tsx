import { useEffect, useRef } from 'react'
import { Folder, FolderPlus, X } from 'lucide-react'
import type { Asset } from '../types/project'

export type GalleryAssetContextMenuState = {
  asset: Asset
  x: number
  y: number
}

type GalleryAssetContextMenuProps = {
  menu: GalleryAssetContextMenuState
  bins: string[]
  onClose: () => void
  onAssignBin: (bin: string | undefined) => void
  onCreateBin: (name: string) => void
}

export function GalleryAssetContextMenu({
  menu,
  bins,
  onClose,
  onAssignBin,
  onCreateBin,
}: GalleryAssetContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const currentBin = menu.asset.bin

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className="fixed z-[60] min-w-[180px] rounded-xl border border-zinc-700 bg-zinc-800 py-1.5 text-xs shadow-2xl"
      style={{ left: menu.x, top: menu.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Move to Bin
      </div>

      {currentBin && (
        <button
          type="button"
          onClick={() => {
            onAssignBin(undefined)
            onClose()
          }}
          className="flex w-full items-center gap-3 px-3 py-1.5 text-zinc-300 hover:bg-zinc-700"
        >
          <X className="h-3.5 w-3.5 text-zinc-500" />
          <span>Remove from Bin</span>
        </button>
      )}

      {bins.map((bin) => (
        <button
          key={bin}
          type="button"
          onClick={() => {
            onAssignBin(bin)
            onClose()
          }}
          className={`flex w-full items-center gap-3 px-3 py-1.5 hover:bg-zinc-700 ${
            currentBin === bin ? 'text-blue-300' : 'text-zinc-300'
          }`}
        >
          <Folder className="h-3.5 w-3.5 text-zinc-500" />
          <span>{bin}</span>
        </button>
      ))}

      <button
        type="button"
        onClick={() => {
          const name = prompt('New bin name:')
          if (name?.trim()) {
            onCreateBin(name.trim())
          }
          onClose()
        }}
        className="flex w-full items-center gap-3 px-3 py-1.5 text-zinc-300 hover:bg-zinc-700"
      >
        <FolderPlus className="h-3.5 w-3.5 text-zinc-500" />
        <span>New Bin...</span>
      </button>
    </div>
  )
}
