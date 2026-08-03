import {
  Image,
  Music,
  Sparkles,
  Upload,
  Video,
  type LucideIcon,
} from "lucide-react";
import {
  GALLERY_SOURCE_OPTIONS,
  GALLERY_TYPE_OPTIONS,
  type GalleryAssetSource,
  type GalleryFilterState,
  type GalleryMediaType,
  toggleGalleryFilterValue,
} from "../lib/gallery-filters";

interface GalleryFiltersProps {
  filter: GalleryFilterState;
  onChange: (filter: GalleryFilterState) => void;
}

const filterChipClass = (active: boolean) =>
  active
    ? "border border-zinc-500/40 bg-zinc-400/30 text-zinc-300"
    : "border border-transparent bg-zinc-800 text-zinc-500 hover:text-zinc-300";

const GALLERY_FILTER_ICONS: Record<
  GalleryMediaType | GalleryAssetSource,
  LucideIcon
> = {
  image: Image,
  video: Video,
  audio: Music,
  generated: Sparkles,
  uploaded: Upload,
};

type FilterOption<T extends string> = {
  value: T;
  label: string;
  icon: LucideIcon;
};

function FilterChipGroup<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: FilterOption<T>[];
  selected: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <div className="flex shrink-0 gap-1" aria-label={label}>
      {options.map((option) => {
        const isActive = selected.includes(option.value);
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onToggle(option.value)}
            aria-pressed={isActive}
            aria-label={option.label}
            title={option.label}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors ${filterChipClass(isActive)}`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

export function GalleryFilters({ filter, onChange }: GalleryFiltersProps) {
  const typeOptions = GALLERY_TYPE_OPTIONS.map((option) => ({
    ...option,
    icon: GALLERY_FILTER_ICONS[option.value],
  }));
  const sourceOptions = GALLERY_SOURCE_OPTIONS.map((option) => ({
    ...option,
    icon: GALLERY_FILTER_ICONS[option.value],
  }));

  const toggleType = (value: GalleryMediaType) => {
    onChange({
      ...filter,
      types: toggleGalleryFilterValue(filter.types, value),
    });
  };

  const toggleSource = (value: GalleryAssetSource) => {
    onChange({
      ...filter,
      sources: toggleGalleryFilterValue(filter.sources, value),
    });
  };

  return (
    <div className="flex min-w-0 items-center gap-1 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
      <FilterChipGroup
        label="Media type"
        options={typeOptions}
        selected={filter.types}
        onToggle={toggleType}
      />
      <FilterChipGroup
        label="Source"
        options={sourceOptions}
        selected={filter.sources}
        onToggle={toggleSource}
      />
    </div>
  );
}
