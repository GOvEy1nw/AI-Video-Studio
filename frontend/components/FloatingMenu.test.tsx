import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FloatingMenu,
  FloatingSubmenu,
  getFloatingMenuPosition,
  type FloatingMenuPlacement,
} from "./FloatingMenu";

const viewport = { height: 600, width: 800 };
const menu = { height: 160, width: 180 };

afterEach(cleanup);

function position(
  anchor: {
    bottom: number;
    height: number;
    left: number;
    right: number;
    top: number;
    width: number;
  },
  placement: FloatingMenuPlacement,
) {
  return getFloatingMenuPosition({
    anchor,
    gap: 8,
    menu,
    placement,
    viewport,
  });
}

describe("getFloatingMenuPosition", () => {
  it("opens above when preferred bottom placement would cross the frame", () => {
    expect(
      position(
        {
          bottom: 580,
          height: 30,
          left: 200,
          right: 300,
          top: 550,
          width: 100,
        },
        "bottom-start",
      ),
    ).toEqual({ left: 200, placement: "top-start", top: 382 });
  });

  it("opens left when a right-side submenu would cross the frame", () => {
    expect(
      position(
        {
          bottom: 240,
          height: 40,
          left: 760,
          right: 790,
          top: 200,
          width: 30,
        },
        "right-start",
      ),
    ).toEqual({ left: 572, placement: "left-start", top: 200 });
  });

  it("changes alignment before clamping a menu against the right edge", () => {
    expect(
      position(
        {
          bottom: 140,
          height: 40,
          left: 750,
          right: 790,
          top: 100,
          width: 40,
        },
        "bottom-start",
      ),
    ).toEqual({ left: 610, placement: "bottom-end", top: 148 });
  });
});

describe("FloatingMenu", () => {
  it("renders through document.body above normal app stacking contexts", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const anchor = document.createElement("button");
    host.append(anchor);

    render(
      <FloatingMenu anchorRef={{ current: anchor }} role="menu">
        Menu content
      </FloatingMenu>,
      { container: host },
    );

    const floatingMenu = screen.getByRole("menu");
    expect(floatingMenu.parentElement).toBe(document.body);
    expect(floatingMenu.classList.contains("z-[2147483647]")).toBe(true);
    expect(floatingMenu.style.maxHeight).toBe("calc(100vh - 16px)");
    expect(floatingMenu.style.maxWidth).toBe("calc(100vw - 16px)");
  });

  it("keeps portaled submenu content interactive", () => {
    const onSelect = vi.fn();
    render(
      <FloatingSubmenu
        menuContent={<button onClick={onSelect}>Nested action</button>}
      >
        <span>More</span>
      </FloatingSubmenu>,
    );

    fireEvent.mouseEnter(screen.getByText("More"));

    const submenu = screen.getByRole("menu");
    expect(submenu.parentElement).toBe(document.body);
    fireEvent.click(screen.getByRole("button", { name: "Nested action" }));
    expect(onSelect).toHaveBeenCalledOnce();
  });
});
