import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GenSpaceModeTabs } from "./GenSpaceModeTabs";
import { VideoModeTabs } from "./video/VideoModeTabs";

afterEach(cleanup);

describe("GenSpace mode tabs", () => {
  it("reports the selected generation mode", async () => {
    const onChange = vi.fn();
    render(<GenSpaceModeTabs mode="image" onChange={onChange} />);

    await userEvent.click(screen.getByRole("tab", { name: "Music" }));

    expect(onChange).toHaveBeenCalledWith("music");
  });

  it("keeps unavailable Retake disabled", () => {
    render(<VideoModeTabs mode="generate" onChange={vi.fn()} />);

    expect(
      (screen.getByRole("tab", { name: "Retake" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
