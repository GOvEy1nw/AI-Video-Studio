const CARD_ASPECT_RATIO = 16 / 9
const COVER_TOLERANCE = 0.05

export function needsBlurredBackdrop(width: number, height: number): boolean {
  if (width <= 0 || height <= 0) return false
  const aspectRatio = width / height
  return Math.abs(aspectRatio - CARD_ASPECT_RATIO) / CARD_ASPECT_RATIO > COVER_TOLERANCE
}
