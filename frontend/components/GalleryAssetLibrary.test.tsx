import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_GALLERY_FILTER,
  filterGalleryAssets,
} from "../lib/gallery-filters";
import type { Asset } from "../types/project";
import { GalleryFilters } from "./GalleryFilters";
import { GalleryAssetCard } from "./GalleryAssetLibrary";
import { GalleryViewControls } from "./GalleryViewControls";

vi.mock("./AudioWaveform", () => ({
  ClipWaveform: ({ url }: { url: string }) => (
    <div data-testid="waveform" data-url={url} />
  ),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const makeAsset = (
  id: string,
  type: Asset["type"],
  source: Asset["source"],
): Asset => ({
  id,
  type,
  source,
  path: `${id}.media`,
  url: `file:///${id}.media`,
  prompt: "",
  resolution: "",
  createdAt: 1,
});

describe("Asset Library controls", () => {
  it("shows everything with no filters and applies selected filters inclusively", () => {
    const assets = [
      makeAsset("generated-image", "image", "generated"),
      makeAsset("uploaded-video", "video", "uploaded"),
      makeAsset("generated-audio", "audio", "generated"),
    ];

    expect(filterGalleryAssets(assets, DEFAULT_GALLERY_FILTER)).toEqual(assets);
    expect(
      filterGalleryAssets(assets, {
        types: ["image", "audio"],
        sources: [],
      }).map(({ id }) => id),
    ).toEqual(["generated-image", "generated-audio"]);
    expect(
      filterGalleryAssets(assets, {
        types: [],
        sources: ["uploaded"],
      }).map(({ id }) => id),
    ).toEqual(["uploaded-video"]);
    expect(
      filterGalleryAssets(assets, {
        types: ["video"],
        sources: ["generated"],
      }),
    ).toEqual([]);
  });

  it("allows the final active filter to turn off", () => {
    const onChange = vi.fn();
    render(
      <GalleryFilters
        filter={{ types: ["image"], sources: [] }}
        onChange={onChange}
      />,
    );

    const imageFilter = screen.getByRole("button", { name: "Image" });
    expect(imageFilter.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(imageFilter);
    expect(onChange).toHaveBeenCalledWith({ types: [], sources: [] });
  });

  it("snaps the grid slider between column counts", () => {
    const onGridColumnsChange = vi.fn();
    render(
      <GalleryViewControls
        viewMode="grid"
        onViewModeChange={vi.fn()}
        gridColumns={3}
        onGridColumnsChange={onGridColumnsChange}
      />,
    );

    const slider = screen.getByRole("slider", { name: "Grid columns" });
    expect(slider.getAttribute("step")).toBe("1");
    expect(slider.getAttribute("aria-valuetext")).toBe("3 columns");

    fireEvent.change(slider, { target: { value: "4" } });
    expect(onGridColumnsChange).toHaveBeenLastCalledWith(1);
    fireEvent.change(slider, { target: { value: "1" } });
    expect(onGridColumnsChange).toHaveBeenLastCalledWith(4);
  });
});

describe("GalleryAssetCard", () => {
  it("routes image assets through the Use image menu", () => {
    const asset: Asset = {
      id: "image-1",
      type: "image",
      path: "image.png",
      url: "file:///image.png",
      prompt: "A cat in a hat",
      resolution: "864 x 864",
      createdAt: 1,
    };
    const onUseImage = vi.fn();

    render(
      <GalleryAssetCard
        asset={asset}
        previewEnabled={false}
        onClick={vi.fn()}
        onDragStart={vi.fn()}
        onContextMenu={vi.fn()}
        onUseImage={onUseImage}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Use image" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Last Frame" }));
    expect(onUseImage).toHaveBeenCalledWith(asset, "last-frame");
  });

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
