import { FileWarning, X } from 'lucide-react'
import type { DuplicateFilenameChoice } from '../lib/media-import'

interface DuplicateFilenameDialogProps {
  fileName: string
  onChoose: (choice: DuplicateFilenameChoice) => void
}

export function DuplicateFilenameDialog({
  fileName,
  onChoose,
}: DuplicateFilenameDialogProps) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-overlay/70 backdrop-blur-xs">
      <div
        className="w-[min(440px,calc(100%-2rem))] overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicate-filename-title"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <FileWarning className="h-5 w-5 text-amber-400 shrink-0" />
            <h2
              id="duplicate-filename-title"
              className="truncate text-base font-semibold text-foreground"
            >
              File already exists
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onChoose('cancel')}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            aria-label="Cancel import"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          <p className="text-sm leading-relaxed text-muted">
            <span className="font-medium text-foreground">{fileName}</span> is
            already in this project. What would you like to do?
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onChoose('cancel')}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onChoose('suffix')}
            className="rounded-lg bg-surface-selected px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
          >
            Add as new copy
          </button>
          <button
            type="button"
            onClick={() => onChoose('reuse')}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-colors"
          >
            Use existing asset
          </button>
        </div>
      </div>
    </div>
  )
}
