interface Props {
  videoUrl: string | null
  previewUrl: string | null
  progress: number
  statusMessage: string
  isGenerating: boolean
}

export function DirectorGenerationPreview({ videoUrl, previewUrl, progress, statusMessage, isGenerating }: Props) {
  return (
    <div className="relative flex min-h-32 min-w-0 flex-1 items-center justify-center overflow-hidden rounded border border-zinc-800 bg-black">
      {videoUrl ? <video src={videoUrl} controls className="max-h-full w-full object-contain" />
        : previewUrl ? <img src={previewUrl} className="max-h-full w-full object-contain" alt="Generation preview" />
          : <span className="text-xs text-zinc-600">Latest Director output</span>}
      {isGenerating && (
        <div className="absolute inset-x-0 bottom-0 bg-zinc-950/90 p-2">
          <div className="mb-1 flex justify-between text-[10px] text-zinc-300"><span>{statusMessage}</span><span>{progress}%</span></div>
          <div className="h-1 rounded bg-zinc-800"><div className="h-full rounded bg-blue-500" style={{ width: `${progress}%` }} /></div>
        </div>
      )}
    </div>
  )
}
