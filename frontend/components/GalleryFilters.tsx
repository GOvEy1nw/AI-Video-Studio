import {
  GALLERY_SOURCE_OPTIONS,
  GALLERY_TYPE_OPTIONS,
  toggleGalleryFilterValue,
  type GalleryAssetSource,
  type GalleryFilterState,
  type GalleryMediaType,
} from "../lib/gallery-filters";

interface GalleryFiltersProps {
  filter: GalleryFilterState;
  onChange: (filter: GalleryFilterState) => void;
}

const filterChipClass = (active: boolean) =>
  active
    ? "border border-zinc-500/40 bg-zinc-400/30 text-zinc-300"
    : "border border-transparent bg-zinc-800 text-zinc-500 hover:text-zinc-300";

function FilterChipGroup<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <div className="flex flex-shrink-0 gap-1" aria-label={label}>
      {options.map((option) => {
        const isActive = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onToggle(option.value)}
            className={`flex h-8 flex-shrink-0 items-center gap-1 rounded-md border px-2.5 text-xs font-medium transition-colors ${filterChipClass(isActive)}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function GalleryFilters({ filter, onChange }: GalleryFiltersProps) {
  const toggleType = (value: GalleryMediaType) => {
    if (filter.types.includes(value) && filter.types.length === 1) {
      return;
    }
    onChange({
      ...filter,
      types: toggleGalleryFilterValue(filter.types, value),
    });
  };

  const toggleSource = (value: GalleryAssetSource) => {
    if (filter.sources.includes(value) && filter.sources.length === 1) {
      return;
    }
    onChange({
      ...filter,
      sources: toggleGalleryFilterValue(filter.sources, value),
    });
  };

  return (
    <div className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <FilterChipGroup
        label="Media type"
        options={GALLERY_TYPE_OPTIONS}
        selected={filter.types}
        onToggle={toggleType}
      />
      <FilterChipGroup
        label="Source"
        options={GALLERY_SOURCE_OPTIONS}
        selected={filter.sources}
        onToggle={toggleSource}
      />
    </div>
  );
}
