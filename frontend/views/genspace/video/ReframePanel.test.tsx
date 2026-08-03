import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
        initialVideoPath={"C:\\clip.mp4"}
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

    expect(header.textContent).toContain("Reframe");
    expect(header.textContent).not.toContain("Reframe video");
    expect(header.textContent).toContain("Output controls");
    expect(canvas.contains(remove)).toBe(true);
    expect(screen.queryByTitle("Replace video")).toBeNull();

    fireEvent.click(remove);
    expect(screen.getByText("Drop a video to reframe")).toBeTruthy();
  });

  it("uses the persistent source layout without Reframe-only controls", async () => {
    const { container } = render(
      <ReframePanel
        initialVideoUrl="file:///clip.mp4"
        initialVideoPath={"C:\\clip.mp4"}
        initialDuration={5}
        aspectMode="16:9"
        sourceOnly
        emptyPrompt="Drop a video for relight"
        controls={<span>Resolution 540</span>}
      />,
    );

    const header = screen.getByTestId("video-source-header");
    const canvas = screen.getByTestId("video-source-canvas");
    const remove = screen.getByRole("button", { name: "Remove Source Video" });

    expect(header.textContent).toContain("Source video");
    expect(header.textContent).toContain("Resolution 540");
    expect(canvas.contains(remove)).toBe(true);
    expect(screen.queryByRole("button", { name: "Reset frame and zoom" })).toBeNull();
    expect(screen.queryByRole("slider", { name: "Reframe zoom" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Confirm" })).toBeNull();

    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    Object.defineProperties(video!, {
      videoWidth: { configurable: true, value: 1920 },
      videoHeight: { configurable: true, value: 1024 },
    });
    fireEvent.loadedMetadata(video!);
    await waitFor(() =>
      expect(Number.parseFloat(canvas.style.aspectRatio)).toBeCloseTo(
        1920 / 1024,
      ),
    );

    fireEvent.click(remove);
    expect(screen.getByText("Drop a video for relight")).toBeTruthy();
  });

  it("fills the selected output-aspect canvas with zero frame inset", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      bottom: 225,
      height: 225,
      left: 0,
      right: 400,
      top: 0,
      width: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const { container } = render(
      <ReframePanel
        initialVideoUrl="file:///clip.mp4"
        initialVideoPath={"C:\\clip.mp4"}
        initialDuration={5}
        aspectMode="16:9"
      />,
    );

    const canvas = screen.getByTestId("video-reframe-canvas");
    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    Object.defineProperties(video!, {
      videoWidth: { configurable: true, value: 1920 },
      videoHeight: { configurable: true, value: 1024 },
    });
    fireEvent.loadedMetadata(video!);

    await waitFor(() =>
      expect(Number.parseFloat(canvas.style.aspectRatio)).toBeCloseTo(16 / 9),
    );
    expect(canvas.className).not.toContain("aspect-video");
    expect(canvas.className).not.toContain("max-h-");
    expect(canvas.parentElement?.parentElement?.className).toContain("px-4");
    expect(canvas.parentElement?.parentElement?.className).toContain("py-3");

    const panTarget = await screen.findByTitle("Drag to pan video");
    expect(panTarget.style.left).toBe("0px");
    expect(panTarget.style.top).toBe("0px");
    expect(panTarget.style.width).toBe("400px");
    expect(panTarget.style.height).toBe("225px");
  });

  it("restores the shared source trim when entering Reframe", async () => {
    const onChange = vi.fn();
    render(
      <ReframePanel
        initialVideoUrl="file:///clip.mp4"
        initialVideoPath={"C:\\clip.mp4"}
        initialDuration={8}
        initialStartTime={1}
        initialTrimDuration={3}
        aspectMode="16:9"
        onChange={onChange}
      />,
    );

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          videoUrl: "file:///clip.mp4",
          startTime: 1,
          duration: 3,
          videoDuration: 8,
        }),
      ),
    );
  });

  it("does not reset live trim state when initial props change", async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <ReframePanel
        initialVideoUrl="file:///clip.mp4"
        initialVideoPath={"C:\\clip.mp4"}
        initialDuration={8}
        initialStartTime={1}
        initialTrimDuration={3}
        aspectMode="16:9"
        resetKey={0}
        onChange={onChange}
      />,
    );
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ startTime: 1, duration: 3 }),
      ),
    );

    rerender(
      <ReframePanel
        initialVideoUrl="file:///clip.mp4"
        initialVideoPath={"C:\\clip.mp4"}
        initialDuration={8}
        initialStartTime={2}
        initialTrimDuration={4}
        aspectMode="16:9"
        resetKey={0}
        onChange={onChange}
      />,
    );
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ startTime: 1, duration: 3 }),
    );
  });
});
