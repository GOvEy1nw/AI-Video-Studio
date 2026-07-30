import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CroppableMediaInputSlot } from "./CroppableMediaInputSlot";

describe("croppable media input", () => {
  it("opens a crop-box-only popover and applies an aspect-locked recipe", () => {
    const onCropChange = vi.fn();
    render(
      <CroppableMediaInputSlot
        item={{
          id: "image",
          url: "file:///C:/image.png",
          role: "start_image",
          type: "image",
        }}
        kind="image"
        title="Start image"
        onDrop={() => undefined}
        onCropChange={onCropChange}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Crop image input" });
    expect(trigger.className).toContain("opacity-0");
    fireEvent.click(trigger);

    expect(screen.getByRole("dialog", { name: "Crop media" })).toBeTruthy();
    expect(screen.getByRole("application", { name: "Crop box" })).toBeTruthy();
    expect(screen.queryByRole("slider")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "4:3" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply crop" }));

    expect(onCropChange).toHaveBeenCalledWith({
      aspectRatio: "4:3",
      x: 0,
      y: 0.125,
      width: 1,
      height: 0.75,
    });
    expect(screen.queryByRole("dialog", { name: "Crop media" })).toBeNull();
  });
});
