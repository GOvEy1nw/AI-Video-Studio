import { describe, expect, it } from "vitest";
import {
  fitMediaCropToAspect,
  isFullMediaCrop,
  moveMediaCrop,
  resizeMediaCrop,
} from "./media-crop";

describe("media crop geometry", () => {
  it("centres a locked aspect ratio within source bounds", () => {
    expect(fitMediaCropToAspect("16:9", 1)).toEqual({
      aspectRatio: "16:9",
      x: 0,
      y: 0.21875,
      width: 1,
      height: 0.5625,
    });
  });

  it("keeps moved crops inside normalized bounds", () => {
    expect(
      moveMediaCrop(
        { aspectRatio: "freeform", x: 0.2, y: 0.2, width: 0.5, height: 0.5 },
        1,
        -1,
      ),
    ).toMatchObject({ x: 0.5, y: 0 });
  });

  it("resizes freeform crops from the selected corner", () => {
    const crop = resizeMediaCrop(
      { aspectRatio: "freeform", x: 0.1, y: 0.2, width: 0.4, height: 0.4 },
      "se",
      0.8,
      0.7,
      1,
    );

    expect(crop.x).toBe(0.1);
    expect(crop.y).toBe(0.2);
    expect(crop.width).toBeCloseTo(0.7);
    expect(crop.height).toBeCloseTo(0.5);
  });

  it("preserves locked output aspect while resizing", () => {
    const crop = resizeMediaCrop(
      fitMediaCropToAspect("16:9", 2),
      "se",
      0.75,
      0.75,
      2,
    );

    expect((crop.width * 2) / crop.height).toBeCloseTo(16 / 9);
    expect(isFullMediaCrop(crop)).toBe(false);
  });
});
