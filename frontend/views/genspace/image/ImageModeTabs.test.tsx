import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ImageModeTabs } from "./ImageModeTabs";

describe("ImageModeTabs", () => {
  it("exposes independent Create, Edit, and Region selections", () => {
    const onChange = vi.fn();
    render(<ImageModeTabs mode="create" onChange={onChange} />);

    expect(
      screen
        .getByRole("button", { name: "Create" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "Region" }));

    expect(onChange).toHaveBeenNthCalledWith(1, "edit");
    expect(onChange).toHaveBeenNthCalledWith(2, "region");
  });
});
