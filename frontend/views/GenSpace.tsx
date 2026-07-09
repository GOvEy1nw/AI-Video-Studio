import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Trash2,
  Download,
  Image,
  Video,
  X,
  Heart,
  Film,
  Volume2,
  VolumeX,
  Sparkles,
  Clock,
  Monitor,
  ChevronUp,
  ChevronDown,
  Scissors,
  Expand,
  Music,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  ClipboardPaste,
  AlertCircle,
  Pencil,
  LoaderCircle,
  Plus,
  ListFilter,
  List,
  Folder,
} from "lucide-react";
import { useProjects } from "../contexts/ProjectContext";
import type { GenSpaceRetakeSource } from "../contexts/ProjectContext";
import { useGeneration } from "../hooks/use-generation";
import { useRetake } from "../hooks/use-retake";
import {
  useImageProfiles,
  useVideoProfiles,
} from "../hooks/use-image-profiles";
import type { Asset } from "../types/project";
import type { ModelProfile } from "../types/model-profiles";
import { GenerationErrorDialog } from "../components/GenerationErrorDialog";
import { DuplicateFilenameDialog } from "../components/DuplicateFilenameDialog";
import { GalleryFilters } from "../components/GalleryFilters";
import { GalleryBinBar } from "../components/GalleryBinBar";
import type { GalleryBinContextMenuState } from "../components/GalleryBinBar";
import {
  GalleryAssetContextMenu,
  type GalleryAssetContextMenuState,
} from "../components/GalleryAssetContextMenu";
import { copyToAssetFolder } from "../lib/asset-copy";
import {
  collectAssetFilePaths,
  deleteProjectAssetFilesFromDisk,
  waitForMediaFileHandlesReleased,
} from "../lib/asset-delete";
import { importGalleryFile, ensureGalleryAssetForInputFile } from "../lib/media-import";
import type { DuplicateFilenameChoice } from "../lib/media-import";
import {
  DEFAULT_GALLERY_FILTER,
  filterGalleryAssets,
  isGalleryFilterActive,
  getAssetDisplayFileName,
  inferAssetSource,
  GALLERY_SOURCE_OPTIONS,
  collectGalleryBins,
  filterGalleryAssetsByBin,
  type GalleryFilterState,
} from "../lib/gallery-filters";
import { backendFetch } from "../lib/backend";
import { fileUrlToPath } from "../lib/url-to-path";
import { logger } from "../lib/logger";
import { RetakePanel } from "../components/RetakePanel";
import { ReframePanel, type ReframePanelState } from "../components/ReframePanel";
import { SeedControl } from "../components/SeedControl";
import { useAppSettings } from "../contexts/AppSettingsContext";
import {
  buildImageInputsFromParams,
  genSpaceModeFromParams,
  resolveLegacyInputMedia,
  resolveInputMediaPath,
  settingsPatchFromGenerationParams,
  toStoredInputMediaEntry,
} from "../lib/apply-generation-params";
import {
  clampGenSpaceSeed,
  DEFAULT_GENSPACE_LOCKED_SEED,
} from "../types/project";

type GenSpaceMode = "image" | "video" | "retake" | "reframe";

type ImageInputItem = {
  id: string;
  url: string;
  role: string;
  type?: "image" | "video" | "audio";
};

type MultiShotRow = {
  id: string;
  seconds: number;
  prompt: string;
};

const MAX_MULTI_SHOT_SECONDS = 20;
const MULTI_SHOT_SECONDS = Array.from(
  { length: MAX_MULTI_SHOT_SECONDS },
  (_, index) => index + 1,
);

function createMultiShotRow(seconds = 4): MultiShotRow {
  return {
    id: crypto.randomUUID(),
    seconds,
    prompt: "",
  };
}

function formatMultiShotPrompt(
  globalPrompt: string,
  rows: MultiShotRow[],
): string {
  let cursor = 0;
  const relayedPrompts = rows.map((row) => {
    const start = cursor;
    cursor += row.seconds;
    return `[${start}s:${cursor}s] ${row.prompt.trim()}`;
  });

  return [globalPrompt.trim(), ...relayedPrompts].filter(Boolean).join("\n");
}

// Asset card with hover overlays
function AssetCard({
  asset,
  onDelete,
  onPlay,
  onDragStart,
  onCreateVideo,
  onRetake,
  onReframe,
  onApplyPrompt,
  onToggleFavorite,
  onContextMenu,
}: {
  asset: Asset;
  onDelete: () => void;
  onPlay: () => void;
  onDragStart: (e: React.DragEvent, asset: Asset) => void;
  onCreateVideo?: (asset: Asset) => void;
  onRetake?: (asset: Asset) => void;
  onReframe?: (asset: Asset) => void;
  onApplyPrompt?: (asset: Asset) => void;
  onToggleFavorite?: () => void;
  onContextMenu?: (e: React.MouseEvent, asset: Asset) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const isFavorite = asset.favorite || false;
  const displayFileName = getAssetDisplayFileName(asset);
  const canApplyPrompt = !!asset.generationParams;

  useEffect(() => {
    if (asset.type === "video" && videoRef.current) {
      if (isHovered) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setCurrentTime(0);
      }
    }
  }, [isHovered, asset.type]);

  useEffect(() => {
    if (asset.type === "audio" && audioRef.current) {
      if (isHovered) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isHovered, asset.type]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = asset.url;
    a.download = asset.path.split("/").pop() || `${asset.type}-${asset.id}`;
    a.click();
  };

  const isDraggable =
    asset.type === "image" ||
    asset.type === "video" ||
    asset.type === "audio";

  return (
    <div
      className="relative group cursor-pointer rounded-xl overflow-hidden bg-zinc-900"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onPlay}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(e, asset);
      }}
      draggable={isDraggable}
      onDragStart={(e) => {
        if (!isDraggable) return;
        onDragStart(e, asset);
      }}
    >
      <div className="relative aspect-video bg-zinc-900">
        {asset.type === "video" ? (
          <video
            key={asset.url}
            ref={videoRef}
            src={asset.url}
            preload="metadata"
            className="h-full w-full object-contain"
            muted={isMuted}
            loop
            onTimeUpdate={handleTimeUpdate}
          />
        ) : asset.type === "audio" ? (
          <>
            <audio
              key={asset.url}
              ref={audioRef}
              src={asset.url}
              preload="metadata"
              loop
              className="hidden"
            />
            <div
              className={`flex h-full w-full items-center justify-center bg-zinc-800 transition-colors ${
                isHovered ? "bg-emerald-950/40" : ""
              }`}
            >
              <Music
                className={`h-10 w-10 transition-colors ${
                  isHovered ? "text-emerald-300" : "text-emerald-400"
                }`}
              />
            </div>
          </>
        ) : (
          <img
            key={asset.url}
            src={asset.url}
            alt=""
            className="h-full w-full object-contain"
          />
        )}

        {/* Favorite heart - always visible when favorited */}
        {isFavorite && !isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.();
            }}
            className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white transition-colors z-10"
          >
            <Heart className="h-3.5 w-3.5 fill-current" />
          </button>
        )}

        {/* Hover overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Top buttons */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite?.();
                }}
                className={`p-1.5 rounded-lg backdrop-blur-md transition-colors ${
                  isFavorite
                    ? "bg-white/20 text-white"
                    : "bg-black/40 text-white hover:bg-black/60"
                }`}
              >
                <Heart
                  className={`h-3.5 w-3.5 ${isFavorite ? "fill-current" : ""}`}
                />
              </button>

              {asset.type === "image" && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateVideo?.(asset);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors flex items-center gap-1.5 text-xs font-medium whitespace-nowrap"
                  >
                    <Film className="h-3 w-3" />
                    Create video
                  </button>
                  {canApplyPrompt && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplyPrompt?.(asset);
                      }}
                      className="p-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
                      title="Apply prompt"
                      aria-label="Apply prompt"
                    >
                      <ClipboardPaste className="h-3.5 w-3.5" />
                    </button>
                  )}
                </>
              )}
              {asset.type === "video" && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetake?.(asset);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors flex items-center gap-1.5 text-xs font-medium whitespace-nowrap"
                  >
                    <Scissors className="h-3 w-3" />
                    Retake
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReframe?.(asset);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors flex items-center gap-1.5 text-xs font-medium whitespace-nowrap"
                  >
                    <Expand className="h-3 w-3" />
                    Reframe
                  </button>
                  {canApplyPrompt && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplyPrompt?.(asset);
                      }}
                      className="p-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
                      title="Apply prompt"
                      aria-label="Apply prompt"
                    >
                      <ClipboardPaste className="h-3.5 w-3.5" />
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleDownload}
                className="p-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white/70 hover:bg-red-500/80 hover:text-white transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Bottom controls for video */}
          {asset.type === "video" && (
            <div className="absolute bottom-9 left-2 right-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-md text-white text-xs font-mono">
                  {formatTime(currentTime)}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  className="p-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="h-3.5 w-3.5" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filename overlay — hover only */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-black/60 px-2.5 py-1.5 transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
          title={displayFileName}
        >
          <p className="truncate text-xs text-zinc-100">{displayFileName}</p>
        </div>
      </div>
    </div>
  );
}

function AssetListRow({
  asset,
  onDelete,
  onPlay,
  onDragStart,
  onApplyPrompt,
  onToggleFavorite,
  onContextMenu,
}: {
  asset: Asset;
  onDelete: () => void;
  onPlay: () => void;
  onDragStart: (e: React.DragEvent, asset: Asset) => void;
  onApplyPrompt?: (asset: Asset) => void;
  onToggleFavorite?: () => void;
  onContextMenu?: (e: React.MouseEvent, asset: Asset) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isFavorite = asset.favorite || false;
  const displayFileName = getAssetDisplayFileName(asset);
  const sourceLabel =
    GALLERY_SOURCE_OPTIONS.find(
      (option) => option.value === inferAssetSource(asset),
    )?.label ?? "Unknown";
  const typeLabel =
    asset.type.charAt(0).toUpperCase() + asset.type.slice(1);

  useEffect(() => {
    if (asset.type === "video" && videoRef.current) {
      if (isHovered) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isHovered, asset.type]);

  useEffect(() => {
    if (asset.type === "audio" && audioRef.current) {
      if (isHovered) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isHovered, asset.type]);

  const isDraggable =
    asset.type === "image" ||
    asset.type === "video" ||
    asset.type === "audio";

  return (
    <div
      className="group flex cursor-pointer items-center gap-4 rounded-lg px-3 py-2 transition-colors hover:bg-zinc-800/60"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onPlay}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(e, asset);
      }}
      draggable={isDraggable}
      onDragStart={(e) => {
        if (!isDraggable) return;
        onDragStart(e, asset);
      }}
    >
      <div className="relative h-12 w-20 flex-shrink-0 overflow-hidden rounded-md bg-zinc-800">
        {asset.type === "video" ? (
          <video
            key={asset.url}
            ref={videoRef}
            src={asset.url}
            preload="metadata"
            className="h-full w-full object-cover"
            muted
            loop
          />
        ) : asset.type === "audio" ? (
          <>
            <audio
              key={asset.url}
              ref={audioRef}
              src={asset.url}
              preload="metadata"
              loop
              className="hidden"
            />
            <div
              className={`flex h-full w-full items-center justify-center transition-colors ${
                isHovered ? "bg-emerald-950/40" : "bg-zinc-800"
              }`}
            >
              <Music
                className={`h-5 w-5 transition-colors ${
                  isHovered ? "text-emerald-300" : "text-emerald-400"
                }`}
              />
            </div>
          </>
        ) : (
          <img
            key={asset.url}
            src={asset.url}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <p
        className="min-w-0 flex-1 truncate text-sm text-zinc-200"
        title={displayFileName}
      >
        {displayFileName}
      </p>

      <span className="w-16 flex-shrink-0 text-sm text-zinc-400">{typeLabel}</span>

      <span className="w-24 flex-shrink-0 text-sm text-zinc-400">
        {sourceLabel}
      </span>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite?.();
        }}
        className={`flex-shrink-0 rounded-md p-2 transition-colors ${
          isFavorite
            ? "text-red-400 hover:text-red-300"
            : "text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
        }`}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
      </button>

      {asset.generationParams && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onApplyPrompt?.(asset);
          }}
          className="flex-shrink-0 rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
          title="Apply prompt"
          aria-label="Apply prompt"
        >
          <ClipboardPaste className="h-4 w-4" />
        </button>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="flex-shrink-0 rounded-md p-2 text-zinc-500 transition-colors hover:bg-red-500/20 hover:text-red-400"
        aria-label="Remove asset"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// Dropdown component for settings
function SettingsDropdown({
  trigger,
  options,
  value,
  onChange,
  title,
}: {
  trigger: React.ReactNode;
  options: {
    value: string;
    label: string;
    disabled?: boolean;
    tooltip?: string;
    icon?: React.ReactNode;
  }[];
  value: string;
  onChange: (value: string) => void;
  title: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex shrink-0 items-center gap-1 whitespace-nowrap px-2 py-1.5 rounded-md transition-colors ${isOpen ? "bg-zinc-700 hover:bg-zinc-700" : "hover:bg-zinc-800"}`}
      >
        {trigger}
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 bg-zinc-800 border border-zinc-700 rounded-md p-2 min-w-[160px] shadow-xl z-[9999]">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
            {title}
          </div>
          <div className="space-y-1">
            {options.map((option) => (
              <div key={option.value} className="relative group/option">
                <button
                  onClick={() => {
                    if (!option.disabled) {
                      onChange(option.value);
                      setIsOpen(false);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-2 py-2 rounded-md transition-colors text-left ${
                    option.disabled
                      ? "cursor-not-allowed"
                      : value === option.value
                        ? "bg-white/20 hover:bg-white/25"
                        : "hover:bg-zinc-700"
                  }`}
                >
                  <span
                    className={`flex items-center gap-2.5 text-sm ${
                      option.disabled
                        ? "text-zinc-600"
                        : value === option.value
                          ? "text-white"
                          : "text-zinc-400"
                    }`}
                  >
                    {option.icon && (
                      <span className="flex-shrink-0">{option.icon}</span>
                    )}
                    {option.label}
                  </span>
                  {value === option.value && !option.disabled && (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
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
  );
}

// Lightricks brand icon
function LightricksIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.0073 8.18934C16.3266 5.6556 14.9346 2.06903 12.3065 2.06903C9.27204 2.06903 6.86627 7.24621 5.45487 11.7948C4.79654 13.9203 4.35877 15.9049 4.17755 17.1736C4.10214 17.5829 4.06274 18.0044 4.06274 18.4347C4.06274 22.2903 7.22553 25.4338 11.1133 25.4338C15.5206 25.4338 23.9376 22.7073 23.9376 18.4347C23.9376 17.1179 23.1376 15.948 21.9018 14.9595L21.9039 14.9575C22.4493 13.7707 22.847 12.648 23.001 11.705C23.1934 10.5053 23.0074 9.5494 22.4429 8.88217C21.7692 8.07382 20.7107 7.85572 19.6586 7.84288C18.8826 7.84288 17.9777 7.96904 17.0073 8.18934ZM8.00176 9.17083C7.6945 9.93266 7.02317 11.7419 6.70157 12.9799C7.93005 11.9987 9.2965 11.1653 10.7091 10.4796C12.2325 9.73758 13.9171 9.06448 15.518 8.58411C15.08 6.98293 13.9585 3.62158 12.3129 3.62158C11.0298 3.62158 9.41958 5.69374 8.00176 9.17083ZM20.6201 14.083L20.6209 14.0786C21.0507 13.1163 21.3522 12.2118 21.4741 11.4547C21.5511 10.9607 21.5832 10.2872 21.2752 9.89577C20.9416 9.46599 20.1975 9.39543 19.6521 9.38901C18.9932 9.38901 18.2117 9.49943 17.3641 9.69208L17.3683 9.69702C17.586 10.7217 17.7526 11.772 17.8808 12.7968C18.8527 13.16 19.7877 13.5908 20.6201 14.083ZM15.8828 10.0897C14.6739 10.4588 13.4041 10.9464 12.209 11.4846C13.4346 11.588 14.8471 11.8527 16.2581 12.2608C16.1554 11.5367 16.0273 10.8061 15.8799 10.0948L15.8828 10.0897ZM11.1133 12.9816C8.07878 12.9816 5.60884 15.4258 5.60884 18.4347C5.60884 21.4435 8.07878 23.8878 11.1133 23.8878C13.8701 23.8878 16.3653 21.6639 16.6048 18.9158C16.7011 17.7546 16.669 15.9263 16.4637 13.9311C14.6294 13.3385 12.6763 12.9816 11.1133 12.9816ZM18.3883 22.2069C17.7984 22.4697 17.1711 22.7085 16.5284 22.9184C18.0872 21.3274 19.8832 18.8193 21.1982 16.3689L21.1997 16.3654C21.9756 17.0509 22.3915 17.7593 22.3915 18.4347C22.3915 19.6985 20.9288 21.0778 18.3883 22.2069ZM19.9493 15.4655L19.9473 15.4707C19.4291 16.4567 18.8221 17.4625 18.1833 18.4092C18.2214 17.4089 18.1892 16.0386 18.0611 14.5212C18.71 14.7948 19.3456 15.1021 19.9493 15.4655Z"
        fill="currentColor"
      />
    </svg>
  );
}

// Square icon for aspect ratio
function AspectIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
    </svg>
  );
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
    imageResolution: string;
    imageAspectRatio: string;
    imageProfileId?: string;
    imageInputRole?: string;
  };
  onSettingsChange: (settings: any) => void;
  imageProfiles: ModelProfile[];
}) {
  const selectedProfileId = settings.imageProfileId || "z_image_turbo";
  const selectedProfile =
    imageProfiles.find((p) => p.id === selectedProfileId) || imageProfiles[0];

  // If the selected profile doesn't support the current aspect ratio or
  // resolution tier, fall back to the profile's defaults. This runs on
  // every render but only emits a change when the values actually need
  // to shift, so it won't loop.
  useEffect(() => {
    if (!selectedProfile) return;
    const allowedAspects = selectedProfile.ui.allowedAspectRatios;
    const allowedTiers = selectedProfile.ui.allowedResolutionTiers;
    const next: any = { ...settings, imageProfileId: selectedProfile.id };
    let changed = false;
    if (!allowedAspects.includes(settings.imageAspectRatio)) {
      next.imageAspectRatio = selectedProfile.ui.defaultAspectRatio;
      changed = true;
    }
    if (!allowedTiers.includes(settings.imageResolution)) {
      next.imageResolution = selectedProfile.ui.defaultResolutionTier;
      changed = true;
    }
    if (changed) {
      onSettingsChange(next);
    }
  }, [selectedProfile, settings, onSettingsChange]);

  if (!selectedProfile) {
    // Profiles not loaded yet — show a placeholder.
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-800/50 text-zinc-500 text-xs">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>Loading models…</span>
      </div>
    );
  }

  const isAvailable = selectedProfile.availability === "available";
  const isExperimental = selectedProfile.availability === "experimental";
  const modelOptions = imageProfiles.map((p) => ({
    value: p.id,
    label:
      p.displayName + (p.status === "experimental" ? " (experimental)" : ""),
    disabled:
      p.availability === "missing_model_files" ||
      p.availability === "unsupported",
    tooltip:
      p.availability === "missing_model_files"
        ? `${p.displayName} is supported by AiVS, but the required WanGP model files are not installed yet.`
        : p.status === "experimental"
          ? "Experimental — may be less stable."
          : undefined,
  }));

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
            <span className="text-zinc-300 font-medium">
              {selectedProfile.displayName}
            </span>
            {isExperimental && (
              <span className="text-[9px] uppercase tracking-wider text-amber-500">
                exp
              </span>
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
            <span>{settings.imageResolution.replace("p", "")}</span>
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
  );
}

// Prompt bar component matching the design
// Two-row layout: prompt row on top, settings row below
function PromptBar({
  mode,
  onModeChange,
  prompt,
  onPromptChange,
  onGenerate,
  onEnhancePrompt,
  isGenerating,
  isEnhancingPrompt,
  seedLocked,
  lockedSeed,
  onSeedChange,
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
  useAudioTrack,
  onUseAudioTrackChange,
  multiShotEnabled,
  onMultiShotEnabledChange,
  multiShotRows,
  onMultiShotRowsChange,
  syncInputFileToGallery,
  mediaInputsExpandKey = 0,
  reframeDurationSeconds,
}: {
  mode: GenSpaceMode;
  onModeChange: (mode: GenSpaceMode) => void;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  onEnhancePrompt: () => void;
  isGenerating: boolean;
  isEnhancingPrompt: boolean;
  seedLocked: boolean;
  lockedSeed: number;
  onSeedChange: (seed: { seedLocked: boolean; lockedSeed: number }) => void;
  canGenerate: boolean;
  buttonLabel: string;
  buttonIcon: React.ReactNode;
  inputImage: string | null;
  onInputImageChange: (url: string | null) => void;
  imageInputs: ImageInputItem[];
  onImageInputsChange: (items: ImageInputItem[]) => void;
  inputAudio: string | null;
  onInputAudioChange: (url: string | null) => void;
  settings: {
    model: string;
    videoProfileId?: string;
    duration: number;
    videoResolution: string;
    fps: number;
    aspectRatio: string;
    imageResolution: string;
    imageAspectRatio: string;
    imageProfileId?: string;
    imageInputRole?: string;
    variations: number;
    audio?: boolean;
  };
  onSettingsChange: (settings: any) => void;
  imageProfiles: ModelProfile[];
  videoProfiles: ModelProfile[];
  useAudioTrack: boolean;
  onUseAudioTrackChange: (v: boolean) => void;
  multiShotEnabled: boolean;
  onMultiShotEnabledChange: (enabled: boolean) => void;
  multiShotRows: MultiShotRow[];
  onMultiShotRowsChange: (rows: MultiShotRow[]) => void;
  syncInputFileToGallery?: (file: File) => Promise<string | null>;
  mediaInputsExpandKey?: number;
  reframeDurationSeconds?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const guideInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAudioDragOver, setIsAudioDragOver] = useState(false);
  const [isGuideDragOver, setIsGuideDragOver] = useState(false);
  const [mediaInputsExpanded, setMediaInputsExpanded] = useState(false);
  const [activeImageInputId, setActiveImageInputId] = useState<string | null>(
    null,
  );
  const isRetake = mode === "retake";
  const isReframe = mode === "reframe";
  const isPanelMode = isRetake || isReframe;
  const LOCAL_MAX_DURATION: Record<string, number> = {
    "540p": 20,
    "720p": 10,
    "1080p": 5,
  };
  const localMaxDuration = LOCAL_MAX_DURATION[settings.videoResolution] ?? 20;
  const videoDurationOptions = [5, 6, 8, 10, 20].filter(
    (d) => d <= localMaxDuration,
  );
  const selectedVideoProfile =
    videoProfiles.find((profile) => profile.id === settings.videoProfileId) ||
    videoProfiles[0];
  const videoResolutionOptions = selectedVideoProfile?.ui
    .allowedResolutionTiers ?? ["540p", "720p", "1080p"];
  const selectedImageProfile =
    imageProfiles.find((profile) => profile.id === settings.imageProfileId) ||
    imageProfiles[0];
  const imageInputPolicy = selectedImageProfile?.inputMedia;
  const supportsImageInput =
    mode === "image" && !!imageInputPolicy?.supportsImageInputs;
  const imageMaxInputs = imageInputPolicy?.maxImages ?? 0;
  const canAddImageInput =
    supportsImageInput && imageInputs.length < imageMaxInputs;
  const defaultImageInputRole =
    imageInputPolicy?.defaultRole ||
    imageInputPolicy?.roles[0]?.role ||
    "reference_subject";
  const multiShotTotalSeconds = multiShotRows.reduce(
    (total, row) => total + row.seconds,
    0,
  );

  useEffect(() => {
    if (mode !== "video" || !selectedVideoProfile) return;
    const allowedAspects = selectedVideoProfile.ui.allowedAspectRatios;
    const allowedTiers = selectedVideoProfile.ui.allowedResolutionTiers;
    const next: any = { ...settings, videoProfileId: selectedVideoProfile.id };
    let changed = false;
    if (!allowedAspects.includes(settings.aspectRatio)) {
      next.aspectRatio = selectedVideoProfile.ui.defaultAspectRatio;
      changed = true;
    }
    if (!allowedTiers.includes(settings.videoResolution)) {
      next.videoResolution = selectedVideoProfile.ui.defaultResolutionTier;
      changed = true;
    }
    if (!settings.videoProfileId) {
      changed = true;
    }
    if (changed) {
      onSettingsChange(next);
    }
  }, [mode, selectedVideoProfile, settings, onSettingsChange]);

  // Normalization for video mode slots
  useEffect(() => {
    if (mode !== "video") return;
    if (!selectedVideoProfile?.inputMedia?.supportsImageInputs) {
      if (imageInputs.length > 0) {
        onImageInputsChange([]);
      }
      setActiveImageInputId(null);
      return;
    }

    const supportedRoles = new Set([
      "start_image",
      "end_image",
      "control_video",
      "human_motion",
      "human_motion_pose",
      "depth",
      "canny_edges",
      "sdr_to_hdr",
      "continue_video",
      "audio_guide",
      "audio_to_video",
      "reference_voice",
    ]);
    const seen = new Set<string>();
    const normalized: ImageInputItem[] = [];
    let hasGuide = false;
    for (const item of imageInputs) {
      if (supportedRoles.has(item.role)) {
        if (item.role === "start_image" || item.role === "end_image") {
          if (!seen.has(item.role)) {
            seen.add(item.role);
            normalized.push(item);
          }
        } else {
          if (!hasGuide) {
            hasGuide = true;
            normalized.push(item);
          }
        }
      }
    }

    const changed = normalized.length !== imageInputs.length;
    if (changed) {
      onImageInputsChange(normalized);
    }
    if (
      activeImageInputId &&
      activeImageInputId !== "guide_slot" &&
      !normalized.some((item) => item.role === activeImageInputId)
    ) {
      setActiveImageInputId(null);
    }
  }, [
    mode,
    selectedVideoProfile,
    imageInputs,
    activeImageInputId,
    onImageInputsChange,
  ]);

  useEffect(() => {
    if (mode !== "image") return;
    if (!imageInputPolicy?.supportsImageInputs) {
      if (imageInputs.length > 0) {
        onImageInputsChange([]);
      }
      setActiveImageInputId(null);
      return;
    }
    const supportedRoles = new Set(
      imageInputPolicy.roles.map((role) => role.role),
    );
    const normalized = imageInputs
      .slice(0, imageInputPolicy.maxImages)
      .map((item) =>
        supportedRoles.has(item.role)
          ? item
          : { ...item, role: defaultImageInputRole },
      );
    const changed =
      normalized.length !== imageInputs.length ||
      normalized.some((item, index) => item.role !== imageInputs[index]?.role);
    if (changed) {
      onImageInputsChange(normalized);
    }
    if (
      activeImageInputId &&
      !normalized.some((item) => item.id === activeImageInputId)
    ) {
      setActiveImageInputId(null);
    }
  }, [
    mode,
    imageInputPolicy,
    imageInputs,
    activeImageInputId,
    defaultImageInputRole,
    onImageInputsChange,
  ]);

  const setSlotMedia = (
    url: string,
    role: string,
    type: "image" | "video" | "audio",
  ) => {
    const isGuideRole = [
      "human_motion",
      "human_motion_pose",
      "depth",
      "canny_edges",
      "sdr_to_hdr",
      "continue_video",
      "audio_to_video",
      "reference_voice",
      "control_video",
      "audio_guide",
    ].includes(role);
    const filtered = imageInputs.filter((item) => {
      if (isGuideRole) {
        return ![
          "human_motion",
          "human_motion_pose",
          "depth",
          "canny_edges",
          "sdr_to_hdr",
          "continue_video",
          "audio_to_video",
          "reference_voice",
          "control_video",
          "audio_guide",
        ].includes(item.role);
      }
      return item.role !== role;
    });
    const newItem = {
      id: crypto.randomUUID(),
      url,
      role,
      type,
    };
    onImageInputsChange([...filtered, newItem]);
  };

  const resetImageFileInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const addImageInput = (url: string) => {
    if (mode === "image" && supportsImageInput) {
      if (!canAddImageInput) return;
      const nextItem = {
        id: crypto.randomUUID(),
        url,
        role: defaultImageInputRole,
      };
      onImageInputsChange([...imageInputs, nextItem]);
      setActiveImageInputId(nextItem.id);
      resetImageFileInput();
      return;
    }

    if (
      mode === "video" &&
      selectedVideoProfile?.inputMedia?.supportsImageInputs
    ) {
      const hasStart = imageInputs.some((item) => item.role === "start_image");
      if (!hasStart) {
        setSlotMedia(url, "start_image", "image");
      } else {
        setSlotMedia(url, "end_image", "image");
      }
      resetImageFileInput();
      return;
    }

    onInputImageChange(url);
    resetImageFileInput();
  };

  const addVideoInput = (url: string) => {
    setSlotMedia(url, "human_motion", "video");
  };

  const addAudioInput = (url: string) => {
    setSlotMedia(url, "audio_to_video", "audio");
  };

  const readGalleryAssetFromDrop = (
    e: React.DragEvent,
  ): Asset | null => {
    const assetData = e.dataTransfer.getData("asset");
    if (!assetData) return null;
    try {
      return JSON.parse(assetData) as Asset;
    } catch {
      return null;
    }
  };

  const applyGalleryAsset = (asset: Asset): boolean => {
    if (asset.type === "image") {
      addImageInput(asset.url);
      return true;
    }
    if (
      mode !== "video" ||
      !selectedVideoProfile?.inputMedia?.supportsImageInputs
    ) {
      return false;
    }
    if (asset.type === "video") {
      addVideoInput(asset.url);
      return true;
    }
    if (asset.type === "audio") {
      addAudioInput(asset.url);
      return true;
    }
    return false;
  };

  const resolveInputFileUrl = async (file: File): Promise<string | null> => {
    if (syncInputFileToGallery) {
      return syncInputFileToGallery(file);
    }
    const filePath = (file as File & { path?: string }).path;
    if (filePath) {
      const normalized = filePath.replace(/\\/g, "/");
      return normalized.startsWith("/")
        ? `file://${normalized}`
        : `file:///${normalized}`;
    }
    return URL.createObjectURL(file);
  };

  const applyGuideMediaFromFile = async (file: File) => {
    const isVideo = file.type.startsWith("video/");
    const isAudio =
      file.type.startsWith("audio/") ||
      ["mp3", "wav", "ogg", "aac", "flac", "m4a"].includes(
        file.name.split(".").pop()?.toLowerCase() || "",
      );
    const fileUrl = await resolveInputFileUrl(file);
    if (!fileUrl) return;

    if (isVideo) {
      setSlotMedia(fileUrl, "human_motion", "video");
    } else if (isAudio) {
      setSlotMedia(fileUrl, "audio_to_video", "audio");
    }
  };

  const handleGuideSlotDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsGuideDragOver(false);

    const asset = readGalleryAssetFromDrop(e);
    if (asset?.type === "video" || asset?.type === "audio") {
      applyGalleryAsset(asset);
      setActiveImageInputId(null);
      return;
    }

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await applyGuideMediaFromFile(file);
      setActiveImageInputId(null);
    }
  };

  const updateImageInputRole = (id: string, role: string) => {
    onImageInputsChange(
      imageInputs.map((item) => (item.id === id ? { ...item, role } : item)),
    );
    setActiveImageInputId(null);
  };

  const removeImageInput = (id: string) => {
    onImageInputsChange(imageInputs.filter((item) => item.id !== id));
    if (activeImageInputId === id) {
      setActiveImageInputId(null);
    }
    resetImageFileInput();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const asset = readGalleryAssetFromDrop(e);
    if (asset && applyGalleryAsset(asset)) {
      return;
    }

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const isAudio =
        file.type.startsWith("audio/") ||
        ["mp3", "wav", "ogg", "aac", "flac", "m4a"].includes(
          file.name.split(".").pop()?.toLowerCase() || "",
        );

      const fileUrl = await resolveInputFileUrl(file);
      if (!fileUrl) return;

      if (
        mode === "video" &&
        selectedVideoProfile?.inputMedia?.supportsImageInputs
      ) {
        if (isImage) {
          addImageInput(fileUrl);
        } else if (isVideo) {
          addVideoInput(fileUrl);
        } else if (isAudio) {
          addAudioInput(fileUrl);
        }
      } else if (isImage) {
        addImageInput(fileUrl);
      }
    }
  };

  const handleAudioDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsAudioDragOver(false);

    const assetData = e.dataTransfer.getData("asset");
    if (assetData) {
      const asset = JSON.parse(assetData) as Asset;
      if (asset.type === "audio") {
        if (
          mode === "video" &&
          selectedVideoProfile?.inputMedia?.supportsImageInputs
        ) {
          addAudioInput(asset.url);
        } else {
          onInputAudioChange(asset.url);
        }
      }
    }

    // Handle file drops
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (["mp3", "wav", "ogg", "aac", "flac", "m4a"].includes(ext || "")) {
        const fileUrl = await resolveInputFileUrl(file);
        if (!fileUrl) return;
        if (
          mode === "video" &&
          selectedVideoProfile?.inputMedia?.supportsImageInputs
        ) {
          addAudioInput(fileUrl);
        } else {
          onInputAudioChange(fileUrl);
        }
      }
    }
  };

  const handleAudioFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = await resolveInputFileUrl(file);
      if (!fileUrl) return;
      if (
        mode === "video" &&
        selectedVideoProfile?.inputMedia?.supportsImageInputs
      ) {
        addAudioInput(fileUrl);
      } else {
        onInputAudioChange(fileUrl);
      }
    }
  };

  const handleGuideFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      await applyGuideMediaFromFile(file);
    }
    if (guideInputRef.current) {
      guideInputRef.current.value = "";
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const isAudio =
        file.type.startsWith("audio/") ||
        ["mp3", "wav", "ogg", "aac", "flac", "m4a"].includes(
          file.name.split(".").pop()?.toLowerCase() || "",
        );

      const fileUrl = await resolveInputFileUrl(file);
      if (!fileUrl) return;

      if (
        mode === "video" &&
        selectedVideoProfile?.inputMedia?.supportsImageInputs
      ) {
        if (isImage) {
          addImageInput(fileUrl);
        } else if (isVideo) {
          addVideoInput(fileUrl);
        } else if (isAudio) {
          addAudioInput(fileUrl);
        }
      } else if (isImage) {
        addImageInput(fileUrl);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isGenerating && canGenerate) {
      e.preventDefault();
      onGenerate();
    }
  };

  const updateMultiShotRow = (id: string, patch: Partial<MultiShotRow>) => {
    onMultiShotRowsChange(
      multiShotRows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const removeMultiShotRow = (id: string) => {
    if (multiShotRows.length <= 2) return;
    onMultiShotRowsChange(multiShotRows.filter((row) => row.id !== id));
  };

  const addMultiShotRow = () => {
    const remaining = MAX_MULTI_SHOT_SECONDS - multiShotTotalSeconds;
    if (remaining <= 0) return;
    onMultiShotRowsChange([
      ...multiShotRows,
      createMultiShotRow(Math.min(4, remaining)),
    ]);
  };

  const videoModelOptions = videoProfiles.map((profile) => ({
    value: profile.id,
    label:
      profile.displayName +
      (profile.status === "experimental" ? " (experimental)" : ""),
    disabled:
      profile.availability === "missing_model_files" ||
      profile.availability === "unsupported",
    tooltip:
      profile.availability === "missing_model_files"
        ? `${profile.displayName} is supported by AiVS, but the required WanGP model files are not installed yet.`
        : profile.status === "experimental"
          ? "Experimental — may be less stable."
          : undefined,
  }));
  const selectedVideoIsExperimental =
    selectedVideoProfile?.availability === "experimental";

  const renderVideoSlot = (
    roleName: string,
    label: string,
    mediaType: "image" | "video" | "audio",
    inputRefEl: React.RefObject<HTMLInputElement>,
  ) => {
    const item = imageInputs.find((x) => x.role === roleName);
    const isActive = activeImageInputId === roleName;
    const slotPolicy = selectedVideoProfile?.inputMedia;
    const roleDef = slotPolicy?.roles.find(
      (candidate) => candidate.role === roleName,
    );

    if (item) {
      return (
        <div key={roleName} className="relative">
          {isActive && (
            <div className="absolute bottom-full left-0 mb-2 w-56 rounded-md border border-zinc-700 bg-zinc-800 p-2 shadow-xl z-[10000]">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                {label}
              </div>
              <div className="space-y-1">
                {mediaType === "image" && slotPolicy && (
                  <>
                    {slotPolicy.roles
                      .filter(
                        (r) =>
                          r.role === "start_image" || r.role === "end_image",
                      )
                      .map((option) => (
                        <button
                          key={option.role}
                          onClick={() =>
                            updateImageInputRole(item.id, option.role)
                          }
                          className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-colors ${
                            item.role === option.role
                              ? "bg-white/20 text-white"
                              : "text-zinc-400 hover:bg-zinc-700"
                          }`}
                          title={option.description}
                        >
                          <Image className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="text-xs">{option.label}</span>
                        </button>
                      ))}
                    <div className="h-px bg-zinc-700 my-1" />
                  </>
                )}
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
            onClick={() => setActiveImageInputId(isActive ? null : roleName)}
            className="group relative h-14 w-14 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 flex items-center justify-center flex-shrink-0"
            title={`${roleDef?.label || label} - Click for actions`}
          >
            <img src={item.url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Pencil className="h-4 w-4 text-white" />
            </div>
            <div className="absolute bottom-1 right-1 p-0.5 rounded bg-black/70 text-[9px] text-zinc-400 scale-90">
              {roleName === "start_image" ? "Start" : "End"}
            </div>
          </button>
        </div>
      );
    }

    return (
      <div
        key={roleName}
        className={`relative h-14 w-14 rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center flex-shrink-0 cursor-pointer hover:border-zinc-500 border-zinc-700`}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) {
            const filePath = (file as any).path as string | undefined;
            const fileUrl = filePath
              ? filePath.replace(/\\/g, "/").startsWith("/")
                ? `file://${filePath.replace(/\\/g, "/")}`
                : `file:///${filePath.replace(/\\/g, "/")}`
              : URL.createObjectURL(file);
            setSlotMedia(fileUrl, roleName, mediaType);
          }
        }}
        onClick={() => inputRefEl.current?.click()}
        title={`Click to add ${label}`}
      >
        <Image className="h-4 w-4 text-zinc-500" />
        <span className="text-[8px] text-zinc-500 mt-1 uppercase scale-90 select-none">
          {roleName === "start_image" ? "Start" : "End"}
        </span>
      </div>
    );
  };

  const renderCombinedGuideSlot = () => {
    const guideItem = imageInputs.find((x) =>
      [
        "control_video",
        "human_motion",
        "human_motion_pose",
        "depth",
        "canny_edges",
        "sdr_to_hdr",
        "continue_video",
        "audio_guide",
        "audio_to_video",
        "reference_voice",
      ].includes(x.role),
    );

    if (guideItem) {
      const isActive = activeImageInputId === "guide_slot";
      const mediaType = guideItem.type;

      const videoRoles = [
        {
          role: "human_motion",
          label: "Human Motion",
          description: "Transfer human motion guidance.",
        },
        {
          role: "human_motion_pose",
          label: "Human Motion (Pose Aligned)",
          description: "Transfer human motion with pose alignment.",
        },
        {
          role: "depth",
          label: "Depth",
          description: "Guide generation using depth map.",
        },
        {
          role: "canny_edges",
          label: "Canny Edges",
          description: "Guide generation using Canny edge maps.",
        },
        {
          role: "sdr_to_hdr",
          label: "Convert SDR to HDR",
          description: "Convert SDR video to HDR using IC-LoRA.",
        },
        {
          role: "continue_video",
          label: "Continue Video",
          description: "Continue video generation from the end of this video.",
        },
      ];

      const audioRoles = [
        {
          role: "audio_to_video",
          label: "Audio To Video",
          description: "Generate video based on soundtrack and text.",
        },
        {
          role: "reference_voice",
          label: "Reference Voice",
          description: "Generate video using reference voice (ID-LoRA).",
        },
      ];

      const currentRoles = mediaType === "video" ? videoRoles : audioRoles;
      const currentRoleDef = currentRoles.find(
        (r) => r.role === guideItem.role,
      );

      return (
        <div
          key="guide_slot"
          className="relative"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            setIsGuideDragOver(true);
          }}
          onDragLeave={() => setIsGuideDragOver(false)}
          onDrop={handleGuideSlotDrop}
        >
          {isActive && (
            <div className="absolute bottom-full left-0 mb-2 w-64 rounded-md border border-zinc-700 bg-zinc-800 p-2 shadow-xl z-[10000]">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                {mediaType === "video"
                  ? "Video Guide Role"
                  : "Audio Track Role"}
              </div>
              <div className="space-y-1">
                {currentRoles.map((option) => (
                  <button
                    key={option.role}
                    onClick={() =>
                      updateImageInputRole(guideItem.id, option.role)
                    }
                    className={`w-full flex flex-col px-2 py-1.5 rounded-md text-left transition-colors ${
                      guideItem.role === option.role
                        ? "bg-white/20 text-white"
                        : "text-zinc-400 hover:bg-zinc-700"
                    }`}
                    title={option.description}
                  >
                    <span className="text-xs font-medium">{option.label}</span>
                    <span className="text-[9px] text-zinc-500 mt-0.5">
                      {option.description}
                    </span>
                  </button>
                ))}

                {mediaType === "video" &&
                  guideItem.role !== "continue_video" && (
                    <>
                      <div className="h-px bg-zinc-700 my-1" />
                      <label className="flex items-center justify-between gap-2 px-2 py-2 hover:bg-zinc-700/50 rounded-md cursor-pointer select-none">
                        <span className="text-xs text-zinc-300">
                          Use Audio Track
                        </span>
                        <input
                          type="checkbox"
                          checked={useAudioTrack}
                          onChange={(e) =>
                            onUseAudioTrackChange(e.target.checked)
                          }
                          className="rounded bg-zinc-900 border-zinc-700 text-blue-500 focus:ring-blue-500 h-3.5 w-3.5"
                        />
                      </label>
                      <div className="text-[9px] text-zinc-500 px-2 leading-tight">
                        {useAudioTrack
                          ? "Generates video with soundtrack from the guide video."
                          : "Generates soundtrack matching the video."}
                      </div>
                    </>
                  )}

                <div className="h-px bg-zinc-700 my-1" />
                <button
                  onClick={() => removeImageInput(guideItem.id)}
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
            onClick={() =>
              setActiveImageInputId(isActive ? null : "guide_slot")
            }
            className={`group relative h-14 w-14 overflow-hidden rounded-lg border bg-zinc-800 flex items-center justify-center flex-shrink-0 ${
              isGuideDragOver
                ? "border-blue-500 ring-1 ring-blue-500/40"
                : "border-zinc-700"
            }`}
            title={`${currentRoleDef?.label || "Video/Audio Guide"} - Click for actions`}
          >
            {mediaType === "video" ? (
              <video
                src={guideItem.url}
                className="h-full w-full object-cover pointer-events-none"
                muted
                playsInline
              />
            ) : (
              <Music className="h-6 w-6 text-emerald-400" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Pencil className="h-4 w-4 text-white" />
            </div>
            <div className="absolute bottom-1 right-1 p-0.5 rounded bg-black/70 text-[9px] text-zinc-400 scale-90 max-w-[48px] truncate">
              {mediaType === "video"
                ? guideItem.role === "continue_video"
                  ? "Continue"
                  : "Video"
                : "Audio"}
            </div>
          </button>
        </div>
      );
    }

    // Empty slot
    return (
      <div
        key="empty_guide_slot"
        className={`relative h-14 w-14 rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center flex-shrink-0 cursor-pointer hover:border-zinc-500 ${
          isGuideDragOver
            ? "border-blue-500 bg-blue-500/10"
            : "border-zinc-700"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          setIsGuideDragOver(true);
        }}
        onDragLeave={() => setIsGuideDragOver(false)}
        onDrop={handleGuideSlotDrop}
        onClick={() => guideInputRef.current?.click()}
        title="Click or drop video/audio from gallery"
      >
        <Video className="h-4 w-4 text-zinc-500" />
        <span className="text-[8px] text-zinc-500 mt-1 uppercase scale-90 select-none">
          Vid/Aud
        </span>
      </div>
    );
  };

  const supportsInputStrip =
    (mode === "image" && supportsImageInput) ||
    (mode === "video" && selectedVideoProfile?.inputMedia?.supportsImageInputs);
  const attachedMediaCount =
    imageInputs.length + (inputImage ? 1 : 0) + (inputAudio ? 1 : 0);

  useEffect(() => {
    setMediaInputsExpanded(false);
  }, [mode, selectedVideoProfile?.id, selectedImageProfile?.id]);

  useEffect(() => {
    if (mediaInputsExpandKey > 0) {
      setMediaInputsExpanded(true);
    }
  }, [mediaInputsExpandKey]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-visible">
      {supportsInputStrip && (
        <div className="border-b border-zinc-800/60">
          <button
            type="button"
            onClick={() => setMediaInputsExpanded((expanded) => !expanded)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-400 transition-colors hover:bg-zinc-800/40 hover:text-zinc-200"
            aria-expanded={mediaInputsExpanded}
          >
            {mediaInputsExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
            )}
            <span className="font-medium text-zinc-300">Media inputs</span>
            {attachedMediaCount > 0 ? (
              <span className="rounded-full bg-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-300">
                {attachedMediaCount}
              </span>
            ) : (
              <span className="text-[10px] text-zinc-500">Optional</span>
            )}
          </button>
          {mediaInputsExpanded && (
            <div className="relative flex items-center gap-2 overflow-visible px-2 pt-1 pb-2">
              {mode === "image" ? (
                <>
                  {imageInputs.map((item) => {
                    const role = imageInputPolicy?.roles.find(
                      (candidate) => candidate.role === item.role,
                    );
                    const isActive = activeImageInputId === item.id;
                    return (
                      <div key={item.id} className="relative">
                        {isActive && imageInputPolicy && (
                          <div className="absolute bottom-full left-0 mb-2 w-56 rounded-md border border-zinc-700 bg-zinc-800 p-2 shadow-xl z-[10000]">
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                              Image input
                            </div>
                            <div className="space-y-1">
                              {imageInputPolicy.roles.map((option) => (
                                <button
                                  key={option.role}
                                  onClick={() =>
                                    updateImageInputRole(item.id, option.role)
                                  }
                                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-colors ${
                                    item.role === option.role
                                      ? "bg-white/20 text-white"
                                      : "text-zinc-400 hover:bg-zinc-700"
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
                          onClick={() =>
                            setActiveImageInputId(isActive ? null : item.id)
                          }
                          className="group relative h-14 w-14 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 flex items-center justify-center flex-shrink-0"
                          title={role?.label || imageInputPolicy?.tooltipLabel}
                        >
                          <img
                            src={item.url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            <Pencil className="h-4 w-4 text-white" />
                          </div>
                        </button>
                      </div>
                    );
                  })}
                  {canAddImageInput && (
                    <div
                      className={`relative h-14 w-14 rounded-lg border-2 border-dashed transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer ${
                        isDragOver
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-zinc-700 hover:border-zinc-500"
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => inputRef.current?.click()}
                      title={imageInputPolicy?.tooltipLabel}
                    >
                      <Image className="h-4 w-4 text-zinc-500" />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {renderVideoSlot(
                    "start_image",
                    "Image 1 (Start)",
                    "image",
                    inputRef,
                  )}
                  {imageInputs.some((x) => x.role === "start_image") &&
                    renderVideoSlot(
                      "end_image",
                      "Image 2 (End)",
                      "image",
                      inputRef,
                    )}
                  {renderCombinedGuideSlot()}
                </>
              )}
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={guideInputRef}
            type="file"
            accept="video/*,audio/*,.mp3,.wav,.ogg,.aac,.flac,.m4a"
            onChange={handleGuideFileSelect}
            className="hidden"
          />
          <input
            ref={audioInputRef}
            type="file"
            accept=".mp3,.wav,.ogg,.aac,.flac,.m4a,audio/*"
            onChange={handleAudioFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Top row: media inputs | Prompt */}
      <div className="flex items-start">
        {/* Input image drop zone — video mode only (I2V) */}
        {mode === "video" &&
          !isPanelMode &&
          !selectedVideoProfile?.inputMedia?.supportsImageInputs && (
            <div
              className={`relative w-10 h-10 mx-2 mt-2 rounded-lg border-2 border-dashed transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer ${
                isDragOver
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-zinc-700 hover:border-zinc-500"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              title="Attach image for I2V"
            >
              {inputImage ? (
                <>
                  <img
                    src={inputImage}
                    alt=""
                    className="w-full h-full object-cover rounded-md"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onInputImageChange(null);
                      resetImageFileInput();
                    }}
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
        {mode === "video" &&
          !isPanelMode &&
          !selectedVideoProfile?.inputMedia?.supportsImageInputs && (
            <div
              className={`relative w-10 h-10 mt-2 rounded-lg border-2 border-dashed transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer ${
                isAudioDragOver
                  ? "border-emerald-500 bg-emerald-500/10"
                  : inputAudio
                    ? "border-emerald-600"
                    : "border-zinc-700 hover:border-zinc-500"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsAudioDragOver(true);
              }}
              onDragLeave={() => setIsAudioDragOver(false)}
              onDrop={handleAudioDrop}
              onClick={() => audioInputRef.current?.click()}
              title={
                inputAudio
                  ? "Audio attached — click to change"
                  : "Attach audio for A2V"
              }
            >
              {inputAudio ? (
                <>
                  <Music className="h-4 w-4 text-emerald-400" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onInputAudioChange(null);
                    }}
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
        <div className="flex flex-1 min-w-0 flex-col py-1">
          {!(mode === "video" && multiShotEnabled) && !isReframe && (
            <textarea
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === "retake"
                  ? "Describe what should happen in the selected section..."
                  : mode === "image"
                    ? "A close-up of a woman talking on the phone..."
                    : "The woman sips from a cup of coffee..."
              }
              className="w-full bg-transparent text-white text-sm placeholder:text-zinc-500 focus:outline-none px-2 py-2 resize-none overflow-y-auto h-[70px] leading-5"
            />
          )}
          {!isPanelMode && (
            <div
              className={`flex items-center gap-2 px-2 pb-0.5 pt-1 ${mode === "video" ? "justify-between" : "justify-end"}`}
            >
              {mode === "video" && (
                <button
                  type="button"
                  onClick={() => onMultiShotEnabledChange(!multiShotEnabled)}
                  disabled={isGenerating}
                  className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium transition-colors ${
                    multiShotEnabled
                      ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                      : "bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                  } disabled:opacity-40`}
                  title="Timing"
                >
                  <Film className="h-3 w-3" />
                  Timing
                </button>
              )}
              <div className="flex items-center gap-2">
                <SeedControl
                  seedLocked={seedLocked}
                  lockedSeed={lockedSeed}
                  onChange={onSeedChange}
                  disabled={isGenerating}
                />
                <button
                  type="button"
                  onClick={onEnhancePrompt}
                  disabled={isGenerating || isEnhancingPrompt || !prompt.trim()}
                  className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-400 transition-colors"
                  title="Enhance prompt"
                >
                  {isEnhancingPrompt ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  Enhance
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {mode === "video" && !isPanelMode && multiShotEnabled && (
        <div className="max-h-72 overflow-y-auto border-t border-zinc-800/60 bg-zinc-950/30">
          <div className="flex items-center gap-2 border-b border-zinc-800/60 px-2 py-2">
            <div className="flex h-8 w-[82px] shrink-0 items-center justify-center rounded-md bg-zinc-800/80 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Global
            </div>
            <input
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="Global prompt for the whole video"
              className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none"
            />
          </div>
          {multiShotRows.map((row, index) => {
            const secondsUsedByOtherRows = multiShotTotalSeconds - row.seconds;
            const maxForRow = Math.max(
              1,
              MAX_MULTI_SHOT_SECONDS - secondsUsedByOtherRows,
            );
            const durationOptions = MULTI_SHOT_SECONDS.filter(
              (value) => value <= maxForRow,
            );

            return (
              <div
                key={row.id}
                className="flex items-center gap-2 border-b border-zinc-800/60 px-2 py-2"
              >
                <label className="flex h-8 w-[92px] shrink-0 items-center gap-1.5 rounded-md bg-zinc-800 px-2 text-zinc-300">
                  <Video className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    {index + 1}
                  </span>
                  <select
                    value={row.seconds}
                    onChange={(e) =>
                      updateMultiShotRow(row.id, {
                        seconds: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-11 bg-transparent text-[10px] font-semibold tracking-wider text-zinc-400 focus:outline-none"
                    title={`Segment ${index + 1} length`}
                  >
                    {durationOptions.map((value) => (
                      <option
                        key={value}
                        value={value}
                        className="bg-zinc-800 text-white"
                      >
                        {String(value).padStart(2, "0")}s
                      </option>
                    ))}
                  </select>
                </label>
                <input
                  value={row.prompt}
                  onChange={(e) =>
                    updateMultiShotRow(row.id, { prompt: e.target.value })
                  }
                  placeholder={`Segment ${index + 1}`}
                  className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeMultiShotRow(row.id)}
                  disabled={multiShotRows.length <= 2}
                  className="p-1 rounded-md text-zinc-600 hover:text-white hover:bg-zinc-800 disabled:opacity-0 disabled:pointer-events-none"
                  title="Remove segment"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={addMultiShotRow}
            disabled={multiShotTotalSeconds >= MAX_MULTI_SHOT_SECONDS}
            className="flex w-full items-center justify-center gap-1.5 px-2 py-2 text-xs text-zinc-400 hover:bg-zinc-800/60 hover:text-white disabled:cursor-not-allowed disabled:text-zinc-700 disabled:hover:bg-transparent"
          >
            <Plus className="h-3.5 w-3.5" />
            Add segment
            <span className="text-zinc-600">
              {multiShotTotalSeconds}/{MAX_MULTI_SHOT_SECONDS}s
            </span>
          </button>
        </div>
      )}

      {/* Bottom row: Mode selector + Settings */}
      <div className="flex items-center gap-0.5 px-1.5 py-1.5 border-t border-zinc-800/60 text-xs text-zinc-400">
        {/* Mode dropdown */}
        <SettingsDropdown
          title="MODE"
          value={mode}
          onChange={(v) => onModeChange(v as GenSpaceMode)}
          options={[
            {
              value: "image",
              label: "Image",
              icon: <Image className="h-4 w-4" />,
            },
            {
              value: "video",
              label: "Video",
              icon: <Video className="h-4 w-4" />,
            },
            {
              value: "retake",
              label: "Retake",
              icon: <Scissors className="h-4 w-4" />,
            },
            {
              value: "reframe",
              label: "Reframe",
              icon: <Expand className="h-4 w-4" />,
            },
          ]}
          trigger={
            <>
              {mode === "image" ? (
                <Image className="h-3.5 w-3.5" />
              ) : mode === "retake" ? (
                <Scissors className="h-3.5 w-3.5" />
              ) : mode === "reframe" ? (
                <Expand className="h-3.5 w-3.5" />
              ) : (
                <Video className="h-3.5 w-3.5" />
              )}
              <span className="text-zinc-300 font-medium">
                {mode === "image"
                  ? "Image"
                  : mode === "retake"
                    ? "Retake"
                    : mode === "reframe"
                      ? "Reframe"
                      : "Video"}
              </span>
              <ChevronUp className="h-3 w-3 text-zinc-500" />
            </>
          }
        />

        <div className="flex-1" />

        {isRetake ? (
          <div className="text-[10px] text-zinc-500 pr-2">
            Trim in the panel above, then retake
          </div>
        ) : isReframe ? (
          <div className="flex items-center gap-2">
            {selectedVideoProfile ? (
              <SettingsDropdown
                title="MODEL"
                value={selectedVideoProfile.id}
                onChange={(v) =>
                  onSettingsChange({ ...settings, videoProfileId: v })
                }
                options={videoModelOptions}
                trigger={
                  <>
                    <LightricksIcon className="h-3.5 w-3.5" />
                    <span className="text-zinc-300 font-medium">
                      {selectedVideoProfile.displayName}
                    </span>
                  </>
                }
              />
            ) : null}
            <SettingsDropdown
              title="RESOLUTION"
              value={settings.videoResolution}
              onChange={(v) =>
                onSettingsChange({ ...settings, videoResolution: v })
              }
              options={videoResolutionOptions.map((value) => ({
                value,
                label: value,
              }))}
              trigger={
                <>
                  <Monitor className="h-3.5 w-3.5" />
                  <span>{settings.videoResolution.replace("p", "")}</span>
                </>
              }
            />
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-800/40 text-zinc-400">
              <Clock className="h-3.5 w-3.5" />
              <span>{(reframeDurationSeconds ?? 0).toFixed(1)}s auto</span>
            </div>
          </div>
        ) : mode === "image" ? (
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
                onChange={(v) =>
                  onSettingsChange({ ...settings, videoProfileId: v })
                }
                options={videoModelOptions}
                trigger={
                  <>
                    <LightricksIcon className="h-3.5 w-3.5" />
                    <span className="text-zinc-300 font-medium">
                      {selectedVideoProfile.displayName}
                    </span>
                    {selectedVideoIsExperimental && (
                      <span className="text-[9px] uppercase tracking-wider text-amber-500">
                        exp
                      </span>
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

            {multiShotEnabled ? (
              <button
                type="button"
                disabled
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-800/40 text-zinc-500 cursor-not-allowed"
                title="Video duration is controlled by timing segments"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>auto</span>
                <span className="text-zinc-600">{multiShotTotalSeconds}s</span>
              </button>
            ) : (
              <SettingsDropdown
                title="DURATION"
                value={String(settings.duration)}
                onChange={(v) =>
                  onSettingsChange({ ...settings, duration: parseFloat(v) })
                }
                options={videoDurationOptions.map((value) => ({
                  value: String(value),
                  label: `${value} Sec`,
                }))}
                trigger={
                  <>
                    <Clock className="h-3.5 w-3.5" />
                    <span>{settings.duration}s</span>
                  </>
                }
              />
            )}

            {/* Resolution dropdown */}
            <SettingsDropdown
              title="RESOLUTION"
              value={settings.videoResolution}
              onChange={(v) => {
                const maxDur = LOCAL_MAX_DURATION[v] ?? 20;
                const clampedDuration =
                  settings.duration > maxDur ? maxDur : settings.duration;
                onSettingsChange({
                  ...settings,
                  videoResolution: v,
                  duration: clampedDuration,
                });
              }}
              options={videoResolutionOptions.map((value) => ({
                value,
                label: value,
              }))}
              trigger={
                <>
                  <Monitor className="h-3.5 w-3.5" />
                  <span>{settings.videoResolution.replace("p", "")}</span>
                </>
              }
            />

            {/* Aspect Ratio dropdown */}
            <SettingsDropdown
              title="ASPECT RATIO"
              value={settings.aspectRatio}
              onChange={(v) =>
                onSettingsChange({ ...settings, aspectRatio: v })
              }
              options={
                inputAudio
                  ? [{ value: "16:9", label: "16:9" }]
                  : [
                      { value: "16:9", label: "16:9" },
                      { value: "9:16", label: "9:16" },
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
              ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              : "bg-white text-black hover:bg-zinc-200"
          }`}
        >
          <span className={isGenerating ? "animate-pulse" : ""}>
            {buttonIcon}
          </span>
          {buttonLabel}
        </button>
      </div>
    </div>
  );
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
  );
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
  );
}

function GridLargeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="2" width="9" height="9" rx="1.5" />
      <rect x="13" y="2" width="9" height="9" rx="1.5" />
      <rect x="2" y="13" width="9" height="9" rx="1.5" />
      <rect x="13" y="13" width="9" height="9" rx="1.5" />
    </svg>
  );
}

type GallerySize = "small" | "medium" | "large" | "list";

const gallerySizeClasses: Record<Exclude<GallerySize, "list">, string> = {
  small:
    "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7",
  medium:
    "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
  large:
    "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3",
};

const GALLERY_BOTTOM_FADE_HEIGHT_PX = 160;

const DEFAULT_VIDEO_SETTINGS = {
  model: "fast",
  videoProfileId: "ltx2_22b_distilled",
  duration: 5,
  videoResolution: "540p",
  fps: 24,
  aspectRatio: "16:9",
  imageResolution: "720p",
  imageSteps: 8,
  variations: 1,
  audio: true,
  imageProfileId: "z_image_turbo",
  imageAspectRatio: "1:1",
  imageInputRole: undefined as string | undefined,
};

export function GenSpace() {
  const {
    currentProject,
    currentProjectId,
    addAsset,
    addTakeToAsset,
    deleteAsset,
    updateAsset,
    toggleFavorite,
    genSpaceEditImageUrl,
    setGenSpaceEditImageUrl,
    setGenSpaceEditMode,
    genSpaceAudioUrl,
    setGenSpaceAudioUrl,
    genSpaceRetakeSource,
    setGenSpaceRetakeSource,
    setPendingRetakeUpdate,
    updateProjectGenSpaceSeed,
  } = useProjects();
  const { updateSettings, isLoaded: appSettingsLoaded } = useAppSettings();
  const [mode, setMode] = useState<GenSpaceMode>("video");
  const [prompt, setPrompt] = useState("");
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [imageInputs, setImageInputs] = useState<ImageInputItem[]>([]);
  const [inputAudio, setInputAudio] = useState<string | null>(null);
  const [useAudioTrack, setUseAudioTrack] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [multiShotEnabled, setMultiShotEnabled] = useState(false);
  const [multiShotRows, setMultiShotRows] = useState<MultiShotRow[]>(() => [
    createMultiShotRow(4),
    createMultiShotRow(4),
  ]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [galleryFilter, setGalleryFilter] =
    useState<GalleryFilterState>(DEFAULT_GALLERY_FILTER);
  const [gallerySize, setGallerySize] = useState<GallerySize>("medium");
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [selectedBin, setSelectedBin] = useState<string | null>(null);
  const [stagedBins, setStagedBins] = useState<string[]>([]);
  const [creatingBin, setCreatingBin] = useState(false);
  const [newBinName, setNewBinName] = useState("");
  const [binContextMenu, setBinContextMenu] =
    useState<GalleryBinContextMenuState | null>(null);
  const [assetContextMenu, setAssetContextMenu] =
    useState<GalleryAssetContextMenuState | null>(null);
  const [isGalleryDragOver, setIsGalleryDragOver] = useState(false);
  const [isGalleryImporting, setIsGalleryImporting] = useState(false);
  const [galleryToast, setGalleryToast] = useState<string | null>(null);
  const [mediaInputsExpandKey, setMediaInputsExpandKey] = useState(0);
  const [inputRestoreVersion, setInputRestoreVersion] = useState(0);
  const [duplicateFilenameChoice, setDuplicateFilenameChoice] = useState<{
    fileName: string;
    resolve: (choice: DuplicateFilenameChoice) => void;
  } | null>(null);
  const sizeMenuRef = useRef<HTMLDivElement>(null);
  const prevProjectIdRef = useRef<string | null>(null);
  const pendingInputRestoreRef = useRef<{
    imageInputs: ImageInputItem[];
    inputImage: string | null;
    inputAudio: string | null;
  } | null>(null);
  const persistedVideoKeyRef = useRef<string | null>(null);
  const persistedImageKeyRef = useRef<string | null>(null);
  const retakeSubmissionRef = useRef<{
    prompt: string;
    input: {
      videoPath: string | null;
      startTime: number;
      duration: number;
      videoDuration: number;
    };
  } | null>(null);
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_VIDEO_SETTINGS,
  }));
  const reframeSubmissionRef = useRef<{
    input: ReframePanelState;
    settings: typeof settings;
  } | null>(null);

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
  } = useGeneration();

  const { profiles: imageProfiles } = useImageProfiles();
  const { profiles: videoProfiles } = useVideoProfiles();

  const {
    submitRetake,
    resetRetake,
    isRetaking,
    retakeStatus,
    retakeError,
    retakeResult,
  } = useRetake();

  const [retakeInput, setRetakeInput] = useState({
    videoUrl: null as string | null,
    videoPath: null as string | null,
    startTime: 0,
    duration: 0,
    videoDuration: 0,
    ready: false,
  });
  const [retakePanelKey, setRetakePanelKey] = useState(0);
  const [retakeInitial, setRetakeInitial] = useState<{
    videoUrl: string | null;
    videoPath: string | null;
    duration?: number;
  }>({ videoUrl: null, videoPath: null, duration: undefined });
  const [activeRetakeSource, setActiveRetakeSource] =
    useState<GenSpaceRetakeSource | null>(null);

  const [reframeInput, setReframeInput] = useState<ReframePanelState>({
    videoUrl: null,
    videoPath: null,
    startTime: 0,
    duration: 0,
    videoDuration: 0,
    videoWidth: 0,
    videoHeight: 0,
    aspectMode: "16:9",
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
    ready: false,
  });
  const [reframePanelKey, setReframePanelKey] = useState(0);
  const [reframeInitial, setReframeInitial] = useState<{
    videoUrl: string | null;
    videoPath: string | null;
    duration?: number;
    aspectMode?: ReframePanelState["aspectMode"];
    padding?: ReframePanelState["padding"];
  }>({ videoUrl: null, videoPath: null });

  // Handle incoming frame from the Video Editor for editing
  useEffect(() => {
    if (genSpaceEditImageUrl) {
      setMode("video");
      setInputImage(genSpaceEditImageUrl);
      setPrompt("");
      setGenSpaceEditImageUrl(null);
      setGenSpaceEditMode(null);
    }
  }, [genSpaceEditImageUrl, setGenSpaceEditImageUrl, setGenSpaceEditMode]);

  // Handle incoming audio from the Video Editor for A2V
  useEffect(() => {
    if (genSpaceAudioUrl) {
      setMode("video");
      setInputAudio(genSpaceAudioUrl);
      setPrompt("");
      setGenSpaceAudioUrl(null);
    }
  }, [genSpaceAudioUrl, setGenSpaceAudioUrl]);

  useEffect(() => {
    if (!genSpaceRetakeSource) return;
    setMode("retake");
    setPrompt("");
    setActiveRetakeSource(genSpaceRetakeSource);
    setRetakeInitial({
      videoUrl: genSpaceRetakeSource.videoUrl,
      videoPath: genSpaceRetakeSource.videoPath,
      duration: genSpaceRetakeSource.duration,
    });
    setRetakePanelKey((prev) => prev + 1);
    setGenSpaceRetakeSource(null);
  }, [genSpaceRetakeSource, setGenSpaceRetakeSource]);

  useEffect(() => {
    if (retakeError) {
      setLocalError(retakeError);
    }
  }, [retakeError]);

  // Gallery shows all image/video/audio assets (generated + uploaded)
  const assets = (currentProject?.assets || []).filter(
    (a) =>
      a.type === "image" || a.type === "video" || a.type === "audio",
  );
  const [lastPrompt, setLastPrompt] = useState("");

  const seedLocked = currentProject?.genSpaceSeedLocked ?? false;
  const lockedSeed = clampGenSpaceSeed(
    currentProject?.genSpaceLockedSeed ?? DEFAULT_GENSPACE_LOCKED_SEED,
  );

  const handleSeedChange = useCallback(
    (seed: { seedLocked: boolean; lockedSeed: number }) => {
      const nextSeed = {
        seedLocked: seed.seedLocked,
        lockedSeed: clampGenSpaceSeed(seed.lockedSeed),
      };
      if (currentProjectId) {
        updateProjectGenSpaceSeed(currentProjectId, nextSeed);
      }
      updateSettings(nextSeed);
    },
    [currentProjectId, updateProjectGenSpaceSeed, updateSettings],
  );

  useEffect(() => {
    if (!appSettingsLoaded) return;
    if (!currentProjectId) {
      prevProjectIdRef.current = null;
      return;
    }
    if (prevProjectIdRef.current === currentProjectId) return;

    prevProjectIdRef.current = currentProjectId;
    const projectSeed = {
      seedLocked: currentProject?.genSpaceSeedLocked ?? false,
      lockedSeed: clampGenSpaceSeed(
        currentProject?.genSpaceLockedSeed ?? DEFAULT_GENSPACE_LOCKED_SEED,
      ),
    };
    updateSettings(projectSeed);
  }, [
    appSettingsLoaded,
    currentProjectId,
    currentProject?.genSpaceSeedLocked,
    currentProject?.genSpaceLockedSeed,
    updateSettings,
  ]);

  // When video generation completes, add to project assets
  useEffect(() => {
    if (!videoUrl || !videoPath || !currentProjectId || isGenerating) return;

    const generationKey = `${videoUrl}|${videoPath}`;
    if (persistedVideoKeyRef.current === generationKey) return;
    persistedVideoKeyRef.current = generationKey;

    const reframeSubmission = reframeSubmissionRef.current;
    if (reframeSubmission) {
      reframeSubmissionRef.current = null;
      const usedInput = reframeSubmission.input;
      const savedVideoSettings = reframeSubmission.settings;
      (async () => {
        try {
          const copied = await copyToAssetFolder(videoPath, currentProjectId);
          const finalPath = copied?.path ?? videoPath;
          const finalUrl = copied?.url ?? videoUrl;
          addAsset(currentProjectId, {
            type: "video",
            path: finalPath,
            url: finalUrl,
            prompt: "outpaint",
            resolution: savedVideoSettings.videoResolution,
            duration: usedInput.duration,
            source: "generated",
            generationParams: {
              mode: "reframe",
              prompt: "outpaint",
              model: savedVideoSettings.model,
              videoProfileId: savedVideoSettings.videoProfileId,
              duration: usedInput.duration,
              resolution: savedVideoSettings.videoResolution,
              fps: savedVideoSettings.fps,
              audio: false,
              cameraMotion: "none",
              reframeAspectMode: usedInput.aspectMode,
              reframePadding: usedInput.padding,
              reframeStartTime: usedInput.startTime,
              reframeDuration: usedInput.duration,
              reframeVideoPath: usedInput.videoPath ?? undefined,
              imageInputMedia: usedInput.videoPath
                ? [
                    {
                      url: usedInput.videoUrl ?? "",
                      role: "control_video",
                      path: usedInput.videoPath,
                    },
                  ]
                : undefined,
            },
            takes: [
              {
                url: finalUrl,
                path: finalPath,
                createdAt: Date.now(),
              },
            ],
            activeTakeIndex: 0,
          });
          reset();
          setMode("video");
        } catch (err) {
          persistedVideoKeyRef.current = null;
          logger.error(`Failed to persist reframe asset: ${err}`);
        }
      })();
      return;
    }

    const genMode = inputAudio
      ? "audio-to-video"
      : inputImage
        ? "image-to-video"
        : "text-to-video";
    const startImageItem = imageInputs.find((x) => x.role === "start_image");
    const audioItem = imageInputs.find((x) =>
      ["audio_guide", "audio_to_video", "reference_voice"].includes(x.role),
    );
    const inputImageUrl = startImageItem?.url || inputImage || undefined;
    const inputAudioUrl = audioItem?.url || inputAudio || undefined;
    const savedVideoSettings = settings;

    (async () => {
      try {
        const copied = await copyToAssetFolder(videoPath, currentProjectId);
        const finalPath = copied?.path ?? videoPath;
        const finalUrl = copied?.url ?? videoUrl;
        addAsset(currentProjectId, {
          type: "video",
          path: finalPath,
          url: finalUrl,
          prompt: lastPrompt,
          resolution: savedVideoSettings.videoResolution,
          duration: savedVideoSettings.duration,
          source: "generated",
          generationParams: {
            mode: genMode as
              | "text-to-video"
              | "image-to-video"
              | "audio-to-video",
            prompt: lastPrompt,
            model: savedVideoSettings.model,
            videoProfileId: savedVideoSettings.videoProfileId,
            duration: savedVideoSettings.duration,
            resolution: savedVideoSettings.videoResolution,
            fps: savedVideoSettings.fps,
            audio: savedVideoSettings.audio || false,
            cameraMotion: "none",
            imageAspectRatio: savedVideoSettings.aspectRatio,
            imageSteps: savedVideoSettings.imageSteps,
            inputImageUrl,
            inputAudioUrl,
            inputImagePath: resolveInputMediaPath(inputImageUrl, assets),
            inputAudioPath: resolveInputMediaPath(inputAudioUrl, assets),
            imageInputMedia: imageInputs.map((item) =>
              toStoredInputMediaEntry(item, assets),
            ),
          },
          takes: [
            {
              url: finalUrl,
              path: finalPath,
              createdAt: Date.now(),
            },
          ],
          activeTakeIndex: 0,
        });
        reset();
      } catch (err) {
        persistedVideoKeyRef.current = null;
        logger.error(`Failed to persist generated video asset: ${err}`);
      }
    })();
  }, [
    videoUrl,
    videoPath,
    currentProjectId,
    isGenerating,
    settings,
    inputImage,
    inputAudio,
    lastPrompt,
    addAsset,
    reset,
    imageInputs,
  ]);

  // When retake completes, add as take or new asset
  useEffect(() => {
    if (!retakeResult || !currentProjectId || isRetaking) return;
    const submission = retakeSubmissionRef.current;
    if (!submission) return;
    retakeSubmissionRef.current = null;
    (async () => {
      const usedPrompt = submission.prompt;
      const usedInput = submission.input;
      const copied = await copyToAssetFolder(
        retakeResult.videoPath,
        currentProjectId,
      );
      const finalPath = copied?.path ?? retakeResult.videoPath;
      const finalUrl = copied?.url ?? retakeResult.videoUrl;

      if (activeRetakeSource?.assetId) {
        const sourceAsset = currentProject?.assets?.find(
          (a) => a.id === activeRetakeSource.assetId,
        );
        if (sourceAsset) {
          const newTakeIndex = sourceAsset.takes ? sourceAsset.takes.length : 1;
          addTakeToAsset(currentProjectId, sourceAsset.id, {
            url: finalUrl,
            path: finalPath,
            createdAt: Date.now(),
          });
          if (activeRetakeSource.linkedClipIds?.length) {
            setPendingRetakeUpdate({
              assetId: sourceAsset.id,
              clipIds: activeRetakeSource.linkedClipIds,
              newTakeIndex,
            });
          }
        }
      } else {
        addAsset(currentProjectId, {
          type: "video",
          path: finalPath,
          url: finalUrl,
          prompt: usedPrompt,
          resolution: "",
          duration: usedInput.duration,
          source: "generated",
          generationParams: {
            mode: "retake",
            prompt: usedPrompt,
            model: "pro",
            duration: usedInput.duration,
            resolution: "",
            fps: 24,
            audio: true,
            cameraMotion: "none",
            retakeVideoPath: finalPath,
            retakeStartTime: usedInput.startTime,
            retakeDuration: usedInput.duration,
            retakeMode: "replace_audio_and_video",
          },
          takes: [{ url: finalUrl, path: finalPath, createdAt: Date.now() }],
          activeTakeIndex: 0,
        });
        setMode("video");
      }

      setActiveRetakeSource(null);
      resetRetake();
    })();
  }, [
    retakeResult,
    isRetaking,
    currentProjectId,
    currentProject?.assets,
    activeRetakeSource,
    addAsset,
    addTakeToAsset,
    setPendingRetakeUpdate,
    resetRetake,
  ]);

  // When image generation/editing completes, add all images to project assets
  useEffect(() => {
    if (imageUrls.length === 0 || !currentProjectId || isGenerating) return;

    const generationKey = `${imageUrls.join("|")}|${imagePaths.join("|")}`;
    if (persistedImageKeyRef.current === generationKey) return;
    persistedImageKeyRef.current = generationKey;

    const genMode = "text-to-image";
    const savedSettings = settings;
    const savedImageInputs = imageInputs;

    (async () => {
      try {
        for (let i = 0; i < imageUrls.length; i++) {
          const imageUrl = imageUrls[i];
          const imgPath = imagePaths[i] || null;
          const exists = assets.some(
            (a) => a.url === imageUrl || a.path === imgPath,
          );
          if (!exists) {
            const copied = imgPath
              ? await copyToAssetFolder(imgPath, currentProjectId)
              : null;
            const finalPath = copied?.path ?? imgPath ?? imageUrl;
            const finalUrl = copied?.url ?? imageUrl;
            addAsset(currentProjectId, {
              type: "image",
              path: finalPath,
              url: finalUrl,
              prompt: lastPrompt,
              resolution: savedSettings.imageResolution,
              source: "generated",
              generationParams: {
                mode: genMode,
                prompt: lastPrompt,
                model: savedSettings.imageProfileId || "z_image_turbo",
                duration: 5,
                resolution: savedSettings.imageResolution,
                fps: 24,
                audio: false,
                cameraMotion: "none",
                imageAspectRatio:
                  savedSettings.imageAspectRatio || savedSettings.aspectRatio,
                imageSteps: savedSettings.imageSteps,
                imageProfileId: savedSettings.imageProfileId,
                inputImageUrl: savedImageInputs[0]?.url,
                inputImagePath: resolveInputMediaPath(
                  savedImageInputs[0]?.url,
                  assets,
                ),
                imageInputRole: savedImageInputs[0]?.role,
                imageInputMedia: savedImageInputs.map((item) =>
                  toStoredInputMediaEntry(item, assets),
                ),
              },
              takes: [
                {
                  url: finalUrl,
                  path: finalPath,
                  createdAt: Date.now(),
                },
              ],
              activeTakeIndex: 0,
            });
          }
        }
        reset();
      } catch (err) {
        persistedImageKeyRef.current = null;
        logger.error(`Failed to persist generated image asset: ${err}`);
      }
    })();
  }, [
    imageUrls,
    imagePaths,
    currentProjectId,
    isGenerating,
    settings,
    imageInputs,
    lastPrompt,
    assets,
    addAsset,
    reset,
  ]);

  const handleGenerate = async () => {
    if (mode === "reframe") {
      if (!reframeInput.videoPath || reframeInput.duration < 2) return;
      const reframeSettings = {
        ...settings,
        duration: Math.max(2, Math.ceil(reframeInput.duration)),
      };
      setSettings(reframeSettings);
      reframeSubmissionRef.current = {
        input: reframeInput,
        settings: reframeSettings,
      };
      setLastPrompt("outpaint");
      await generate(
        "outpaint",
        null,
        {
          model: reframeSettings.model as "fast" | "pro",
          videoProfileId: reframeSettings.videoProfileId,
          duration: reframeSettings.duration,
          videoResolution: reframeSettings.videoResolution,
          fps: reframeSettings.fps,
          audio: false,
          cameraMotion: "none",
          aspectRatio: reframeSettings.aspectRatio,
          imageResolution: reframeSettings.imageResolution,
          imageAspectRatio: reframeSettings.aspectRatio,
          imageSteps: reframeSettings.imageSteps,
        },
        null,
        [{ path: reframeInput.videoPath, role: "control_video" }],
        false,
        undefined,
        {
          aspectMode: reframeInput.aspectMode,
          padding: reframeInput.padding,
          controlVideoStartTime: reframeInput.startTime,
          controlVideoDuration: reframeInput.duration,
        },
      );
      return;
    }

    if (mode === "retake") {
      if (!retakeInput.videoPath || retakeInput.duration < 2) return;
      retakeSubmissionRef.current = {
        prompt,
        input: {
          videoPath: retakeInput.videoPath,
          startTime: retakeInput.startTime,
          duration: retakeInput.duration,
          videoDuration: retakeInput.videoDuration,
        },
      };
      await submitRetake({
        videoPath: retakeInput.videoPath,
        startTime: retakeInput.startTime,
        duration: retakeInput.duration,
        prompt,
        mode: "replace_audio_and_video",
      });
      return;
    }

    const shouldUseMultiShot = mode === "video" && multiShotEnabled;
    if (!shouldUseMultiShot && !prompt.trim()) return;
    if (shouldUseMultiShot && multiShotRows.some((row) => !row.prompt.trim()))
      return;
    const multiShotDuration = multiShotRows.reduce(
      (total, row) => total + row.seconds,
      0,
    );
    const generationPrompt = shouldUseMultiShot
      ? formatMultiShotPrompt(prompt, multiShotRows)
      : prompt;
    const shotPrompts = shouldUseMultiShot
      ? multiShotRows.map((row) => ({
          seconds: row.seconds,
          prompt: row.prompt.trim(),
        }))
      : undefined;

    // Save the prompt before generation starts
    setLastPrompt(generationPrompt);

    if (mode === "image") {
      const inputMedia = imageInputs
        .map((item) => {
          const path = fileUrlToPath(item.url);
          return path ? { path, role: item.role } : null;
        })
        .filter(
          (item): item is { path: string; role: string } => item !== null,
        );
      generateImage(
        generationPrompt,
        {
          model: "fast" as "fast" | "pro",
          duration: 5,
          videoResolution: settings.videoResolution,
          fps: 24,
          audio: false,
          cameraMotion: "none",
          imageResolution: settings.imageResolution,
          imageAspectRatio: settings.imageAspectRatio || settings.aspectRatio,
          imageSteps: settings.imageSteps,
          variations: settings.variations,
          imageProfileId: settings.imageProfileId,
          imageInputRole: settings.imageInputRole,
        },
        inputMedia,
      );
    } else {
      // Generate video (t2v if no image/audio, i2v if image, a2v if audio)
      // Extract filesystem path from the file:// URL for the backend
      const startImageItem = imageInputs.find((x) => x.role === "start_image");
      const audioItem = imageInputs.find((x) =>
        ["audio_guide", "audio_to_video", "reference_voice"].includes(x.role),
      );
      const videoGuideItem = imageInputs.find((x) =>
        [
          "control_video",
          "human_motion",
          "human_motion_pose",
          "depth",
          "canny_edges",
          "sdr_to_hdr",
        ].includes(x.role),
      );

      const imagePath = startImageItem
        ? fileUrlToPath(startImageItem.url)
        : inputImage
          ? fileUrlToPath(inputImage)
          : null;
      const audioPath = audioItem
        ? fileUrlToPath(audioItem.url)
        : videoGuideItem && useAudioTrack
          ? fileUrlToPath(videoGuideItem.url)
          : inputAudio
            ? fileUrlToPath(inputAudio)
            : null;
      const videoSettings = { ...settings };
      if (shouldUseMultiShot) videoSettings.duration = multiShotDuration;
      if (audioPath) videoSettings.model = "pro";
      if (shouldUseMultiShot) setSettings(videoSettings);

      const inputMedia = imageInputs
        .map((item) => {
          const path = fileUrlToPath(item.url);
          return path ? { path, role: item.role } : null;
        })
        .filter(
          (item): item is { path: string; role: string } => item !== null,
        );

      generate(
        prompt,
        imagePath,
        {
          model: videoSettings.model as "fast" | "pro",
          videoProfileId: videoSettings.videoProfileId,
          duration: videoSettings.duration,
          videoResolution: videoSettings.videoResolution,
          fps: videoSettings.fps,
          audio: videoSettings.audio || false,
          cameraMotion: "none",
          aspectRatio: videoSettings.aspectRatio,
          imageResolution: videoSettings.imageResolution,
          imageAspectRatio: videoSettings.aspectRatio,
          imageSteps: videoSettings.imageSteps,
        },
        audioPath,
        inputMedia,
        useAudioTrack,
        shotPrompts,
      );
    }
  };

  const handleEnhancePrompt = async () => {
    const trimmedPrompt = prompt.trim();
    if (
      !trimmedPrompt ||
      mode === "retake" ||
      mode === "reframe" ||
      promptGenerating ||
      isEnhancingPrompt
    )
      return;

    const inputImageUrl =
      mode === "image"
        ? imageInputs[0]?.url
        : imageInputs.find((item) => item.role === "start_image")?.url ||
          inputImage;
    const inputImagePath = inputImageUrl ? fileUrlToPath(inputImageUrl) : null;

    setIsEnhancingPrompt(true);
    setLocalError(null);
    try {
      const response = await backendFetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          mode,
          modelProfileId:
            mode === "image"
              ? settings.imageProfileId
              : settings.videoProfileId,
          inputImagePath,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Prompt enhancement failed");
      }
      const data = await response.json();
      if (typeof data.prompt === "string" && data.prompt.trim()) {
        setPrompt(data.prompt);
      }
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Prompt enhancement failed",
      );
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!currentProjectId) return;

    const asset = assets.find((entry) => entry.id === assetId);
    const pathsToTrash = asset ? collectAssetFilePaths(asset) : [];

    if (selectedAsset?.id === assetId) {
      setSelectedAsset(null);
    }
    deleteAsset(currentProjectId, assetId);

    if (pathsToTrash.length > 0) {
      await waitForMediaFileHandlesReleased();
      await deleteProjectAssetFilesFromDisk(currentProjectId, pathsToTrash);
    }
  };

  const handleDragStart = (e: React.DragEvent, asset: Asset) => {
    e.dataTransfer.setData("asset", JSON.stringify(asset));
    e.dataTransfer.setData("assetId", asset.id);
    e.dataTransfer.effectAllowed = "copy";
  };

  const showGalleryToast = useCallback((message: string) => {
    setGalleryToast(message);
  }, []);

  const requestDuplicateFilenameChoice = useCallback(
    (fileName: string): Promise<DuplicateFilenameChoice> =>
      new Promise((resolve) => {
        setDuplicateFilenameChoice({ fileName, resolve });
      }),
    [],
  );

  const handleDuplicateFilenameChoice = useCallback(
    (choice: DuplicateFilenameChoice) => {
      duplicateFilenameChoice?.resolve(choice);
      setDuplicateFilenameChoice(null);
    },
    [duplicateFilenameChoice],
  );

  const syncInputFileToGallery = useCallback(
    (file: File) => {
      if (!currentProjectId) {
        return Promise.resolve(null);
      }
      return ensureGalleryAssetForInputFile(
        currentProjectId,
        file,
        currentProject?.assets ?? [],
        addAsset,
        requestDuplicateFilenameChoice,
      );
    },
    [
      currentProjectId,
      currentProject?.assets,
      addAsset,
      requestDuplicateFilenameChoice,
    ],
  );

  useEffect(() => {
    if (!galleryToast) return;
    const timer = window.setTimeout(() => setGalleryToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [galleryToast]);

  const handleGalleryDragEnter = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("asset")) return;
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      setIsGalleryDragOver(true);
    }
  };

  const handleGalleryDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("asset")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsGalleryDragOver(true);
  };

  const handleGalleryDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsGalleryDragOver(false);
  };

  const handleGalleryDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsGalleryDragOver(false);
    if (e.dataTransfer.types.includes("asset")) return;
    if (!currentProjectId) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    setIsGalleryImporting(true);
    const knownPaths = new Set(
      (currentProject?.assets || []).map((asset) => asset.path),
    );
    let imported = 0;
    let rejected = 0;

    try {
      for (const file of files) {
        const outcome = await importGalleryFile(
          currentProjectId,
          file,
          requestDuplicateFilenameChoice,
        );
        if (!outcome.ok) {
          if (outcome.reason !== "cancelled") {
            rejected += 1;
          }
          continue;
        }
        if (knownPaths.has(outcome.asset.path)) {
          continue;
        }
        addAsset(currentProjectId, outcome.asset);
        knownPaths.add(outcome.asset.path);
        imported += 1;
      }
    } finally {
      setIsGalleryImporting(false);
    }

    if (imported > 0) {
      showGalleryToast(
        imported === 1
          ? "Added 1 file to gallery"
          : `Added ${imported} files to gallery`,
      );
    }
    if (rejected > 0) {
      showGalleryToast(
        rejected === 1
          ? "Unsupported file — use image, video, or audio"
          : `${rejected} files skipped — use image, video, or audio only`,
      );
    }
  };

  const handleCreateVideo = (imageAsset: Asset) => {
    setMode("video");
    setInputImage(imageAsset.url);
    setPrompt(`${imageAsset.prompt || "The scene comes to life..."}`);
  };

  const handleRetake = (videoAsset: Asset) => {
    setMode("retake");
    setPrompt("");
    setActiveRetakeSource(null);
    setRetakeInitial({
      videoUrl: videoAsset.url,
      videoPath: videoAsset.path,
      duration: videoAsset.duration,
    });
    setRetakePanelKey((prev) => prev + 1);
  };

  const handleReframe = (videoAsset: Asset) => {
    setMode("reframe");
    setPrompt("");
    setReframeInitial({
      videoUrl: videoAsset.url,
      videoPath: videoAsset.path,
      duration: videoAsset.duration,
    });
    setReframePanelKey((prev) => prev + 1);
  };

  const handleApplyPrompt = useCallback(
    (asset: Asset) => {
      const params = asset.generationParams;
      if (!params) return;

      const projectAssets = currentProject?.assets ?? [];

      setLocalError(null);
      setMultiShotEnabled(false);
      setMultiShotRows([createMultiShotRow(4), createMultiShotRow(4)]);

      const nextMode = genSpaceModeFromParams(params);
      const restoredInputs = buildImageInputsFromParams(params, projectAssets);
      const { inputImage: restoredImage, inputAudio: restoredAudio } =
        resolveLegacyInputMedia(params, restoredInputs, projectAssets);

      pendingInputRestoreRef.current = {
        imageInputs: restoredInputs,
        inputImage: restoredImage,
        inputAudio: restoredAudio,
      };

      setImageInputs([]);
      setInputImage(null);
      setInputAudio(null);
      setMode(nextMode);
      setPrompt(params.prompt);
      setSettings((prev) => settingsPatchFromGenerationParams(params, prev));
      setInputRestoreVersion((version) => version + 1);

      if (nextMode === "retake") {
        setActiveRetakeSource(null);
        setRetakeInitial({
          videoUrl: asset.url,
          videoPath: asset.path,
          duration: asset.duration ?? params.retakeDuration,
        });
        setRetakePanelKey((prev) => prev + 1);
      }
      if (nextMode === "reframe") {
        setReframeInitial({
          videoUrl: asset.url,
          videoPath: asset.path,
          duration: asset.duration ?? params.reframeDuration,
          aspectMode: params.reframeAspectMode,
          padding: params.reframePadding,
        });
        setReframePanelKey((prev) => prev + 1);
      }
    },
    [currentProject?.assets],
  );

  useEffect(() => {
    const pending = pendingInputRestoreRef.current;
    if (!pending) return;

    const hasMedia =
      pending.imageInputs.length > 0 || pending.inputImage || pending.inputAudio;
    if (!hasMedia) {
      pendingInputRestoreRef.current = null;
      return;
    }

    if (mode === "image" && imageProfiles.length === 0) return;
    if (mode === "video" && videoProfiles.length === 0) return;

    pendingInputRestoreRef.current = null;
    setImageInputs(pending.imageInputs);
    setInputImage(pending.inputImage);
    setInputAudio(pending.inputAudio);
    setMediaInputsExpandKey((key) => key + 1);
  }, [
    inputRestoreVersion,
    mode,
    settings.imageProfileId,
    settings.videoProfileId,
    imageProfiles.length,
    videoProfiles.length,
  ]);

  const isRetakeMode = mode === "retake";
  const isReframeMode = mode === "reframe";
  const isPanelMode = isRetakeMode || isReframeMode;
  const canSubmit = isReframeMode
    ? reframeInput.ready && !!reframeInput.videoPath && !isGenerating
    : isRetakeMode
    ? retakeInput.ready && !!retakeInput.videoPath && !isRetaking
    : mode === "video" && multiShotEnabled
      ? multiShotRows.every((row) => row.prompt.trim())
      : !!prompt.trim();
  const promptButtonLabel = isReframeMode
    ? "Reframe"
    : isRetakeMode
      ? "Retake"
      : "Generate";
  const promptButtonIcon = isReframeMode ? (
    <Expand className="h-3.5 w-3.5" />
  ) : isRetakeMode ? (
    <Scissors className="h-3.5 w-3.5" />
  ) : (
    <Sparkles
      className={`h-3.5 w-3.5 ${isGenerating ? "animate-pulse" : ""}`}
    />
  );
  const promptGenerating = isRetakeMode ? isRetaking : isGenerating;

  // Close size menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        sizeMenuRef.current &&
        !sizeMenuRef.current.contains(e.target as Node)
      ) {
        setShowSizeMenu(false);
      }
    };
    if (showSizeMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSizeMenu]);

  const filteredAssets = useMemo(() => {
    let list = filterGalleryAssets(assets, galleryFilter);
    if (selectedBin !== null) {
      list = filterGalleryAssetsByBin(list, selectedBin);
    }
    if (showFavorites) {
      list = list.filter((asset) => asset.favorite);
    }
    return list;
  }, [assets, galleryFilter, showFavorites, selectedBin]);

  const galleryBins = useMemo(
    () => collectGalleryBins(assets, stagedBins),
    [assets, stagedBins],
  );

  const handleAssignAssetToBin = useCallback(
    (assetId: string, bin: string | undefined) => {
      if (!currentProjectId) return;
      updateAsset(currentProjectId, assetId, { bin });
    },
    [currentProjectId, updateAsset],
  );

  const handleCommitNewBin = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setStagedBins((prev) =>
      prev.includes(trimmed) ? prev : [...prev, trimmed].sort(),
    );
    setSelectedBin(trimmed);
    setCreatingBin(false);
    setNewBinName("");
  }, []);

  const handleRenameBin = useCallback(
    (oldName: string, newName: string) => {
      if (!currentProjectId) return;
      const trimmed = newName.trim();
      if (!trimmed || trimmed === oldName) return;
      for (const asset of assets.filter((entry) => entry.bin === oldName)) {
        updateAsset(currentProjectId, asset.id, { bin: trimmed });
      }
      setStagedBins((prev) =>
        prev
          .map((entry) => (entry === oldName ? trimmed : entry))
          .sort((a, b) => a.localeCompare(b)),
      );
      if (selectedBin === oldName) {
        setSelectedBin(trimmed);
      }
    },
    [assets, currentProjectId, selectedBin, updateAsset],
  );

  const handleDeleteBin = useCallback(
    (bin: string) => {
      if (!currentProjectId) return;
      for (const asset of assets.filter((entry) => entry.bin === bin)) {
        updateAsset(currentProjectId, asset.id, { bin: undefined });
      }
      setStagedBins((prev) => prev.filter((entry) => entry !== bin));
      if (selectedBin === bin) {
        setSelectedBin(null);
      }
    },
    [assets, currentProjectId, selectedBin, updateAsset],
  );

  const handleAssetContextMenu = useCallback(
    (e: React.MouseEvent, asset: Asset) => {
      setAssetContextMenu({ asset, x: e.clientX, y: e.clientY });
      setBinContextMenu(null);
    },
    [],
  );

  const galleryFilterActive = isGalleryFilterActive(galleryFilter);

  // Navigation for the asset preview modal
  const selectedIndex = selectedAsset
    ? filteredAssets.findIndex((a) => a.id === selectedAsset.id)
    : -1;
  const canGoPrev = selectedIndex > 0;
  const canGoNext =
    selectedIndex >= 0 && selectedIndex < filteredAssets.length - 1;

  const goToPrev = useCallback(() => {
    if (canGoPrev) setSelectedAsset(filteredAssets[selectedIndex - 1]);
  }, [canGoPrev, filteredAssets, selectedIndex]);

  const goToNext = useCallback(() => {
    if (canGoNext) setSelectedAsset(filteredAssets[selectedIndex + 1]);
  }, [canGoNext, filteredAssets, selectedIndex]);

  // Keyboard navigation for the preview modal
  useEffect(() => {
    if (!selectedAsset) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "Escape") setSelectedAsset(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedAsset, goToPrev, goToNext]);

  return (
    <div
      className="h-full relative bg-zinc-950"
      onDragEnter={!isPanelMode ? handleGalleryDragEnter : undefined}
      onDragOver={!isPanelMode ? handleGalleryDragOver : undefined}
      onDragLeave={!isPanelMode ? handleGalleryDragLeave : undefined}
      onDrop={!isPanelMode ? handleGalleryDrop : undefined}
    >
      {!isPanelMode && galleryToast && (
        <div className="absolute top-6 left-1/2 z-30 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-900/95 px-4 py-2 text-sm text-zinc-200 shadow-xl">
          {galleryToast}
        </div>
      )}
      {!isPanelMode && isGalleryDragOver && (
        <div className="pointer-events-none absolute inset-4 z-20 flex items-center justify-center rounded-xl border-2 border-dashed border-violet-400/70 bg-violet-500/10">
          <p className="text-sm font-medium text-violet-200">
            Drop image, video, or audio files to add to gallery
          </p>
        </div>
      )}
      {/* Empty state */}
      {!isPanelMode && assets.length === 0 && !isGenerating && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-zinc-700 flex items-center justify-center mb-4">
            <Sparkles className="h-10 w-10 text-zinc-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Start Creating
          </h3>
          <p className="text-zinc-500 max-w-md">
            Use the prompt bar below to generate images and videos, or drop
            image, video, and audio files here to add them to your gallery.
          </p>
        </div>
      )}

      {/* No favorites empty state */}
      {!isPanelMode &&
        showFavorites &&
        filteredAssets.length === 0 &&
        assets.length > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <Heart className="h-12 w-12 text-zinc-700 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No favorites yet
            </h3>
            <p className="text-zinc-500 text-sm">
              Click the heart icon on any asset to add it to your favorites.
            </p>
          </div>
        )}

      {/* No filter matches empty state */}
      {!isPanelMode &&
        !showFavorites &&
        selectedBin !== null &&
        filteredAssets.length === 0 &&
        assets.length > 0 &&
        !isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <Folder className="h-12 w-12 text-zinc-700 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No assets in &ldquo;{selectedBin}&rdquo;
            </h3>
            <p className="text-zinc-500 text-sm">
              Right-click an asset and choose Move to Bin to add it here.
            </p>
          </div>
        )}

      {!isPanelMode &&
        !showFavorites &&
        selectedBin === null &&
        galleryFilterActive &&
        filteredAssets.length === 0 &&
        assets.length > 0 &&
        !isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <ListFilter className="h-12 w-12 text-zinc-700 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No matching assets
            </h3>
            <p className="text-zinc-500 text-sm">
              Try adjusting the type or source filters.
            </p>
          </div>
        )}

      {/* Assets area — full width, no background, above the prompt bar */}
      {!isPanelMode && (assets.length > 0 || isGenerating) && (
        <div className="absolute inset-x-0 top-0 bottom-0 flex flex-col px-4 pt-4">
          {/* Top bar — filter + favorites + bins left, view right */}
          <div className="flex items-center justify-between gap-3 pb-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <GalleryFilters
                filter={galleryFilter}
                onChange={setGalleryFilter}
              />
              <button
                type="button"
                onClick={() => setShowFavorites(!showFavorites)}
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border transition-colors ${
                  showFavorites
                    ? "border-red-500/30 bg-red-500/20 text-red-400"
                    : "border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
                aria-label="Show favorites"
                aria-pressed={showFavorites}
                title="Show favorites"
              >
                <Heart
                  className={`h-4 w-4 ${showFavorites ? "fill-current" : ""}`}
                />
              </button>
              <div className="min-w-0 flex-1">
                <GalleryBinBar
                  bins={galleryBins}
                  assets={assets}
                  selectedBin={selectedBin}
                  creatingBin={creatingBin}
                  newBinName={newBinName}
                  onSelectBin={setSelectedBin}
                  onCreatingBinChange={setCreatingBin}
                  onNewBinNameChange={setNewBinName}
                  onCommitNewBin={handleCommitNewBin}
                  onAssignAssetToBin={(assetId, bin) =>
                    handleAssignAssetToBin(assetId, bin)
                  }
                  onRenameBin={handleRenameBin}
                  onDeleteBin={handleDeleteBin}
                  binContextMenu={binContextMenu}
                  onBinContextMenuChange={setBinContextMenu}
                />
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
            <div ref={sizeMenuRef} className="relative">
              <button
                onClick={() => setShowSizeMenu(!showSizeMenu)}
                className={`p-2 rounded-md transition-colors ${
                  showSizeMenu
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {gallerySize === "list" ? (
                  <List className="h-4 w-4" />
                ) : gallerySize === "small" ? (
                  <GridSmallIcon className="h-4 w-4" />
                ) : gallerySize === "medium" ? (
                  <GridMediumIcon className="h-4 w-4" />
                ) : (
                  <GridLargeIcon className="h-4 w-4" />
                )}
              </button>

              {showSizeMenu && (
                <div className="absolute top-full mt-2 right-0 bg-zinc-800 border border-zinc-700 rounded-md p-2 min-w-[160px] shadow-xl z-50">
                  {[
                    {
                      value: "small" as GallerySize,
                      label: "Small",
                      icon: GridSmallIcon,
                    },
                    {
                      value: "medium" as GallerySize,
                      label: "Medium",
                      icon: GridMediumIcon,
                    },
                    {
                      value: "large" as GallerySize,
                      label: "Large",
                      icon: GridLargeIcon,
                    },
                    {
                      value: "list" as GallerySize,
                      label: "List",
                      icon: List,
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setGallerySize(option.value);
                        setShowSizeMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-2.5 rounded-md transition-colors text-left ${gallerySize === option.value ? "bg-white/20 hover:bg-white/25" : "hover:bg-zinc-700"}`}
                    >
                      <div className="flex items-center gap-3">
                        <option.icon
                          className={`h-4 w-4 ${gallerySize === option.value ? "text-white" : "text-zinc-500"}`}
                        />
                        <span
                          className={`text-sm ${gallerySize === option.value ? "text-white font-medium" : "text-zinc-400"}`}
                        >
                          {option.label}
                        </span>
                      </div>
                      {gallerySize === option.value && (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            </div>
          </div>

          {/* Assets grid — fills remaining space, scrollable */}
          <div
            className="overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] flex-1"
            style={{ paddingBottom: GALLERY_BOTTOM_FADE_HEIGHT_PX }}
          >
            <div
              className={
                gallerySize === "list"
                  ? "flex flex-col gap-0.5"
                  : `grid ${gallerySizeClasses[gallerySize]} gap-4`
              }
            >
              {isGenerating &&
                (gallerySize === "list" ? (
                  <div className="flex items-center gap-4 rounded-lg px-3 py-3">
                    <div className="relative h-12 w-20 flex-shrink-0 overflow-hidden rounded-md bg-zinc-800">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <LoaderCircle className="h-5 w-5 animate-spin text-violet-400" />
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400">
                      {statusMessage || "Generating..."}
                    </p>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden bg-zinc-800 aspect-video">
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="relative w-16 h-16 mb-3">
                        <div className="absolute inset-0 rounded-full border-2 border-violet-500/30" />
                        <div className="absolute inset-0 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                        <div className="absolute inset-2 rounded-full bg-zinc-800 flex items-center justify-center">
                          <Sparkles className="h-6 w-6 text-violet-400" />
                        </div>
                      </div>
                      <p className="text-sm text-zinc-400">
                        {statusMessage || "Generating..."}
                      </p>
                      {progress > 0 && (
                        <div className="w-32 h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                          <div
                            className="h-full bg-violet-500 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              {isGalleryImporting &&
                (gallerySize === "list" ? (
                  <div className="flex items-center gap-4 rounded-lg px-3 py-3">
                    <div className="relative h-12 w-20 flex-shrink-0 overflow-hidden rounded-md bg-zinc-800">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <LoaderCircle className="h-5 w-5 animate-spin text-violet-400" />
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400">Importing...</p>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden bg-zinc-800 aspect-video">
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <LoaderCircle className="h-8 w-8 animate-spin text-violet-400 mb-2" />
                      <p className="text-sm text-zinc-400">Importing...</p>
                    </div>
                  </div>
                ))}
              {filteredAssets.map((asset) =>
                gallerySize === "list" ? (
                  <AssetListRow
                    key={asset.id}
                    asset={asset}
                    onDelete={() => handleDelete(asset.id)}
                    onPlay={() => setSelectedAsset(asset)}
                    onDragStart={handleDragStart}
                    onContextMenu={handleAssetContextMenu}
                    onApplyPrompt={handleApplyPrompt}
                    onToggleFavorite={() =>
                      currentProjectId &&
                      toggleFavorite(currentProjectId, asset.id)
                    }
                  />
                ) : (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onDelete={() => handleDelete(asset.id)}
                    onPlay={() => setSelectedAsset(asset)}
                    onDragStart={handleDragStart}
                    onContextMenu={handleAssetContextMenu}
                    onCreateVideo={handleCreateVideo}
                    onRetake={handleRetake}
                    onReframe={handleReframe}
                    onApplyPrompt={handleApplyPrompt}
                    onToggleFavorite={() =>
                      currentProjectId &&
                      toggleFavorite(currentProjectId, asset.id)
                    }
                  />
                ),
              )}
            </div>
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent"
            style={{ height: GALLERY_BOTTOM_FADE_HEIGHT_PX }}
          />
        </div>
      )}

      {mode === "retake" && (
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

      {mode === "reframe" && (
        <div className="absolute inset-x-0 top-0 bottom-[160px] px-4 pt-4 pb-4 flex flex-col overflow-hidden">
          <ReframePanel
            initialVideoUrl={reframeInitial.videoUrl}
            initialVideoPath={reframeInitial.videoPath}
            initialDuration={reframeInitial.duration}
            initialAspectMode={reframeInitial.aspectMode}
            initialPadding={reframeInitial.padding}
            resetKey={reframePanelKey}
            fillHeight
            isProcessing={isGenerating}
            processingStatus={statusMessage}
            onChange={(data) => setReframeInput(data)}
          />
        </div>
      )}

      {/* Floating prompt panel — wider, responsive, centered */}
      <div className="absolute bottom-5 left-1/2 z-20 w-[min(700px,calc(100%-2rem))] -translate-x-1/2">
        {/* Prompt bar */}
        <PromptBar
          mode={mode}
          onModeChange={setMode}
          prompt={prompt}
          onPromptChange={setPrompt}
          onGenerate={handleGenerate}
          onEnhancePrompt={handleEnhancePrompt}
          isGenerating={promptGenerating}
          isEnhancingPrompt={isEnhancingPrompt}
          seedLocked={seedLocked}
          lockedSeed={lockedSeed}
          onSeedChange={handleSeedChange}
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
          useAudioTrack={useAudioTrack}
          onUseAudioTrackChange={setUseAudioTrack}
          multiShotEnabled={multiShotEnabled}
          onMultiShotEnabledChange={setMultiShotEnabled}
          multiShotRows={multiShotRows}
          onMultiShotRowsChange={setMultiShotRows}
          syncInputFileToGallery={syncInputFileToGallery}
          mediaInputsExpandKey={mediaInputsExpandKey}
          reframeDurationSeconds={reframeInput.duration}
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
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            disabled={!canGoPrev}
            className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full backdrop-blur-md transition-all ${
              canGoPrev
                ? "bg-white/10 text-white hover:bg-white/20 cursor-pointer"
                : "bg-white/5 text-zinc-600 cursor-default"
            }`}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Next button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            disabled={!canGoNext}
            className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full backdrop-blur-md transition-all ${
              canGoNext
                ? "bg-white/10 text-white hover:bg-white/20 cursor-pointer"
                : "bg-white/5 text-zinc-600 cursor-default"
            }`}
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Content area */}
          <div
            className="relative max-w-5xl w-full max-h-full px-20 py-8"
            onClick={(e) => e.stopPropagation()}
          >
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

            {selectedAsset.type === "video" ? (
              <video
                key={selectedAsset.id}
                src={selectedAsset.url}
                controls
                autoPlay
                className="w-full rounded-xl object-contain max-h-[75vh]"
              />
            ) : selectedAsset.type === "audio" ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-zinc-900 py-16 px-8">
                <Music className="mb-6 h-16 w-16 text-emerald-400" />
                <audio
                  key={selectedAsset.id}
                  src={selectedAsset.url}
                  controls
                  autoPlay
                  className="w-full max-w-md"
                />
              </div>
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
                      navigator.clipboard.writeText(selectedAsset.prompt);
                      setCopiedPrompt(true);
                      setTimeout(() => setCopiedPrompt(false), 2000);
                    }}
                    className="shrink-0 p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                    title="Copy prompt"
                  >
                    {copiedPrompt ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
              <p className="text-zinc-500 text-sm mt-1">
                {selectedAsset.type === "audio"
                  ? getAssetDisplayFileName(selectedAsset)
                  : `${selectedAsset.resolution} • ${
                      selectedAsset.duration
                        ? `${selectedAsset.duration}s`
                        : "Image"
                    }`}
              </p>
            </div>
          </div>
        </div>
      )}

      {duplicateFilenameChoice && (
        <DuplicateFilenameDialog
          fileName={duplicateFilenameChoice.fileName}
          onChoose={handleDuplicateFilenameChoice}
        />
      )}

      {assetContextMenu && (
        <GalleryAssetContextMenu
          menu={assetContextMenu}
          bins={galleryBins}
          onClose={() => setAssetContextMenu(null)}
          onAssignBin={(bin) => {
            handleAssignAssetToBin(assetContextMenu.asset.id, bin);
          }}
          onCreateBin={(name) => {
            handleCommitNewBin(name);
            handleAssignAssetToBin(assetContextMenu.asset.id, name);
          }}
        />
      )}

      {(error || localError) && (
        <GenerationErrorDialog
          error={(error || localError)!}
          onDismiss={() => {
            if (error) reset();
            if (localError) {
              setLocalError(null);
              resetRetake();
            }
          }}
        />
      )}
    </div>
  );
}
