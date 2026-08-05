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
  onCopySettings: vi.fn(),
  onDelete: vi.fn(),
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
});
