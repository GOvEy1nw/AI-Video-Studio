import { useState } from 'react'
import { AlertCircle, ChevronDown, ChevronRight, X } from 'lucide-react'

interface GenerationErrorDialogProps {
  error: string
  onDismiss: () => void
}

function getHumanMessage(error: string): string {
  const lower = error.toLowerCase()
  if (lower.includes('409') || lower.includes('already')) {
    return 'A generation is already in progress. Please wait for it to finish or cancel it.'
  }
  if (lower.includes('cuda') || lower.includes('out of memory') || lower.includes('oom')) {
    return 'The GPU ran out of memory. Try a lower resolution or shorter duration.'
  }
  if ((lower.includes('model') && (lower.includes('not found') || lower.includes('load')))) {
    return 'The AI model failed to load. Please check your setup and try again.'
  }
  if (lower.includes('fetch') || lower.includes('network') || lower.includes('econnrefused')) {
    return 'Could not connect to the generation server. Make sure the backend is running.'
  }
  if (lower.includes('input image') || lower.includes('canvas') || lower.includes('cors')) {
    return 'Failed to prepare the input image. The file may be corrupted or inaccessible.'
  }
  if (lower.includes('could not auto-generate') || lower.includes('send to genspace')) {
    return error
  }
  return 'Something went wrong during generation. Please try again.'
}

export function GenerationErrorDialog({ error, onDismiss }: GenerationErrorDialogProps) {
  const [detailsExpanded, setDetailsExpanded] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/70 backdrop-blur-xs">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-[480px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <h2 className="text-base font-semibold text-foreground">Generation Failed</h2>
          </div>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg hover:bg-surface-hover text-subtle-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {getHumanMessage(error)}
          </p>

          {/* Expandable technical details */}
          <div className="mt-4">
            <button
              onClick={() => setDetailsExpanded(!detailsExpanded)}
              className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground"
            >
              {detailsExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              Technical Details
            </button>
            {detailsExpanded && (
              <pre className="mt-2 bg-input rounded-lg p-3 text-[11px] text-muted-foreground whitespace-pre-wrap wrap-break-word max-h-40 overflow-auto">
                {error}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end">
          <button
            onClick={onDismiss}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  )
}
