import { describe, expect, it } from "vitest";
import { getAssetLibraryVirtualRange } from "./asset-library-virtual";

describe("Asset Library virtualization", () => {
  it("keeps a 1,000-asset sidebar grid under the rendered-card target", () => {
    const columns = 4;
    const rows = Math.ceil(1_000 / columns);
    const range = getAssetLibraryVirtualRange(rows, 100, 12_000, 500);
    expect((range.end - range.start) * columns).toBeLessThan(200);
  });

  it("clamps viewport ranges at collection edges", () => {
    expect(getAssetLibraryVirtualRange(20, 32, 0, 64)).toEqual({ start: 0, end: 5 });
    expect(getAssetLibraryVirtualRange(20, 32, 10_000, 64)).toEqual({ start: 17, end: 20 });
  });
});
