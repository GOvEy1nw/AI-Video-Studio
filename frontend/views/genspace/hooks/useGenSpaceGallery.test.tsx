import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Asset } from "../../../types/project";
import { useGenSpaceGallery } from "./useGenSpaceGallery";

vi.mock("../../../hooks/use-asset-deletion", () => ({
  useAssetDeletion: ({
    beforeDelete,
  }: {
    beforeDelete?: (assetIds: string[]) => void;
  }) => ({
    pendingAssetIds: [],
    requestDeleteAssets: (assetIds: string[]) => beforeDelete?.(assetIds),
    cancelDeleteAssets: vi.fn(),
    confirmDeleteAssets: vi.fn(),
  }),
}));

vi.mock("../../../lib/media-import", () => ({
  ensureGalleryAssetForInputFile: vi.fn(),
  importGalleryFile: vi.fn(),
}));

const asset: Asset = {
  id: "asset-1",
  type: "image",
  path: "C:\\asset.png",
  url: "file:///C:/asset.png",
  prompt: "Existing asset",
  resolution: "512 x 512",
  createdAt: 1_700_000_000_000,
};
const assets = [asset];

function props(isGenerating: boolean) {
  return {
    assets,
    assetBins: [],
    assetBinColors: {},
    currentProjectId: "project-a",
    isActive: true,
    isGenerating,
    addAsset: vi.fn(() => asset),
    deleteAsset: vi.fn(),
    updateAsset: vi.fn(),
    toggleFavorite: vi.fn(),
    createAssetBin: vi.fn(),
    renameAssetBin: vi.fn(),
    deleteAssetBin: vi.fn(),
    setAssetBinColor: vi.fn(),
    setAssetActiveTake: vi.fn(),
    onUseImage: vi.fn(),
    onReframe: vi.fn(),
    onCopySettings: vi.fn(),
    getAssetModelName: vi.fn(() => "Test model"),
  };
}

describe("useGenSpaceGallery generation selection", () => {
  it("clears a prior asset when generation starts", () => {
    const { result, rerender } = renderHook(
      ({ isGenerating }: { isGenerating: boolean }) =>
        useGenSpaceGallery(props(isGenerating)),
      { initialProps: { isGenerating: false } },
    );

    act(() => result.current.selectAsset(asset));
    expect(result.current.overlays.selectedAsset).toEqual(asset);

    act(() => rerender({ isGenerating: true }));

    expect(result.current.overlays.selectedAsset).toBeNull();
  });

  it("exposes persisted-asset selection for completion handoff", () => {
    const completedAsset = { ...asset, id: "asset-completed" };
    const { result } = renderHook(() =>
      useGenSpaceGallery(props(false)),
    );

    act(() => result.current.selectAsset(completedAsset));

    expect(result.current.overlays.selectedAsset).toEqual(completedAsset);
  });

  it("routes bulk gallery deletion through asset deletion", () => {
    const { result } = renderHook(() =>
      useGenSpaceGallery(props(false)),
    );

    act(() => result.current.selectAsset(asset));
    act(() => result.current.library.onDeleteAssets?.([asset.id]));

    expect(result.current.overlays.selectedAsset).toBeNull();
  });
});
