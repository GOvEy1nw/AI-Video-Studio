import { createRef, type ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_GALLERY_FILTER } from "../../lib/gallery-filters";
import { GenSpaceGallery } from "./GenSpaceGallery";

vi.mock("../../components/DownloadProgressView", () => ({
  DownloadProgressView: () => null,
}));
vi.mock("../../components/GalleryAssetLibrary", () => ({
  AssetLibraryImportButton: () => null,
  GalleryAssetLibrary: ({ leadingContent }: { leadingContent?: ReactNode }) => (
    <>{leadingContent}</>
  ),
}));

const noop = () => undefined;

describe("GenSpace gallery dropzone", () => {
  it("owns OS drops inside the library and selects the active job", () => {
    const onDragEnter = vi.fn();
    const onDrop = vi.fn();
    const onSelectGeneration = vi.fn();
    const cancelGeneration = vi.fn();

    render(
      <div data-testid="workspace">
        <GenSpaceGallery
          dropZoneProps={{ onDragEnter, onDrop }}
          library={{
            assets: [],
            visibleAssets: [],
            bins: [],
            binColors: {},
            filter: DEFAULT_GALLERY_FILTER,
            onFilterChange: noop,
            selectedBin: null,
            onSelectedBinChange: noop,
            creatingBin: false,
            onCreatingBinChange: noop,
            newBinName: "",
            onNewBinNameChange: noop,
            onCommitNewBin: noop,
            onAssignAssetToBin: noop,
            onRenameBin: noop,
            onDeleteBin: noop,
            onSetBinColor: noop,
            binContextMenu: null,
            onBinContextMenuChange: noop,
            viewMode: "grid",
            onViewModeChange: noop,
            gridColumns: 2,
            onGridColumnsChange: noop,
            showFavorites: false,
            onShowFavoritesChange: noop,
            getThumbnailUrl: () => undefined,
            previewEnabled: false,
            onAssetDragStart: noop,
            onAssetContextMenu: noop,
          }}
          fileInputRef={createRef<HTMLInputElement>()}
          onImportFiles={noop}
          toast={null}
          isDragOver={false}
          isImporting={false}
          filterActive={false}
          isPanelMode={false}
          generation={{
            mode: "image",
            isRunning: true,
            isSelected: false,
            isCancelling: false,
            previewUrl: "data:image/png;base64,preview",
            modelDownload: null,
            modelLifecycleActive: false,
            statusMessage: "Loading model",
            progress: 48,
            badges: ["Phase 1/2"],
            modelName: "Test model",
            onSelect: onSelectGeneration,
            cancel: cancelGeneration,
          }}
        />
      </div>,
    );

    const workspace = screen.getByTestId("workspace");
    const dropzone = screen.getByTestId("genspace-gallery-dropzone");

    fireEvent.dragEnter(workspace);
    expect(onDragEnter).not.toHaveBeenCalled();
    fireEvent.dragEnter(dropzone);
    fireEvent.drop(dropzone);
    expect(onDragEnter).toHaveBeenCalledOnce();
    expect(onDrop).toHaveBeenCalledOnce();
    expect(screen.getByTestId("active-generation-card")).toBeTruthy();
    expect(
      screen.getByRole("progressbar", { name: "Generation progress" }),
    ).toBeTruthy();
    expect(screen.queryByText("Test model")).toBeNull();
    expect(screen.queryByText("Loading model")).toBeNull();
    expect(screen.queryByText("Phase 1/2")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(cancelGeneration).toHaveBeenCalledOnce();
    fireEvent.click(
      screen.getByRole("button", { name: "Select active generation" }),
    );
    expect(onSelectGeneration).toHaveBeenCalledOnce();
  });
});
