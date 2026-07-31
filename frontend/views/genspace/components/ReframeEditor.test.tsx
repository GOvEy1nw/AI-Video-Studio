import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ReframeEditor,
  type ReframeEditorValue,
} from "./ReframeEditor";

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      private readonly callback: ResizeObserverCallback;

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
      }

      observe(element: Element) {
        vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
          x: 0,
          y: 0,
          top: 0,
          right: 640,
          bottom: 360,
          left: 0,
          width: 640,
          height: 360,
          toJSON: () => ({}),
        });
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

function ImageHarness({ initialZoom = 0 }: { initialZoom?: number }) {
  const [value, setValue] = useState<ReframeEditorValue>({
    aspectMode: "16:9",
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  return (
    <>
      <ReframeEditor
        mediaType="image"
        mediaUrl="file:///master.png"
        sourceWidth={1600}
        sourceHeight={900}
        value={value}
        onChange={setValue}
        canvasStyle={{ width: 640, height: 360 }}
        initialZoom={initialZoom}
      />
      <output data-testid="frame-state">{JSON.stringify(value)}</output>
    </>
  );
}

describe("ReframeEditor", () => {
  it("keeps matching media fitted when zoom returns to zero", () => {
    render(<ImageHarness initialZoom={20} />);

    expect(screen.getByTestId("frame-state").textContent).not.toContain(
      '"padding":{"top":0,"bottom":0,"left":0,"right":0}',
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Landscape 16:9" }),
    );

    expect(
      (screen.getByRole("slider", {
        name: "Outpaint expansion",
      }) as HTMLInputElement).value,
    ).toBe("0");
    expect(screen.getByTestId("frame-state").textContent).toContain(
      '"padding":{"top":0,"bottom":0,"left":0,"right":0}',
    );
  });

  it("supports custom mirrored edge dragging", () => {
    render(<ImageHarness />);
    const frame = document.querySelector(
      ".border-dashed.border-blue-400",
    );
    expect(frame?.className).toContain("box-border");

    fireEvent.click(
      screen.getByRole("button", { name: "Custom aspect ratio" }),
    );

    const edge = document.querySelector(
      'div[style*="cursor: ew-resize"]',
    );
    expect(edge).not.toBeNull();
    fireEvent.mouseDown(edge as Element, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(window, { clientX: -40, clientY: 0 });
    fireEvent.mouseUp(window);

    const state = JSON.parse(
      screen.getByTestId("frame-state").textContent ?? "{}",
    ) as ReframeEditorValue;
    expect(state.aspectMode).toBe("custom");
    expect(state.padding.left + state.padding.right).toBeGreaterThan(0);
  });

  it("renders video media through the same editor", () => {
    const videoRef = createRef<HTMLVideoElement>();
    render(
      <ReframeEditor
        mediaType="video"
        mediaUrl="file:///source.mp4"
        sourceWidth={1920}
        sourceHeight={1080}
        value={{
          aspectMode: "16:9",
          padding: { top: 0, bottom: 0, left: 0, right: 0 },
        }}
        onChange={() => undefined}
        videoRef={videoRef}
        canvasStyle={{ width: 640, height: 360 }}
      />,
    );

    expect(document.querySelector("video")).not.toBeNull();
  });
});
