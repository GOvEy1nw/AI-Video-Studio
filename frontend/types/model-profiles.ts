/**
 * Curated model profile types — mirror the backend's
 * `ModelProfileResponse` / `ModelProfileListResponse` shapes from
 * `api_types.py`. The backend is the source of truth for which models
 * appear in the AiVS UI; the frontend reads this list via
 * `GET /api/model-profiles`.
 */

export type ModelProfileAvailability =
  | 'available'
  | 'missing_model_files'
  | 'partially_installed'
  | 'unsupported'
  | 'experimental'
  | 'hidden'

export type ModelProfileStatus = 'stable' | 'experimental' | 'hidden'

export interface ModelProfileCapabilities {
  textToImage: boolean
  referenceImages: boolean
  controlImage: boolean
  inpainting: boolean
  lora: 'supported' | 'unsupported' | 'future' | 'experimental'
}

export interface ModelProfileUi {
  defaultAspectRatio: string
  defaultResolutionTier: string
  allowedAspectRatios: string[]
  allowedResolutionTiers: string[]
}

export interface ModelProfile {
  id: string
  displayName: string
  mediaType: string
  visible: boolean
  status: ModelProfileStatus
  wangpModelType: string
  capabilities: ModelProfileCapabilities
  ui: ModelProfileUi
  availability: ModelProfileAvailability
}

export interface ModelProfileListResponse {
  profiles: ModelProfile[]
}
