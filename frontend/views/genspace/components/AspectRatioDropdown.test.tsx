import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  ASPECT_RATIO_OPTIONS,
  AspectRatioDropdown,
} from "./AspectRatioDropdown";

afterEach(cleanup);

describe("AspectRatioDropdown", () => {
  it("renders square first and landscape/portrait pairs with ratio icons", () => {
    render(
      <AspectRatioDropdown value="16:9" onChange={() => undefined} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "16:9" }));
    const menu = screen.getByText("ASPECT RATIO").parentElement;
    if (!menu) throw new Error("Aspect ratio menu missing");
    const labels = within(menu)
      .getAllByRole("button")
      .map((button) => button.textContent?.trim());

    expect(labels).toEqual([...ASPECT_RATIO_OPTIONS]);
    expect(menu.querySelectorAll("[data-aspect-ratio]")).toHaveLength(
      ASPECT_RATIO_OPTIONS.length,
    );
    expect(menu.dataset.preferredPlacement).toBe("top-end");
    expect(menu.parentElement).toBe(document.body);
  });

  it("shows Auto instead of a stale ratio when media owns the aspect", () => {
    render(
      <AspectRatioDropdown
        value="16:9"
        disabled
        onChange={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: "Auto" })).toBeTruthy();
    expect(screen.queryByText("16:9")).toBeNull();
  });
});
