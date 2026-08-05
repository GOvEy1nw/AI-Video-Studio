export const ASSET_LIBRARY_OVERSCAN_ROWS = 3;

export function getAssetLibraryVirtualRange(
  itemCount: number,
  rowHeight: number,
  scrollTop: number,
  viewportHeight: number,
  overscan = ASSET_LIBRARY_OVERSCAN_ROWS,
) {
  if (itemCount === 0 || rowHeight <= 0 || viewportHeight <= 0) {
    return { start: 0, end: 0 };
  }
  const firstVisible = Math.min(itemCount, Math.floor(scrollTop / rowHeight));
  const visibleRows = Math.ceil(viewportHeight / rowHeight);
  return {
    start: Math.max(0, firstVisible - overscan),
    end: Math.min(itemCount, firstVisible + visibleRows + overscan),
  };
}
