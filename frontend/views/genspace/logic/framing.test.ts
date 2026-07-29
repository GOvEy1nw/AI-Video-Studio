import { describe, expect, it } from "vitest";
import {
  FRAMING_OPTIONS,
  FRAMING_PRESETS,
  applyFramingPrefix,
  buildFramingPrefix,
  formatFramingIndicator,
} from "./framing";

const settings = {
  camera: "RED Komodo Cinema",
  lens: "Macro Lens",
  focalLength: "50mm",
  aperture: "f/5.6",
  shutter: "1/100s",
  iso: "ISO 400",
};

describe("framing prompt helpers", () => {
  it("keeps slider options usable and every preset on valid steps", () => {
    const sliderFields = [
      "focalLength",
      "aperture",
      "shutter",
      "iso",
    ] as const;

    for (const field of sliderFields) {
      const options = FRAMING_OPTIONS[field];
      expect(options.length).toBeGreaterThan(1);
      expect(new Set(options).size).toBe(options.length);
      for (const preset of FRAMING_PRESETS) {
        expect(options).toContain(preset.settings[field]);
      }
    }
  });

  it("formats the hidden prefix and compact indicator", () => {
    expect(buildFramingPrefix(settings)).toBe(
      "Shot on RED Komodo Cinema, Macro Lens, 50mm, f/5.6, 1/100s, ISO 400",
    );
    expect(formatFramingIndicator(settings)).toBe(
      "RED Komodo Cinema-Macro Lens-50mm-f/5.6-1/100s-ISO 400",
    );
  });

  it("prefixes the effective prompt without changing an unframed prompt", () => {
    expect(applyFramingPrefix("product on a pedestal", settings)).toBe(
      "Shot on RED Komodo Cinema, Macro Lens, 50mm, f/5.6, 1/100s, ISO 400. product on a pedestal",
    );
    expect(applyFramingPrefix("  authored prompt  ", null)).toBe(
      "  authored prompt  ",
    );
  });
});
