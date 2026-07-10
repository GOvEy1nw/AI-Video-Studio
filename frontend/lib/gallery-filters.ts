import type { Asset } from '../types/project'

export type GalleryMediaType = 'image' | 'video' | 'audio'
export type GalleryAssetSource = 'generated' | 'uploaded'

export type GalleryFilterState = {
  types: GalleryMediaType[]
  sources: GalleryAssetSource[]
}

export const DEFAULT_GALLERY_FILTER: GalleryFilterState = {
  types: ['image', 'video', 'audio'],
  sources: ['generated', 'uploaded'],
}

export const GALLERY_TYPE_OPTIONS: {
  value: GalleryMediaType
  label: string
}[] = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
]

export const GALLERY_SOURCE_OPTIONS: {
  value: GalleryAssetSource
  label: string
}[] = [
  { value: 'generated', label: 'Generated' },
  { value: 'uploaded', label: 'Uploaded' },
]

export function inferAssetSource(asset: Asset): GalleryAssetSource {
  if (asset.source === 'uploaded') return 'uploaded'
  if (asset.source === 'generated') return 'generated'
  return asset.generationParams ? 'generated' : 'uploaded'
}

export function isGalleryFilterActive(filter: GalleryFilterState): boolean {
  return (
    filter.types.length < GALLERY_TYPE_OPTIONS.length ||
    filter.sources.length < GALLERY_SOURCE_OPTIONS.length
  )
}

export function filterGalleryAssets(
  assets: Asset[],
  filter: GalleryFilterState,
): Asset[] {
  return assets.filter((asset) => {
    if (!filter.types.includes(asset.type as GalleryMediaType)) {
      return false
    }
    return filter.sources.includes(inferAssetSource(asset))
  })
}

export function toggleGalleryFilterValue<T extends string>(
  values: T[],
  value: T,
): T[] {
  if (values.includes(value)) {
    return values.filter((entry) => entry !== value)
  }
  return [...values, value]
}

export function getAssetDisplayFileName(asset: Asset): string {
  const fromPath = asset.path.split(/[/\\]/).pop()
  if (fromPath) return fromPath
  if (asset.prompt.trim()) return asset.prompt.trim()
  return `${asset.type}-${asset.id}`
}

export function collectGalleryBins(
  assets: Asset[],
  extraBins: string[] = [],
): string[] {
  const binSet = new Set<string>(extraBins)
  for (const asset of assets) {
    if (asset.bin) binSet.add(asset.bin)
  }
  return Array.from(binSet).sort((a, b) => a.localeCompare(b))
}

export function filterGalleryAssetsByBin(
  assets: Asset[],
  selectedBin: string | null,
): Asset[] {
  if (selectedBin === null) return assets
  return assets.filter((asset) => asset.bin === selectedBin)
}
