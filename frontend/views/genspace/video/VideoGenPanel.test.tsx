import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GenSpaceMediaInput, VideoProcessMode } from "../types";
import type { VideoGenPanelController, VideoGenSettings } from "../types";
import { VideoGenPanel } from "./VideoGenPanel";
import type { VideoToolId } from "../../../types/video-tools";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private readonly callback: ResizeObserverCallback) {}

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

function VideoPanelHarness({
  mode,
  initialToolInput = null,
}: {
  mode: VideoProcessMode;
  initialToolInput?: GenSpaceMediaInput | null;
}) {
  const [selectedTool, setSelectedTool] = useState<VideoToolId>("reframe");
  const [toolInput, setToolInput] =
    useState<GenSpaceMediaInput | null>(initialToolInput);
  const [reframePanelKey, setReframePanelKey] = useState(0);
  const [settings, setSettings] = useState<VideoGenSettings>({
    model: "fast",
    profileId: "ltx2_22b_distilled",
    duration: 5,
    resolution: "540p",
    fps: 24,
    aspectRatio: "16:9",
    audio: true,
  });
  const controller = {
    prompt: {
      value: "",
      setValue: vi.fn(),
      enhance: vi.fn(),
      enhanceEnabled: true,
      isEnhancing: false,
      seedLocked: false,
      lockedSeed: 1,
      setSeed: vi.fn(),
    },
    generation: {
      submit: vi.fn(),
      canSubmit: false,
      isRunning: false,
      label: "Generate",
      icon: null,
    },
    settings: {
      value: settings,
      patch: (patch: Partial<VideoGenSettings>) =>
        setSettings((current) => ({ ...current, ...patch })),
    },
    media: {
      inputImage: null,
      setInputImage: vi.fn(),
      inputAudio: null,
      setInputAudio: vi.fn(),
      inputs: [],
      setInputs: vi.fn(),
      useAudioTrack: false,
      setUseAudioTrack: vi.fn(),
      resolveInputFileUrl: vi.fn(async () => null),
      syncInputFileToGallery: vi.fn(async () => null),
    },
    profiles: { options: [], modelDownload: null },
    videoTools: {
      mode,
      setMode: vi.fn(),
      panel: () => <div data-testid="video-tool-panel" />,
      reframeDurationSeconds: 4,
      reframeAspectMode: "16:9" as const,
      reframePadding: { top: 0, bottom: 0, left: 0, right: 0 },
      reframePanelKey,
      onReframePanelChange: vi.fn(),
      setReframeAspectMode: vi.fn(),
      selectedTool,
      setSelectedTool: (tool: VideoToolId) => {
        if (tool === "reframe" && selectedTool !== "reframe") {
          setReframePanelKey((current) => current + 1);
        }
        setSelectedTool(tool);
      },
      toolInput,
      setToolInput,
    },
    framing: { value: null, setValue: vi.fn() },
  } satisfies VideoGenPanelController;

  return <VideoGenPanel controller={controller} />;
}

describe("VideoGenPanel", () => {
  it("uses a 2-20 second duration slider", () => {
    render(<VideoPanelHarness mode="generate" />);
    fireEvent.click(screen.getByRole("button", { name: "Video duration" }));

    const slider = screen.getByRole("slider", {
      name: "Video duration seconds",
    }) as HTMLInputElement;
    expect(slider.min).toBe("2");
    expect(slider.max).toBe("20");
    fireEvent.change(slider, { target: { value: "12" } });
    expect(screen.getByRole("button", { name: "Video duration" }).textContent).toContain("12s");
  });

  it("renders Reframe resolution and aspect inside the editor control row", () => {
    render(
      <VideoPanelHarness
        mode="reframe"
        initialToolInput={{
          id: "clip",
          url: "app-media://clip.mp4",
          path: "C:/clip.mp4",
          role: "control_video",
          type: "video",
          mediaDuration: 5,
        }}
      />,
    );
    const panel = within(screen.getByTestId("video-reframe-header"));

    expect(panel.getByRole("button", { name: "540" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "16:9" })).toHaveLength(1);
    fireEvent.click(panel.getByRole("button", { name: "16:9" }));
    const aspectMenu = screen.getByText("ASPECT RATIO").parentElement;
    expect(aspectMenu?.dataset.preferredPlacement).toBe("bottom-end");
    expect(aspectMenu?.parentElement).toBe(document.body);
  });

  it("presents every Video Tool and uses the persistent source-video layout", () => {
    render(<VideoPanelHarness mode="reframe" />);

    expect(screen.getByRole("tab", { name: "Tools" })).toBeTruthy();
    const modeTabs = screen.getByRole("tablist", { name: "Video mode" });
    const tools = within(screen.getByRole("group", { name: "Video tools" }));
    expect(modeTabs.nextElementSibling).toBe(tools.getByRole("button", { name: "Reframe" }).parentElement);
    for (const label of [
      "Reframe",
      "Extend",
      "Relight",
      "Colorize",
      "Clean Plate",
      "Lip Dub",
      "Decompression",
      "SDR to HDR",
      "Remove Glare",
      "Deblur",
    ]) {
      expect(tools.getByRole("button", { name: label })).toBeTruthy();
    }
    expect(
      tools.getByRole("button", { name: "Reframe" }).getAttribute("aria-pressed"),
    ).toBe("true");
    fireEvent.click(tools.getByRole("button", { name: "Relight" }));
    expect(
      tools.getByRole("button", { name: "Relight" }).getAttribute("aria-pressed"),
    ).toBe("true");
    const dropzone = screen.getByTestId("video-source-dropzone");
    expect(dropzone.hasAttribute("data-genspace-dropzone")).toBe(true);
    expect(within(dropzone).getByText("Drop a video for relight")).toBeTruthy();
    expect(within(dropzone).getByRole("button", { name: "Browse" })).toBeTruthy();
    expect(screen.queryByTestId("video-tool-panel")).toBeNull();

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [],
        getData: (type: string) =>
          type === "asset"
            ? JSON.stringify({
                type: "video",
                url: "app-media://clip.mp4",
                path: "C:/clip.mp4",
              })
            : "",
      },
    });

    const header = screen.getByTestId("video-source-header");
    const canvas = screen.getByTestId("video-source-canvas");
    const remove = screen.getByRole("button", { name: "Remove Source Video" });
    expect(header.textContent).toContain("Source video");
    expect(within(header).getByRole("button", { name: "540" })).toBeTruthy();
    expect(canvas.contains(remove)).toBe(true);
    expect(screen.queryByRole("button", { name: "Confirm" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Reset frame and zoom" })).toBeNull();
    expect(screen.queryByRole("slider", { name: "Reframe zoom" })).toBeNull();
    expect(screen.queryByRole("button", { name: "16:9" })).toBeNull();
    expect(screen.getByRole("button", { name: "auto" })).toBeTruthy();
  });

  it("keeps one mounted video editor while switching between Tools", () => {
    const { container } = render(
      <VideoPanelHarness
        mode="reframe"
        initialToolInput={{
          id: "clip",
          url: "app-media://clip.mp4",
          path: "C:/clip.mp4",
          role: "control_video",
          type: "video",
          trimStartTime: 1,
          trimDuration: 3,
          mediaDuration: 8,
        }}
      />,
    );

    const tools = within(screen.getByRole("group", { name: "Video tools" }));
    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    expect(video?.getAttribute("src")).toBe("app-media://clip.mp4");

    fireEvent.click(tools.getByRole("button", { name: "Relight" }));
    expect(container.querySelector("video")).toBe(video);
    expect(screen.getByTestId("video-source-header")).toBeTruthy();

    fireEvent.click(tools.getByRole("button", { name: "Reframe" }));
    expect(container.querySelector("video")).toBe(video);
    expect(screen.getByTestId("video-reframe-header")).toBeTruthy();
    expect(screen.getByText("Duration: 00:03.00")).toBeTruthy();
  });

  it("preserves video dimensions and Reframe controls across Tool switches", () => {
    const { container } = render(
      <VideoPanelHarness
        mode="reframe"
        initialToolInput={{
          id: "clip",
          url: "app-media://clip.mp4",
          path: "C:/clip.mp4",
          role: "control_video",
          type: "video",
          trimStartTime: 1,
          trimDuration: 3,
          mediaDuration: 8,
        }}
      />,
    );

    const tools = within(screen.getByRole("group", { name: "Video tools" }));
    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    Object.defineProperty(video!, "videoWidth", { configurable: true, value: 1920 });
    Object.defineProperty(video!, "videoHeight", { configurable: true, value: 1024 });
    fireEvent.loadedMetadata(video!);

    const initialCanvas = screen.getByTestId("video-reframe-canvas");
    expect(initialCanvas.className).toContain("rounded-lg");
    const initialZoom = screen.getByRole("slider", { name: "Reframe zoom" });
    fireEvent.change(initialZoom, { target: { value: "50" } });
    expect((initialZoom as HTMLInputElement).value).toBe("50");

    fireEvent.click(tools.getByRole("button", { name: "Relight" }));
    fireEvent.click(tools.getByRole("button", { name: "Reframe" }));

    expect(container.querySelector("video")).toBe(video);
    const returnedCanvas = screen.getByTestId("video-reframe-canvas");
    expect(returnedCanvas.className).toContain("rounded-lg");
    expect(returnedCanvas.querySelector(".border-2")).not.toBeNull();
    const returnedZoom = screen.getByRole("slider", { name: "Reframe zoom" });
    fireEvent.change(returnedZoom, { target: { value: "50" } });
    expect((returnedZoom as HTMLInputElement).value).toBe("50");

    fireEvent.click(tools.getByRole("button", { name: "Relight" }));
    const sourceCanvas = screen.getByTestId("video-source-canvas");
    expect(sourceCanvas.style.aspectRatio).toMatch(/^1\.875(?: \/ 1)?$/);
  });

  it("keeps Extend duration manual", () => {
    render(<VideoPanelHarness mode="reframe" />);

    const tools = within(screen.getByRole("group", { name: "Video tools" }));
    fireEvent.click(tools.getByRole("button", { name: "Extend" }));

    expect(screen.getByRole("button", { name: "Video duration" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "auto" })).toBeNull();
  });
});
