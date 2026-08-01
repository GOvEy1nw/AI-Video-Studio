import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardPaste,
  Copy,
  Expand,
  FolderOpen,
  Heart,
  LoaderCircle,
  Pause,
  Play,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { ClipWaveform } from "../../components/AudioWaveform";
import { DownloadProgressView } from "../../components/DownloadProgressView";
import {
  UseImageDropdown,
  type ImageUseTarget,
} from "../../components/UseImageDropdown";
import type { Asset } from "../../types/project";
import type { GenSpaceGalleryProps } from "./GenSpaceGallery";

export interface GenSpaceSelectedGenerationProps {
  style?: React.CSSProperties;
  asset: Asset | null;
  modelName?: string;
  generation: GenSpaceGalleryProps["generation"];
  selectedIndex: number;
  visibleAssetCount: number;
  copiedPrompt: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onCopyPrompt: (prompt: string) => void;
  onToggleFavorite: (asset: Asset) => void;
  onUseImage: (asset: Asset, target: ImageUseTarget) => void;
  onReframe: (asset: Asset) => void;
  onCopySettings: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}

function ActionButton({
  label,
  icon,
  onClick,
  active = false,
  danger = false,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors ${
        danger
          ? "border-red-500/20 text-red-400 hover:bg-red-500/10"
          : active
            ? "border-red-500/20 bg-red-500/10 text-red-400"
            : "border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
      }`}
      aria-label={label}
      title={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function GenerationProgress({
  generation,
}: {
  generation: GenSpaceGalleryProps["generation"];
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col p-5">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-zinc-800 bg-black">
        {generation.previewUrl ? (
          <img
            src={generation.previewUrl}
            alt="Current generation preview"
            className="h-full w-full object-contain"
          />
        ) : null}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center px-6 text-center ${
            generation.previewUrl ? "bg-black/45" : ""
          }`}
        >
          {generation.modelDownload === null &&
          (!generation.previewUrl || generation.modelLifecycleActive) ? (
            <LoaderCircle className="mb-4 h-10 w-10 animate-spin text-violet-400" />
          ) : null}
          {generation.modelDownload ? (
            <DownloadProgressView
              className="w-full max-w-md rounded-xl bg-black/65 p-4"
              title={`Downloading ${
                generation.modelDownload.modelName ?? "model files"
              }`}
              transfer={generation.modelDownload}
            />
          ) : (
            <>
              <p className="text-base font-medium text-zinc-100">
                {generation.statusMessage || "Generating..."}
              </p>
              {generation.badges.length > 0 ? (
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {generation.badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full border border-white/10 bg-black/50 px-2 py-1 text-[10px] text-zinc-300"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              ) : null}
              {!generation.modelLifecycleActive ? (
                <div className="mt-5 w-full max-w-sm">
                  <div className="mb-2 flex justify-between text-xs text-zinc-400">
                    <span>{generation.modelName}</span>
                    <span>{Math.round(generation.progress)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full bg-violet-500 transition-all"
                      style={{ width: `${generation.progress}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </>
          )}
          <button
            type="button"
            onClick={generation.cancel}
            disabled={generation.isCancelling}
            className="mt-5 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-black/60 disabled:cursor-wait disabled:opacity-60"
          >
            {generation.isCancelling ? "Cancelling..." : "Cancel generation"}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatPlaybackTime(value: number) {
  const seconds = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function MediaPlayerControls({
  currentTime,
  duration,
  isPlaying,
  muted,
  audio,
  onPlayPause,
  onSeek,
  onToggleMuted,
}: {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  muted: boolean;
  audio: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onToggleMuted: () => void;
}) {
  return (
    <div
      data-testid="media-player-controls"
      className="w-full shrink-0 border-t border-zinc-800 bg-zinc-900/95 px-5 py-3 backdrop-blur"
    >
      <div
        className={`flex w-full items-center gap-3 ${audio ? "justify-center" : ""}`}
      >
        <button
          type="button"
          onClick={onPlayPause}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
            audio
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
              : "border-violet-400/20 bg-violet-400/10 text-violet-300 hover:bg-violet-400/20"
          }`}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 fill-current" />
          ) : (
            <Play className="ml-0.5 h-4 w-4 fill-current" />
          )}
        </button>
        {!audio ? (
          <>
            <span className="w-20 shrink-0 text-center font-mono text-[11px] text-zinc-400">
              {formatPlaybackTime(currentTime)} / {formatPlaybackTime(duration)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step="0.01"
              value={Math.min(currentTime, duration || 0)}
              disabled={duration <= 0}
              onChange={(event) => onSeek(Number(event.currentTarget.value))}
              aria-label="Playback position"
              className="min-w-0 flex-1 cursor-pointer accent-violet-400 disabled:cursor-wait"
            />
            <button
              type="button"
              onClick={onToggleMuted}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function PlayableAssetPreview({ asset }: { asset: Asset }) {
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(asset.duration ?? 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const audio = asset.type === "audio";
  const progress = duration > 0 ? currentTime / duration : 0;

  const syncDuration = (media: HTMLMediaElement) => {
    if (Number.isFinite(media.duration) && media.duration > 0) {
      setDuration(media.duration);
    }
  };

  const handlePlayPause = useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;
    if (media.paused || media.ended) {
      void media.play().catch(() => setIsPlaying(false));
    } else {
      media.pause();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isSpace =
        event.code === "Space" ||
        event.key === " " ||
        event.key === "Spacebar" ||
        event.key === "Space";
      if (!isSpace || event.repeat || event.defaultPrevented) {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest(
          "input, textarea, select, button, [contenteditable='true']",
        )
      ) {
        return;
      }
      const media = mediaRef.current;
      if (!media || media.closest("[hidden]")) return;
      event.preventDefault();
      handlePlayPause();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePlayPause]);

  const handleSeek = (time: number) => {
    const media = mediaRef.current;
    if (!media) return;
    media.currentTime = time;
    setCurrentTime(time);
  };

  const handleWaveformClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width <= 0 || duration <= 0) return;
    const fraction = Math.max(
      0,
      Math.min(1, (event.clientX - bounds.left) / bounds.width),
    );
    handleSeek(fraction * duration);
  };

  const handleWaveformKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    handleSeek(
      Math.max(
        0,
        Math.min(duration, currentTime + (event.key === "ArrowRight" ? 5 : -5)),
      ),
    );
  };

  const handleToggleMuted = () => {
    const media = mediaRef.current;
    if (!media) return;
    media.muted = !media.muted;
    setMuted(media.muted);
  };

  const mediaEvents = {
    onLoadedMetadata: (event: React.SyntheticEvent<HTMLMediaElement>) =>
      syncDuration(event.currentTarget),
    onDurationChange: (event: React.SyntheticEvent<HTMLMediaElement>) =>
      syncDuration(event.currentTarget),
    onTimeUpdate: (event: React.SyntheticEvent<HTMLMediaElement>) =>
      setCurrentTime(event.currentTarget.currentTime),
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false),
    onEnded: () => setIsPlaying(false),
    onVolumeChange: (event: React.SyntheticEvent<HTMLMediaElement>) =>
      setMuted(event.currentTarget.muted),
  };

  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      {audio ? (
        <div
          data-testid="audio-waveform"
          role="slider"
          tabIndex={duration > 0 ? 0 : -1}
          aria-label="Audio playback position"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
          aria-valuetext={`${formatPlaybackTime(currentTime)} of ${formatPlaybackTime(duration)}`}
          onClick={handleWaveformClick}
          onKeyDown={handleWaveformKeyDown}
          className="relative min-h-0 w-full flex-1 cursor-pointer overflow-hidden bg-linear-to-b from-emerald-950/20 to-zinc-950 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400/70"
        >
          <audio
            ref={(node) => {
              mediaRef.current = node;
            }}
            src={asset.url}
            preload="metadata"
            {...mediaEvents}
          />
          <ClipWaveform
            url={asset.url}
            progress={progress}
            color="rgba(52, 211, 153, 0.62)"
            playedColor="rgba(74, 222, 168, 0.74)"
          />
        </div>
      ) : (
        <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden bg-black">
          <video
            ref={(node) => {
              mediaRef.current = node;
            }}
            src={asset.url}
            preload="metadata"
            className="h-full w-full object-contain"
            {...mediaEvents}
          />
        </div>
      )}
      <MediaPlayerControls
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        muted={muted}
        audio={audio}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onToggleMuted={handleToggleMuted}
      />
    </div>
  );
}

function AssetPreview({ asset }: { asset: Asset }) {
  if (asset.type === "video" || asset.type === "audio") {
    return <PlayableAssetPreview key={asset.url} asset={asset} />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center p-5">
      <img
        key={asset.url}
        src={asset.url}
        alt={asset.prompt}
        className="max-h-full max-w-full object-contain"
      />
    </div>
  );
}

export function GenSpaceSelectedGeneration({
  asset,
  style,
  modelName,
  generation,
  selectedIndex,
  visibleAssetCount,
  copiedPrompt,
  canGoPrev,
  canGoNext,
  onClose,
  onPrevious,
  onNext,
  onCopyPrompt,
  onToggleFavorite,
  onUseImage,
  onReframe,
  onCopySettings,
  onDelete,
}: GenSpaceSelectedGenerationProps) {
  const showingGeneration = generation.isRunning && generation.isSelected;
  const metadata = asset
    ? [
        ["Model", modelName ?? "Unknown"],
        ["Resolution", asset.resolution || "Original"],
        ...(asset.duration !== undefined
          ? [["Duration", `${asset.duration}s`]]
          : []),
        [
          "Generation time",
          asset.generationTimeSeconds !== undefined
            ? `${asset.generationTimeSeconds}s`
            : "Not recorded",
        ],
        [
          "Created",
          new Intl.DateTimeFormat(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(asset.createdAt),
        ],
      ]
    : [];

  return (
    <section
      data-testid="selected-generation-panel"
      className="absolute inset-y-0 flex min-w-0 flex-col bg-zinc-950"
      style={style}
    >
      <header className="flex h-30 shrink-0 items-center justify-between gap-4 border-b bg-zinc-900 border-zinc-800 px-5">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 mb-4 items-center gap-2">
            <h2
              className="min-w-0 truncate text-sm font-semibold text-white"
              title={asset?.prompt}
            >
              {asset?.prompt || "Selected generation"}
            </h2>
            {asset?.generationParams ? (
              <button
                type="button"
                onClick={() => onCopySettings(asset)}
                className="flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-zinc-800 px-2 text-[10px] font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
                aria-label="Copy settings"
                title="Copy settings"
              >
                <ClipboardPaste className="h-3.5 w-3.5" />
                <span>Copy settings</span>
              </button>
            ) : null}
            {asset?.prompt ? (
              <button
                type="button"
                onClick={() => onCopyPrompt(asset.prompt)}
                className="shrink-0 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                aria-label="Copy prompt"
                title="Copy prompt"
              >
                {copiedPrompt ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {metadata.map(([label, value]) => (
              <div key={label}>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">
                  {label}
                </p>
                <p className="mt-0.5 text-xs text-zinc-300">{value}</p>
              </div>
            ))}
          </div>
        </div>
        {asset ? (
          <p className="mt-0.5 text-[10px] text-zinc-500">
            {selectedIndex + 1} of {visibleAssetCount}
          </p>
        ) : showingGeneration ? (
          <p className="mt-0.5 text-[10px] text-violet-300">
            Generation in progress
          </p>
        ) : null}
        {asset ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrevious}
              disabled={!canGoPrev}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white disabled:text-zinc-700"
              aria-label="Previous asset"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!canGoNext}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white disabled:text-zinc-700"
              aria-label="Next asset"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white"
              aria-label="Clear selected asset"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </header>

      {showingGeneration ? (
        <GenerationProgress generation={generation} />
      ) : asset ? (
        <>
          <div className="flex min-h-0 flex-1 overflow-hidden bg-black/40">
            <AssetPreview asset={asset} />
          </div>
          <div className="shrink-0 border-t bg-zinc-900 border-zinc-800 px-5 py-4">
            <div className="flex flex-wrap gap-2">
              <ActionButton
                label={asset.favorite ? "Favorited" : "Favorite"}
                active={asset.favorite}
                icon={
                  <Heart
                    className={`h-4 w-4 ${
                      asset.favorite ? "fill-current" : ""
                    }`}
                  />
                }
                onClick={() => onToggleFavorite(asset)}
              />
              <ActionButton
                label="Open"
                icon={<FolderOpen className="h-4 w-4" />}
                onClick={() =>
                  void window.electronAPI?.showItemInFolder(asset.path)
                }
              />
              {asset.type === "image" ? (
                <UseImageDropdown
                  onSelect={(target) => onUseImage(asset, target)}
                />
              ) : null}
              {asset.type === "video" ? (
                <ActionButton
                  label="Reframe"
                  icon={<Expand className="h-4 w-4" />}
                  onClick={() => onReframe(asset)}
                />
              ) : null}
              <ActionButton
                label="Remove"
                danger
                icon={<Trash2 className="h-4 w-4" />}
                onClick={() => onDelete(asset)}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-zinc-800">
            <Sparkles className="h-8 w-8 text-zinc-700" />
          </div>
          <h3 className="text-sm font-medium text-zinc-300">
            Select a generation
          </h3>
          <p className="mt-2 max-w-sm text-xs leading-5 text-zinc-600">
            Choose an asset or the active generation card to inspect its
            preview, metadata, prompt, and actions.
          </p>
        </div>
      )}
    </section>
  );
}
