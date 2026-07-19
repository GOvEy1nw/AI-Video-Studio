import { Trash2, X } from "lucide-react";

interface DeleteAssetDialogProps {
  assetCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteAssetDialog({
  assetCount,
  onCancel,
  onConfirm,
}: DeleteAssetDialogProps) {
  const isMulti = assetCount > 1;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        className="w-[min(420px,calc(100%-2rem))] overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-asset-title"
        aria-describedby="delete-asset-description"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <Trash2 className="h-5 w-5 text-red-400" />
            <h2
              id="delete-asset-title"
              className="text-base font-semibold text-zinc-100"
            >
              {isMulti ? "Delete Assets?" : "Delete Asset?"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="Cancel asset deletion"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 px-6 py-5">
          <p className="text-sm text-zinc-300">
            {isMulti
              ? `Delete ${assetCount} assets from this project?`
              : "Delete this asset from the project?"}
          </p>
          <p id="delete-asset-description" className="text-xs text-zinc-500">
            {isMulti
              ? "Their files will be moved to the Recycle Bin."
              : "Its files will be moved to the Recycle Bin."}
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-800 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
