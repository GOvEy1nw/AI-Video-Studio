import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { GenPanelSection } from "./GenPanelSection";

afterEach(cleanup);

describe("GenPanelSection", () => {
  it("renders section content without prescribing disclosure defaults", () => {
    render(
      <GenPanelSection title="Settings">
        <span>Content</span>
      </GenPanelSection>,
    );

    expect(screen.getByText("Settings")).toBeTruthy();
    expect(screen.getByText("Content")).toBeTruthy();
  });

  it("honors an explicit collapsed state and toggles from it", async () => {
    render(
      <GenPanelSection title="Settings" collapsible collapsed>
        <span>Content</span>
      </GenPanelSection>,
    );
    const details = screen.getByText("Settings").closest("details");

    expect(details).toHaveProperty("open", false);
    await userEvent.click(screen.getByText("Settings"));
    expect(details).toHaveProperty("open", true);
  });
});
