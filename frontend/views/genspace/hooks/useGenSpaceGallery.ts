import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GalleryBinContextMenuState } from "../../../components/GalleryBinBar";
import type { GalleryGridColumns } from "../../../components/GalleryViewControls";
import { useProjects } from "../../../contexts/ProjectContext";
import { useAssetDeletion } from "../../../hooks/use-asset-deletion";
import {
  collectGalleryBins,
  filterGalleryAssets,
  filterGalleryAssetsByBin,
  isGalleryFilterActive,
  DEFAULT_GALLERY_FILTER,
  type GalleryFilterState,
} from "../../../lib/gallery-filters";
import {
  ensureGalleryAssetForInputFile,
  importGalleryFile,
  type DuplicateFilenameChoice,
} from "../../../lib/media-import";
import type { Asset } from "../../../types/project";
import type { ImageUseTarget } from "../../../components/UseImageDropdown";
import type { GenSpaceGalleryProps } from "../GenSpaceGallery";

type Projects = ReturnType<typeof useProjects>;

export function useGenSpaceGallery({
  currentProject,
  currentProjectId,
  currentTab,
  isGenerating,
  addAsset,
  deleteAsset,
  updateAsset,
  toggleFavorite,
  createAssetBin,
  renameAssetBin,
  deleteAssetBin,
  setAssetBinColor,
  setAssetActiveTake,
  onUseImage,
  onReframe,
  onCopySettings,
  getAssetModelName,
}: {
  currentProject: Projects["currentProject"];
  currentProjectId: string | null;
  currentTab: string;
  isGenerating: boolean;
  addAsset: Projects["addAsset"];
  deleteAsset: Projects["deleteAsset"];
  updateAsset: Projects["updateAsset"];
  toggleFavorite: Projects["toggleFavorite"];
  createAssetBin: Projects["createAssetBin"];
  renameAssetBin: Projects["renameAssetBin"];
  deleteAssetBin: Projects["deleteAssetBin"];
  setAssetBinColor: Projects["setAssetBinColor"];
  setAssetActiveTake: Projects["setAssetActiveTake"];
  onUseImage: (asset: Asset, target: ImageUseTarget) => void;
  onReframe: (asset: Asset) => void;
  onCopySettings: (asset: Asset) => void;
  getAssetModelName: (asset: Asset) => string | undefined;
}) {
  const assets = useMemo(
    () =>
      (currentProject?.assets ?? []).filter(
        ({ type }) => type === "image" || type === "video" || type === "audio",
      ),
    [currentProject?.assets],
  );
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [filter, setFilter] = useState<GalleryFilterState>(
    DEFAULT_GALLERY_FILTER,
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [gridColumns, setGridColumns] = useState<GalleryGridColumns>(2);
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    () => !document.hidden,
  );
  const [selectedBin, setSelectedBin] = useState<string | null>(null);
  const [creatingBin, setCreatingBin] = useState(false);
  const [newBinName, setNewBinName] = useState("");
  const [binContextMenu, setBinContextMenu] =
    useState<GalleryBinContextMenuState | null>(null);
  const [assetContextMenu, setAssetContextMenu] = useState<{
    assetId: string;
    x: number;
    y: number;
  } | null>(null);
  const [contextSelectedAssetIds, setContextSelectedAssetIds] = useState(
    new Set<string>(),
  );
  const [takesViewAssetId, setTakesViewAssetId] = useState<string | null>(null);
  const assetContextMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const wasGeneratingRef = useRef(false);
  const [duplicateFilenameChoice, setDuplicateFilenameChoice] = useState<{
    fileName: string;
    resolve: (choice: DuplicateFilenameChoice) => void;
  } | null>(null);

  const beforeDelete = useCallback((assetIds: string[]) => {
    const ids = new Set(assetIds);
    setSelectedAsset((current) =>
      current && ids.has(current.id) ? null : current,
    );
    setTakesViewAssetId((current) =>
      current && ids.has(current) ? null : current,
    );
    setContextSelectedAssetIds(new Set());
  }, []);
  const {
    pendingAssetIds,
    requestDeleteAssets,
    cancelDeleteAssets,
    confirmDeleteAssets,
  } = useAssetDeletion({
    projectId: currentProjectId,
    assets,
    deleteAsset,
    beforeDelete,
  });

  useEffect(() => {
    const sync = () => setIsDocumentVisible(!document.hidden);
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  useEffect(() => {
    if (isGenerating && !wasGeneratingRef.current) {
      setSelectedAsset(null);
    }
    wasGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setSelectedAsset((current) =>
      current ? (assets.find(({ id }) => id === current.id) ?? null) : current,
    );
  }, [assets]);

  const requestDuplicateChoice = useCallback(
    (fileName: string): Promise<DuplicateFilenameChoice> =>
      new Promise((resolve) =>
        setDuplicateFilenameChoice({ fileName, resolve }),
      ),
    [],
  );
  const chooseDuplicate = useCallback(
    (choice: DuplicateFilenameChoice) => {
      duplicateFilenameChoice?.resolve(choice);
      setDuplicateFilenameChoice(null);
    },
    [duplicateFilenameChoice],
  );
  const syncInputFileToGallery = useCallback(
    (file: File) =>
      currentProjectId
        ? ensureGalleryAssetForInputFile(
            currentProjectId,
            file,
            currentProject?.assets ?? [],
            addAsset,
            requestDuplicateChoice,
          )
        : Promise.resolve(null),
    [
      addAsset,
      currentProject?.assets,
      currentProjectId,
      requestDuplicateChoice,
    ],
  );
  const importFiles = useCallback(
    async (files: File[]) => {
      if (!currentProjectId || files.length === 0) return;
      setIsImporting(true);
      const paths = new Set(assets.map(({ path }) => path));
      let imported = 0;
      let rejected = 0;
      try {
        for (const file of files) {
          const outcome = await importGalleryFile(
            currentProjectId,
            file,
            requestDuplicateChoice,
          );
          if (!outcome.ok) {
            if (outcome.reason !== "cancelled") rejected += 1;
            continue;
          }
          if (paths.has(outcome.asset.path)) continue;
          addAsset(currentProjectId, outcome.asset);
          paths.add(outcome.asset.path);
          imported += 1;
        }
      } finally {
        setIsImporting(false);
      }
      if (imported > 0) {
        setToast(
          imported === 1
            ? "Added 1 file to gallery"
            : `Added ${imported} files to gallery`,
        );
      }
      if (rejected > 0) {
        setToast(
          rejected === 1
            ? "Unsupported file — use image, video, or audio"
            : `${rejected} files skipped — use image, video, or audio only`,
        );
      }
    },
    [addAsset, assets, currentProjectId, requestDuplicateChoice],
  );

  const visibleAssets = useMemo(() => {
    let result = filterGalleryAssets(assets, filter);
    if (selectedBin !== null) {
      result = filterGalleryAssetsByBin(result, selectedBin);
    }
    if (showFavorites) {
      result = result.filter(({ favorite }) => favorite);
    }
    return result;
  }, [assets, filter, selectedBin, showFavorites]);
  const bins = useMemo(
    () => collectGalleryBins(assets, currentProject?.assetBins),
    [assets, currentProject?.assetBins],
  );
  const contextAsset = assetContextMenu
    ? assets.find(({ id }) => id === assetContextMenu.assetId)
    : undefined;
  const takesAsset = takesViewAssetId
    ? assets.find(({ id }) => id === takesViewAssetId)
    : undefined;
  const selectedIndex = selectedAsset
    ? visibleAssets.findIndex(({ id }) => id === selectedAsset.id)
    : -1;
  const canGoPrev = selectedIndex > 0;
  const canGoNext =
    selectedIndex >= 0 && selectedIndex < visibleAssets.length - 1;
  const goToPrev = useCallback(() => {
    if (canGoPrev) setSelectedAsset(visibleAssets[selectedIndex - 1]);
  }, [canGoPrev, selectedIndex, visibleAssets]);
  const goToNext = useCallback(() => {
    if (canGoNext) setSelectedAsset(visibleAssets[selectedIndex + 1]);
  }, [canGoNext, selectedIndex, visibleAssets]);

  useEffect(() => {
    if (!selectedAsset) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNext();
      } else if (event.key === "Escape") {
        setSelectedAsset(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goToNext, goToPrev, selectedAsset]);

  useEffect(() => {
    if (!assetContextMenu) return;
    const close = (event: MouseEvent) => {
      if (
        assetContextMenuRef.current &&
        !assetContextMenuRef.current.contains(event.target as Node)
      ) {
        setAssetContextMenu(null);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [assetContextMenu]);

  const library = useMemo<GenSpaceGalleryProps["library"]>(
    () => ({
      assets,
      visibleAssets,
      bins,
      binColors: currentProject?.assetBinColors ?? {},
      filter,
      onFilterChange: setFilter,
      selectedBin,
      onSelectedBinChange: setSelectedBin,
      creatingBin,
      onCreatingBinChange: setCreatingBin,
      newBinName,
      onNewBinNameChange: setNewBinName,
      onCommitNewBin: (name) => {
        const trimmed = name.trim();
        if (!trimmed || !currentProjectId) return;
        createAssetBin(currentProjectId, trimmed);
        setSelectedBin(trimmed);
        setCreatingBin(false);
        setNewBinName("");
      },
      onAssignAssetToBin: (assetId, bin) => {
        if (currentProjectId) updateAsset(currentProjectId, assetId, { bin });
      },
      onRenameBin: (oldName, newName) => {
        const trimmed = newName.trim();
        if (!currentProjectId || !trimmed || trimmed === oldName) return;
        renameAssetBin(currentProjectId, oldName, trimmed);
        if (selectedBin === oldName) setSelectedBin(trimmed);
      },
      onDeleteBin: (bin) => {
        if (!currentProjectId) return;
        deleteAssetBin(currentProjectId, bin);
        if (selectedBin === bin) setSelectedBin(null);
      },
      onSetBinColor: (bin, color) => {
        if (currentProjectId) setAssetBinColor(currentProjectId, bin, color);
      },
      binContextMenu,
      onBinContextMenuChange: setBinContextMenu,
      viewMode,
      onViewModeChange: setViewMode,
      gridColumns,
      onGridColumnsChange: setGridColumns,
      showFavorites,
      onShowFavoritesChange: setShowFavorites,
      getThumbnailUrl: ({ thumbnail }) => thumbnail,
      getAssetModelName,
      previewEnabled: currentTab === "gen-space" && isDocumentVisible,
      selectedAssetIds: selectedAsset
        ? new Set([selectedAsset.id])
        : new Set<string>(),
      onAssetClick: (event, asset) => {
        event.stopPropagation();
        setSelectedAsset(asset);
      },
      onAssetDragStart: (event, asset) => {
        event.dataTransfer.setData("asset", JSON.stringify(asset));
        event.dataTransfer.setData("assetId", asset.id);
        event.dataTransfer.effectAllowed = "copy";
      },
      onAssetContextMenu: (event, asset) => {
        setAssetContextMenu({
          assetId: asset.id,
          x: event.clientX,
          y: event.clientY,
        });
        setContextSelectedAssetIds(new Set([asset.id]));
        setBinContextMenu(null);
      },
      onDeleteAsset: (asset) => requestDeleteAssets([asset.id]),
      onDeleteAssets: requestDeleteAssets,
      onToggleFavorite: (asset) => {
        if (currentProjectId) toggleFavorite(currentProjectId, asset.id);
      },
      onUseImage,
      onReframe,
      onCopySettings,
      onSelectTake: (asset, takeIndex) => {
        if (currentProjectId) {
          setAssetActiveTake(currentProjectId, asset.id, takeIndex);
        }
      },
    }),
    [
      assets,
      binContextMenu,
      bins,
      createAssetBin,
      creatingBin,
      currentProject?.assetBinColors,
      currentProjectId,
      currentTab,
      deleteAssetBin,
      filter,
      getAssetModelName,
      gridColumns,
      isDocumentVisible,
      newBinName,
      onCopySettings,
      onUseImage,
      onReframe,
      renameAssetBin,
      requestDeleteAssets,
      selectedAsset,
      selectedBin,
      setAssetActiveTake,
      setAssetBinColor,
      showFavorites,
      toggleFavorite,
      updateAsset,
      viewMode,
      visibleAssets,
    ],
  );
  const selectAsset = useCallback((asset: Asset) => {
    setSelectedAsset(asset);
  }, []);

  return {
    assets,
    library,
    fileInputRef,
    importFiles,
    toast,
    isDragOver,
    isImporting,
    filterActive: isGalleryFilterActive(filter),
    selectAsset,
    syncInputFileToGallery,
    rootDragHandlers: {
      onDragEnter: (event: React.DragEvent) => {
        if (event.dataTransfer.types.includes("asset")) return;
        if (event.dataTransfer.types.includes("Files")) {
          event.preventDefault();
          setIsDragOver(true);
        }
      },
      onDragOver: (event: React.DragEvent) => {
        if (event.dataTransfer.types.includes("asset")) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setIsDragOver(true);
      },
      onDragLeave: (event: React.DragEvent) => {
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        setIsDragOver(false);
      },
      onDrop: (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragOver(false);
        if (!event.dataTransfer.types.includes("asset")) {
          void importFiles(Array.from(event.dataTransfer.files));
        }
      },
    },
    overlays: {
      selectedAsset,
      selectedIndex,
      copiedPrompt,
      setCopiedPrompt,
      canGoPrev,
      canGoNext,
      goToPrev,
      goToNext,
      setSelectedAsset,
      duplicateFilenameChoice,
      chooseDuplicate,
      takesAsset,
      setTakesViewAssetId,
      contextMenu: assetContextMenu,
      contextAsset,
      contextSelectedAssetIds,
      setContextSelectedAssetIds,
      contextMenuRef: assetContextMenuRef,
      setAssetContextMenu,
      bins,
      pendingAssetIds,
      requestDeleteAssets,
      cancelDeleteAssets,
      confirmDeleteAssets,
    },
  };
}
