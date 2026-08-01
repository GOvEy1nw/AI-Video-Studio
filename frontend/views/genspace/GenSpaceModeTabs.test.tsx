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

  it("assigns each mode its accent and selected state", () => {
    render(<GenSpaceModeTabs mode="video" onChange={vi.fn()} />);

    const image = screen.getByRole("tab", { name: "Image" });
    const video = screen.getByRole("tab", { name: "Video" });
    const music = screen.getByRole("tab", { name: "Music" });

    expect(image.style.getPropertyValue("--genspace-mode-accent")).toBe(
      "var(--color-blue-500)",
    );
    expect(
      image.style.getPropertyValue("--genspace-mode-accent-hover"),
    ).toBe("var(--color-blue-400)");
    expect(video.style.getPropertyValue("--genspace-mode-accent")).toBe(
      "var(--color-violet-500)",
    );
    expect(
      video.style.getPropertyValue("--genspace-mode-accent-hover"),
    ).toBe("var(--color-violet-400)");
    expect(music.style.getPropertyValue("--genspace-mode-accent")).toBe(
      "var(--color-emerald-600)",
    );
    expect(
      music.style.getPropertyValue("--genspace-mode-accent-hover"),
    ).toBe("var(--color-emerald-500)");
    expect(video.getAttribute("aria-selected")).toBe("true");
  });

  it("keeps unavailable Retake disabled", () => {
    render(<VideoModeTabs mode="generate" onChange={vi.fn()} />);

    expect(
      (screen.getByRole("tab", { name: "Retake" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
