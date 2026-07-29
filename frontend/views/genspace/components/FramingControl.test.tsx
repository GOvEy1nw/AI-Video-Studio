import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FRAMING_OPTIONS,
  FRAMING_PRESETS,
  formatFramingIndicator,
} from "../logic/framing";
import { FramingControl } from "./FramingControl";

afterEach(() => {
  cleanup();
});

describe("FramingControl", () => {
  it("applies a preset from camera settings", () => {
    const onChange = vi.fn();
    render(<FramingControl value={null} onChange={onChange} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Open camera settings" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Camera Settings" }),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: /DSLR Portrait/ }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Apply camera settings" }),
    );

    expect(onChange).toHaveBeenCalledWith({
      ...FRAMING_PRESETS[1].settings,
    });
  });

  it("shows compact applied settings beside active icon", () => {
    render(
      <FramingControl
        value={FRAMING_PRESETS[0].settings}
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByTitle(formatFramingIndicator(FRAMING_PRESETS[0].settings)),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Open camera settings" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("opens a backdrop-free popover with dropdowns and stepped sliders", () => {
    render(<FramingControl value={null} onChange={vi.fn()} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Open camera settings" }),
    );

    const dialog = screen.getByRole("dialog", { name: "Camera Settings" });
    expect(dialog.parentElement).toBe(document.body);
    expect(dialog.getAttribute("aria-modal")).toBeNull();
    expect(screen.getByRole("combobox", { name: "Camera" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Lens" })).toBeTruthy();
    expect(within(dialog).getAllByRole("slider")).toHaveLength(4);

    const aperture = screen.getByRole("slider", { name: "Aperture" });
    expect(aperture.getAttribute("min")).toBe("0");
    expect(aperture.getAttribute("max")).toBe(
      String(FRAMING_OPTIONS.aperture.length - 1),
    );
    expect(aperture.getAttribute("step")).toBe("1");
    expect(aperture.getAttribute("aria-valuetext")).toBe(
      FRAMING_PRESETS[0].settings.aperture,
    );
    expect(
      screen
        .getByRole("slider", { name: "ISO" })
        .getAttribute("aria-valuetext"),
    ).toBe(FRAMING_PRESETS[0].settings.iso.replace(/^ISO\s+/, ""));
    expect(
      screen
        .getByRole("slider", { name: "Shutter" })
        .getAttribute("aria-valuetext"),
    ).toBe(FRAMING_PRESETS[0].settings.shutter.replace(/s$/, ""));
  });

  it("changes dropdown and stepped slider values", () => {
    const onChange = vi.fn();
    render(<FramingControl value={null} onChange={onChange} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Open camera settings" }),
    );

    const defaults = FRAMING_PRESETS[0].settings;
    const camera = FRAMING_OPTIONS.camera.find(
      (option) => option !== defaults.camera,
    )!;
    const lens = FRAMING_OPTIONS.lens.find(
      (option) => option !== defaults.lens,
    )!;
    const apertureIndex = FRAMING_OPTIONS.aperture.findIndex(
      (option) => option !== defaults.aperture,
    );
    const apertureValue = FRAMING_OPTIONS.aperture[apertureIndex];

    fireEvent.change(screen.getByRole("combobox", { name: "Camera" }), {
      target: { value: camera },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Lens" }), {
      target: { value: lens },
    });
    const aperture = screen.getByRole("slider", { name: "Aperture" });
    fireEvent.change(aperture, {
      target: { value: String(apertureIndex) },
    });
    expect(aperture.getAttribute("aria-valuetext")).toBe(apertureValue);

    fireEvent.click(
      screen.getByRole("button", { name: "Apply camera settings" }),
    );
    expect(onChange).toHaveBeenCalledWith({
      ...defaults,
      camera,
      lens,
      aperture: apertureValue,
    });
  });
});
