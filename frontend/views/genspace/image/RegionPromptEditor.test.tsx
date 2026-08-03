import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createEmptyRegionPrompt,
  serializeRegionPrompt,
  type RegionPromptState,
} from "./region-prompt";
import { RegionPromptEditor } from "./RegionPromptEditor";

afterEach(cleanup);

function RegionPromptHarness() {
  const [value, setValue] = useState<RegionPromptState>(
    createEmptyRegionPrompt,
  );
  return (
    <>
      <RegionPromptEditor
        value={value}
        onChange={setValue}
        aspectRatio="16:9"
        disabled={false}
      />
      <output data-testid="serialized-region-prompt">
        {serializeRegionPrompt(value)}
      </output>
    </>
  );
}

describe("RegionPromptEditor", () => {
  it("organizes disclosures and edits progressive swatches, presets, and custom values", () => {
    const { container } = render(<RegionPromptHarness />);

    const summaries = [...container.querySelectorAll("summary")].map(
      (summary) => summary.textContent,
    );
    expect(summaries).toEqual(["Global Prompt", "Style"]);
    expect(
      screen
        .getByText("Global Prompt")
        .closest("details")
        ?.hasAttribute("open"),
    ).toBe(false);
    expect(
      screen.getByText("Style").closest("details")?.hasAttribute("open"),
    ).toBe(false);

    const canvas = screen.getByTestId("region-layout-canvas");
    expect(canvas.style.aspectRatio).toBe("16 / 9");
    expect(screen.getByLabelText("Global colors count").textContent).toBe(
      "0/16",
    );
    expect(screen.getAllByLabelText(/^Set global color \d+$/)).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Add box" }));
    expect(screen.getByLabelText("Region colors count").textContent).toBe(
      "0/6",
    );
    expect(screen.getAllByLabelText(/^Set region color \d+$/)).toHaveLength(1);
    expect(
      screen.getByTestId("selected-region-settings").dataset.regionColor,
    ).toBe("#38BDF8");
    expect(screen.queryByText(/\[\d+,\s*\d+,\s*\d+,\s*\d+\]/)).toBeNull();

    fireEvent.change(screen.getByLabelText("Region description"), {
      target: { value: "A red balloon" },
    });
    const box = screen.getByRole("group", {
      name: "Region 1: A red balloon",
    });
    fireEvent.keyDown(box, { key: "ArrowRight" });

    fireEvent.click(screen.getByRole("button", { name: "Text" }));
    expect(screen.queryByLabelText("Region description")).toBeNull();
    fireEvent.change(screen.getByLabelText("Text Copy"), {
      target: { value: "UP" },
    });
    expect(
      screen.getByPlaceholderText("Text Copy Goes Here..."),
    ).toBeTruthy();
    expect(
      (screen.getByLabelText("Custom region font") as HTMLInputElement)
        .disabled,
    ).toBe(true);
    fireEvent.change(screen.getByLabelText("Region font preset"), {
      target: { value: "Montserrat" },
    });
    fireEvent.change(screen.getByLabelText("Region font preset"), {
      target: { value: "custom" },
    });
    expect(
      (screen.getByLabelText("Custom region font") as HTMLInputElement)
        .disabled,
    ).toBe(false);
    fireEvent.change(screen.getByLabelText("Custom region font"), {
      target: { value: "Cooper Black" },
    });
    fireEvent.change(screen.getByLabelText("Set region color 1"), {
      target: { value: "#abcdef" },
    });
    expect(screen.getByLabelText("Clear region color 1")).toBeTruthy();
    expect(screen.getByLabelText("Region colors count").textContent).toBe(
      "1/6",
    );
    expect(screen.getAllByLabelText(/^Set region color \d+$/)).toHaveLength(2);

    expect(screen.getByText("Camera settings")).toBeTruthy();
    expect(
      (screen.getByLabelText("Custom region medium") as HTMLInputElement)
        .disabled,
    ).toBe(true);
    fireEvent.click(
      screen.getByRole("button", { name: "Open camera settings" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "DSLR Portrait" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Apply camera settings" }),
    );
    expect(
      JSON.parse(
        screen.getByTestId("serialized-region-prompt").textContent || "",
      ).style_description.photo,
    ).toContain("Canon EOS R5");

    fireEvent.change(screen.getByLabelText("Region medium preset"), {
      target: { value: "illustration" },
    });
    expect(screen.queryByText("Camera settings")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Add Art style presets" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Watercolor" }));
    expect(
      screen.getByRole("dialog", { name: "Art style presets" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Oil painting" }));
    expect(
      screen.getByRole("dialog", { name: "Art style presets" }),
    ).toBeTruthy();
    fireEvent.pointerDown(document.body);
    expect(
      screen.queryByRole("dialog", { name: "Art style presets" }),
    ).toBeNull();
    fireEvent.change(screen.getByLabelText("Art style"), {
      target: { value: "Watercolor, Oil painting, Risograph" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Add Lighting presets" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Golden hour" }));
    fireEvent.pointerDown(document.body);
    fireEvent.click(
      screen.getByRole("button", { name: "Add Aesthetics presets" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Cinematic" }));
    fireEvent.pointerDown(document.body);
    fireEvent.change(screen.getByLabelText("Region medium preset"), {
      target: { value: "custom" },
    });
    expect(
      (screen.getByLabelText("Custom region medium") as HTMLInputElement)
        .disabled,
    ).toBe(false);
    fireEvent.change(screen.getByLabelText("Custom region medium"), {
      target: { value: "mixed media" },
    });
    fireEvent.change(screen.getByLabelText("Set global color 1"), {
      target: { value: "#123456" },
    });
    expect(screen.getByLabelText("Global colors count").textContent).toBe(
      "1/16",
    );
    expect(screen.getAllByLabelText(/^Set global color \d+$/)).toHaveLength(2);

    const serialized = screen.getByTestId(
      "serialized-region-prompt",
    ).textContent;
    expect(JSON.parse(serialized || "")).toMatchObject({
      style_description: {
        aesthetics: "Cinematic",
        lighting: "Golden hour",
        art_style: "Watercolor, Oil painting, Risograph",
        medium: "mixed media",
        color_palette: ["#123456"],
      },
      compositional_deconstruction: {
        elements: [
          {
            type: "text",
            bbox: [70, 80, 410, 500],
            text: "UP",
            desc: "Font: Cooper Black.",
            color_palette: ["#ABCDEF"],
          },
        ],
      },
    });

    fireEvent.click(screen.getByLabelText("Clear region color 1"));
    expect(screen.queryByLabelText("Clear region color 1")).toBeNull();
    expect(screen.getByLabelText("Region colors count").textContent).toBe(
      "0/6",
    );
    expect(screen.getAllByLabelText(/^Set region color \d+$/)).toHaveLength(1);
    expect(
      JSON.parse(
        screen.getByTestId("serialized-region-prompt").textContent || "",
      ).compositional_deconstruction.elements[0],
    ).not.toHaveProperty("color_palette");

    fireEvent.click(screen.getByRole("button", { name: "Add box" }));
    expect(
      screen.getByTestId("selected-region-settings").dataset.regionColor,
    ).toBe("#FB923C");
    fireEvent.click(
      screen.getByRole("button", { name: "Delete selected region" }),
    );
    expect(
      screen.getByTestId("selected-region-settings").dataset.regionColor,
    ).toBe("#38BDF8");
    fireEvent.click(
      screen.getByRole("button", { name: "Delete selected region" }),
    );
    expect(
      screen.getByTestId("serialized-region-prompt").textContent,
    ).toBe("");
  });

  it("cycles overlapping regions and resizes the revealed region", () => {
    render(<RegionPromptHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Add box" }));
    fireEvent.click(screen.getByRole("button", { name: "Add box" }));

    const canvas = screen.getByTestId("region-layout-canvas");
    Object.defineProperty(canvas, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        bottom: 1000,
        height: 1000,
        left: 0,
        right: 1000,
        top: 0,
        width: 1000,
        x: 0,
        y: 0,
      }),
    });

    const regionOne = () =>
      screen.getByRole("group", { name: "Region 1: Untitled" });
    const regionTwo = () =>
      screen.getByRole("group", { name: "Region 2: Untitled" });
    const regionGeometry = (region: HTMLElement) => [
      region.style.top,
      region.style.left,
      region.style.width,
      region.style.height,
    ];

    expect(regionTwo().style.zIndex).toBe("3");
    const geometryBeforeCycle = [
      regionGeometry(regionOne()),
      regionGeometry(regionTwo()),
    ];
    fireEvent.click(regionTwo(), {
      clientX: 200,
      clientY: 200,
      detail: 1,
    });
    expect(
      screen.getByTestId("selected-region-settings").dataset.regionColor,
    ).toBe("#38BDF8");
    expect(regionOne().style.zIndex).toBe("3");
    expect(regionTwo().style.zIndex).toBe("");
    expect(
      [regionGeometry(regionOne()), regionGeometry(regionTwo())],
    ).toEqual(geometryBeforeCycle);

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Resize region 1" }),
      { clientX: 490, clientY: 410, pointerId: 1 },
    );
    fireEvent.pointerMove(canvas, {
      clientX: 590,
      clientY: 510,
      pointerId: 1,
    });
    fireEvent.pointerUp(canvas, { pointerId: 1 });

    expect(regionOne().style.width).toBe("52%");
    expect(regionOne().style.height).toBe("44%");
    expect(regionTwo().style.width).toBe("42%");
    expect(regionTwo().style.height).toBe("34%");
  });

  it("cycles an overlapping region on long press", () => {
    vi.useFakeTimers();
    try {
      render(<RegionPromptHarness />);
      fireEvent.click(screen.getByRole("button", { name: "Add box" }));
      fireEvent.click(screen.getByRole("button", { name: "Add box" }));

      const canvas = screen.getByTestId("region-layout-canvas");
      Object.defineProperty(canvas, "getBoundingClientRect", {
        configurable: true,
        value: () => ({
          bottom: 1000,
          height: 1000,
          left: 0,
          right: 1000,
          top: 0,
          width: 1000,
          x: 0,
          y: 0,
        }),
      });
      const regionTwo = screen.getByRole("group", {
        name: "Region 2: Untitled",
      });
      fireEvent.pointerDown(regionTwo, {
        clientX: 200,
        clientY: 200,
        pointerId: 1,
      });
      act(() => vi.advanceTimersByTime(520));

      expect(
        screen.getByTestId("selected-region-settings").dataset.regionColor,
      ).toBe("#38BDF8");
      fireEvent.pointerUp(canvas, { pointerId: 1 });
    } finally {
      vi.useRealTimers();
    }
  });
});
