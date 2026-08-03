import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Asset } from "../../types/project";
import {
  AssetContextMenu,
  type AssetContextMenuProps,
} from "./AssetContextMenu";

afterEach(() => cleanup());

const makeAsset = (type: Asset["type"]): Asset => ({
  id: `${type}-1`,
  type,
  path: `${type}.media`,
  url: `file:///${type}.media`,
  prompt: "A test asset",
  resolution: "Original",
  createdAt: 1,
});

function menuProps(asset: Asset): AssetContextMenuProps {
  return {
    asset,
    targetIds: [asset.id],
    assetContextMenu: { assetId: asset.id, x: 10, y: 10 },
    assetContextMenuRef: { current: null },
    assets: [asset],
    bins: [],
    isRegenerating: false,
    regeneratingAssetId: null,
    currentProjectId: null,
    setAssetActiveTake: vi.fn(),
    setTakesViewAssetId: vi.fn(),
    setSelectedAssetIds: vi.fn(),
    setAssetContextMenu: vi.fn(),
    updateAsset: vi.fn(),
    addAsset: vi.fn(),
    deleteAsset: vi.fn(),
    requestDeleteAssets: vi.fn(),
    deleteTakeFromAsset: vi.fn(),
  };
}

describe("AssetContextMenu media-use submenus", () => {
  it("puts image use targets behind a Use image submenu", () => {
    const asset = makeAsset("image");
    const onUseImage = vi.fn();

    render(
      <AssetContextMenu
        {...menuProps(asset)}
        onUseImage={onUseImage}
      />,
    );

    expect(screen.queryByRole("menuitem", { name: "Last Frame" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Use image" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Last Frame" }));

    expect(onUseImage).toHaveBeenCalledWith(asset, "last-frame");
  });

  it("puts video tools behind a Use video submenu instead of Reframe", () => {
    const asset = makeAsset("video");
    const onUseVideo = vi.fn();

    render(
      <AssetContextMenu
        {...menuProps(asset)}
        onUseVideo={onUseVideo}
      />,
    );

    expect(screen.queryByRole("button", { name: "Reframe" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Use video" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Relight" }));

    expect(onUseVideo).toHaveBeenCalledWith(asset, "relight");
  });
});
