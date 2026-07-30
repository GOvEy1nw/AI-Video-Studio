import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import {
  createEmptyRegionPrompt,
  serializeRegionPrompt,
  type RegionPromptState,
} from "./region-prompt";
import { RegionPromptEditor } from "./RegionPromptEditor";

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
    expect(summaries).toEqual(["Global Prompt", "Region", "Style"]);
    expect(
      screen
        .getByText("Global Prompt")
        .closest("details")
        ?.hasAttribute("open"),
    ).toBe(false);
    expect(
      screen.getByText("Region").closest("details")?.hasAttribute("open"),
    ).toBe(true);
    expect(
      screen.getByText("Style").closest("details")?.hasAttribute("open"),
    ).toBe(true);

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
});
