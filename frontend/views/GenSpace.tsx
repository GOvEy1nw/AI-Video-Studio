import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Trash2, Download, Image, Video, X,
  Heart, Film, Volume2, VolumeX, Sparkles,
  Clock, Monitor, ChevronUp, Scissors, Music,
  ChevronLeft, ChevronRight, Copy, Check, AlertCircle, Pencil
} from 'lucide-react'
import { useProjects } from '../contexts/ProjectContext'
import type { GenSpaceRetakeSource } from '../contexts/ProjectContext'
import { useGeneration } from '../hooks/use-generation'
import { useRetake } from '../hooks/use-retake'
import { useImageProfiles, useVideoProfiles } from '../hooks/use-image-profiles'
import type { Asset } from '../types/project'
import type { ModelProfile } from '../types/model-profiles'
import { GenerationErrorDialog } from '../components/GenerationErrorDialog'
import { copyToAssetFolder } from '../lib/asset-copy'
import { fileUrlToPath } from '../lib/url-to-path'
import { logger } from '../lib/logger'
import { RetakePanel } from '../components/RetakePanel'

type ImageInputItem = {
  id: string
  url: string
  role: string
}

// Asset card with hover overlays
function AssetCard({ 
  asset, 
  onDelete, 
  onPlay,
  onDragStart,
  onCreateVideo,
  onRetake,
  onToggleFavorite
}: {
  asset: Asset
  onDelete: () => void
  onPlay: () => void
  onDragStart: (e: React.DragEvent, asset: Asset) => void
  onCreateVideo?: (asset: Asset) => void
  onRetake?: (asset: Asset) => void
  onToggleFavorite?: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const isFavorite = asset.favorite || false

  useEffect(() => {
    if (asset.type === 'video' && videoRef.current) {
      if (isHovered) {
        videoRef.current.play().catch(() => {})
      } else {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
        setCurrentTime(0)
      }
    }
  }, [isHovered, asset.type])

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    const a = document.createElement('a')
    a.href = asset.url
    a.download = asset.path.split('/').pop() || `${asset.type}-${asset.id}`
    a.click()
  }

  return (
    <div
      className="relative group cursor-pointer rounded-xl overflow-hidden bg-zinc-900"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onPlay}
      draggable={asset.type === 'image'}
      onDragStart={(e) => asset.type === 'image' && onDragStart(e, asset)}
    >
      {asset.type === 'video' ? (
        <video 
          ref={videoRef}
          src={asset.url} 
          className="w-full aspect-video object-contain"
          muted={isMuted}
          loop
          onTimeUpdate={handleTimeUpdate}
        />
      ) : (
        <img src={asset.url} alt="" className="w-full aspect-video object-contain" />
      )}
      
      {/* Favorite heart - always visible when favorited */}
      {isFavorite && !isHovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite?.() }}
          className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white transition-colors z-10"
        >
          <Heart className="h-3.5 w-3.5 fill-current" />
        </button>
      )}
      
      {/* Hover overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 transition-opacity duration-200 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Top buttons */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite?.() }}
              className={`p-1.5 rounded-lg backdrop-blur-md transition-colors ${
                isFavorite ? 'bg-white/20 text-white' : 'bg-black/40 text-white hover:bg-black/60'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            
            {asset.type === 'image' && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onCreateVideo?.(asset) }}
                  className="px-2.5 py-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors flex items-center gap-1.5 text-xs font-medium whitespace-nowrap"
                >
                  <Film className="h-3 w-3" />
                  Create video
                </button>
              </>
            )}
            {asset.type === 'video' && (
              <button
                onClick={(e) => { e.stopPropagation(); onRetake?.(asset) }}
                className="px-2.5 py-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors flex items-center gap-1.5 text-xs font-medium whitespace-nowrap"
              >
                <Scissors className="h-3 w-3" />
                Retake
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
            {/* Tools button hidden for now */}
          </div>
        </div>
        
        {/* Bottom controls for video */}
        {asset.type === 'video' && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-md text-white text-xs font-mono">
                {formatTime(currentTime)}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted) }}
                className="p-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
              >
                {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Delete button (subtle, bottom right) */}
        {(
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white/70 hover:bg-red-500/80 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      
    </div>
  )
}

// Dropdown component for settings
function SettingsDropdown({ 
  trigger, 
  options, 
  value, 
  onChange,
  title 
}: { 
  trigger: React.ReactNode
  options: { value: string; label: string; disabled?: boolean; tooltip?: string; icon?: React.ReactNode }[]
  value: string
  onChange: (value: string) => void
  title: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])
  
  return (
    <div ref={dropdownRef} className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex shrink-0 items-center gap-1 whitespace-nowrap px-2 py-1.5 rounded-md transition-colors ${isOpen ? 'bg-zinc-700 hover:bg-zinc-700' : 'hover:bg-zinc-800'}`}
      >
        {trigger}
      </button>
      
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 bg-zinc-800 border border-zinc-700 rounded-md p-2 min-w-[160px] shadow-xl z-[9999]">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">{title}</div>
          <div className="space-y-1">
            {options.map(option => (
              <div key={option.value} className="relative group/option">
                <button
                  onClick={() => { if (!option.disabled) { onChange(option.value); setIsOpen(false) } }}
                  className={`w-full flex items-center justify-between px-2 py-2 rounded-md transition-colors text-left ${
                    option.disabled
                      ? 'cursor-not-allowed'
                      : value === option.value ? 'bg-white/20 hover:bg-white/25' : 'hover:bg-zinc-700'
                  }`}
                >
                  <span className={`flex items-center gap-2.5 text-sm ${
                    option.disabled 
                      ? 'text-zinc-600' 
                      : value === option.value ? 'text-white' : 'text-zinc-400'
                  }`}>
                    {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                    {option.label}
                  </span>
                  {value === option.value && !option.disabled && (
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                {option.disabled && option.tooltip && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-zinc-700 rounded text-xs text-zinc-300 whitespace-nowrap opacity-0 group-hover/option:opacity-100 pointer-events-none z-[10000] transition-opacity">
                    {option.tooltip}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Lightricks brand icon
function LightricksIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M17.0073 8.18934C16.3266 5.6556 14.9346 2.06903 12.3065 2.06903C9.27204 2.06903 6.86627 7.24621 5.45487 11.7948C4.79654 13.9203 4.35877 15.9049 4.17755 17.1736C4.10214 17.5829 4.06274 18.0044 4.06274 18.4347C4.06274 22.2903 7.22553 25.4338 11.1133 25.4338C15.5206 25.4338 23.9376 22.7073 23.9376 18.4347C23.9376 17.1179 23.1376 15.948 21.9018 14.9595L21.9039 14.9575C22.4493 13.7707 22.847 12.648 23.001 11.705C23.1934 10.5053 23.0074 9.5494 22.4429 8.88217C21.7692 8.07382 20.7107 7.85572 19.6586 7.84288C18.8826 7.84288 17.9777 7.96904 17.0073 8.18934ZM8.00176 9.17083C7.6945 9.93266 7.02317 11.7419 6.70157 12.9799C7.93005 11.9987 9.2965 11.1653 10.7091 10.4796C12.2325 9.73758 13.9171 9.06448 15.518 8.58411C15.08 6.98293 13.9585 3.62158 12.3129 3.62158C11.0298 3.62158 9.41958 5.69374 8.00176 9.17083ZM20.6201 14.083L20.6209 14.0786C21.0507 13.1163 21.3522 12.2118 21.4741 11.4547C21.5511 10.9607 21.5832 10.2872 21.2752 9.89577C20.9416 9.46599 20.1975 9.39543 19.6521 9.38901C18.9932 9.38901 18.2117 9.49943 17.3641 9.69208L17.3683 9.69702C17.586 10.7217 17.7526 11.772 17.8808 12.7968C18.8527 13.16 19.7877 13.5908 20.6201 14.083ZM15.8828 10.0897C14.6739 10.4588 13.4041 10.9464 12.209 11.4846C13.4346 11.588 14.8471 11.8527 16.2581 12.2608C16.1554 11.5367 16.0273 10.8061 15.8799 10.0948L15.8828 10.0897ZM11.1133 12.9816C8.07878 12.9816 5.60884 15.4258 5.60884 18.4347C5.60884 21.4435 8.07878 23.8878 11.1133 23.8878C13.8701 23.8878 16.3653 21.6639 16.6048 18.9158C16.7011 17.7546 16.669 15.9263 16.4637 13.9311C14.6294 13.3385 12.6763 12.9816 11.1133 12.9816ZM18.3883 22.2069C17.7984 22.4697 17.1711 22.7085 16.5284 22.9184C18.0872 21.3274 19.8832 18.8193 21.1982 16.3689L21.1997 16.3654C21.9756 17.0509 22.3915 17.7593 22.3915 18.4347C22.3915 19.6985 20.9288 21.0778 18.3883 22.2069ZM19.9493 15.4655L19.9473 15.4707C19.4291 16.4567 18.8221 17.4625 18.1833 18.4092C18.2214 17.4089 18.1892 16.0386 18.0611 14.5212C18.71 14.7948 19.3456 15.1021 19.9493 15.4655Z" fill="currentColor" />
    </svg>
  )
}

// Square icon for aspect ratio
function AspectIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
    </svg>
  )
}

// Profile-driven image-mode controls. Reads the curated profile list
// from the backend and drives the model/resolution/aspect dropdowns
// from the selected profile. When the user switches models, the current
// aspect ratio / resolution tier are kept if the new model supports
// them, otherwise they fall back to the new model's defaults. Per the
// Phase 4 brief: never silently keep an invalid resolution from the
// previous model.
function ImageModeControls({
  settings,
  onSettingsChange,
  imageProfiles,
}: {
  settings: {
    imageResolution: string
    imageAspectRatio: string
    imageProfileId?: string
    imageInputRole?: string
  }
  onSettingsChange: (settings: any) => void
  imageProfiles: ModelProfile[]
}) {
  const selectedProfileId = settings.imageProfileId || 'z_image_turbo'
  const selectedProfile =
    imageProfiles.find((p) => p.id === selectedProfileId) || imageProfiles[0]

  // If the selected profile doesn't support the current aspect ratio or
  // resolution tier, fall back to the profile's defaults. This runs on
  // every render but only emits a change when the values actually need
  // to shift, so it won't loop.
  useEffect(() => {
    if (!selectedProfile) return
    const allowedAspects = selectedProfile.ui.allowedAspectRatios
    const allowedTiers = selectedProfile.ui.allowedResolutionTiers
    const next: any = { ...settings, imageProfileId: selectedProfile.id }
    let changed = false
    if (!allowedAspects.includes(settings.imageAspectRatio)) {
      next.imageAspectRatio = selectedProfile.ui.defaultAspectRatio
      changed = true
    }
    if (!allowedTiers.includes(settings.imageResolution)) {
      next.imageResolution = selectedProfile.ui.defaultResolutionTier
      changed = true
    }
    if (changed) {
      onSettingsChange(next)
    }
  }, [selectedProfile, settings, onSettingsChange])

  if (!selectedProfile) {
    // Profiles not loaded yet — show a placeholder.
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-800/50 text-zinc-500 text-xs">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>Loading models…</span>
      </div>
    )
  }

  const isAvailable = selectedProfile.availability === 'available'
  const isExperimental = selectedProfile.availability === 'experimental'
  const modelOptions = imageProfiles.map((p) => ({
    value: p.id,
    label: p.displayName + (p.status === 'experimental' ? ' (experimental)' : ''),
    disabled: p.availability === 'missing_model_files' || p.availability === 'unsupported',
    tooltip:
      p.availability === 'missing_model_files'
        ? `${p.displayName} is supported by AiVS, but the required WanGP model files are not installed yet.`
        : p.status === 'experimental'
          ? 'Experimental — may be less stable.'
          : undefined,
  }))

  return (
    <>
      <SettingsDropdown
        title="IMAGE MODEL"
        value={selectedProfile.id}
        onChange={(v) => onSettingsChange({ ...settings, imageProfileId: v })}
        options={modelOptions}
        trigger={
          <>
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-zinc-300 font-medium">{selectedProfile.displayName}</span>
            {isExperimental && (
              <span className="text-[9px] uppercase tracking-wider text-amber-500">exp</span>
            )}
            <ChevronUp className="h-3 w-3 text-zinc-500" />
          </>
        }
      />

      <div className="w-px h-4 bg-zinc-700 mx-0.5" />

      <SettingsDropdown
        title="RESOLUTION"
        value={settings.imageResolution}
        onChange={(v) => onSettingsChange({ ...settings, imageResolution: v })}
        options={selectedProfile.ui.allowedResolutionTiers.map((tier) => ({
          value: tier,
          label: tier,
        }))}
        trigger={
          <>
            <Monitor className="h-3.5 w-3.5" />
            <span>{settings.imageResolution.replace('p', '')}</span>
          </>
        }
      />

      <SettingsDropdown
        title="ASPECT RATIO"
        value={settings.imageAspectRatio}
        onChange={(v) => onSettingsChange({ ...settings, imageAspectRatio: v })}
        options={selectedProfile.ui.allowedAspectRatios.map((ratio) => ({
          value: ratio,
          label: ratio,
        }))}
        trigger={
          <>
            <AspectIcon className="h-3.5 w-3.5" />
            <span>{settings.imageAspectRatio}</span>
          </>
        }
      />

      {!isAvailable && !isExperimental && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 text-[10px]">
          <AlertCircle className="h-3 w-3" />
          <span>Model files missing</span>
        </div>
      )}
    </>
  )
}

// Prompt bar component matching the design
// Two-row layout: prompt row on top, settings row below
function PromptBar({
  mode,
  onModeChange,
  prompt,
  onPromptChange,
  onGenerate,
  isGenerating,
  inputImage,
  onInputImageChange,
  imageInputs,
  onImageInputsChange,
  inputAudio,
  onInputAudioChange,
  settings,
  onSettingsChange,
  canGenerate,
  buttonLabel,
  buttonIcon,
  imageProfiles,
  videoProfiles,
}: {
  mode: 'image' | 'video' | 'retake'
  onModeChange: (mode: 'image' | 'video' | 'retake') => void
  prompt: string
  onPromptChange: (prompt: string) => void
  onGenerate: () => void
  isGenerating: boolean
  canGenerate: boolean
  buttonLabel: string
  buttonIcon: React.ReactNode
  inputImage: string | null
  onInputImageChange: (url: string | null) => void
  imageInputs: ImageInputItem[]
  onImageInputsChange: (items: ImageInputItem[]) => void
  inputAudio: string | null
  onInputAudioChange: (url: string | null) => void
  settings: {
    model: string
    videoProfileId?: string
    duration: number
    videoResolution: string
    fps: number
    aspectRatio: string
    imageResolution: string
    imageAspectRatio: string
    imageProfileId?: string
    imageInputRole?: string
    variations: number
    audio?: boolean
  }
  onSettingsChange: (settings: any) => void
  imageProfiles: ModelProfile[]
  videoProfiles: ModelProfile[]
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isAudioDragOver, setIsAudioDragOver] = useState(false)
  const [activeImageInputId, setActiveImageInputId] = useState<string | null>(null)
  const isRetake = mode === 'retake'
  const LOCAL_MAX_DURATION: Record<string, number> = { '540p': 20, '720p': 10, '1080p': 5 }
  const localMaxDuration = LOCAL_MAX_DURATION[settings.videoResolution] ?? 20
  const videoDurationOptions = [5, 6, 8, 10, 20].filter(d => d <= localMaxDuration)
  const selectedVideoProfile = videoProfiles.find((profile) => profile.id === settings.videoProfileId) || videoProfiles[0]
  const videoResolutionOptions = selectedVideoProfile?.ui.allowedResolutionTiers ?? ['540p', '720p', '1080p']
  const selectedImageProfile = imageProfiles.find((profile) => profile.id === settings.imageProfileId) || imageProfiles[0]
  const imageInputPolicy = selectedImageProfile?.inputMedia
  const supportsImageInput = mode === 'image' && !!imageInputPolicy?.supportsImageInputs
  const imageMaxInputs = imageInputPolicy?.maxImages ?? 0
  const canAddImageInput = supportsImageInput && imageInputs.length < imageMaxInputs
  const defaultImageInputRole = imageInputPolicy?.defaultRole || imageInputPolicy?.roles[0]?.role || 'reference_subject'

  useEffect(() => {
    if (mode !== 'video' || !selectedVideoProfile) return
    const allowedAspects = selectedVideoProfile.ui.allowedAspectRatios
    const allowedTiers = selectedVideoProfile.ui.allowedResolutionTiers
    const next: any = { ...settings, videoProfileId: selectedVideoProfile.id }
    let changed = false
    if (!allowedAspects.includes(settings.aspectRatio)) {
      next.aspectRatio = selectedVideoProfile.ui.defaultAspectRatio
      changed = true
    }
    if (!allowedTiers.includes(settings.videoResolution)) {
      next.videoResolution = selectedVideoProfile.ui.defaultResolutionTier
      changed = true
    }
    if (!settings.videoProfileId) {
      changed = true
    }
    if (changed) {
      onSettingsChange(next)
    }
  }, [mode, selectedVideoProfile, settings, onSettingsChange])

  useEffect(() => {
    if (mode !== 'image') return
    if (!imageInputPolicy?.supportsImageInputs) {
      if (imageInputs.length > 0) {
        onImageInputsChange([])
      }
      setActiveImageInputId(null)
      return
    }
    const supportedRoles = new Set(imageInputPolicy.roles.map((role) => role.role))
    const normalized = imageInputs
      .slice(0, imageInputPolicy.maxImages)
      .map((item) => supportedRoles.has(item.role) ? item : { ...item, role: defaultImageInputRole })
    const changed =
      normalized.length !== imageInputs.length ||
      normalized.some((item, index) => item.role !== imageInputs[index]?.role)
    if (changed) {
      onImageInputsChange(normalized)
    }
    if (activeImageInputId && !normalized.some((item) => item.id === activeImageInputId)) {
      setActiveImageInputId(null)
    }
  }, [mode, imageInputPolicy, imageInputs, activeImageInputId, defaultImageInputRole, onImageInputsChange])

  const resetImageFileInput = () => {
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const addImageInput = (url: string) => {
    if (mode === 'image' && supportsImageInput) {
      if (!canAddImageInput) return
      const nextItem = {
        id: crypto.randomUUID(),
        url,
        role: defaultImageInputRole,
      }
      onImageInputsChange([...imageInputs, nextItem])
      setActiveImageInputId(nextItem.id)
      resetImageFileInput()
      return
    }
    onInputImageChange(url)
    resetImageFileInput()
  }

  const updateImageInputRole = (id: string, role: string) => {
    onImageInputsChange(imageInputs.map((item) => item.id === id ? { ...item, role } : item))
    setActiveImageInputId(null)
  }

  const removeImageInput = (id: string) => {
    onImageInputsChange(imageInputs.filter((item) => item.id !== id))
    if (activeImageInputId === id) {
      setActiveImageInputId(null)
    }
    resetImageFileInput()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const assetData = e.dataTransfer.getData('asset')
    if (assetData) {
      const asset = JSON.parse(assetData) as Asset
      if (asset.type === 'image') {
        addImageInput(asset.url)
        return
      }
    }

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const filePath = (file as any).path as string | undefined
      if (filePath) {
        const normalized = filePath.replace(/\\/g, '/')
        const fileUrl = normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`
        addImageInput(fileUrl)
      } else {
        addImageInput(URL.createObjectURL(file))
      }
    }
  }

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsAudioDragOver(false)

    const assetData = e.dataTransfer.getData('asset')
    if (assetData) {
      const asset = JSON.parse(assetData) as Asset
      if (asset.type === 'audio') {
        onInputAudioChange(asset.url)
      }
    }

    // Handle file drops
    const file = e.dataTransfer.files?.[0]
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(ext || '')) {
        const filePath = (file as any).path as string | undefined
        if (filePath) {
          const normalized = filePath.replace(/\\/g, '/')
          const fileUrl = normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`
          onInputAudioChange(fileUrl)
        }
      }
    }
  }

  const handleAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const filePath = (file as any).path as string | undefined
      if (filePath) {
        const normalized = filePath.replace(/\\/g, '/')
        const fileUrl = normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`
        onInputAudioChange(fileUrl)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      // In Electron, File objects have a .path property with the full filesystem path
      const filePath = (file as any).path as string | undefined
      if (filePath) {
        const normalized = filePath.replace(/\\/g, '/')
        const fileUrl = normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`
        addImageInput(fileUrl)
      } else {
        const url = URL.createObjectURL(file)
        addImageInput(url)
      }
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isGenerating && canGenerate) {
      e.preventDefault()
      onGenerate()
    }
  }

  const videoModelOptions = videoProfiles.map((profile) => ({
    value: profile.id,
    label: profile.displayName + (profile.status === 'experimental' ? ' (experimental)' : ''),
    disabled: profile.availability === 'missing_model_files' || profile.availability === 'unsupported',
    tooltip:
      profile.availability === 'missing_model_files'
        ? `${profile.displayName} is supported by AiVS, but the required WanGP model files are not installed yet.`
        : profile.status === 'experimental'
          ? 'Experimental — may be less stable.'
          : undefined,
  }))
  const selectedVideoIsExperimental = selectedVideoProfile?.availability === 'experimental'

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-visible">
      {supportsImageInput && (
        <div className="relative flex items-center gap-2 overflow-visible px-2 pt-2 pb-1">
          {imageInputs.map((item) => {
            const role = imageInputPolicy?.roles.find((candidate) => candidate.role === item.role)
            const isActive = activeImageInputId === item.id
            return (
              <div key={item.id} className="relative">
                {isActive && imageInputPolicy && (
                  <div className="absolute bottom-full left-0 mb-2 w-56 rounded-md border border-zinc-700 bg-zinc-800 p-2 shadow-xl z-[10000]">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Image input</div>
                    <div className="space-y-1">
                      {imageInputPolicy.roles.map((option) => (
                        <button
                          key={option.role}
                          onClick={() => updateImageInputRole(item.id, option.role)}
                          className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-colors ${
                            item.role === option.role ? 'bg-white/20 text-white' : 'text-zinc-400 hover:bg-zinc-700'
                          }`}
                          title={option.description}
                        >
                          <Image className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="text-xs">{option.label}</span>
                        </button>
                      ))}
                      <div className="h-px bg-zinc-700 my-1" />
                      <button
                        onClick={() => removeImageInput(item.id)}
                        className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-left text-red-300 hover:bg-red-500/15 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="text-xs">Remove</span>
                      </button>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setActiveImageInputId(isActive ? null : item.id)}
                  className="group relative h-14 w-14 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800"
                  title={role?.label || imageInputPolicy?.tooltipLabel}
                >
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Pencil className="h-4 w-4 text-white" />
                  </div>
                </button>
              </div>
            )
          })}
          {canAddImageInput && (
            <div
              className={`relative h-14 w-14 rounded-lg border-2 border-dashed transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer ${
                isDragOver ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-700 hover:border-zinc-500'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              title={imageInputPolicy?.tooltipLabel}
            >
              <Image className="h-4 w-4 text-zinc-500" />
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Top row: media inputs | Prompt */}
      <div className="flex items-start">
        {/* Input image drop zone — video mode only (I2V) */}
        {mode === 'video' && !isRetake && (
          <div
            className={`relative w-10 h-10 mx-2 mt-2 rounded-lg border-2 border-dashed transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer ${
              isDragOver ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-700 hover:border-zinc-500'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            title="Attach image for I2V"
          >
            {inputImage ? (
              <>
                <img src={inputImage} alt="" className="w-full h-full object-cover rounded-md" />
                <button
                  onClick={(e) => { e.stopPropagation(); onInputImageChange(null); resetImageFileInput() }}
                  className="absolute -top-1 -right-1 p-0.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white z-10"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <Image className="h-4 w-4 text-zinc-500" />
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Audio drop zone — only in video mode */}
        {mode === 'video' && !isRetake && (
          <div
            className={`relative w-10 h-10 mt-2 rounded-lg border-2 border-dashed transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer ${
              isAudioDragOver ? 'border-emerald-500 bg-emerald-500/10' : inputAudio ? 'border-emerald-600' : 'border-zinc-700 hover:border-zinc-500'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsAudioDragOver(true) }}
            onDragLeave={() => setIsAudioDragOver(false)}
            onDrop={handleAudioDrop}
            onClick={() => audioInputRef.current?.click()}
            title={inputAudio ? 'Audio attached — click to change' : 'Attach audio for A2V'}
          >
            {inputAudio ? (
              <>
                <Music className="h-4 w-4 text-emerald-400" />
                <button
                  onClick={(e) => { e.stopPropagation(); onInputAudioChange(null) }}
                  className="absolute -top-1 -right-1 p-0.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white z-10"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <Music className="h-4 w-4 text-zinc-500" />
            )}
            <input
              ref={audioInputRef}
              type="file"
              accept=".mp3,.wav,.ogg,.aac,.flac,.m4a"
              onChange={handleAudioFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Prompt input - fills remaining width */}
        <div className="flex-1 min-w-0 py-1">
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'retake'
              ? "Describe what should happen in the selected section..."
              : mode === 'image'
                ? "A close-up of a woman talking on the phone..."
                : "The woman sips from a cup of coffee..."
            }
            className="w-full bg-transparent text-white text-sm placeholder:text-zinc-500 focus:outline-none px-2 py-2 resize-none overflow-y-auto h-[70px] leading-5"
          />
        </div>

      </div>
      
      {/* Bottom row: Mode selector + Settings */}
      <div className="flex items-center gap-0.5 px-1.5 py-1.5 border-t border-zinc-800/60 text-xs text-zinc-400">
        {/* Mode dropdown */}
        <SettingsDropdown
          title="MODE"
          value={mode}
          onChange={(v) => onModeChange(v as 'image' | 'video' | 'retake')}
          options={[
            { value: 'image', label: 'Generate Images', icon: <Image className="h-4 w-4" /> },
            { value: 'video', label: 'Generate Videos', icon: <Video className="h-4 w-4" /> },
            { value: 'retake', label: 'Retake', icon: <Scissors className="h-4 w-4" /> },
          ]}
          trigger={
            <>
              {mode === 'image' ? <Image className="h-3.5 w-3.5" /> : mode === 'retake' ? <Scissors className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
              <span className="text-zinc-300 font-medium">{mode === 'image' ? 'Image' : mode === 'retake' ? 'Retake' : 'Video'}</span>
              <ChevronUp className="h-3 w-3 text-zinc-500" />
            </>
          }
        />
        
        <div className="flex-1" />
        
        {isRetake ? (
          <div className="text-[10px] text-zinc-500 pr-2">Trim in the panel above, then retake</div>
        ) : mode === 'image' ? (
          <ImageModeControls
            settings={settings}
            onSettingsChange={onSettingsChange}
            imageProfiles={imageProfiles}
          />
        ) : (
          <>
            {selectedVideoProfile ? (
              <SettingsDropdown
                title="MODEL"
                value={selectedVideoProfile.id}
                onChange={(v) => onSettingsChange({ ...settings, videoProfileId: v })}
                options={videoModelOptions}
                trigger={
                  <>
                    <LightricksIcon className="h-3.5 w-3.5" />
                    <span className="text-zinc-300 font-medium">{selectedVideoProfile.displayName}</span>
                    {selectedVideoIsExperimental && (
                      <span className="text-[9px] uppercase tracking-wider text-amber-500">exp</span>
                    )}
                  </>
                }
              />
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-800/50 text-zinc-500 text-xs">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Loading models…</span>
              </div>
            )}

            <div className="w-px h-4 bg-zinc-700 mx-0.5" />
            
            {/* Duration dropdown */}
            <SettingsDropdown
              title="DURATION"
              value={String(settings.duration)}
              onChange={(v) => onSettingsChange({ ...settings, duration: parseFloat(v) })}
              options={videoDurationOptions.map((value) => ({ value: String(value), label: `${value} Sec` }))}
              trigger={
                <>
                  <Clock className="h-3.5 w-3.5" />
                  <span>{settings.duration}s</span>
                </>
              }
            />
            
            {/* Resolution dropdown */}
            <SettingsDropdown
              title="RESOLUTION"
              value={settings.videoResolution}
              onChange={(v) => {
                const maxDur = LOCAL_MAX_DURATION[v] ?? 20
                const clampedDuration = settings.duration > maxDur ? maxDur : settings.duration
                onSettingsChange({ ...settings, videoResolution: v, duration: clampedDuration })
              }}
              options={videoResolutionOptions.map((value) => ({ value, label: value }))}
              trigger={
                <>
                  <Monitor className="h-3.5 w-3.5" />
                  <span>{settings.videoResolution.replace('p', '')}</span>
                </>
              }
            />

            
            {/* Aspect Ratio dropdown */}
            <SettingsDropdown
              title="ASPECT RATIO"
              value={settings.aspectRatio}
              onChange={(v) => onSettingsChange({ ...settings, aspectRatio: v })}
              options={inputAudio
                ? [{ value: '16:9', label: '16:9' }]
                : [
                    { value: '16:9', label: '16:9' },
                    { value: '9:16', label: '9:16' },
                  ]
              }
              trigger={
                <>
                  <AspectIcon className="h-3.5 w-3.5" />
                  <span>{settings.aspectRatio}</span>
                </>
              }
            />
            
          </>
        )}
        
        {/* Generate button */}
        <button
          onClick={onGenerate}
          disabled={isGenerating || !canGenerate}
          className={`flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all flex-shrink-0 ${
            isGenerating || !canGenerate
              ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              : 'bg-white text-black hover:bg-zinc-200'
          }`}
        >
          <span className={isGenerating ? 'animate-pulse' : ''}>{buttonIcon}</span>
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}

// Gallery size icon components
function GridSmallIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="2" width="4" height="4" rx="0.5" />
      <rect x="8" y="2" width="4" height="4" rx="0.5" />
      <rect x="14" y="2" width="4" height="4" rx="0.5" />
      <rect x="20" y="2" width="2" height="4" rx="0.5" />
      <rect x="2" y="8" width="4" height="4" rx="0.5" />
      <rect x="8" y="8" width="4" height="4" rx="0.5" />
      <rect x="14" y="8" width="4" height="4" rx="0.5" />
      <rect x="20" y="8" width="2" height="4" rx="0.5" />
      <rect x="2" y="14" width="4" height="4" rx="0.5" />
      <rect x="8" y="14" width="4" height="4" rx="0.5" />
      <rect x="14" y="14" width="4" height="4" rx="0.5" />
      <rect x="20" y="14" width="2" height="4" rx="0.5" />
    </svg>
  )
}

function GridMediumIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="2" width="6" height="6" rx="1" />
      <rect x="10" y="2" width="6" height="6" rx="1" />
      <rect x="18" y="2" width="4" height="6" rx="1" />
      <rect x="2" y="10" width="6" height="6" rx="1" />
      <rect x="10" y="10" width="6" height="6" rx="1" />
      <rect x="18" y="10" width="4" height="6" rx="1" />
      <rect x="2" y="18" width="6" height="4" rx="1" />
      <rect x="10" y="18" width="6" height="4" rx="1" />
      <rect x="18" y="18" width="4" height="4" rx="1" />
    </svg>
  )
}

function GridLargeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="2" width="9" height="9" rx="1.5" />
      <rect x="13" y="2" width="9" height="9" rx="1.5" />
      <rect x="2" y="13" width="9" height="9" rx="1.5" />
      <rect x="13" y="13" width="9" height="9" rx="1.5" />
    </svg>
  )
}

type GallerySize = 'small' | 'medium' | 'large'

const gallerySizeClasses: Record<GallerySize, string> = {
  small: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7',
  medium: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
  large: 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3',
}

const DEFAULT_VIDEO_SETTINGS = {
  model: 'fast',
  videoProfileId: 'ltx2_22b_distilled',
  duration: 5,
  videoResolution: '540p',
  fps: 24,
  aspectRatio: '16:9',
  imageResolution: '720p',
  imageSteps: 8,
  variations: 1,
  audio: true,
  imageProfileId: 'z_image_turbo',
  imageAspectRatio: '1:1',
  imageInputRole: undefined as string | undefined,
}

export function GenSpace() {
  const { currentProject, currentProjectId, addAsset, addTakeToAsset, deleteAsset, toggleFavorite, genSpaceEditImageUrl, setGenSpaceEditImageUrl, setGenSpaceEditMode, genSpaceAudioUrl, setGenSpaceAudioUrl, genSpaceRetakeSource, setGenSpaceRetakeSource, setPendingRetakeUpdate } = useProjects()
  const [mode, setMode] = useState<'image' | 'video' | 'retake'>('video')
  const [prompt, setPrompt] = useState('')
  const [inputImage, setInputImage] = useState<string | null>(null)
  const [imageInputs, setImageInputs] = useState<ImageInputItem[]>([])
  const [inputAudio, setInputAudio] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)
  const [gallerySize, setGallerySize] = useState<GallerySize>('medium')
  const [showSizeMenu, setShowSizeMenu] = useState(false)
  const sizeMenuRef = useRef<HTMLDivElement>(null)
  const persistedVideoKeyRef = useRef<string | null>(null)
  const persistedImageKeyRef = useRef<string | null>(null)
  const retakeSubmissionRef = useRef<{
    prompt: string
    input: {
      videoPath: string | null
      startTime: number
      duration: number
      videoDuration: number
    }
  } | null>(null)
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_VIDEO_SETTINGS }))

  const {
    generate,
    generateImage,
    isGenerating,
    progress,
    statusMessage,
    videoUrl,
    videoPath,
    imageUrls,
    imagePaths,
    error,
    reset,
  } = useGeneration()

  const { profiles: imageProfiles } = useImageProfiles()
  const { profiles: videoProfiles } = useVideoProfiles()

  const {
    submitRetake,
    resetRetake,
    isRetaking,
    retakeStatus,
    retakeError,
    retakeResult,
  } = useRetake()

  const [retakeInput, setRetakeInput] = useState({
    videoUrl: null as string | null,
    videoPath: null as string | null,
    startTime: 0,
    duration: 0,
    videoDuration: 0,
    ready: false,
  })
  const [retakePanelKey, setRetakePanelKey] = useState(0)
  const [retakeInitial, setRetakeInitial] = useState<{
    videoUrl: string | null
    videoPath: string | null
    duration?: number
  }>({ videoUrl: null, videoPath: null, duration: undefined })
  const [activeRetakeSource, setActiveRetakeSource] = useState<GenSpaceRetakeSource | null>(null)
  
  // Handle incoming frame from the Video Editor for editing
  useEffect(() => {
    if (genSpaceEditImageUrl) {
      setMode('video')
      setInputImage(genSpaceEditImageUrl)
      setPrompt('')
      setGenSpaceEditImageUrl(null)
      setGenSpaceEditMode(null)
    }
  }, [genSpaceEditImageUrl, setGenSpaceEditImageUrl, setGenSpaceEditMode])

  // Handle incoming audio from the Video Editor for A2V
  useEffect(() => {
    if (genSpaceAudioUrl) {
      setMode('video')
      setInputAudio(genSpaceAudioUrl)
      setPrompt('')
      setGenSpaceAudioUrl(null)
    }
  }, [genSpaceAudioUrl, setGenSpaceAudioUrl])

  useEffect(() => {
    if (!genSpaceRetakeSource) return
    setMode('retake')
    setPrompt('')
    setActiveRetakeSource(genSpaceRetakeSource)
    setRetakeInitial({
      videoUrl: genSpaceRetakeSource.videoUrl,
      videoPath: genSpaceRetakeSource.videoPath,
      duration: genSpaceRetakeSource.duration,
    })
    setRetakePanelKey((prev) => prev + 1)
    setGenSpaceRetakeSource(null)
  }, [genSpaceRetakeSource, setGenSpaceRetakeSource])

  useEffect(() => {
    if (retakeError) {
      setLocalError(retakeError)
    }
  }, [retakeError])

  // Only show assets that were generated (have generationParams), not imported files
  const assets = (currentProject?.assets || []).filter(a => a.generationParams)
  const [lastPrompt, setLastPrompt] = useState('')
  
  // When video generation completes, add to project assets
  useEffect(() => {
    if (!videoUrl || !videoPath || !currentProjectId || isGenerating) return

    const generationKey = `${videoUrl}|${videoPath}`
    if (persistedVideoKeyRef.current === generationKey) return
    persistedVideoKeyRef.current = generationKey

    const genMode = inputAudio
      ? 'audio-to-video'
      : inputImage ? 'image-to-video' : 'text-to-video'
    const savedVideoSettings = settings

    ;(async () => {
      try {
        const copied = await copyToAssetFolder(videoPath, currentProjectId)
        const finalPath = copied?.path ?? videoPath
        const finalUrl = copied?.url ?? videoUrl
        addAsset(currentProjectId, {
          type: 'video',
          path: finalPath,
          url: finalUrl,
          prompt: lastPrompt,
          resolution: savedVideoSettings.videoResolution,
          duration: savedVideoSettings.duration,
          generationParams: {
            mode: genMode as 'text-to-video' | 'image-to-video' | 'audio-to-video',
            prompt: lastPrompt,
            model: savedVideoSettings.model,
            videoProfileId: savedVideoSettings.videoProfileId,
            duration: savedVideoSettings.duration,
            resolution: savedVideoSettings.videoResolution,
            fps: savedVideoSettings.fps,
            audio: savedVideoSettings.audio || false,
            cameraMotion: 'none',
            imageAspectRatio: savedVideoSettings.aspectRatio,
            imageSteps: savedVideoSettings.imageSteps,
            inputImageUrl: inputImage || undefined,
            inputAudioUrl: inputAudio || undefined,
          },
          takes: [{
            url: finalUrl,
            path: finalPath,
            createdAt: Date.now(),
          }],
          activeTakeIndex: 0,
        })
        reset()
      } catch (err) {
        persistedVideoKeyRef.current = null
        logger.error(`Failed to persist generated video asset: ${err}`)
      }
    })()
  }, [videoUrl, videoPath, currentProjectId, isGenerating, settings, inputImage, inputAudio, lastPrompt, addAsset, reset])

  // When retake completes, add as take or new asset
  useEffect(() => {
    if (!retakeResult || !currentProjectId || isRetaking) return
    const submission = retakeSubmissionRef.current
    if (!submission) return
    retakeSubmissionRef.current = null

    ;(async () => {
      const usedPrompt = submission.prompt
      const usedInput = submission.input
      const copied = await copyToAssetFolder(retakeResult.videoPath, currentProjectId)
      const finalPath = copied?.path ?? retakeResult.videoPath
      const finalUrl = copied?.url ?? retakeResult.videoUrl

      if (activeRetakeSource?.assetId) {
        const sourceAsset = currentProject?.assets?.find(a => a.id === activeRetakeSource.assetId)
        if (sourceAsset) {
          const newTakeIndex = sourceAsset.takes ? sourceAsset.takes.length : 1
          addTakeToAsset(currentProjectId, sourceAsset.id, {
            url: finalUrl,
            path: finalPath,
            createdAt: Date.now(),
          })
          if (activeRetakeSource.linkedClipIds?.length) {
            setPendingRetakeUpdate({
              assetId: sourceAsset.id,
              clipIds: activeRetakeSource.linkedClipIds,
              newTakeIndex,
            })
          }
        }
      } else {
        addAsset(currentProjectId, {
          type: 'video',
          path: finalPath,
          url: finalUrl,
          prompt: usedPrompt,
          resolution: '',
          duration: usedInput.duration,
          generationParams: {
            mode: 'retake',
            prompt: usedPrompt,
            model: 'pro',
            duration: usedInput.duration,
            resolution: '',
            fps: 24,
            audio: true,
            cameraMotion: 'none',
            retakeVideoPath: finalPath,
            retakeStartTime: usedInput.startTime,
            retakeDuration: usedInput.duration,
            retakeMode: 'replace_audio_and_video',
          },
          takes: [{ url: finalUrl, path: finalPath, createdAt: Date.now() }],
          activeTakeIndex: 0,
        })
        setMode('video')
      }

      setActiveRetakeSource(null)
      resetRetake()
    })()
  }, [retakeResult, isRetaking, currentProjectId, currentProject?.assets, activeRetakeSource, addAsset, addTakeToAsset, setPendingRetakeUpdate, resetRetake])
  
  // When image generation/editing completes, add all images to project assets
  useEffect(() => {
    if (imageUrls.length === 0 || !currentProjectId || isGenerating) return

    const generationKey = `${imageUrls.join('|')}|${imagePaths.join('|')}`
    if (persistedImageKeyRef.current === generationKey) return
    persistedImageKeyRef.current = generationKey

    const genMode = 'text-to-image'
    const savedSettings = settings
    const savedImageInputs = imageInputs

    ;(async () => {
      try {
        for (let i = 0; i < imageUrls.length; i++) {
          const imageUrl = imageUrls[i]
          const imgPath = imagePaths[i] || null
          const exists = assets.some(a => a.url === imageUrl || a.path === imgPath)
          if (!exists) {
            const copied = imgPath ? await copyToAssetFolder(imgPath, currentProjectId) : null
            const finalPath = copied?.path ?? imgPath ?? imageUrl
            const finalUrl = copied?.url ?? imageUrl
            addAsset(currentProjectId, {
              type: 'image',
              path: finalPath,
              url: finalUrl,
              prompt: lastPrompt,
              resolution: savedSettings.imageResolution,
              generationParams: {
                mode: genMode,
                prompt: lastPrompt,
                model: savedSettings.imageProfileId || 'z_image_turbo',
                duration: 5,
                resolution: savedSettings.imageResolution,
                fps: 24,
                audio: false,
                cameraMotion: 'none',
                imageAspectRatio: savedSettings.imageAspectRatio || savedSettings.aspectRatio,
                imageSteps: savedSettings.imageSteps,
                imageProfileId: savedSettings.imageProfileId,
                inputImageUrl: savedImageInputs[0]?.url,
                imageInputRole: savedImageInputs[0]?.role,
                imageInputMedia: savedImageInputs.map((item) => ({ url: item.url, role: item.role })),
              },
              takes: [{
                url: finalUrl,
                path: finalPath,
                createdAt: Date.now(),
              }],
              activeTakeIndex: 0,
            })
          }
        }
        reset()
      } catch (err) {
        persistedImageKeyRef.current = null
        logger.error(`Failed to persist generated image asset: ${err}`)
      }
    })()
  }, [imageUrls, imagePaths, currentProjectId, isGenerating, settings, imageInputs, lastPrompt, assets, addAsset, reset])
  
  const handleGenerate = async () => {
    if (mode === 'retake') {
      if (!retakeInput.videoPath || retakeInput.duration < 2) return
      retakeSubmissionRef.current = {
        prompt,
        input: {
          videoPath: retakeInput.videoPath,
          startTime: retakeInput.startTime,
          duration: retakeInput.duration,
          videoDuration: retakeInput.videoDuration,
        },
      }
      await submitRetake({
        videoPath: retakeInput.videoPath,
        startTime: retakeInput.startTime,
        duration: retakeInput.duration,
        prompt,
        mode: 'replace_audio_and_video',
      })
      return
    }

    if (!prompt.trim()) return

    // Save the prompt before generation starts
    setLastPrompt(prompt)

    if (mode === 'image') {
      const inputMedia = imageInputs
        .map((item) => {
          const path = fileUrlToPath(item.url)
          return path ? { path, role: item.role } : null
        })
        .filter((item): item is { path: string; role: string } => item !== null)
      generateImage(
        prompt,
        {
          model: 'fast' as 'fast' | 'pro',
          duration: 5,
          videoResolution: settings.videoResolution,
          fps: 24,
          audio: false,
          cameraMotion: 'none',
          imageResolution: settings.imageResolution,
          imageAspectRatio: settings.imageAspectRatio || settings.aspectRatio,
          imageSteps: settings.imageSteps,
          variations: settings.variations,
          imageProfileId: settings.imageProfileId,
          imageInputRole: settings.imageInputRole,
        },
        inputMedia,
      )
    } else {
      // Generate video (t2v if no image/audio, i2v if image, a2v if audio)
      // Extract filesystem path from the file:// URL for the backend
      const imagePath = inputImage ? fileUrlToPath(inputImage) : null
      const audioPath = inputAudio ? fileUrlToPath(inputAudio) : null
      const videoSettings = { ...settings }
      if (audioPath) videoSettings.model = 'pro'

      generate(
        prompt,
        imagePath,
        {
          model: videoSettings.model as 'fast' | 'pro',
          videoProfileId: videoSettings.videoProfileId,
          duration: videoSettings.duration,
          videoResolution: videoSettings.videoResolution,
          fps: videoSettings.fps,
          audio: videoSettings.audio || false,
          cameraMotion: 'none',
          aspectRatio: videoSettings.aspectRatio,
          imageResolution: videoSettings.imageResolution,
          imageAspectRatio: videoSettings.aspectRatio,
          imageSteps: videoSettings.imageSteps,
        },
        audioPath,
      )
    }
  }
  
  const handleDelete = (assetId: string) => {
    if (currentProjectId) {
      deleteAsset(currentProjectId, assetId)
    }
  }
  
  const handleDragStart = (e: React.DragEvent, asset: Asset) => {
    e.dataTransfer.setData('asset', JSON.stringify(asset))
    e.dataTransfer.setData('assetId', asset.id)
    e.dataTransfer.effectAllowed = 'copy'
  }
  
  const handleCreateVideo = (imageAsset: Asset) => {
    setMode('video')
    setInputImage(imageAsset.url)
    setPrompt(`${imageAsset.prompt || 'The scene comes to life...'}`)
  }

  const handleRetake = (videoAsset: Asset) => {
    setMode('retake')
    setPrompt('')
    setActiveRetakeSource(null)
    setRetakeInitial({
      videoUrl: videoAsset.url,
      videoPath: videoAsset.path,
      duration: videoAsset.duration,
    })
    setRetakePanelKey((prev) => prev + 1)
  }

  const isRetakeMode = mode === 'retake'
  const canSubmit = isRetakeMode
    ? retakeInput.ready && !!retakeInput.videoPath && !isRetaking
    : !!prompt.trim()
  const promptButtonLabel = isRetakeMode ? 'Retake' : 'Generate'
  const promptButtonIcon = isRetakeMode
    ? <Scissors className="h-3.5 w-3.5" />
    : <Sparkles className={`h-3.5 w-3.5 ${isGenerating ? 'animate-pulse' : ''}`} />
  const promptGenerating = isRetakeMode ? isRetaking : isGenerating
  
  // Close size menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sizeMenuRef.current && !sizeMenuRef.current.contains(e.target as Node)) {
        setShowSizeMenu(false)
      }
    }
    if (showSizeMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSizeMenu])

  const filteredAssets = showFavorites ? assets.filter(a => a.favorite) : assets
  const favoriteCount = assets.filter(a => a.favorite).length

  // Navigation for the asset preview modal
  const selectedIndex = selectedAsset ? filteredAssets.findIndex(a => a.id === selectedAsset.id) : -1
  const canGoPrev = selectedIndex > 0
  const canGoNext = selectedIndex >= 0 && selectedIndex < filteredAssets.length - 1

  const goToPrev = useCallback(() => {
    if (canGoPrev) setSelectedAsset(filteredAssets[selectedIndex - 1])
  }, [canGoPrev, filteredAssets, selectedIndex])

  const goToNext = useCallback(() => {
    if (canGoNext) setSelectedAsset(filteredAssets[selectedIndex + 1])
  }, [canGoNext, filteredAssets, selectedIndex])

  // Keyboard navigation for the preview modal
  useEffect(() => {
    if (!selectedAsset) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goToPrev() }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goToNext() }
      else if (e.key === 'Escape') setSelectedAsset(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedAsset, goToPrev, goToNext])

  return (
    <div className="h-full relative bg-zinc-950">

      {/* Empty state */}
      {mode !== 'retake' && assets.length === 0 && !isGenerating && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-zinc-700 flex items-center justify-center mb-4">
            <Sparkles className="h-10 w-10 text-zinc-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Start Creating</h3>
          <p className="text-zinc-500 max-w-md">
            Use the prompt bar below to generate images and videos.
            Drag assets into the input box to use them as references.
          </p>
        </div>
      )}

      {/* No favorites empty state */}
      {mode !== 'retake' && showFavorites && filteredAssets.length === 0 && assets.length > 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <Heart className="h-12 w-12 text-zinc-700 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No favorites yet</h3>
          <p className="text-zinc-500 text-sm">
            Click the heart icon on any asset to add it to your favorites.
          </p>
        </div>
      )}

      {/* Assets area — full width, no background, above the prompt bar */}
      {mode !== 'retake' && (assets.length > 0 || isGenerating) && (
        <div className="absolute inset-x-0 top-0 bottom-[160px] flex flex-col px-4 pt-4">
          {/* Top bar */}
          <div className="flex items-center justify-end pb-2 gap-2">
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                showFavorites
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Heart className={`h-4 w-4 ${showFavorites ? 'fill-current' : ''}`} />
              Favorites
              {favoriteCount > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  showFavorites ? 'bg-red-500/30 text-red-300' : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {favoriteCount}
                </span>
              )}
            </button>

            <div ref={sizeMenuRef} className="relative">
              <button
                onClick={() => setShowSizeMenu(!showSizeMenu)}
                className={`p-2 rounded-md transition-colors ${
                  showSizeMenu ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {gallerySize === 'small' ? <GridSmallIcon className="h-4 w-4" /> :
                 gallerySize === 'medium' ? <GridMediumIcon className="h-4 w-4" /> :
                 <GridLargeIcon className="h-4 w-4" />}
              </button>

              {showSizeMenu && (
                <div className="absolute top-full mt-2 right-0 bg-zinc-800 border border-zinc-700 rounded-md p-2 min-w-[160px] shadow-xl z-50">
                  {([
                    { value: 'small' as GallerySize, label: 'Small', icon: GridSmallIcon },
                    { value: 'medium' as GallerySize, label: 'Medium', icon: GridMediumIcon },
                    { value: 'large' as GallerySize, label: 'Large', icon: GridLargeIcon },
                  ]).map(option => (
                    <button
                      key={option.value}
                      onClick={() => { setGallerySize(option.value); setShowSizeMenu(false) }}
                      className={`w-full flex items-center justify-between px-2 py-2.5 rounded-md transition-colors text-left ${gallerySize === option.value ? 'bg-white/20 hover:bg-white/25' : 'hover:bg-zinc-700'}`}
                    >
                      <div className="flex items-center gap-3">
                        <option.icon className={`h-4 w-4 ${gallerySize === option.value ? 'text-white' : 'text-zinc-500'}`} />
                        <span className={`text-sm ${gallerySize === option.value ? 'text-white font-medium' : 'text-zinc-400'}`}>
                          {option.label}
                        </span>
                      </div>
                      {gallerySize === option.value && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Assets grid — fills remaining space, scrollable */}
          <div className="overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] flex-1">
            <div className={`grid ${gallerySizeClasses[gallerySize]} gap-4`}>
              {isGenerating && (
                <div className="relative rounded-xl overflow-hidden bg-zinc-800 aspect-video">
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="relative w-16 h-16 mb-3">
                      <div className="absolute inset-0 rounded-full border-2 border-violet-500/30" />
                      <div className="absolute inset-0 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                      <div className="absolute inset-2 rounded-full bg-zinc-800 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-violet-400" />
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400">{statusMessage || 'Generating...'}</p>
                    {progress > 0 && (
                      <div className="w-32 h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-violet-500 transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              )}
              {filteredAssets.map(asset => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onDelete={() => handleDelete(asset.id)}
                  onPlay={() => setSelectedAsset(asset)}
                  onDragStart={handleDragStart}
                  onCreateVideo={handleCreateVideo}
                  onRetake={handleRetake}
                  onToggleFavorite={() => currentProjectId && toggleFavorite(currentProjectId, asset.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === 'retake' && (
        <div className="absolute inset-x-0 top-0 bottom-[160px] px-4 pt-4 pb-4 flex flex-col overflow-hidden">
          <RetakePanel
            initialVideoUrl={retakeInitial.videoUrl}
            initialVideoPath={retakeInitial.videoPath}
            initialDuration={retakeInitial.duration}
            resetKey={retakePanelKey}
            fillHeight
            isProcessing={isRetaking}
            processingStatus={retakeStatus}
            onChange={(data) => setRetakeInput(data)}
          />
        </div>
      )}

      {/* Floating prompt panel — wider, responsive, centered */}
      <div className="absolute bottom-5 left-1/2 w-[min(700px,calc(100%-2rem))] -translate-x-1/2">

        {/* Prompt bar */}
        <PromptBar
          mode={mode}
          onModeChange={setMode}
          prompt={prompt}
          onPromptChange={setPrompt}
          onGenerate={handleGenerate}
          isGenerating={promptGenerating}
          canGenerate={canSubmit}
          buttonLabel={promptButtonLabel}
          buttonIcon={promptButtonIcon}
          inputImage={inputImage}
          onInputImageChange={setInputImage}
          imageInputs={imageInputs}
          onImageInputsChange={setImageInputs}
          inputAudio={inputAudio}
          onInputAudioChange={setInputAudio}
          settings={settings}
          onSettingsChange={setSettings}
              imageProfiles={imageProfiles}
              videoProfiles={videoProfiles}
            />
      </div>
      
      {/* Asset preview modal */}
      {selectedAsset && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setSelectedAsset(null)}
        >
          {/* Previous button */}
          <button
            onClick={(e) => { e.stopPropagation(); goToPrev() }}
            disabled={!canGoPrev}
            className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full backdrop-blur-md transition-all ${
              canGoPrev
                ? 'bg-white/10 text-white hover:bg-white/20 cursor-pointer'
                : 'bg-white/5 text-zinc-600 cursor-default'
            }`}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Next button */}
          <button
            onClick={(e) => { e.stopPropagation(); goToNext() }}
            disabled={!canGoNext}
            className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full backdrop-blur-md transition-all ${
              canGoNext
                ? 'bg-white/10 text-white hover:bg-white/20 cursor-pointer'
                : 'bg-white/5 text-zinc-600 cursor-default'
            }`}
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Content area */}
          <div className="relative max-w-5xl w-full max-h-full px-20 py-8" onClick={e => e.stopPropagation()}>
            {/* Top bar: counter + close */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-zinc-500 font-medium">
                {selectedIndex + 1} / {filteredAssets.length}
              </span>
              <button
                onClick={() => setSelectedAsset(null)}
                className="p-2 rounded-md text-zinc-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {selectedAsset.type === 'video' ? (
              <video
                key={selectedAsset.id}
                src={selectedAsset.url}
                controls
                autoPlay
                className="w-full rounded-xl object-contain max-h-[75vh]"
              />
            ) : (
              <img
                key={selectedAsset.id}
                src={selectedAsset.url}
                alt=""
                className="w-full rounded-xl object-contain max-h-[75vh]"
              />
            )}
            <div className="mt-4 text-center">
              <div className="inline-flex items-start gap-2 max-w-full">
                <p className="text-zinc-300">{selectedAsset.prompt}</p>
                {selectedAsset.prompt && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedAsset.prompt)
                      setCopiedPrompt(true)
                      setTimeout(() => setCopiedPrompt(false), 2000)
                    }}
                    className="shrink-0 p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                    title="Copy prompt"
                  >
                    {copiedPrompt ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <p className="text-zinc-500 text-sm mt-1">
                {selectedAsset.resolution} • {selectedAsset.duration ? `${selectedAsset.duration}s` : 'Image'}
              </p>
            </div>
          </div>
        </div>
      )}

      {(error || localError) && (
        <GenerationErrorDialog
          error={(error || localError)!}
          onDismiss={() => { if (error) reset(); if (localError) { setLocalError(null); resetRetake() } }}
        />
      )}
    </div>
  )
}
