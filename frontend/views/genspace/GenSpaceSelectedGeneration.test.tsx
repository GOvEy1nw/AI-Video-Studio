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
    onCreateVideo: noop,
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
    const onCreateVideo = vi.fn();
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
          onCreateVideo,
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
    fireEvent.click(screen.getByRole("button", { name: "Create video" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(onFavorite).toHaveBeenCalledWith(asset);
    expect(onCreateVideo).toHaveBeenCalledWith(asset);
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
});
