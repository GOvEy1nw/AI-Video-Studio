import { GenerationPreviewMedia } from "../genspace/components/GenerationPreviewMedia"

interface Props {
  videoUrl: string | null
  previewUrl: string | null
  progress: number
  statusMessage: string
  isGenerating: boolean
}

export function DirectorGenerationPreview({ videoUrl, previewUrl, progress, statusMessage, isGenerating }: Props) {
  return (
    <div className="relative flex min-h-32 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-sm border border-border bg-black">
      {videoUrl ? <video src={videoUrl} controls className="max-h-full w-full object-contain" />
        : previewUrl ? <GenerationPreviewMedia url={previewUrl} className="max-h-full w-full object-contain" />
          : <span className="text-xs text-white/60">Latest Director output</span>}
      {isGenerating && (
        <div className="absolute inset-x-0 bottom-0 bg-surface-raised/90 p-2">
          <div className="mb-1 flex justify-between text-[10px] text-muted-foreground"><span>{statusMessage}</span><span>{progress}%</span></div>
          <div className="h-1 rounded-sm bg-surface"><div className="h-full rounded-sm bg-blue-500" style={{ width: `${progress}%` }} /></div>
        </div>
      )}
    </div>
  )
}
