import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Asset } from "../../types/project";
import {
  AssetContextMenu,
  type AssetContextMenuProps,
} from "./AssetContextMenu";

vi.mock("../../components/UseVideoDropdown", () => ({
  UseVideoDropdown: ({ onSelect }: { onSelect: (target: "relight") => void }) => (
    <>
      <button type="button" aria-label="Use video">Use video</button>
      <button type="button" role="menuitem" onClick={() => onSelect("relight")}>Relight</button>
    </>
  ),
}));

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

  it("stacks same-type assets under the right-clicked root without deleting media", () => {
    const absorbed: Asset = {
      ...makeAsset("image"),
      id: "absorbed",
      url: "file:///projected-absorbed.media",
      path: "projected-absorbed.media",
      thumbnail: "projected-absorbed-thumbnail",
      prompt: "Projected absorbed metadata",
      resolution: "1024 x 1024",
      duration: 6,
      generationTimeSeconds: 4,
      generationParams: { mode: "upscale", prompt: "", model: "lanczos", duration: 6, resolution: "1024 x 1024", fps: 24, audio: false, cameraMotion: "none" },
      activeTakeIndex: 0,
      takes: [
        {
          url: "file:///legacy-absorbed.media",
          path: "legacy-absorbed.media",
          createdAt: 2,
        },
      ],
    };
    const root: Asset = {
      ...makeAsset("image"),
      id: "root",
      activeTakeIndex: 1,
      takes: [
        {
          url: "file:///root-original.media",
          path: "root-original.media",
          createdAt: 3,
          generationParams: null,
        },
        {
          url: "file:///root-upscaled.media",
          path: "root-upscaled.media",
          createdAt: 4,
          generationParams: { mode: "upscale", prompt: "", model: "lanczos", duration: 5, resolution: "Original", fps: 24, audio: false, cameraMotion: "none" },
        },
      ],
    };
    const updateAsset = vi.fn();
    const deleteAsset = vi.fn();

    render(
      <AssetContextMenu
        {...menuProps(root)}
        currentProjectId="project-1"
        targetIds={[absorbed.id, root.id]}
        assets={[absorbed, root]}
        updateAsset={updateAsset}
        deleteAsset={deleteAsset}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Stack Selected" }));

    expect(updateAsset).toHaveBeenCalledWith(
      "project-1",
      root.id,
      expect.objectContaining({
        activeTakeIndex: 1,
        takes: [
          expect.objectContaining({
            url: root.takes![0].url,
            path: root.takes![0].path,
            createdAt: 3,
            thumbnail: root.thumbnail,
            prompt: root.prompt,
            resolution: root.resolution,
            generationTimeSeconds: null,
            generationParams: null,
          }),
          expect.objectContaining({
            url: root.url,
            path: root.path,
            createdAt: 4,
            prompt: root.prompt,
            resolution: root.resolution,
          }),
          expect.objectContaining({
            url: absorbed.url,
            path: absorbed.path,
            thumbnail: absorbed.thumbnail,
            createdAt: 2,
            duration: absorbed.duration,
            prompt: absorbed.prompt,
            resolution: absorbed.resolution,
            generationTimeSeconds: 4,
            generationParams: absorbed.generationParams,
          }),
        ],
      }),
    );
    expect(deleteAsset).toHaveBeenCalledWith("project-1", absorbed.id);
  });

  it("materializes nested legacy take metadata without replacing explicit nulls", () => {
    const root = { ...makeAsset("image"), id: "root" };
    const absorbed: Asset = {
      ...makeAsset("image"),
      id: "nested-absorbed",
      url: "file:///projected-active.media",
      path: "projected-active.media",
      thumbnail: "projected-thumbnail",
      prompt: "Projected metadata",
      resolution: "1024 x 1024",
      duration: 6,
      generationTimeSeconds: 9,
      generationParams: { mode: "upscale", prompt: "", model: "lanczos", duration: 6, resolution: "1024 x 1024", fps: 24, audio: false, cameraMotion: "none" },
      activeTakeIndex: 1,
      takes: [
        {
          url: "file:///legacy-inactive.media",
          path: "legacy-inactive.media",
          createdAt: 2,
          generationTimeSeconds: null,
          generationParams: null,
        },
        {
          url: "file:///legacy-active.media",
          path: "legacy-active.media",
          createdAt: 3,
        },
      ],
    };
    const updateAsset = vi.fn();

    render(
      <AssetContextMenu
        {...menuProps(root)}
        currentProjectId="project-1"
        targetIds={[root.id, absorbed.id]}
        assets={[root, absorbed]}
        updateAsset={updateAsset}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Stack Selected" }));

    expect(updateAsset).toHaveBeenCalledWith(
      "project-1",
      root.id,
      expect.objectContaining({
        takes: [
          expect.anything(),
          expect.objectContaining({
            url: "file:///legacy-inactive.media",
            path: "legacy-inactive.media",
            createdAt: 2,
            thumbnail: absorbed.thumbnail,
            duration: absorbed.duration,
            prompt: absorbed.prompt,
            resolution: absorbed.resolution,
            generationTimeSeconds: null,
            generationParams: null,
          }),
          expect.objectContaining({
            url: absorbed.url,
            path: absorbed.path,
            createdAt: 3,
            thumbnail: absorbed.thumbnail,
            duration: absorbed.duration,
            prompt: absorbed.prompt,
            resolution: absorbed.resolution,
            generationTimeSeconds: absorbed.generationTimeSeconds,
            generationParams: absorbed.generationParams,
          }),
        ],
      }),
    );
  });
});
