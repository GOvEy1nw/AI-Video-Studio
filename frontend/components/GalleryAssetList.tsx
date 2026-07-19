import { useMemo, useState, type DragEvent, type MouseEvent, type ReactNode } from 'react'
import { ArrowUpDown, ChevronDown, ChevronUp, Image, Layers, Music } from 'lucide-react'
import type { Asset } from '../types/project'

type SortColumn = 'name' | 'type' | 'duration' | 'resolution' | 'date' | 'color'

type ColorLabel = {
  color: string
  label: string
}

type GalleryAssetListProps = {
  assets: Asset[]
  selectedAssetIds?: Set<string>
  getAssetColorLabel?: (asset: Asset) => ColorLabel | undefined
  getThumbnailUrl?: (asset: Asset) => string | undefined
  onAssetClick?: (event: MouseEvent<HTMLDivElement>, asset: Asset) => void
  onAssetDoubleClick?: (event: MouseEvent<HTMLDivElement>, asset: Asset) => void
  onAssetContextMenu?: (event: MouseEvent<HTMLDivElement>, asset: Asset) => void
  onAssetDragStart?: (event: DragEvent<HTMLDivElement>, asset: Asset) => void
  renderActions?: (asset: Asset) => ReactNode
  actionsWidthClass?: string
}

function assetName(asset: Asset) {
  return asset.path?.split(/[/\\]/).pop() || asset.type.charAt(0).toUpperCase() + asset.type.slice(1)
}

function resolutionHeight(resolution?: string) {
  const match = resolution?.match(/(\d+)/)
  return match ? Number.parseInt(match[1], 10) : 0
}

export function GalleryAssetList({
  assets,
  selectedAssetIds = new Set(),
  getAssetColorLabel,
  getThumbnailUrl,
  onAssetClick,
  onAssetDoubleClick,
  onAssetContextMenu,
  onAssetDragStart,
  renderActions,
  actionsWidthClass = 'w-6',
}: GalleryAssetListProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const sortedAssets = useMemo(() => {
    const direction = sortDirection === 'asc' ? 1 : -1
    return [...assets].sort((left, right) => {
      switch (sortColumn) {
        case 'name':
          return direction * assetName(left).localeCompare(assetName(right))
        case 'type':
          return direction * left.type.localeCompare(right.type)
        case 'duration':
          return direction * ((left.duration ?? 0) - (right.duration ?? 0))
        case 'resolution':
          return direction * (resolutionHeight(left.resolution) - resolutionHeight(right.resolution))
        case 'date':
          return direction * (left.createdAt - right.createdAt)
        case 'color':
          return direction * (getAssetColorLabel?.(left)?.label || '').localeCompare(getAssetColorLabel?.(right)?.label || '')
      }
    })
  }, [assets, getAssetColorLabel, sortColumn, sortDirection])

  const toggleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const columns: { column: SortColumn; label: string; className: string }[] = [
    { column: 'name', label: 'Name', className: 'flex-1 min-w-0' },
    { column: 'type', label: 'Type', className: 'w-14 flex-shrink-0 text-center' },
    { column: 'duration', label: 'Duration', className: 'w-16 flex-shrink-0 text-right' },
    { column: 'resolution', label: 'Res', className: 'w-14 flex-shrink-0 text-right' },
    { column: 'date', label: 'Date', className: 'w-16 flex-shrink-0 text-right' },
    { column: 'color', label: 'Color', className: 'w-10 flex-shrink-0 text-center' },
  ]

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-1 border-b border-zinc-800 bg-zinc-900/95 px-2 py-1">
        <div className="w-2 flex-shrink-0" />
        <div className="w-8 flex-shrink-0" />
        {columns.map(({ column, label, className }) => (
          <button
            key={column}
            type="button"
            onClick={() => toggleSort(column)}
            className={`${className} flex cursor-pointer select-none items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wider transition-colors ${
              sortColumn === column ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className="truncate">{label}</span>
            {sortColumn === column ? (
              sortDirection === 'asc' ? <ChevronUp className="h-2.5 w-2.5 flex-shrink-0" /> : <ChevronDown className="h-2.5 w-2.5 flex-shrink-0" />
            ) : (
              <ArrowUpDown className="h-2.5 w-2.5 flex-shrink-0 opacity-0 group-hover:opacity-50" />
            )}
          </button>
        ))}
        <div className={`${actionsWidthClass} flex-shrink-0`} />
      </div>

      {sortedAssets.map((asset) => {
        const color = getAssetColorLabel?.(asset)
        const thumbnailUrl = getThumbnailUrl?.(asset) || asset.thumbnail
        return (
          <div
            key={asset.id}
            data-asset-card
            data-asset-id={asset.id}
            draggable={Boolean(onAssetDragStart)}
            onDragStart={(event) => onAssetDragStart?.(event, asset)}
            onClick={(event) => onAssetClick?.(event, asset)}
            onDoubleClick={(event) => onAssetDoubleClick?.(event, asset)}
            onContextMenu={(event) => onAssetContextMenu?.(event, asset)}
            className={`group flex cursor-pointer items-center gap-1 px-2 py-1 transition-all ${
              selectedAssetIds.has(asset.id)
                ? 'bg-blue-600/20 ring-1 ring-blue-500/50'
                : 'hover:bg-zinc-800/60'
            }`}
          >
            {color ? (
              <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: color.color }} />
            ) : (
              <div className="w-2 flex-shrink-0" />
            )}
            <div className="h-6 w-8 flex-shrink-0 overflow-hidden rounded bg-zinc-800">
              {asset.type === 'video' ? (
                thumbnailUrl ? <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <video src={asset.url} preload="metadata" muted playsInline className="h-full w-full object-cover" />
              ) : asset.type === 'audio' ? (
                <div className="flex h-full w-full items-center justify-center bg-emerald-900/40"><Music className="h-2.5 w-2.5 text-emerald-400" /></div>
              ) : asset.type === 'adjustment' ? (
                <div className="flex h-full w-full items-center justify-center bg-blue-900/30"><Layers className="h-2.5 w-2.5 text-blue-400" /></div>
              ) : asset.url ? (
                <img src={asset.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center"><Image className="h-2.5 w-2.5 text-zinc-500" /></div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] leading-tight text-zinc-200">{assetName(asset)}</p>
              {asset.takes && asset.takes.length > 1 && (
                <span className="text-[8px] text-blue-400">{asset.takes.length} takes</span>
              )}
            </div>
            <span className="w-14 flex-shrink-0 text-center text-[9px] font-medium uppercase text-zinc-500">{asset.type}</span>
            <span className="w-16 flex-shrink-0 text-right text-[9px] tabular-nums text-zinc-500">{asset.duration != null ? `${asset.duration.toFixed(1)}s` : '—'}</span>
            <span className="w-14 flex-shrink-0 text-right text-[9px] text-zinc-500">{asset.resolution || '—'}</span>
            <span className="w-16 flex-shrink-0 text-right text-[9px] text-zinc-500">{new Date(asset.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            <div className="flex w-10 flex-shrink-0 items-center justify-center">
              {color ? <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color.color }} title={color.label} /> : <span className="text-[9px] text-zinc-600">—</span>}
            </div>
            <div className={`${actionsWidthClass} flex flex-shrink-0 items-center justify-end`}>{renderActions?.(asset)}</div>
          </div>
        )
      })}
    </div>
  )
}
