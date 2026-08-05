import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_GALLERY_FILTER,
  filterGalleryAssets,
  toggleGalleryFilterValue,
} from "../lib/gallery-filters";
import type { Asset } from "../types/project";
import {
  GalleryAssetLibrary,
  type GalleryAssetLibraryProps,
} from "./GalleryAssetLibrary";

afterEach(cleanup);

const makeAsset = (id: string, type: Asset["type"]): Asset => ({
  id,
  type,
  source: "generated",
  path: `${id}.media`,
  url: `file:///${id}.media`,
  prompt: "",
  resolution: "",
  createdAt: 1,
});

function makeLibraryProps(
  overrides: Partial<GalleryAssetLibraryProps> = {},
): GalleryAssetLibraryProps {
  const assets = [makeAsset("asset-one", "image"), makeAsset("asset-two", "video")];
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

describe("Asset Library", () => {
  it("filters by the selected media and source groups", () => {
    const generatedImage = makeAsset("generated-image", "image");
    const uploadedVideo = { ...makeAsset("uploaded-video", "video"), source: "uploaded" as const };

    expect(
      filterGalleryAssets([generatedImage, uploadedVideo], {
        types: ["image"],
        sources: ["generated"],
      }),
    ).toEqual([generatedImage]);
    expect(toggleGalleryFilterValue(["image"], "image")).toEqual([]);
  });

  it("selects by click and keyboard, clears selection, then requests bulk deletion", () => {
    const onDeleteAssets = vi.fn();
    render(<GalleryAssetLibrary {...makeLibraryProps({ onDeleteAssets })} />);

    fireEvent.click(screen.getByRole("button", { name: "Enter multi-select mode" }));
    const [firstCard, secondCard] = screen.getAllByRole("checkbox");
    fireEvent.click(firstCard);
    fireEvent.keyDown(secondCard, { key: " " });
    expect(screen.getByText("2 selected")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));
    fireEvent.click(secondCard);
    fireEvent.click(screen.getByRole("button", { name: "Delete selected assets" }));

    expect(onDeleteAssets).toHaveBeenCalledWith(["asset-two"]);
  });

  it("keeps a card pointer gesture out of marquee capture", () => {
    const { container } = render(<GalleryAssetLibrary {...makeLibraryProps()} />);
    fireEvent.click(screen.getByRole("button", { name: "Enter multi-select mode" }));
    const card = screen.getAllByRole("checkbox")[0];
    const surface = container.querySelector(".gallery-scrollbar");
    const setPointerCapture = vi.fn();
    Object.defineProperty(surface, "setPointerCapture", {
      configurable: true,
      value: setPointerCapture,
    });

    fireEvent.pointerDown(card, { button: 0, pointerId: 1, clientX: 20, clientY: 20 });
    fireEvent.pointerUp(card, { pointerId: 1, clientX: 20, clientY: 20 });

    expect(setPointerCapture).not.toHaveBeenCalled();
  });

});
