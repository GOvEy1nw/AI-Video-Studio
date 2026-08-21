import { useRef, useState } from 'react'
import { ChevronDown, ChevronUp, ListOrdered, Trash2, X } from 'lucide-react'
import { FloatingMenu } from './FloatingMenu'
import { useGenerationQueue, type GenerationQueueJob } from '../contexts/GenerationQueueContext'

function JobRow({ job, index, count }: { job: GenerationQueueJob; index?: number; count?: number }) {
  const { cancel, discard, dismiss, remove, reorder, queued } = useGenerationQueue()
  const active = job.status === 'running' || job.status === 'cancel_requested'
  const terminal = ['completed', 'failed', 'cancelled', 'interrupted'].includes(job.status)
  const move = (direction: -1 | 1) => {
    if (index === undefined || count === undefined) return
    const target = index + direction
    if (target < 0 || target >= count) return
    const ids = queued.map((entry) => entry.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    void reorder(ids)
  }
  return <li className="border-b border-border px-3 py-2 last:border-b-0">
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium text-foreground">{job.summary.label}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{job.progress?.phase ?? job.status}{typeof job.progress?.percent === 'number' ? ` · ${job.progress.percent}%` : ''}</div>
        {job.error ? <div className="mt-1 text-[11px] text-destructive">{job.error}</div> : null}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        {index !== undefined ? <>
          <button type="button" aria-label="Move job up" disabled={index === 0} onClick={() => move(-1)} className="rounded p-1 text-muted-foreground hover:bg-surface-hover disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
          <button type="button" aria-label="Move job down" disabled={index === count! - 1} onClick={() => move(1)} className="rounded p-1 text-muted-foreground hover:bg-surface-hover disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
        </> : null}
        {active ? <button type="button" aria-label="Cancel generation job" onClick={() => void cancel(job.id)} className="rounded p-1 text-muted-foreground hover:bg-surface-hover"><X className="h-3.5 w-3.5" /></button> : null}
        {job.status === 'queued' ? <button type="button" aria-label="Remove queued job" onClick={() => void remove(job.id)} className="rounded p-1 text-muted-foreground hover:bg-surface-hover"><X className="h-3.5 w-3.5" /></button> : null}
        {job.status === 'completed' ? <button type="button" aria-label="Discard completed generation result" onClick={() => void discard(job.id)} className="rounded p-1 text-muted-foreground hover:bg-surface-hover"><Trash2 className="h-3.5 w-3.5" /></button> : null}
        {terminal && job.status !== 'completed' ? <button type="button" aria-label="Dismiss generation job" onClick={() => void dismiss(job.id)} className="rounded p-1 text-muted-foreground hover:bg-surface-hover"><X className="h-3.5 w-3.5" /></button> : null}
      </div>
    </div>
    {active && typeof job.progress?.percent === 'number' ? <div className="mt-2 h-1 overflow-hidden rounded bg-surface"><div className="h-full bg-primary" style={{ width: `${job.progress.percent}%` }} /></div> : null}
  </li>
}

export function GenerationQueuePopover() {
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const { active, queued, attention } = useGenerationQueue()
  const count = queued.length + attention.length + (active ? 1 : 0)
  return <>
    <button ref={anchorRef} type="button" aria-label="Generation queue" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="relative h-8 w-8 rounded-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground">
      <ListOrdered className="mx-auto h-4 w-4" />
      {count > 0 ? <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">{count}</span> : null}
    </button>
    {open ? <FloatingMenu anchorRef={anchorRef} placement="bottom-end" role="dialog" aria-label="Generation queue" className="w-80 overflow-hidden rounded-md border border-border bg-popover shadow-xl">
      <div className="border-b border-border px-3 py-2 text-sm font-medium text-foreground">Generation queue</div>
      <ul className="max-h-[60vh] overflow-y-auto">
        {active ? <JobRow job={active} /> : null}
        {queued.map((job, index) => <JobRow key={job.id} job={job} index={index} count={queued.length} />)}
        {attention.map((job) => <JobRow key={job.id} job={job} />)}
        {!active && queued.length === 0 && attention.length === 0 ? <li className="px-3 py-4 text-xs text-muted-foreground">No queued generation work.</li> : null}
      </ul>
    </FloatingMenu> : null}
  </>
}
