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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-[min(440px,calc(100%-2rem))] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicate-filename-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3 min-w-0">
            <FileWarning className="h-5 w-5 text-amber-400 flex-shrink-0" />
            <h2
              id="duplicate-filename-title"
              className="text-base font-semibold text-zinc-100 truncate"
            >
              File already exists
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onChoose('cancel')}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="Cancel import"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-zinc-300 leading-relaxed">
            <span className="font-medium text-zinc-100">{fileName}</span> is
            already in this project. What would you like to do?
          </p>
        </div>

        <div className="px-6 py-4 border-t border-zinc-800 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={() => onChoose('cancel')}
            className="px-4 py-2 text-sm font-medium rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onChoose('suffix')}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-800 text-zinc-100 hover:bg-zinc-700 transition-colors"
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
