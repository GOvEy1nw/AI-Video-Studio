export type ReframeAspectMode = '1:1' | '16:9' | '9:16' | 'custom'

export type DragEdge = 'top' | 'bottom' | 'left' | 'right'

export interface ReframePadding {
  top: number
  bottom: number
  left: number
  right: number
}

export const ZERO_PADDING: ReframePadding = {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
}

/** Max per-edge padding when expanding via edge handles (user-facing). */
export const MAX_PADDING_UI = 100
/** Max per-edge padding for internal pan compensation (e.g. 0/200 when total is 200). */
export const MAX_PADDING_INTERNAL = 200
/** @deprecated use MAX_PADDING_UI or MAX_PADDING_INTERNAL */
export const MAX_PADDING_PCT = MAX_PADDING_UI

export function clampExpandPadding(value: number): number {
  return Math.max(0, Math.min(MAX_PADDING_UI, Math.round(value)))
}

export function clampPaddingToExpandMax(padding: ReframePadding): ReframePadding {
  return {
    top: clampExpandPadding(padding.top),
    bottom: clampExpandPadding(padding.bottom),
    left: clampExpandPadding(padding.left),
    right: clampExpandPadding(padding.right),
  }
}

export function clampInternalPadding(value: number): number {
  return Math.max(0, Math.min(MAX_PADDING_INTERNAL, Math.round(value)))
}

/** @deprecated use clampExpandPadding or clampInternalPadding */
export function clampPadding(value: number): number {
  return clampExpandPadding(value)
}

export interface VideoRect {
  x: number
  y: number
  width: number
  height: number
}

export interface FrameLayout {
  outer: VideoRect
  inner: VideoRect
  /** Max video display size when the box hugs the source (phase 1 reference). */
  referenceInner: VideoRect
  /** True when the outer box is clamped to the container and video is shrinking. */
  constrained: boolean
}

export function aspectRatioValue(mode: Exclude<ReframeAspectMode, 'custom'>): number {
  if (mode === '1:1') return 1
  if (mode === '16:9') return 16 / 9
  return 9 / 16
}

export function sourceCanvasSize(
  videoWidth: number,
  videoHeight: number,
  padding: ReframePadding,
): { width: number; height: number } {
  return {
    width: videoWidth * (1 + padding.left / 100 + padding.right / 100),
    height: videoHeight * (1 + padding.top / 100 + padding.bottom / 100),
  }
}

export function computeVideoContentRect(
  containerWidth: number,
  containerHeight: number,
  videoWidth: number,
  videoHeight: number,
): VideoRect {
  if (containerWidth <= 0 || containerHeight <= 0 || videoWidth <= 0 || videoHeight <= 0) {
    return { x: 0, y: 0, width: containerWidth, height: containerHeight }
  }
  const containerRatio = containerWidth / containerHeight
  const videoRatio = videoWidth / videoHeight
  if (videoRatio > containerRatio) {
    const width = containerWidth
    const height = containerWidth / videoRatio
    return { x: 0, y: (containerHeight - height) / 2, width, height }
  }
  const height = containerHeight
  const width = containerHeight * videoRatio
  return { x: (containerWidth - width) / 2, y: 0, width, height }
}

function fitAspectInBox(
  boxWidth: number,
  boxHeight: number,
  aspect: number,
  offsetX: number,
  offsetY: number,
): VideoRect {
  const boxAspect = boxWidth / boxHeight
  if (aspect > boxAspect) {
    const width = boxWidth
    const height = width / aspect
    return { x: offsetX, y: offsetY + (boxHeight - height) / 2, width, height }
  }
  const height = boxHeight
  const width = height * aspect
  return { x: offsetX + (boxWidth - width) / 2, y: offsetY, width, height }
}

/**
 * Two-phase layout:
 * 1. Box hugs video at reference size; padding grows the outer box until it hits the container.
 * 2. Outer clamped to container max; further padding shrinks the video inside.
 */
export function computeFrameLayout(
  containerWidth: number,
  containerHeight: number,
  videoWidth: number,
  videoHeight: number,
  padding: ReframePadding,
  margin = 8,
): FrameLayout {
  const availW = Math.max(1, containerWidth - margin * 2)
  const availH = Math.max(1, containerHeight - margin * 2)
  const ox = margin
  const oy = margin

  const referenceInner = computeVideoContentRect(availW, availH, videoWidth, videoHeight)
  referenceInner.x += ox
  referenceInner.y += oy

  if (videoWidth <= 0 || videoHeight <= 0) {
    const outer = { x: ox, y: oy, width: availW, height: availH }
    return { outer, inner: { ...referenceInner }, referenceInner, constrained: false }
  }

  const src = sourceCanvasSize(videoWidth, videoHeight, padding)
  const srcAspect = src.width / src.height

  const unconstrainedOuterW =
    referenceInner.width * (1 + padding.left / 100 + padding.right / 100)
  const unconstrainedOuterH =
    referenceInner.height * (1 + padding.top / 100 + padding.bottom / 100)

  if (unconstrainedOuterW <= availW && unconstrainedOuterH <= availH) {
    const outer: VideoRect = {
      width: unconstrainedOuterW,
      height: unconstrainedOuterH,
      x: ox + (availW - unconstrainedOuterW) / 2,
      y: oy + (availH - unconstrainedOuterH) / 2,
    }
    const inner: VideoRect = {
      x: outer.x + referenceInner.width * (padding.left / 100),
      y: outer.y + referenceInner.height * (padding.top / 100),
      width: referenceInner.width,
      height: referenceInner.height,
    }
    return { outer, inner, referenceInner, constrained: false }
  }

  const outer = fitAspectInBox(availW, availH, srcAspect, ox, oy)
  const inner: VideoRect = {
    x: outer.x + (outer.width * (padding.left / 100) * videoWidth) / src.width,
    y: outer.y + (outer.height * (padding.top / 100) * videoHeight) / src.height,
    width: (outer.width * videoWidth) / src.width,
    height: (outer.height * videoHeight) / src.height,
  }
  return { outer, inner, referenceInner, constrained: true }
}

/** Minimum symmetric padding so source video fits target aspect canvas. */
export function computeFitPadding(
  videoWidth: number,
  videoHeight: number,
  aspectMode: Exclude<ReframeAspectMode, 'custom'>,
): ReframePadding {
  if (videoWidth <= 0 || videoHeight <= 0) return { ...ZERO_PADDING }

  const innerRatio = videoWidth / videoHeight
  const targetRatio = aspectRatioValue(aspectMode)

  if (Math.abs(innerRatio - targetRatio) < 0.001) {
    return { ...ZERO_PADDING }
  }

  if (innerRatio > targetRatio) {
    const outerHeight = videoWidth / targetRatio
    const padPct = ((outerHeight - videoHeight) / 2 / videoHeight) * 100
    return {
      top: clampExpandPadding(padPct),
      bottom: clampExpandPadding(padPct),
      left: 0,
      right: 0,
    }
  }

  const outerWidth = videoHeight * targetRatio
  const padPct = ((outerWidth - videoWidth) / 2 / videoWidth) * 100
  return {
    top: 0,
    bottom: 0,
    left: clampExpandPadding(padPct),
    right: clampExpandPadding(padPct),
  }
}

export function minPaddingForMode(
  videoWidth: number,
  videoHeight: number,
  aspectMode: ReframeAspectMode,
): ReframePadding {
  if (aspectMode === 'custom') return { ...ZERO_PADDING }
  return computeFitPadding(videoWidth, videoHeight, aspectMode)
}

export function enforceAspectPadding(
  videoWidth: number,
  videoHeight: number,
  padding: ReframePadding,
  targetRatio: number,
): ReframePadding {
  if (videoWidth <= 0 || videoHeight <= 0) return padding

  const outerW = videoWidth * (1 + padding.left / 100 + padding.right / 100)
  const outerH = videoHeight * (1 + padding.top / 100 + padding.bottom / 100)
  if (outerW <= 0 || outerH <= 0) return padding

  const currentRatio = outerW / outerH
  if (Math.abs(currentRatio - targetRatio) < 0.001) return padding

  if (currentRatio > targetRatio) {
    const targetOuterH = outerW / targetRatio
    const currentOuterH = videoHeight * (1 + padding.top / 100 + padding.bottom / 100)
    const extraH = targetOuterH - currentOuterH
    const addEach = (extraH / 2 / videoHeight) * 100
    return {
      top: clampExpandPadding(padding.top + addEach),
      bottom: clampExpandPadding(padding.bottom + addEach),
      left: padding.left,
      right: padding.right,
    }
  }

  const targetOuterW = outerH * targetRatio
  const currentOuterW = videoWidth * (1 + padding.left / 100 + padding.right / 100)
  const extraW = targetOuterW - currentOuterW
  const addEach = (extraW / 2 / videoWidth) * 100
  return {
    top: padding.top,
    bottom: padding.bottom,
    left: clampExpandPadding(padding.left + addEach),
    right: clampExpandPadding(padding.right + addEach),
  }
}

/** Shift padding between opposite sides — pans video inside the box without changing its size. */
export function applyPanPadding(
  startPadding: ReframePadding,
  deltaPxX: number,
  deltaPxY: number,
  startOuter: VideoRect,
  startInner: VideoRect,
): ReframePadding {
  const totalHorizontal = startPadding.left + startPadding.right
  const totalVertical = startPadding.top + startPadding.bottom

  if (totalHorizontal <= 0 && totalVertical <= 0) {
    return startPadding
  }

  const startGapLeft = startInner.x - startOuter.x
  const startGapTop = startInner.y - startOuter.y

  const maxGapLeft =
    startInner.width > 0 && totalHorizontal > 0
      ? (startInner.width * totalHorizontal) / 100
      : 0
  const maxGapTop =
    startInner.height > 0 && totalVertical > 0
      ? (startInner.height * totalVertical) / 100
      : 0

  const nextGapLeft =
    totalHorizontal > 0
      ? Math.max(0, Math.min(maxGapLeft, startGapLeft + deltaPxX))
      : 0
  const nextGapTop =
    totalVertical > 0
      ? Math.max(0, Math.min(maxGapTop, startGapTop + deltaPxY))
      : 0

  const nextLeft =
    startInner.width > 0 && totalHorizontal > 0
      ? (nextGapLeft / startInner.width) * 100
      : startPadding.left
  const nextTop =
    startInner.height > 0 && totalVertical > 0
      ? (nextGapTop / startInner.height) * 100
      : startPadding.top

  const left = clampInternalPadding(Math.max(0, Math.min(totalHorizontal, nextLeft)))
  const top = clampInternalPadding(Math.max(0, Math.min(totalVertical, nextTop)))

  // Opposite sides absorb the remainder — totals stay fixed, one side may reach 200% internally.
  const right = clampInternalPadding(Math.max(0, totalHorizontal - left))
  const bottom = clampInternalPadding(Math.max(0, totalVertical - top))

  return { left, right, top, bottom }
}

export function formatPaddingLabel(padding: ReframePadding): string {
  const fmt = (value: number) =>
    value > MAX_PADDING_UI ? `${MAX_PADDING_UI}+` : String(value)
  return `T ${fmt(padding.top)}% · B ${fmt(padding.bottom)}% · L ${fmt(padding.left)}% · R ${fmt(padding.right)}%`
}

export function paddingForAspectModeChange(
  videoWidth: number,
  videoHeight: number,
  nextMode: ReframeAspectMode,
  currentPadding: ReframePadding,
): ReframePadding {
  if (nextMode === 'custom') return currentPadding
  return computeFitPadding(videoWidth, videoHeight, nextMode)
}

function symmetricPadding(horizontal: number, vertical: number): ReframePadding {
  const h = clampExpandPadding(horizontal)
  const v = clampExpandPadding(vertical)
  return { left: h, right: h, top: v, bottom: v }
}

/** Max zoom padding while keeping target aspect and every edge ≤ 100%. */
export function computeMaxAspectZoomPadding(
  videoWidth: number,
  videoHeight: number,
  aspectMode: Exclude<ReframeAspectMode, 'custom'>,
): ReframePadding {
  const W = videoWidth
  const H = videoHeight
  if (W <= 0 || H <= 0) return { ...ZERO_PADDING }

  const targetRatio = aspectRatioValue(aspectMode)
  const fit = computeFitPadding(W, H, aspectMode)

  const verticalForHorizontal = (horizontalPerSide: number): number => {
    const outerW = W * (1 + (horizontalPerSide * 2) / 100)
    const outerH = outerW / targetRatio
    return Math.max(0, ((outerH / H) - 1) / 2 * 100)
  }

  const horizontalForVertical = (verticalPerSide: number): number => {
    const outerH = H * (1 + (verticalPerSide * 2) / 100)
    const outerW = outerH * targetRatio
    return Math.max(0, ((outerW / W) - 1) / 2 * 100)
  }

  const isZeroFit =
    fit.top === 0 && fit.bottom === 0 && fit.left === 0 && fit.right === 0

  if (isZeroFit) {
    const horizontalAtMax = MAX_PADDING_UI
    const verticalAtMax = verticalForHorizontal(horizontalAtMax)
    if (verticalAtMax <= MAX_PADDING_UI) {
      return symmetricPadding(horizontalAtMax, verticalAtMax)
    }
    return symmetricPadding(
      horizontalForVertical(MAX_PADDING_UI),
      MAX_PADDING_UI,
    )
  }

  if (fit.left > 0 || fit.right > 0) {
    const horizontalAtMax = MAX_PADDING_UI
    const verticalAtMax = verticalForHorizontal(horizontalAtMax)
    if (verticalAtMax <= MAX_PADDING_UI) {
      return symmetricPadding(horizontalAtMax, verticalAtMax)
    }
    return symmetricPadding(
      horizontalForVertical(MAX_PADDING_UI),
      MAX_PADDING_UI,
    )
  }

  const verticalAtMax = MAX_PADDING_UI
  const horizontalAtMax = horizontalForVertical(verticalAtMax)
  if (horizontalAtMax <= MAX_PADDING_UI) {
    return symmetricPadding(horizontalAtMax, verticalAtMax)
  }
  return symmetricPadding(
    MAX_PADDING_UI,
    verticalForHorizontal(MAX_PADDING_UI),
  )
}

/** Preset aspect zoom: 0 = fit box, 100 = max expansion at target aspect (per-edge ≤ 100%). */
export function paddingForAspectZoom(
  videoWidth: number,
  videoHeight: number,
  aspectMode: Exclude<ReframeAspectMode, 'custom'>,
  zoom: number,
): ReframePadding {
  const fit = computeFitPadding(videoWidth, videoHeight, aspectMode)
  const max = computeMaxAspectZoomPadding(videoWidth, videoHeight, aspectMode)
  const t = Math.max(0, Math.min(100, zoom)) / 100
  const lerpSide = (from: number, to: number) =>
    clampExpandPadding(from + t * (to - from))

  const padding: ReframePadding = {
    top: lerpSide(fit.top, max.top),
    bottom: lerpSide(fit.bottom, max.bottom),
    left: lerpSide(fit.left, max.left),
    right: lerpSide(fit.right, max.right),
  }

  return clampPaddingToExpandMax(
    enforceAspectPadding(
      videoWidth,
      videoHeight,
      padding,
      aspectRatioValue(aspectMode),
    ),
  )
}

function paddingHasInternalPan(padding: ReframePadding): boolean {
  return (
    padding.top > MAX_PADDING_UI ||
    padding.bottom > MAX_PADDING_UI ||
    padding.left > MAX_PADDING_UI ||
    padding.right > MAX_PADDING_UI
  )
}

/** Keep pan position when zoom totals change. */
export function applyZoomPreservingPan(
  current: ReframePadding,
  zoomBase: ReframePadding,
): ReframePadding {
  const oldHorizontal = current.left + current.right
  const oldVertical = current.top + current.bottom
  const newHorizontal = zoomBase.left + zoomBase.right
  const newVertical = zoomBase.top + zoomBase.bottom

  if (oldHorizontal <= 0 && oldVertical <= 0) {
    return zoomBase
  }

  const leftFraction = oldHorizontal > 0 ? current.left / oldHorizontal : 0.5
  const topFraction = oldVertical > 0 ? current.top / oldVertical : 0.5

  const left = clampInternalPadding(Math.round(newHorizontal * leftFraction))
  const top = clampInternalPadding(Math.round(newVertical * topFraction))

  const next: ReframePadding = {
    left,
    right: clampInternalPadding(Math.max(0, newHorizontal - left)),
    top,
    bottom: clampInternalPadding(Math.max(0, newVertical - top)),
  }

  // Zoom never introduces >100% per edge; only prior pan may exceed that.
  if (!paddingHasInternalPan(current)) {
    return clampPaddingToExpandMax(next)
  }

  return next
}

/** Custom mode: dragging one edge expands both sides on that axis equally. */
export function applyMirroredEdgeExpand(
  padding: ReframePadding,
  edge: DragEdge,
  deltaPx: number,
  referenceInner: VideoRect,
): ReframePadding {
  const next = { ...padding }

  if ((edge === 'left' || edge === 'right') && referenceInner.width > 0) {
    const sign = edge === 'left' ? -1 : 1
    const deltaPct = (sign * deltaPx / referenceInner.width) * 100
    next.left = clampExpandPadding(next.left + deltaPct)
    next.right = clampExpandPadding(next.right + deltaPct)
  } else if ((edge === 'top' || edge === 'bottom') && referenceInner.height > 0) {
    const sign = edge === 'top' ? -1 : 1
    const deltaPct = (sign * deltaPx / referenceInner.height) * 100
    next.top = clampExpandPadding(next.top + deltaPct)
    next.bottom = clampExpandPadding(next.bottom + deltaPct)
  }

  return next
}

export function paddingToOuterRect(inner: VideoRect, padding: ReframePadding): VideoRect {
  const expandLeft = inner.width * (padding.left / 100)
  const expandRight = inner.width * (padding.right / 100)
  const expandTop = inner.height * (padding.top / 100)
  const expandBottom = inner.height * (padding.bottom / 100)
  return {
    x: inner.x - expandLeft,
    y: inner.y - expandTop,
    width: inner.width + expandLeft + expandRight,
    height: inner.height + expandTop + expandBottom,
  }
}
