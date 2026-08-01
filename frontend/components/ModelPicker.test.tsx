import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import type { ModelProfile } from "../types/model-profiles";
import { groupModelProfiles, ModelPicker } from "./ModelPicker";

afterEach(cleanup);

function profile(
  id: string,
  displayName: string,
  family: string,
): ModelProfile {
  return {
    id,
    displayName,
    status: "stable",
    availability: "available",
    wangpMetadata: { family },
  } as ModelProfile;
}

const fast = profile("fast", "ACE-Step 1.5 Fast", "music");
const xl = profile("xl", "ACE-Step 1.5 XL", "music");

function Harness() {
  const [value, setValue] = useState(fast.id);
  return (
    <>
      <ModelPicker
        profiles={[fast, xl]}
        value={value}
        onChange={setValue}
        icon={<span>Music</span>}
      />
      <output data-testid="selected-model">{value}</output>
    </>
  );
}

describe("ModelPicker", () => {
  it("switches variants directly from family chips", () => {
    render(<Harness />);

    const fastChip = screen.getByRole("button", {
      name: "Select ACE-Step 1.5 Fast",
    });
    const xlChip = screen.getByRole("button", {
      name: "Select ACE-Step 1.5 XL",
    });
    expect(fastChip.getAttribute("aria-pressed")).toBe("true");
    expect(xlChip.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(xlChip);
    expect(screen.getByTestId("selected-model").textContent).toBe("xl");
    expect(xlChip.getAttribute("aria-pressed")).toBe("true");
  });

  it("shows the same variant chips in the dropdown and closes after selection", () => {
    render(<Harness />);

    fireEvent.click(screen.getByText("ACE-Step 1.5").closest("button")!);
    const xlOption = screen.getByRole("button", { name: "ACE-Step 1.5 XL" });
    fireEvent.click(xlOption);

    expect(screen.getByTestId("selected-model").textContent).toBe("xl");
    expect(
      screen.queryByRole("button", { name: "ACE-Step 1.5 Fast" }),
    ).toBeNull();
  });

  it("selects the first variant when the dropdown family label is clicked", () => {
    render(<Harness />);

    fireEvent.click(
      screen.getByRole("button", { name: "Select ACE-Step 1.5 XL" }),
    );
    fireEvent.click(screen.getByText("ACE-Step 1.5").closest("button")!);
    fireEvent.click(
      screen.getByRole("button", { name: "Select ACE-Step 1.5" }),
    );

    expect(screen.getByTestId("selected-model").textContent).toBe("fast");
    expect(
      screen.queryByRole("button", { name: "ACE-Step 1.5 XL" }),
    ).toBeNull();
  });

  it("keeps incompatible or single-profile families as separate full labels", () => {
    const create = profile("create", "Qwen Image", "qwen");
    const edit = profile("edit", "Qwen Image Edit", "qwen");

    expect(groupModelProfiles([create])).toEqual([
      expect.objectContaining({ label: "Qwen Image", grouped: false }),
    ]);
    expect(groupModelProfiles([create, edit])).toEqual([
      expect.objectContaining({ label: "Qwen Image", grouped: false }),
      expect.objectContaining({ label: "Qwen Image Edit", grouped: false }),
    ]);
  });
});
