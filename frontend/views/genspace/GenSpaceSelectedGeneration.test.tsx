import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Asset } from "../../types/project";
import {
  GenSpaceSelectedGeneration,
  type GenSpaceSelectedGenerationProps,
} from "./GenSpaceSelectedGeneration";

vi.mock("../../components/DownloadProgressView", () => ({
  DownloadProgressView: () => null,
}));

vi.mock("../../components/AudioWaveform", () => ({
  ClipWaveform: ({
    progress,
  }: {
    progress?: number;
  }) => <div data-testid="clip-waveform" data-progress={progress} />,
}));

const noop = () => undefined;

function generation(
  patch: Partial<GenSpaceSelectedGenerationProps["generation"]> = {},
): GenSpaceSelectedGenerationProps["generation"] {
  return {
    isRunning: false,
    isSelected: false,
    isCancelling: false,
    previewUrl: null,
    modelDownload: null,
    modelLifecycleActive: false,
    statusMessage: "",
    progress: 0,
    badges: [],
    modelName: "Krea 2 Turbo",
    onSelect: noop,
    cancel: noop,
    ...patch,
  };
}

function props(
  patch: Partial<GenSpaceSelectedGenerationProps> = {},
): GenSpaceSelectedGenerationProps {
  return {
    asset: null,
    generation: generation(),
    selectedIndex: -1,
    visibleAssetCount: 0,
    copiedPrompt: false,
    canGoPrev: false,
    canGoNext: false,
    onClose: noop,
    onPrevious: noop,
    onNext: noop,
    onCopyPrompt: noop,
    onToggleFavorite: noop,
    onUseImage: noop,
    onReframe: noop,
    onCopySettings: noop,
    onDelete: noop,
    ...patch,
  };
}

describe("GenSpaceSelectedGeneration", () => {
  it("shows selected asset metadata, prompt, and actions", () => {
    const asset: Asset = {
      id: "image-1",
      type: "image",
      path: "C:\\image.png",
      url: "file:///C:/image.png",
      prompt: "A cat in a hat",
      resolution: "864 x 864",
      generationTimeSeconds: 14,
      createdAt: 1_700_000_000_000,
      generationParams: {
        mode: "text-to-image",
        prompt: "A cat in a hat",
        model: "krea2_turbo",
        duration: 5,
        resolution: "864 x 864",
        fps: 24,
        audio: false,
        cameraMotion: "none",
      },
    };
    const onFavorite = vi.fn();
    const onUseImage = vi.fn();
    const onCopySettings = vi.fn();
    const onDelete = vi.fn();

    render(
      <GenSpaceSelectedGeneration
        {...props({
          asset,
          modelName: "Krea 2 Turbo",
          selectedIndex: 1,
          visibleAssetCount: 3,
          onToggleFavorite: onFavorite,
          onUseImage,
          onCopySettings,
          onDelete,
        })}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "A cat in a hat" }),
    ).toBeTruthy();
    expect(screen.getAllByText("A cat in a hat")).toHaveLength(1);
    expect(screen.getByText("Krea 2 Turbo")).toBeTruthy();
    expect(screen.getByText("864 x 864")).toBeTruthy();
    expect(screen.getByText("14s")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Favorite" }));
    fireEvent.click(screen.getByRole("button", { name: "Use image" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "First Frame" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(onFavorite).toHaveBeenCalledWith(asset);
    expect(onUseImage).toHaveBeenCalledWith(asset, "first-frame");
    expect(onCopySettings).toHaveBeenCalledWith(asset);
    expect(onDelete).toHaveBeenCalledWith(asset);
  });

  it("shows progress when the active generation card is selected", () => {
    const cancel = vi.fn();
    render(
      <GenSpaceSelectedGeneration
        {...props({
          generation: generation({
            isRunning: true,
            isSelected: true,
            progress: 48,
            statusMessage: "Generating image...",
            badges: ["Step 12/25"],
            cancel,
          }),
        })}
      />,
    );

    expect(screen.getByText("Generating image...")).toBeTruthy();
    expect(screen.getByText("48%")).toBeTruthy();
    expect(screen.getByText("Step 12/25")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Cancel generation" }),
    );
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("toggles selected playback with spacebar only in active non-editable context", () => {
    const asset: Asset = {
      id: "audio-shortcut",
      type: "audio",
      path: "C:\\shortcut.wav",
      url: "file:///C:/shortcut.wav",
      prompt: "Keyboard transport",
      resolution: "Original",
      duration: 30,
      createdAt: 1_700_000_000_000,
    };
    const { container, unmount } = render(
      <GenSpaceSelectedGeneration {...props({ asset })} />,
    );
    const audio = container.querySelector("audio")!;
    const play = vi.spyOn(audio, "play").mockResolvedValue(undefined);
    const pause = vi.spyOn(audio, "pause").mockImplementation(() => {});

    const playEvent = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      code: "Space",
    });
    window.dispatchEvent(playEvent);
    expect(play).toHaveBeenCalledOnce();
    expect(playEvent.defaultPrevented).toBe(true);

    Object.defineProperty(audio, "paused", {
      configurable: true,
      value: false,
    });
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: " ",
      }),
    );
    expect(pause).toHaveBeenCalledOnce();

    const input = document.createElement("input");
    container.appendChild(input);
    fireEvent.keyDown(input, { code: "Space" });
    expect(pause).toHaveBeenCalledOnce();

    container
      .querySelector('[data-testid="selected-generation-panel"]')!
      .setAttribute("hidden", "");
    fireEvent.keyDown(window, { code: "Space" });
    expect(pause).toHaveBeenCalledOnce();

    unmount();
    fireEvent.keyDown(window, { code: "Space" });
    expect(pause).toHaveBeenCalledOnce();
  });

  it("seeks audio from its waveform and leaves only play/pause below", () => {
    const asset: Asset = {
      id: "audio-1",
      type: "audio",
      path: "C:\\music.wav",
      url: "file:///C:/music.wav",
      prompt: "Ambient strings",
      resolution: "Original",
      duration: 185,
      createdAt: 1_700_000_000_000,
    };

    const { container } = render(
      <GenSpaceSelectedGeneration {...props({ asset })} />,
    );
    const audio = container.querySelector("audio");
    const controls = container.querySelector<HTMLElement>(
      '[data-testid="media-player-controls"]',
    )!;
    const waveform = container.querySelector<HTMLElement>(
      '[data-testid="audio-waveform"]',
    )!;

    expect(audio).toBeTruthy();
    expect(controls.classList.contains("w-full")).toBe(true);
    expect(controls.parentElement?.lastElementChild).toBe(controls);
    expect(waveform.classList.contains("w-full")).toBe(true);
    expect(controls.querySelectorAll("button")).toHaveLength(1);
    expect(
      screen.queryByRole("slider", { name: "Playback position" }),
    ).toBeNull();

    Object.defineProperty(audio!, "duration", {
      configurable: true,
      value: 185,
    });
    vi.spyOn(waveform, "getBoundingClientRect").mockReturnValue({
      left: 100,
      width: 400,
    } as DOMRect);
    fireEvent.loadedMetadata(audio!);
    fireEvent.click(waveform, { clientX: 200 });

    expect(audio!.currentTime).toBe(46.25);
    expect(waveform.getAttribute("aria-valuenow")).toBe("46.25");
    expect(
      container.querySelector<HTMLElement>('[data-testid="clip-waveform"]')!
        .dataset.progress,
    ).toBe("0.25");

    fireEvent.keyDown(waveform, { key: "ArrowRight" });
    expect(audio!.currentTime).toBe(51.25);

    fireEvent.play(audio!);
    expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
    fireEvent.pause(audio!);
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
  });

  it("uses the same pinned full-width controls for video playback", () => {
    const asset: Asset = {
      id: "video-1",
      type: "video",
      path: "C:\\video.mp4",
      url: "file:///C:/video.mp4",
      prompt: "A moving scene",
      resolution: "1920 x 1080",
      duration: 5,
      createdAt: 1_700_000_000_000,
    };

    const { container } = render(
      <GenSpaceSelectedGeneration {...props({ asset })} />,
    );
    const video = container.querySelector("video");
    const controls = container.querySelector<HTMLElement>(
      '[data-testid="media-player-controls"]',
    );

    expect(video).toBeTruthy();
    expect(controls).toBeTruthy();
    expect(video!.controls).toBe(false);
    expect(controls!.classList.contains("w-full")).toBe(true);
    expect(controls!.parentElement?.lastElementChild).toBe(controls);
    expect(
      controls!.querySelector('[aria-label="Playback position"]'),
    ).toBeTruthy();
    expect(controls!.querySelector('[aria-label="Mute"]')).toBeTruthy();
  });
});
