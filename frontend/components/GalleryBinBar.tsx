import { useEffect, useRef } from "react";
import { Folder, FolderPlus, Pencil, Trash2, X } from "lucide-react";
import type { Asset } from "../types/project";
import {
  COLOR_LABELS,
  getColorLabel,
} from "../views/editor/video-editor-utils";

export type GalleryBinContextMenuState = {
  bin: string;
  x: number;
  y: number;
};

type GalleryBinBarProps = {
  bins: string[];
  binColors?: Record<string, string>;
  assets: Asset[];
  selectedBin: string | null;
  creatingBin: boolean;
  newBinName: string;
  onSelectBin: (bin: string | null) => void;
  onCreatingBinChange: (creating: boolean) => void;
  onNewBinNameChange: (name: string) => void;
  onCommitNewBin: (name: string) => void;
  onAssignAssetToBin: (assetId: string, bin: string) => void;
  onRenameBin: (oldName: string, newName: string) => void;
  onDeleteBin: (bin: string) => void;
  onSetBinColor: (bin: string, colorLabel?: string) => void;
  binContextMenu: GalleryBinContextMenuState | null;
  onBinContextMenuChange: (menu: GalleryBinContextMenuState | null) => void;
};

export function GalleryBinBar({
  bins,
  binColors = {},
  assets,
  selectedBin,
  creatingBin,
  newBinName,
  onSelectBin,
  onCreatingBinChange,
  onNewBinNameChange,
  onCommitNewBin,
  onAssignAssetToBin,
  onRenameBin,
  onDeleteBin,
  onSetBinColor,
  binContextMenu,
  onBinContextMenuChange,
}: GalleryBinBarProps) {
  const newBinInputRef = useRef<HTMLInputElement>(null);
  const binContextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (creatingBin) {
      newBinInputRef.current?.focus();
    }
  }, [creatingBin]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        binContextMenuRef.current &&
        !binContextMenuRef.current.contains(event.target as Node)
      ) {
        onBinContextMenuChange(null);
      }
    };
    if (binContextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [binContextMenu, onBinContextMenuChange]);

  const countInBin = (bin: string) =>
    assets.filter((asset) => asset.bin === bin).length;

  const binChipClass = (active: boolean) =>
    `flex h-8 flex-shrink-0 items-center gap-1 rounded-md border px-2.5 text-xs font-medium transition-colors ${
      active
        ? "border border-zinc-500/40 bg-zinc-400/30 text-zinc-300"
        : "border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
    }`;

  return (
    <>
      <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => onSelectBin(null)}
          className={binChipClass(selectedBin === null)}
        >
          <Folder className="h-3.5 w-3.5 flex-shrink-0" />
          <span>All Bins</span>
        </button>

        {bins.map((bin) => (
          <button
            key={bin}
            type="button"
            onClick={() => onSelectBin(selectedBin === bin ? null : bin)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBinContextMenuChange({ bin, x: e.clientX, y: e.clientY });
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add("ring-2", "ring-blue-400");
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove("ring-2", "ring-blue-400");
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("ring-2", "ring-blue-400");
              const assetId = e.dataTransfer.getData("assetId");
              if (assetId) {
                onAssignAssetToBin(assetId, bin);
              }
            }}
            className={binChipClass(selectedBin === bin)}
          >
            <Folder
              className="h-3.5 w-3.5 flex-shrink-0"
              style={{ color: getColorLabel(binColors[bin])?.color }}
            />
            <span className="truncate">{bin}</span>
            <span className="text-[10px] text-zinc-500">{countInBin(bin)}</span>
          </button>
        ))}

        {creatingBin ? (
          <input
            ref={newBinInputRef}
            type="text"
            value={newBinName}
            onChange={(e) => onNewBinNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newBinName.trim()) {
                onCommitNewBin(newBinName.trim());
              }
              if (e.key === "Escape") {
                onCreatingBinChange(false);
                onNewBinNameChange("");
              }
            }}
            onBlur={() => {
              if (newBinName.trim()) {
                onCommitNewBin(newBinName.trim());
              } else {
                onCreatingBinChange(false);
                onNewBinNameChange("");
              }
            }}
            placeholder="Bin name..."
            className="h-8 w-28 flex-shrink-0 rounded-md border border-zinc-600 bg-zinc-800 px-2 text-xs text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => onCreatingBinChange(true)}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-transparent text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            aria-label="Create bin"
            title="Create bin"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
        )}
      </div>

      {binContextMenu && (
        <div
          ref={binContextMenuRef}
          className="fixed z-[60] min-w-[160px] rounded-xl border border-zinc-700 bg-zinc-800 py-1.5 text-xs shadow-2xl"
          style={{ left: binContextMenu.x, top: binContextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              const newName = prompt("Rename bin:", binContextMenu.bin);
              if (newName?.trim() && newName.trim() !== binContextMenu.bin) {
                onRenameBin(binContextMenu.bin, newName.trim());
              }
              onBinContextMenuChange(null);
            }}
            className="flex w-full items-center gap-3 px-3 py-1.5 text-zinc-300 hover:bg-zinc-700"
          >
            <Pencil className="h-3.5 w-3.5 text-zinc-500" />
            <span>Rename Bin</span>
          </button>
          <div className="my-1 h-px bg-zinc-700" />
          <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Label
          </div>
          <div className="flex flex-wrap items-center gap-1 px-3 py-1.5">
            <button
              type="button"
              onClick={() => {
                onSetBinColor(binContextMenu.bin, undefined);
                onBinContextMenuChange(null);
              }}
              className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all ${
                !binColors[binContextMenu.bin]
                  ? "scale-110 border-white"
                  : "border-zinc-600 hover:border-zinc-400"
              }`}
              title="No label"
              aria-label="No label"
            >
              <X className="h-2 w-2 text-zinc-400" />
            </button>
            {COLOR_LABELS.map((colorLabel) => (
              <button
                key={colorLabel.id}
                type="button"
                onClick={() => {
                  onSetBinColor(binContextMenu.bin, colorLabel.id);
                  onBinContextMenuChange(null);
                }}
                className={`h-4 w-4 rounded-full transition-all ${
                  binColors[binContextMenu.bin] === colorLabel.id
                    ? "scale-110 ring-2 ring-white ring-offset-1 ring-offset-zinc-800"
                    : "hover:scale-125"
                }`}
                style={{ backgroundColor: colorLabel.color }}
                title={colorLabel.label}
                aria-label={`${colorLabel.label} label`}
              />
            ))}
          </div>
          <div className="my-1 h-px bg-zinc-700" />
          <button
            type="button"
            onClick={() => {
              onDeleteBin(binContextMenu.bin);
              onBinContextMenuChange(null);
            }}
            className="flex w-full items-center gap-3 px-3 py-1.5 text-red-400 hover:bg-zinc-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Bin</span>
          </button>
        </div>
      )}
    </>
  );
}
