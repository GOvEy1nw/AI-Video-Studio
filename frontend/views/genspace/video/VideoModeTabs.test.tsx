import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VideoModeTabs } from "./VideoModeTabs";

describe("VideoModeTabs", () => {
  it("keeps unavailable Retake disabled and selects a concrete tool", () => {
    const onChange = vi.fn();
    const onToolChange = vi.fn();

    render(
      <VideoModeTabs
        mode="generate"
        onChange={onChange}
        selectedTool="reframe"
        onToolChange={onToolChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Choose mode" }));
    const retake = screen.getByRole("button", {
      name: "Retake: Retake is not yet compatible with WanGP",
    });
    expect((retake as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Extend" }));
    expect(onChange).toHaveBeenCalledWith("reframe");
    expect(onToolChange).toHaveBeenCalledWith("extend");
  });
});
