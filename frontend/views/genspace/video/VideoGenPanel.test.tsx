import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { VideoProcessMode } from "../types";
import type { VideoGenPanelController, VideoGenSettings } from "../types";
import { VideoGenPanel } from "./VideoGenPanel";

afterEach(cleanup);

function VideoPanelHarness({ mode }: { mode: VideoProcessMode }) {
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
      panel: (controls?: ReactNode) => (
        <div data-testid="video-tool-panel">{controls}</div>
      ),
      reframeDurationSeconds: 4,
      reframeAspectMode: "16:9" as const,
      setReframeAspectMode: vi.fn(),
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
    render(<VideoPanelHarness mode="reframe" />);
    const panel = within(screen.getByTestId("video-tool-panel"));

    expect(panel.getByRole("button", { name: "540" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "16:9" })).toHaveLength(1);
    fireEvent.click(panel.getByRole("button", { name: "16:9" }));
    expect(
      screen.getByText("ASPECT RATIO").parentElement?.classList.contains("top-full"),
    ).toBe(true);
  });
});
