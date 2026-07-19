import { useCallback, useState } from "react";
import {
  collectAssetFilePaths,
  deleteProjectAssetFilesFromDisk,
  waitForMediaFileHandlesReleased,
} from "../lib/asset-delete";
import type { Asset } from "../types/project";

interface UseAssetDeletionOptions {
  projectId: string | null;
  assets: Asset[];
  deleteAsset: (projectId: string, assetId: string) => void;
  beforeDelete?: (assetIds: string[]) => void;
}

export function useAssetDeletion({
  projectId,
  assets,
  deleteAsset,
  beforeDelete,
}: UseAssetDeletionOptions) {
  const [pendingAssetIds, setPendingAssetIds] = useState<string[]>([]);

  const requestDeleteAssets = useCallback((assetIds: string[]) => {
    setPendingAssetIds([...new Set(assetIds)]);
  }, []);

  const cancelDeleteAssets = useCallback(() => setPendingAssetIds([]), []);

  const confirmDeleteAssets = useCallback(async () => {
    if (!projectId || pendingAssetIds.length === 0) return;

    const assetIds = pendingAssetIds;
    const selectedIds = new Set(assetIds);
    const pathsToTrash = [
      ...new Set(
        assets
          .filter((asset) => selectedIds.has(asset.id))
          .flatMap(collectAssetFilePaths),
      ),
    ];

    setPendingAssetIds([]);
    beforeDelete?.(assetIds);
    assetIds.forEach((assetId) => deleteAsset(projectId, assetId));

    if (pathsToTrash.length > 0) {
      await waitForMediaFileHandlesReleased();
      await deleteProjectAssetFilesFromDisk(projectId, pathsToTrash);
    }
  }, [assets, beforeDelete, deleteAsset, pendingAssetIds, projectId]);

  return {
    pendingAssetIds,
    requestDeleteAssets,
    cancelDeleteAssets,
    confirmDeleteAssets,
  };
}
