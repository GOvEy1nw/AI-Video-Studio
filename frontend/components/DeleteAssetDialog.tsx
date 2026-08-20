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
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-overlay/70 p-4 backdrop-blur-xs">
      <div
        className="w-[min(420px,calc(100%-2rem))] overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-asset-title"
        aria-describedby="delete-asset-description"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <Trash2 className="h-5 w-5 text-red-400" />
            <h2
              id="delete-asset-title"
              className="text-base font-semibold text-foreground"
            >
              {isMulti ? "Delete Assets?" : "Delete Asset?"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-subtle-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
            aria-label="Cancel asset deletion"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 px-6 py-5">
          <p className="text-sm text-muted-foreground">
            {isMulti
              ? `Delete ${assetCount} assets from this project?`
              : "Delete this asset from the project?"}
          </p>
          <p id="delete-asset-description" className="text-xs text-subtle-foreground">
            {isMulti
              ? "Their files will be moved to the Recycle Bin."
              : "Its files will be moved to the Recycle Bin."}
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-hover"
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
