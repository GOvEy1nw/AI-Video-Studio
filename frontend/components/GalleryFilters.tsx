import { useEffect, useRef, useState } from 'react'
import { Check, ListFilter } from 'lucide-react'
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

function FilterCheckboxGroup<T extends string>({
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
      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </div>
      <div className="space-y-0.5">
        {options.map((option) => {
          const isChecked = selected.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              className={`w-full flex items-center justify-between px-2 py-2 rounded-md transition-colors text-left ${
                isChecked
                  ? 'bg-white/15 text-white'
                  : 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              <span className="text-sm">{option.label}</span>
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border ${
                  isChecked
                    ? 'border-violet-400 bg-violet-500/30 text-violet-200'
                    : 'border-zinc-600 bg-zinc-900/40'
                }`}
              >
                {isChecked && <Check className="h-3 w-3" />}
              </span>
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
    onChange({
      ...filter,
      types: toggleGalleryFilterValue(filter.types, value),
    })
  }

  const toggleSource = (value: GalleryAssetSource) => {
    onChange({
      ...filter,
      sources: toggleGalleryFilterValue(filter.sources, value),
    })
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          open || filterActive
            ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
        }`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <ListFilter className="h-4 w-4" />
        Filter
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 bg-zinc-800 border border-zinc-700 rounded-md p-2 min-w-[200px] shadow-xl z-50 space-y-3">
          <FilterCheckboxGroup
            title="Type"
            options={GALLERY_TYPE_OPTIONS}
            selected={filter.types}
            onToggle={toggleType}
          />
          <div className="h-px bg-zinc-700" />
          <FilterCheckboxGroup
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
