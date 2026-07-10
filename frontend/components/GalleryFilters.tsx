import { useEffect, useRef, useState } from 'react'
import { ListFilter } from 'lucide-react'
import {
  GALLERY_SOURCE_OPTIONS,
  GALLERY_TYPE_OPTIONS,
  isGalleryFilterActive,
  toggleGalleryFilterValue,
  type GalleryAssetSource,
  type GalleryFilterState,
  type GalleryMediaType,
} from '../lib/gallery-filters'

interface GalleryFiltersProps {
  filter: GalleryFilterState
  onChange: (filter: GalleryFilterState) => void
}

const filterChipClass = (active: boolean) =>
  active
    ? 'border border-blue-500/40 bg-blue-600/30 text-blue-300'
    : 'border border-transparent bg-zinc-800 text-zinc-500 hover:text-zinc-300'

function FilterChipGroup<T extends string>({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string
  options: { value: T; label: string }[]
  selected: T[]
  onToggle: (value: T) => void
}) {
  return (
    <div>
      <div className="px-0.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const isActive = selected.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${filterChipClass(isActive)}`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function GalleryFilters({ filter, onChange }: GalleryFiltersProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const filterActive = isGalleryFilterActive(filter)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const toggleType = (value: GalleryMediaType) => {
    if (filter.types.includes(value) && filter.types.length === 1) {
      return
    }
    onChange({
      ...filter,
      types: toggleGalleryFilterValue(filter.types, value),
    })
  }

  const toggleSource = (value: GalleryAssetSource) => {
    if (filter.sources.includes(value) && filter.sources.length === 1) {
      return
    }
    onChange({
      ...filter,
      sources: toggleGalleryFilterValue(filter.sources, value),
    })
  }

  return (
    <div ref={menuRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border transition-colors ${
          open || filterActive
            ? 'border-blue-500/40 bg-blue-600/30 text-blue-300'
            : 'border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white'
        }`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Filter gallery"
        title="Filter gallery"
      >
        <ListFilter className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 min-w-[220px] rounded-md border border-zinc-700 bg-zinc-800 p-2.5 shadow-xl space-y-3">
          <FilterChipGroup
            title="Type"
            options={GALLERY_TYPE_OPTIONS}
            selected={filter.types}
            onToggle={toggleType}
          />
          <div className="h-px bg-zinc-700" />
          <FilterChipGroup
            title="Source"
            options={GALLERY_SOURCE_OPTIONS}
            selected={filter.sources}
            onToggle={toggleSource}
          />
        </div>
      )}
    </div>
  )
}
