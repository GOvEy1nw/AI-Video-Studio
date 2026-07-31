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

function ImageHarness({ initialZoom = 100 }: { initialZoom?: number }) {
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
        controls={<span>Output controls</span>}
      />
      <button
        type="button"
        onClick={() =>
          setValue((current) => ({ ...current, aspectMode: "4:3" }))
        }
      >
        Set 4:3
      </button>
      <output data-testid="frame-state">{JSON.stringify(value)}</output>
    </>
  );
}

describe("ReframeEditor", () => {
  it("uses 100% for fill, 0% for half-size, and resets to fill", () => {
    render(<ImageHarness />);

    expect(screen.getByTestId("frame-state").textContent).toContain(
      '"padding":{"top":0,"bottom":0,"left":0,"right":0}',
    );

    fireEvent.change(screen.getByRole("slider", { name: "Reframe zoom" }), {
      target: { value: "0" },
    });
    const halfSizeState = JSON.parse(
      screen.getByTestId("frame-state").textContent ?? "{}",
    ) as ReframeEditorValue;
    expect(halfSizeState.padding).toEqual({
      top: 50,
      bottom: 50,
      left: 50,
      right: 50,
    });

    fireEvent.click(screen.getByRole("button", { name: "Reset frame and zoom" }));

    expect(
      (screen.getByRole("slider", {
        name: "Reframe zoom",
      }) as HTMLInputElement).value,
    ).toBe("100");
    expect(screen.getByTestId("frame-state").textContent).toContain(
      '"padding":{"top":0,"bottom":0,"left":0,"right":0}',
    );
  });

  it("places supplied output controls before reset and zoom controls", () => {
    render(<ImageHarness />);
    const header = screen.getByTestId("reframe-editor-header");
    const outputControls = screen.getByText("Output controls");
    const reset = screen.getByRole("button", { name: "Reset frame and zoom" });

    expect(header.contains(outputControls)).toBe(true);
    expect(
      outputControls.compareDocumentPosition(reset) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);
  });

  it("applies an external preset and exposes no custom aspect control", () => {
    render(<ImageHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Set 4:3" }));

    const state = JSON.parse(
      screen.getByTestId("frame-state").textContent ?? "{}",
    ) as ReframeEditorValue;
    expect(state.aspectMode).toBe("4:3");
    expect(state.padding.top + state.padding.bottom).toBeGreaterThan(0);
    expect(
      (screen.getByRole("slider", { name: "Reframe zoom" }) as HTMLInputElement)
        .disabled,
    ).toBe(false);
    expect(
      screen.queryByRole("button", { name: "Custom aspect ratio" }),
    ).toBeNull();
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
