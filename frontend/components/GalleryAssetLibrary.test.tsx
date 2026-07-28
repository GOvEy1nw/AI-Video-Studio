import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Asset } from "../types/project";
import { GalleryAssetCard } from "./GalleryAssetLibrary";

vi.mock("./AudioWaveform", () => ({
  ClipWaveform: ({ url }: { url: string }) => (
    <div data-testid="waveform" data-url={url} />
  ),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("GalleryAssetCard", () => {
  it("shows model and generation time in the top-left metadata badge", () => {
    const { container } = render(
      <GalleryAssetCard
        asset={{
          id: "image-1",
          type: "image",
          path: "image.png",
          url: "file:///image.png",
          prompt: "A cat in a hat",
          resolution: "864 x 864",
          generationTimeSeconds: 14,
          createdAt: 1,
        }}
        modelName="Krea 2 Turbo"
        previewEnabled={false}
        onClick={vi.fn()}
        onDragStart={vi.fn()}
        onContextMenu={vi.fn()}
      />,
    );

    expect(screen.getByText("Krea 2 Turbo")).toBeTruthy();
    expect(screen.getByText("14s")).toBeTruthy();
    expect(container.querySelector(".aspect-square")).toBeTruthy();
    expect(container.querySelectorAll("img")).toHaveLength(1);
    expect(container.querySelector("img")?.className).toContain("object-cover");
  });

  it("stacks music variations without playing them on hover", () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockResolvedValue(undefined);
    const onSelectTake = vi.fn();
    const asset: Asset = {
      id: "music-1",
      type: "audio",
      path: "variation-1.wav",
      url: "file:///variation-1.wav",
      prompt: "A cinematic score",
      resolution: "",
      createdAt: 1,
      activeTakeIndex: 0,
      takes: [1, 2, 3, 4].map((variationIndex) => ({
        path: `variation-${variationIndex}.wav`,
        url: `file:///variation-${variationIndex}.wav`,
        createdAt: variationIndex,
        variationIndex,
      })),
    };

    const { container } = render(
      <GalleryAssetCard
        asset={asset}
        previewEnabled
        onClick={vi.fn()}
        onDragStart={vi.fn()}
        onContextMenu={vi.fn()}
        onSelectTake={onSelectTake}
      />,
    );

    const rows = screen.getAllByRole("button", {
      name: /Select music variation/,
    });
    expect(rows).toHaveLength(4);
    expect(screen.getAllByTestId("waveform")).toHaveLength(4);
    expect(container.querySelectorAll("audio")).toHaveLength(0);
    expect(screen.queryByLabelText("Previous take")).toBeNull();

    fireEvent.mouseEnter(rows[1]);
    expect(play).not.toHaveBeenCalled();
    fireEvent.click(rows[2]);
    expect(onSelectTake).toHaveBeenCalledWith(2);
  });

  it("does not play video on hover", () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockResolvedValue(undefined);
    const { container } = render(
      <GalleryAssetCard
        asset={{
          id: "video-1",
          type: "video",
          path: "video.mp4",
          url: "file:///video.mp4",
          prompt: "A city at night",
          resolution: "1920 x 1080",
          createdAt: 1,
        }}
        previewEnabled
        onClick={vi.fn()}
        onDragStart={vi.fn()}
        onContextMenu={vi.fn()}
      />,
    );

    const card = container.querySelector("[data-asset-card]");
    expect(card).toBeTruthy();
    fireEvent.mouseEnter(card!);
    expect(play).not.toHaveBeenCalled();
    expect(container.querySelector("video")?.className).toContain("object-cover");
  });
});
