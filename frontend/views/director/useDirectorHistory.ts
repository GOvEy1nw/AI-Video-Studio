import { useCallback, useEffect, useRef } from 'react'
import type { DirectorSequenceV1 } from '@/types/director'

const MAX_UNDO_HISTORY = 50

export function useDirectorHistory(
  sequence: DirectorSequenceV1 | undefined,
  onChange: (sequence: DirectorSequenceV1) => void,
  historyKey: string | undefined,
) {
  const past = useRef<DirectorSequenceV1[]>([])
  const future = useRef<DirectorSequenceV1[]>([])

  useEffect(() => {
    past.current = []
    future.current = []
  }, [historyKey])

  const commit = useCallback((next: DirectorSequenceV1) => {
    if (sequence) past.current = [...past.current.slice(-(MAX_UNDO_HISTORY - 1)), sequence]
    future.current = []
    onChange(next)
  }, [onChange, sequence])

  const undo = useCallback(() => {
    if (!sequence) return
    const previous = past.current.pop()
    if (!previous) return
    future.current.push(sequence)
    onChange(previous)
  }, [onChange, sequence])

  const redo = useCallback(() => {
    if (!sequence) return
    const next = future.current.pop()
    if (!next) return
    past.current.push(sequence)
    onChange(next)
  }, [onChange, sequence])

  return { commit, undo, redo }
}
