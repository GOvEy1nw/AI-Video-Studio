import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_GALLERY_FILTER,
  filterGalleryAssets,
  toggleGalleryFilterValue,
} from "../lib/gallery-filters";
import type { Asset } from "../types/project";
import { GalleryFilters } from "./GalleryFilters";
import {
  GalleryAssetCard,
  GalleryAssetLibrary,
  type GalleryAssetLibraryProps,
} from "./GalleryAssetLibrary";
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

function makeLibraryProps(
  overrides: Partial<GalleryAssetLibraryProps> = {},
): GalleryAssetLibraryProps {
  const assets = [
    makeAsset("asset-one", "image", "generated"),
    makeAsset("asset-two", "video", "uploaded"),
  ];
  return {
    assets,
    visibleAssets: assets,
    bins: [],
    binColors: {},
    filter: DEFAULT_GALLERY_FILTER,
    onFilterChange: vi.fn(),
    selectedBin: null,
    onSelectedBinChange: vi.fn(),
    creatingBin: false,
    onCreatingBinChange: vi.fn(),
    newBinName: "",
    onNewBinNameChange: vi.fn(),
    onCommitNewBin: vi.fn(),
    onAssignAssetToBin: vi.fn(),
    onRenameBin: vi.fn(),
    onDeleteBin: vi.fn(),
    onSetBinColor: vi.fn(),
    binContextMenu: null,
    onBinContextMenuChange: vi.fn(),
    viewMode: "grid",
    onViewModeChange: vi.fn(),
    gridColumns: 2,
    onGridColumnsChange: vi.fn(),
    showFavorites: false,
    onShowFavoritesChange: vi.fn(),
    getThumbnailUrl: () => undefined,
    previewEnabled: false,
    onAssetDragStart: vi.fn(),
    onAssetContextMenu: vi.fn(),
    onDeleteAssets: vi.fn(),
    ...overrides,
  };
}

describe("Asset Library controls", () => {
  it("shows everything with no filters and combines selected filters", () => {
    const assets = [
      makeAsset("generated-image", "image", "generated"),
      makeAsset("uploaded-video", "video", "uploaded"),
      makeAsset("generated-audio", "audio", "generated"),
    ];

    expect(filterGalleryAssets(assets, DEFAULT_GALLERY_FILTER)).toEqual(assets);
    expect(
      filterGalleryAssets(assets, {
        types: ["image"],
        sources: ["generated"],
      }).map(({ id }) => id),
    ).toEqual(["generated-image"]);
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

  it("renders icon-only filters with accessible labels and exclusive selection", () => {
    const onChange = vi.fn();
    render(
      <GalleryFilters
        filter={{ types: ["image"], sources: ["generated"] }}
        onChange={onChange}
      />,
    );

    const imageFilter = screen.getByRole("button", { name: "Image" });
    const videoFilter = screen.getByRole("button", { name: "Video" });
    const generatedFilter = screen.getByRole("button", { name: "Generated" });
    const uploadedFilter = screen.getByRole("button", { name: "Uploaded" });

    expect(imageFilter.textContent).toBe("");
    expect(imageFilter.querySelector("svg")).toBeTruthy();
    expect(imageFilter.getAttribute("title")).toBe("Image");
    expect(imageFilter.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(videoFilter);
    expect(onChange).toHaveBeenLastCalledWith({
      types: ["video"],
      sources: ["generated"],
    });

    fireEvent.click(uploadedFilter);
    expect(onChange).toHaveBeenLastCalledWith({
      types: ["image"],
      sources: ["uploaded"],
    });

    fireEvent.click(imageFilter);
    expect(onChange).toHaveBeenLastCalledWith({
      types: [],
      sources: ["generated"],
    });

    fireEvent.click(generatedFilter);
    expect(onChange).toHaveBeenLastCalledWith({
      types: ["image"],
      sources: [],
    });
  });

  it("normalizes filter toggles to one value per group", () => {
    expect(toggleGalleryFilterValue(["image", "audio"], "video")).toEqual([
      "video",
    ]);
    expect(toggleGalleryFilterValue(["image", "audio"], "image")).toEqual([]);
  });

  it("uses hover-only scrollbar styling on the gallery scroll area", () => {
    const props: GalleryAssetLibraryProps = {
      assets: [],
      visibleAssets: [],
      bins: [],
      binColors: {},
      filter: DEFAULT_GALLERY_FILTER,
      onFilterChange: vi.fn(),
      selectedBin: null,
      onSelectedBinChange: vi.fn(),
      creatingBin: false,
      onCreatingBinChange: vi.fn(),
      newBinName: "",
      onNewBinNameChange: vi.fn(),
      onCommitNewBin: vi.fn(),
      onAssignAssetToBin: vi.fn(),
      onRenameBin: vi.fn(),
      onDeleteBin: vi.fn(),
      onSetBinColor: vi.fn(),
      binContextMenu: null,
      onBinContextMenuChange: vi.fn(),
      viewMode: "grid",
      onViewModeChange: vi.fn(),
      gridColumns: 2,
      onGridColumnsChange: vi.fn(),
      showFavorites: false,
      onShowFavoritesChange: vi.fn(),
      getThumbnailUrl: () => undefined,
      previewEnabled: false,
      onAssetDragStart: vi.fn(),
      onAssetContextMenu: vi.fn(),
    };

    const { container } = render(<GalleryAssetLibrary {...props} />);
    expect(container.querySelector(".gallery-scrollbar")).toBeTruthy();
  });

  it("supports click, keyboard, clear, and bulk-delete selection", () => {
    const onDeleteAssets = vi.fn();
    render(
      <GalleryAssetLibrary
        {...makeLibraryProps({ onDeleteAssets })}
      />,
    );

    const modeToggle = screen.getByRole("button", {
      name: "Enter multi-select mode",
    });
    fireEvent.click(modeToggle);
    expect(modeToggle.getAttribute("aria-pressed")).toBe("true");
    const cards = screen.getAllByRole("checkbox");
    expect(cards).toHaveLength(2);
    expect(cards[0].getAttribute("aria-checked")).toBe("false");

    fireEvent.click(cards[0]);
    fireEvent.keyDown(cards[1], { key: " " });
    expect(cards[0].getAttribute("aria-checked")).toBe("true");
    expect(cards[1].getAttribute("aria-checked")).toBe("true");
    expect(screen.getByText("2 selected")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(cards[0].getAttribute("aria-checked")).toBe("false");
    expect(cards[1].getAttribute("aria-checked")).toBe("false");

    fireEvent.click(cards[1]);
    fireEvent.click(
      screen.getByRole("button", { name: "Delete selected assets" }),
    );
    expect(onDeleteAssets).toHaveBeenCalledWith(["asset-two"]);
    expect(cards[1].getAttribute("aria-checked")).toBe("false");

    fireEvent.click(
      screen.getByRole("button", { name: "Exit multi-select mode" }),
    );
    expect(
      screen
        .getByRole("button", { name: "Enter multi-select mode" })
        .getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("keeps pointer clicks on cards out of marquee capture", () => {
    render(<GalleryAssetLibrary {...makeLibraryProps()} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Enter multi-select mode" }),
    );
    const card = screen.getAllByRole("checkbox")[0];
    const surface = document.querySelector(".gallery-scrollbar");
    expect(surface).toBeTruthy();
    const setPointerCapture = vi.fn();
    Object.defineProperty(surface, "setPointerCapture", {
      configurable: true,
      value: setPointerCapture,
    });

    fireEvent.pointerDown(card, {
      button: 0,
      pointerId: 1,
      clientX: 20,
      clientY: 20,
    });
    fireEvent.pointerUp(card, {
      button: 0,
      pointerId: 1,
      clientX: 20,
      clientY: 20,
    });
    fireEvent.click(card);

    expect(card.getAttribute("aria-checked")).toBe("true");
    expect(setPointerCapture).not.toHaveBeenCalled();
  });

  it("prevents native text selection while multi-select mode is active", () => {
    render(<GalleryAssetLibrary {...makeLibraryProps()} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Enter multi-select mode" }),
    );
    const surface = document.querySelector(".gallery-scrollbar");
    expect(surface).toBeTruthy();

    const selectStart = new Event("selectstart", {
      bubbles: true,
      cancelable: true,
    });
    expect(surface?.dispatchEvent(selectStart)).toBe(false);
  });

  it("selects cards intersecting a marquee box", () => {
    render(<GalleryAssetLibrary {...makeLibraryProps()} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Enter multi-select mode" }),
    );
    const cards = screen.getAllByRole("checkbox");
    const makeRect = (left: number, top: number, right: number, bottom: number) => ({
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top,
      x: left,
      y: top,
      toJSON: () => ({}),
    });
    Object.defineProperty(cards[0], "getBoundingClientRect", {
      configurable: true,
      value: () => makeRect(10, 10, 40, 40),
    });
    Object.defineProperty(cards[1], "getBoundingClientRect", {
      configurable: true,
      value: () => makeRect(70, 10, 100, 40),
    });

    const surface = document.querySelector(".gallery-scrollbar");
    expect(surface).toBeTruthy();
    fireEvent.pointerDown(surface!, {
      button: 0,
      pointerId: 1,
      clientX: 0,
      clientY: 0,
    });
    fireEvent.pointerMove(surface!, {
      pointerId: 1,
      clientX: 50,
      clientY: 50,
    });
    fireEvent.pointerUp(surface!, {
      pointerId: 1,
      clientX: 50,
      clientY: 50,
    });

    expect(cards[0].getAttribute("aria-checked")).toBe("true");
    expect(cards[1].getAttribute("aria-checked")).toBe("false");
  });

  it("snaps the grid slider between column counts", () => {
    const onGridColumnsChange = vi.fn();
    render(
      <GalleryViewControls
        viewMode="grid"
        onViewModeChange={vi.fn()}
        gridColumns={2}
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
    expect(container.querySelector("video")?.className).toContain(
      "object-cover",
    );
  });
});
