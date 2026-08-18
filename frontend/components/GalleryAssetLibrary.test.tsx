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

  it("ctrl-click toggles assets, shift-click selects a range, and plain click exits multi-select", () => {
    const onAssetClick = vi.fn();
    const assets = [
      makeAsset("asset-one", "image"),
      makeAsset("asset-two", "video"),
      makeAsset("asset-three", "audio"),
    ];
    const { container } = render(
      <GalleryAssetLibrary {...makeLibraryProps({ assets, visibleAssets: assets, onAssetClick })} />,
    );

    const cards = container.querySelectorAll("[data-asset-card]");
    fireEvent.click(cards[0], { ctrlKey: true });
    fireEvent.click(cards[2], { ctrlKey: true });
    expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(2);

    fireEvent.click(cards[1], { ctrlKey: true });
    expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(3);

    fireEvent.click(cards[2], { shiftKey: true });
    expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(2);
    expect(screen.queryByText(/selected/)).toBeNull();

    fireEvent.click(cards[0]);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(onAssetClick).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ id: "asset-one" }));
  });

  it("keeps the existing selection when ctrl-click starts multi-select", () => {
    const { container } = render(
      <GalleryAssetLibrary
        {...makeLibraryProps({ selectedAssetIds: new Set(["asset-one"]) })}
      />,
    );

    fireEvent.click(container.querySelectorAll("[data-asset-card]")[1], { ctrlKey: true });

    expect(screen.getAllByRole("checkbox", { checked: true }).map((card) => card.dataset.assetId)).toEqual([
      "asset-one",
      "asset-two",
    ]);
  });

  it("falls back to the clicked asset when a range anchor is filtered out", () => {
    const assets = [
      makeAsset("asset-one", "image"),
      makeAsset("asset-two", "image"),
      makeAsset("asset-three", "image"),
    ];
    const { container, rerender } = render(
      <GalleryAssetLibrary {...makeLibraryProps({ assets, visibleAssets: assets })} />,
    );

    fireEvent.click(container.querySelectorAll("[data-asset-card]")[0], { ctrlKey: true });
    rerender(
      <GalleryAssetLibrary
        {...makeLibraryProps({ assets, visibleAssets: assets.slice(1) })}
      />,
    );
    fireEvent.click(container.querySelectorAll("[data-asset-card]")[1], { shiftKey: true });

    expect(screen.getAllByRole("checkbox", { checked: true }).map((card) => card.dataset.assetId)).toEqual([
      "asset-three",
    ]);
  });

  it("keeps a ctrl-selected context-menu set and has no bulk action bar", () => {
    const onSelectedAssetIdsChange = vi.fn();
    const { container } = render(
      <GalleryAssetLibrary {...makeLibraryProps({ onSelectedAssetIdsChange })} />,
    );

    const cards = container.querySelectorAll("[data-asset-card]");
    fireEvent.click(cards[0], { ctrlKey: true });
    fireEvent.click(cards[1], { ctrlKey: true });
    fireEvent.contextMenu(cards[1]);

    expect(onSelectedAssetIdsChange).toHaveBeenLastCalledWith(new Set(["asset-one", "asset-two"]));
    expect(screen.queryByRole("button", { name: "Clear selection" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete selected assets" })).toBeNull();
  });

  it("enters multi-select from focused grid cards and list rows", () => {
    const onAssetClick = vi.fn();
    const { container, unmount } = render(
      <GalleryAssetLibrary {...makeLibraryProps({ onAssetClick })} />,
    );
    const gridCard = container.querySelector<HTMLElement>("[data-asset-card]")!;
    expect(gridCard.getAttribute("role")).toBe("button");
    gridCard.focus();
    fireEvent.keyDown(gridCard, { key: "Enter" });
    expect(onAssetClick).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ id: "asset-one" }));
    fireEvent.keyDown(gridCard, { key: "Enter", ctrlKey: true });
    expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(1);

    unmount();
    const list = render(
      <GalleryAssetLibrary {...makeLibraryProps({ viewMode: "list" })} />,
    );
    const listRow = list.container.querySelector<HTMLElement>("[data-asset-card]")!;
    expect(listRow.getAttribute("role")).toBe("button");
    listRow.focus();
    fireEvent.keyDown(listRow, { key: " ", ctrlKey: true });
    expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(1);
  });

  it("uses the current list sort order for shift ranges", () => {
    const assets = [
      makeAsset("charlie", "image"),
      makeAsset("alpha", "image"),
      makeAsset("bravo", "image"),
    ];
    const { container } = render(
      <GalleryAssetLibrary {...makeLibraryProps({ assets, visibleAssets: assets, viewMode: "list" })} />,
    );

    const rows = container.querySelectorAll<HTMLElement>("[data-asset-card]");
    expect([...rows].map((row) => row.dataset.assetId)).toEqual(["alpha", "bravo", "charlie"]);
    fireEvent.click(rows[0], { ctrlKey: true });
    fireEvent.click(rows[1], { shiftKey: true });

    expect(screen.getAllByRole("checkbox", { checked: true }).map((row) => row.dataset.assetId)).toEqual(["alpha", "bravo"]);
  });

  it("clears multi-select from header controls", () => {
    const { container } = render(<GalleryAssetLibrary {...makeLibraryProps()} />);
    fireEvent.click(container.querySelectorAll("[data-asset-card]")[0], {
      ctrlKey: true,
    });
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "List view" }));

    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("keeps a card pointer gesture out of marquee capture", () => {
    const { container } = render(<GalleryAssetLibrary {...makeLibraryProps()} />);
    fireEvent.click(container.querySelectorAll("[data-asset-card]")[0], {
      ctrlKey: true,
    });
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

  it("bounds mounted cards for a 1,000-asset library while retaining leading content", () => {
    const assets = Array.from({ length: 1_000 }, (_, index) => makeAsset(`asset-${index}`, "image"));
    const { container } = render(
      <GalleryAssetLibrary
        {...makeLibraryProps({
          assets,
          visibleAssets: assets,
          leadingContent: <p>Generation in progress</p>,
        })}
      />,
    );

    expect(screen.getByText("Generation in progress")).toBeTruthy();
    expect(container.querySelectorAll("[data-asset-card]").length).toBeLessThan(200);
  });

  it("bounds mounted list rows for a 1,000-asset library", () => {
    const assets = Array.from({ length: 1_000 }, (_, index) => makeAsset(`asset-${index}`, "image"));
    const { container } = render(
      <GalleryAssetLibrary
        {...makeLibraryProps({ assets, visibleAssets: assets, viewMode: "list" })}
      />,
    );

    expect(container.querySelectorAll("[data-asset-card]").length).toBeLessThan(200);
  });

});
