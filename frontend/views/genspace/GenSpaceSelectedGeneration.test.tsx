import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Asset } from "../../types/project";
import {
  GenSpaceSelectedGeneration,
  type GenSpaceSelectedGenerationProps,
} from "./GenSpaceSelectedGeneration";

vi.mock("../../components/AudioWaveform", () => ({
  ClipWaveform: () => null,
}));

const asset: Asset = {
  id: "audio-1",
  type: "audio",
  path: "C:\\audio.mp3",
  url: "file:///C:/audio.mp3",
  prompt: "Selected audio",
  resolution: "Original",
  createdAt: 1_700_000_000_000,
};

const props: Omit<GenSpaceSelectedGenerationProps, "isActive"> = {
  asset,
  generation: {
    mode: "music",
    isRunning: false,
    isSelected: false,
    isCancelling: false,
    previewUrl: null,
    modelDownload: null,
    modelLifecycleActive: false,
    statusMessage: "",
    progress: 0,
    badges: [],
    modelName: "Test model",
    onSelect: vi.fn(),
    cancel: vi.fn(),
  },
  selectedIndex: 0,
  visibleAssetCount: 1,
  copiedPrompt: false,
  canGoPrev: false,
  canGoNext: false,
  onClose: vi.fn(),
  onPrevious: vi.fn(),
  onNext: vi.fn(),
  onCopyPrompt: vi.fn(),
  onToggleFavorite: vi.fn(),
  onUseImage: vi.fn(),
  onUseVideo: vi.fn(),
  onUpscale: vi.fn(),
  onCopySettings: vi.fn(),
  onDelete: vi.fn(),
  onSelectTake: vi.fn(),
};

describe("GenSpaceSelectedGeneration", () => {
  it("pauses selected media when its workspace becomes inactive", () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockResolvedValue(undefined);
    const pause = vi
      .spyOn(HTMLMediaElement.prototype, "pause")
      .mockImplementation(() => undefined);
    const { getByRole, rerender } = render(
      <GenSpaceSelectedGeneration {...props} isActive={true} />,
    );

    fireEvent.click(getByRole("button", { name: "Play" }));
    expect(play).toHaveBeenCalledOnce();

    rerender(<GenSpaceSelectedGeneration {...props} isActive={false} />);
    expect(pause).toHaveBeenCalledOnce();
  });

  it("offers Upscale and switches stacked versions through the active-take owner", () => {
    const onUpscale = vi.fn();
    const onSelectTake = vi.fn();
    const stackedAsset: Asset = {
      ...asset,
      type: "image",
      takes: [
        { url: "file:///C:/original.png", path: "C:\\original.png", createdAt: 1 },
        { url: "file:///C:/upscaled.png", path: "C:\\upscaled.png", createdAt: 2, generationParams: { mode: "upscale", prompt: "", model: "lanczos", duration: 5, resolution: "1024 x 1024", fps: 24, audio: false, cameraMotion: "none" } },
      ],
      activeTakeIndex: 1,
    };
    const { getByRole, getAllByRole, getByText, queryByRole, rerender } = render(
      <GenSpaceSelectedGeneration {...props} asset={stackedAsset} onUpscale={onUpscale} onSelectTake={onSelectTake} />,
    );

    fireEvent.click(getByRole("button", { name: "Upscale" }));
    const tabs = getAllByRole("tab");
    const bubbledKeyDown = vi.fn();
    window.addEventListener("keydown", bubbledKeyDown);
    tabs[1].focus();
    fireEvent.keyDown(tabs[1], { key: "ArrowLeft" });
    window.removeEventListener("keydown", bubbledKeyDown);

    expect(onUpscale).toHaveBeenCalledWith(stackedAsset);
    expect(onSelectTake).toHaveBeenCalledWith(stackedAsset.id, 0);
    expect(bubbledKeyDown).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(tabs[0]);
    expect(getByRole("tablist", { name: "Asset versions" })).toBeTruthy();
    expect(getByText(new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(2))).toBeTruthy();

    rerender(<GenSpaceSelectedGeneration {...props} asset={{ ...asset, takes: [{ url: asset.url, path: asset.path, createdAt: 1 }, { url: "file:///C:/audio-2.mp3", path: "C:\\audio-2.mp3", createdAt: 2 }] }} onUpscale={onUpscale} onSelectTake={onSelectTake} />);
    expect(queryByRole("tablist", { name: "Asset versions" })).toBeNull();
  });
});
