import { LayoutGrid, List } from 'lucide-react'

export type GalleryGridColumns = 1 | 2 | 3 | 4

type GalleryViewControlsProps = {
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  gridColumns: GalleryGridColumns
  onGridColumnsChange: (columns: GalleryGridColumns) => void
}

export function GalleryViewControls({
  viewMode,
  onViewModeChange,
  gridColumns,
  onGridColumnsChange,
}: GalleryViewControlsProps) {
  const buttonClass = (active: boolean) =>
    `rounded p-1.5 transition-colors ${
      active
        ? 'bg-zinc-700 text-white'
        : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
    }`

  return (
    <div className="flex shrink-0 items-center gap-1.5">
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
          min={1}
          max={4}
          step={1}
          value={5 - gridColumns}
          onChange={(event) =>
            onGridColumnsChange(
              (5 - Number(event.target.value)) as GalleryGridColumns,
            )
          }
          className="h-1 w-20 cursor-pointer accent-blue-500"
          aria-label="Grid columns"
          aria-valuetext={`${gridColumns} ${
            gridColumns === 1 ? 'column' : 'columns'
          }`}
          title={`${gridColumns} ${gridColumns === 1 ? 'column' : 'columns'}`}
        />
      )}
    </div>
  )
}
