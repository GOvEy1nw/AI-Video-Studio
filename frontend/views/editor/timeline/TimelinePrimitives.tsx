import { forwardRef, type HTMLAttributes, type MouseEventHandler, type ReactNode } from 'react'
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimelineRulerProps extends HTMLAttributes<HTMLDivElement> {
  durationUnits: number
  pixelsPerUnit: number
  majorInterval: number
  minorInterval: number
  formatLabel: (unit: number) => string
  children?: ReactNode
}

export const TimelineRuler = forwardRef<HTMLDivElement, TimelineRulerProps>(function TimelineRuler({
  durationUnits,
  pixelsPerUnit,
  majorInterval,
  minorInterval,
  formatLabel,
  children,
  className,
  style,
  ...props
}, ref) {
  const ticks: ReactNode[] = []
  const safeMinorInterval = Math.max(Number.EPSILON, minorInterval)
  const end = durationUnits + majorInterval
  for (let unit = 0; unit < end; unit = +(unit + safeMinorInterval).toFixed(4)) {
    const remainder = unit % majorInterval
    const isMajor = remainder < 0.001 || Math.abs(remainder - majorInterval) < 0.001
    ticks.push(
      <div key={unit} className="absolute inset-y-0" style={{ left: unit * pixelsPerUnit }}>
        <div className={cn('h-full border-l', isMajor ? 'border-zinc-700' : 'border-zinc-800')} />
        {isMajor && (
          <span className="absolute bottom-0.5 left-1 whitespace-nowrap text-[10px] leading-none text-zinc-500">
            {formatLabel(unit)}
          </span>
        )}
      </div>,
    )
  }

  return (
    <div
      ref={ref}
      className={cn('relative h-6 select-none border-b border-zinc-800 bg-zinc-900', className)}
      style={{ minWidth: durationUnits * pixelsPerUnit, ...style }}
      {...props}
    >
      {ticks}
      {children}
    </div>
  )
})

interface TimelinePlayheadProps extends HTMLAttributes<HTMLDivElement> {
  position: number
  rulerHead?: boolean
}

export const TimelinePlayhead = forwardRef<HTMLDivElement, TimelinePlayheadProps>(function TimelinePlayhead({
  position,
  rulerHead = false,
  className,
  style,
  ...props
}, ref) {
  return (
    <div
      ref={ref}
      className={cn('pointer-events-none absolute bottom-0 top-0 z-30 w-0.5 bg-red-500', className)}
      style={{ left: position, ...style }}
      {...props}
    >
      {rulerHead && <div className="absolute -top-1 left-1/2 h-0 w-0 -translate-x-1/2 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-red-500" />}
    </div>
  )
})

export const TimelineSegmentFrame = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function TimelineSegmentFrame({
  className,
  ...props
}, ref) {
  return <div ref={ref} className={cn('overflow-hidden rounded border select-none', className)} {...props} />
})

interface TimelineTrackRowProps {
  label: ReactNode
  children: ReactNode
  height?: number
  locked?: boolean
  className?: string
  contentClassName?: string
  onMouseDown?: MouseEventHandler<HTMLDivElement>
}

export function TimelineTrackRow({
  label,
  children,
  height = 52,
  locked = false,
  className,
  contentClassName,
  onMouseDown,
}: TimelineTrackRowProps) {
  return (
    <div className={cn('grid grid-cols-[8rem_minmax(0,1fr)] border-b border-zinc-800', locked && 'opacity-55', className)} style={{ height }}>
      <div className="flex min-w-0 items-center border-r border-zinc-800 bg-zinc-900 px-2 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className={cn('relative min-w-0 bg-zinc-950/70', contentClassName)} onMouseDown={onMouseDown}>
        {children}
      </div>
    </div>
  )
}

interface TimelineViewportProps extends HTMLAttributes<HTMLDivElement> {
  focused?: boolean
}

export const TimelineViewport = forwardRef<HTMLDivElement, TimelineViewportProps>(function TimelineViewport({
  focused,
  className,
  ...props
}, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'min-w-0 overflow-hidden rounded border bg-zinc-950 transition-colors',
        focused ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-zinc-800',
        className,
      )}
      {...props}
    />
  )
})

interface TimelineZoomControlsProps {
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  onFit?: () => void
  className?: string
}

export function TimelineZoomControls({ value, min, max, step, onChange, onFit, className }: TimelineZoomControlsProps) {
  const percent = Math.round(value * 100)
  const clamp = (next: number) => Math.max(min, Math.min(max, next))
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button type="button" title="Zoom out" aria-label="Zoom out" onClick={() => onChange(clamp(value - step))} className="rounded p-0.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300">
        <ZoomOut className="h-3.5 w-3.5" />
      </button>
      <input type="range" min={Math.round(min * 100)} max={Math.round(max * 100)} step={Math.max(1, Math.round(step * 100 / 5))} value={percent} onChange={(event) => onChange(clamp(Number(event.target.value) / 100))} className="h-1 w-24 cursor-pointer accent-blue-500" title={`Zoom: ${percent}%`} />
      <button type="button" title="Zoom in" aria-label="Zoom in" onClick={() => onChange(clamp(value + step))} className="rounded p-0.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300">
        <ZoomIn className="h-3.5 w-3.5" />
      </button>
      <span className="w-8 text-right text-[10px] tabular-nums text-zinc-500">{percent}%</span>
      {onFit && (
        <button type="button" title="Fit to view" aria-label="Fit to view" onClick={onFit} className="ml-0.5 rounded p-0.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300">
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
