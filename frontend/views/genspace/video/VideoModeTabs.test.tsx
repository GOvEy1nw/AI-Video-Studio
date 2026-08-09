import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ModelProfile } from "../../../types/model-profiles";
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
        profile={{
          availability: "available",
          videoEdits: {
            operations: [
              { id: "reframe", status: "stable", handler: "video_generation" },
              { id: "extend", status: "stable", handler: "video_generation" },
              { id: "relight", status: "hidden", handler: "video_generation" },
              {
                id: "retake",
                status: "hidden",
                handler: "retake",
                disabledReason: "Retake is not yet compatible with WanGP",
              },
            ],
          },
        } as ModelProfile}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Choose mode" }));
    const retake = screen.getByRole("button", {
      name: "Retake: Retake is not yet compatible with WanGP",
    });
    expect((retake as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole("button", { name: "Relight" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Extend" }));
    expect(onChange).toHaveBeenCalledWith("reframe");
    expect(onToolChange).toHaveBeenCalledWith("extend");
  });
});
