import { describe, expect, it } from "vitest";
import {
  applyPanPadding,
  applyZoomPreservingPan,
  aspectRatioValue,
  paddingForAspectZoom,
  sourceCanvasSize,
} from "./reframe-outpaint"

describe("Reframe zoom geometry", () => {
  it("maps 100% to target-aspect fill and 0% to half-size media", () => {
    const fill = paddingForAspectZoom(1920, 1080, "4:3", 100)
    const half = paddingForAspectZoom(1920, 1080, "4:3", 0)
    const fillCanvas = sourceCanvasSize(1920, 1080, fill)
    const halfCanvas = sourceCanvasSize(1920, 1080, half)

    expect(fillCanvas.width / fillCanvas.height).toBeCloseTo(
      aspectRatioValue("4:3"),
      1,
    )
    expect(halfCanvas.width / fillCanvas.width).toBeCloseTo(2, 2)
    expect(halfCanvas.height / fillCanvas.height).toBeCloseTo(2, 2)
  })

  it("keeps extreme curated aspect pairs exact at half size", () => {
    const padding = paddingForAspectZoom(2520, 1080, "9:21", 0)
    const canvas = sourceCanvasSize(2520, 1080, padding)

    expect(canvas.width / canvas.height).toBeCloseTo(
      aspectRatioValue("9:21"),
      2,
    )
  })

  it("keeps frame aspect stable through every zoom step", () => {
    const targetAspect = aspectRatioValue("4:3")

    for (let zoom = 0; zoom <= 100; zoom += 1) {
      const canvas = sourceCanvasSize(
        1920,
        1080,
        paddingForAspectZoom(1920, 1080, "4:3", zoom),
      )
      expect(canvas.width / canvas.height).toBeCloseTo(targetAspect, 10)
    }
  })

  it("lets placement move all padding to one side without changing totals", () => {
    const start = { left: 494, right: 494, top: 50, bottom: 50 }
    const result = applyPanPadding(
      start,
      494,
      0,
      { x: 0, y: 0, width: 1088, height: 200 },
      { x: 494, y: 50, width: 100, height: 100 },
    )

    expect(result).toEqual({ left: 988, right: 0, top: 50, bottom: 50 })
    expect(result.left + result.right).toBe(start.left + start.right)
    expect(result.top + result.bottom).toBe(start.top + start.bottom)
  })

  it("preserves placement fractions while zoom changes axis totals", () => {
    const result = applyZoomPreservingPan(
      { left: 800, right: 188, top: 0, bottom: 100 },
      { left: 100, right: 100, top: 75, bottom: 75 },
    )

    expect(result.left / (result.left + result.right)).toBeCloseTo(800 / 988, 10)
    expect(result.top).toBe(0)
    expect(result.bottom).toBe(150)
    expect(result.left + result.right).toBe(200)
    expect(result.top + result.bottom).toBe(150)
  })
})
