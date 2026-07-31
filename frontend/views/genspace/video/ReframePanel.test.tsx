import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReframePanel } from "./ReframePanel";

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private readonly callback: ResizeObserverCallback) {}

      observe() {
        this.callback([], this as unknown as ResizeObserver);
      }

      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ReframePanel", () => {
  it("uses the shared header and an overlaid remove action without Replace", () => {
    render(
      <ReframePanel
        initialVideoUrl="file:///clip.mp4"
        initialVideoPath="C:\\clip.mp4"
        initialDuration={5}
        aspectMode="16:9"
        controls={<span>Output controls</span>}
      />,
    );

    const header = screen.getByTestId("video-reframe-header");
    const canvas = screen.getByTestId("video-reframe-canvas");
    const remove = screen.getByRole("button", {
      name: "Remove Reframe Video",
    });

    expect(header.textContent).toContain("Reframe video");
    expect(header.textContent).toContain("Output controls");
    expect(canvas.contains(remove)).toBe(true);
    expect(screen.queryByTitle("Replace video")).toBeNull();

    fireEvent.click(remove);
    expect(screen.getByText("Drop a video to reframe")).toBeTruthy();
  });
});
