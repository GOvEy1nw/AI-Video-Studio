import { useCallback, useEffect, useRef, useState } from "react";
import { Music } from "lucide-react";
import { getWaveform } from "../lib/audio-decode-service";
import { logger } from "../lib/logger";

interface AudioClipInfo {
  url: string;
  name: string;
  startTime: number;
  duration: number;
}

interface AudioWaveformProps {
  audioClips: AudioClipInfo[];
  currentTime: number;
  isPlaying: boolean;
  enabled?: boolean;
}

export { getWaveform as computeWaveform } from "../lib/audio-decode-service";

function drawPeaks(
  canvas: HTMLCanvasElement,
  peaks: Float32Array,
  color: string,
  heightFactor = 1,
) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.floor(rect.width);
  const height = Math.floor(rect.height * heightFactor);
  if (!width || !height) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.scale(dpr, dpr);
  context.clearRect(0, 0, width, height);
  const center = height / 2;
  const amplitude = height * 0.45;
  context.fillStyle = color;
  context.beginPath();
  for (let index = 0; index < width; index += 1) {
    const peak = peaks[Math.min(peaks.length - 1, Math.floor((index / width) * peaks.length))];
    if (index === 0) context.moveTo(index, center - peak * amplitude);
    else context.lineTo(index, center - peak * amplitude);
  }
  for (let index = width - 1; index >= 0; index -= 1) {
    const peak = peaks[Math.min(peaks.length - 1, Math.floor((index / width) * peaks.length))];
    context.lineTo(index, center + peak * amplitude);
  }
  context.closePath();
  context.fill();
}

function useVisible(ref: React.RefObject<Element | null>, enabled: boolean) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const target = ref.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, [enabled, ref]);
  return enabled && visible;
}

function StaticWaveform({
  peaks,
  color,
  playedColor,
  progress,
  className,
}: {
  peaks: Float32Array;
  color: string;
  playedColor?: string;
  progress?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLCanvasElement>(null);
  const playedRef = useRef<HTMLCanvasElement>(null);
  const draw = useCallback(() => {
    if (!baseRef.current) return;
    drawPeaks(baseRef.current, peaks, color);
    if (playedColor && playedRef.current) drawPeaks(playedRef.current, peaks, playedColor);
  }, [color, peaks, playedColor]);
  useEffect(() => {
    draw();
    const observer = new ResizeObserver(draw);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [draw]);
  const clampedProgress = Math.max(0, Math.min(1, progress ?? 0));
  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className ?? ""}`}>
      <canvas ref={baseRef} className="absolute inset-0 h-full w-full" />
      {playedColor && (
        <canvas
          ref={playedRef}
          className="absolute inset-0 h-full w-full"
          style={{ clipPath: `inset(0 ${100 - clampedProgress * 100}% 0 0)` }}
        />
      )}
      {progress !== undefined && (
        <div className="absolute inset-y-0 w-px bg-white" style={{ left: `${clampedProgress * 100}%` }} />
      )}
    </div>
  );
}

export function AudioWaveform({ audioClips, currentTime, enabled = true }: AudioWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const active = useVisible(containerRef, enabled);
  const [waveforms, setWaveforms] = useState<Map<string, Float32Array>>(new Map());
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    void Promise.all(audioClips.filter((clip) => clip.url).map(async (clip) => {
      try { return [clip.url, await getWaveform(clip.url)] as const; }
      catch (error) { logger.warn(`Failed to decode audio waveform: ${clip.url} ${error}`); return null; }
    })).then((results) => {
      if (!cancelled) setWaveforms(new Map(results.filter((value): value is readonly [string, Float32Array] => value !== null)));
    });
    return () => { cancelled = true; };
  }, [active, audioClips]);
  return (
    <div ref={containerRef} className="w-full h-full flex flex-col">
      <div className="flex-1 relative min-h-0 bg-[#0a0a0a]">
        {audioClips.map((clip) => {
          const peaks = waveforms.get(clip.url);
          return peaks ? <StaticWaveform key={clip.url} peaks={peaks} color="rgba(16, 185, 129, 0.9)" playedColor="rgba(110, 231, 183, 0.9)" progress={(currentTime - clip.startTime) / clip.duration} /> : null;
        })}
        <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 rounded-sm bg-black/60"><Music className="h-3 w-3 text-emerald-400" /><span className="text-[10px] text-emerald-400 font-medium">Audio</span></div>
      </div>
      {audioClips.length > 0 && <div className="shrink-0 px-3 py-1.5 bg-zinc-950 border-t border-zinc-800">{audioClips.map((audioClip, index) => <p key={`${audioClip.url}-${index}`} className="text-2xs text-zinc-500 truncate">{audioClip.name}</p>)}</div>}
    </div>
  );
}

interface ClipWaveformProps {
  url: string;
  className?: string;
  color?: string;
  playedColor?: string;
  progress?: number;
  enabled?: boolean;
}

export function ClipWaveform({ url, className = "", color = "rgba(52, 211, 153, 0.7)", playedColor, progress, enabled = true }: ClipWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const active = useVisible(containerRef, enabled);
  const [peaks, setPeaks] = useState<Float32Array | null>(null);
  useEffect(() => {
    if (!active || !url) return;
    let cancelled = false;
    void getWaveform(url, 200).then((result) => { if (!cancelled) setPeaks(result); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [active, url]);
  return <div ref={containerRef} className={`absolute inset-0 ${className}`}>{peaks && <StaticWaveform peaks={peaks} color={color} playedColor={playedColor} progress={progress} />}</div>;
}
