import { LayoutGrid, List } from 'lucide-react'

type GalleryViewControlsProps = {
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  cardSize: number
  onCardSizeChange: (size: number) => void
  min?: number
  max?: number
}

export function GalleryViewControls({
  viewMode,
  onViewModeChange,
  cardSize,
  onCardSizeChange,
  min = 120,
  max = 360,
}: GalleryViewControlsProps) {
  const buttonClass = (active: boolean) =>
    `rounded p-1.5 transition-colors ${
      active
        ? 'bg-zinc-700 text-white'
        : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
    }`

  return (
    <div className="flex flex-shrink-0 items-center gap-1.5">
      <div className="flex rounded-lg bg-zinc-900 p-0.5">
        <button
          type="button"
          onClick={() => onViewModeChange('grid')}
          className={buttonClass(viewMode === 'grid')}
          aria-label="Grid view"
          title="Grid view"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('list')}
          className={buttonClass(viewMode === 'list')}
          aria-label="List view"
          title="List view"
        >
          <List className="h-3.5 w-3.5" />
        </button>
      </div>
      {viewMode === 'grid' && (
        <input
          type="range"
          min={min}
          max={max}
          step={8}
          value={cardSize}
          onChange={(event) => onCardSizeChange(Number(event.target.value))}
          className="h-1 w-20 cursor-pointer accent-blue-500"
          aria-label="Grid card size"
          title="Grid card size"
        />
      )}
    </div>
  )
}
