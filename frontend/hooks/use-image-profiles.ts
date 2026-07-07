import { useState, useEffect, useCallback } from 'react'
import { backendFetch } from '../lib/backend'
import type { ModelProfile, ModelProfileListResponse } from '../types/model-profiles'
import { logger } from '../lib/logger'

/**
 * Fetch and cache the curated image model profiles from the backend.
 *
 * The backend is the source of truth for which models appear in the
 * AiVS UI (per Phase 4: 'WanGP tells us what can exist; AiVS decides
 * what should be visible'). The frontend never scrapes WanGP options
 * directly into the UI.
 *
 * Profiles are fetched once on mount and refetched on demand (e.g.
 * after a model download completes). The hook exposes a `refresh`
 * callback for that.
 */
function useProfilesByMediaType(mediaType: 'image' | 'video') {
  const [profiles, setProfiles] = useState<ModelProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await backendFetch('/api/model-profiles')
      if (!res.ok) {
        throw new Error(`Failed to load model profiles: ${res.status}`)
      }
      const data: ModelProfileListResponse = await res.json()
      setProfiles(data.profiles.filter((p) => p.mediaType === mediaType))
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      logger.error(`useProfilesByMediaType(${mediaType}): ${message}`)
    } finally {
      setLoading(false)
    }
  }, [mediaType])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { profiles, loading, error, refresh }
}

export function useImageProfiles() {
  return useProfilesByMediaType('image')
}

export function useVideoProfiles() {
  return useProfilesByMediaType('video')
}
