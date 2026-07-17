import { useCallback } from 'react'
import type { DirectorTimelineDocument } from '@/types/project'
import type { ModelProfile } from '@/types/model-profiles'
import type { DirectorSequenceV1 } from '@/types/director'

export function useDirectorSequence(
  timeline: DirectorTimelineDocument | null,
  profiles: ModelProfile[],
  update: (sequence: DirectorSequenceV1) => void,
) {
  const profile = profiles.find((item) => item.director.enabled)

  const change = useCallback((next: DirectorSequenceV1) => {
    update({ ...next, updatedAt: Date.now() })
  }, [update])

  return { sequence: timeline?.sequence, profile, change }
}
