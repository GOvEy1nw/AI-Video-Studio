import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { GenPanelSection } from "./GenPanelSection";

afterEach(cleanup);

describe("GenPanelSection", () => {
  it("keeps existing sections expanded by default", () => {
    render(
      <GenPanelSection title="Settings">
        <span>Content</span>
      </GenPanelSection>,
    );

    expect(screen.getByText("Settings").closest("details")).toBeNull();
  });

  it("uses native disclosure behavior when collapsible", async () => {
    render(
      <GenPanelSection title="Settings" collapsible>
        <span>Content</span>
      </GenPanelSection>,
    );
    const details = screen.getByText("Settings").closest("details");

    expect(details).toHaveProperty("open", false);
    await userEvent.click(screen.getByText("Settings"));
    expect(details).toHaveProperty("open", true);
  });
});
