import { cn } from "@/lib/utils";
import {
  clampPercent,
  formatBytes,
  formatEta,
  formatTransferRate,
} from "@/lib/transfer-format";
import type { DownloadTransferProgress } from "@/types/progress";

interface DownloadProgressViewProps {
  title: string;
  transfer: DownloadTransferProgress;
  compact?: boolean;
  className?: string;
}

export function DownloadProgressView({
  title,
  transfer,
  compact = false,
  className,
}: DownloadProgressViewProps) {
  const percent = clampPercent(
    transfer.percent ??
      (transfer.total && transfer.total > 0
        ? (transfer.current / transfer.total) * 100
        : null),
  );
  const item = transfer.filename ?? transfer.repoId;
  const primary =
    transfer.unit === "bytes"
      ? transfer.total
        ? `${formatBytes(transfer.current)} / ${formatBytes(transfer.total)} · ${percent?.toFixed(1)}%`
        : transfer.current > 0
          ? `${formatBytes(transfer.current)} downloaded`
          : null
      : transfer.total
        ? `${transfer.current} / ${transfer.total} files · ${percent?.toFixed(1)}%`
        : transfer.current > 0
          ? `${transfer.current} files downloaded`
          : null;
  const secondary = [
    formatTransferRate(transfer.speedBps),
    transfer.etaSeconds != null ? `About ${formatEta(transfer.etaSeconds)} remaining` : "",
    transfer.fileIndex != null && transfer.fileCount != null
      ? `File ${transfer.fileIndex} of ${transfer.fileCount}`
      : "",
  ].filter(Boolean);

  return (
    <div className={cn("min-w-0 text-left", compact ? "space-y-1" : "space-y-1.5", className)}>
      <p className={cn("truncate font-medium text-zinc-100", compact ? "text-[11px]" : "text-sm")}>
        {title}
      </p>
      {item && (
        <p className="truncate text-[11px] text-zinc-300" title={item}>
          {item}
        </p>
      )}
      <div
        className="h-1.5 overflow-hidden rounded-full bg-zinc-700"
        role="progressbar"
        aria-label="Model download progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent ?? undefined}
      >
        {percent == null ? (
          <div className="h-full w-1/3 animate-pulse rounded-full bg-violet-500" />
        ) : (
          <div
            className="h-full rounded-full bg-violet-500 transition-[width]"
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
      {(primary || secondary.length > 0) && (
        <p className="text-[10px] text-zinc-400">
          {[primary, ...secondary].filter(Boolean).join(" · ")}
        </p>
      )}
    </div>
  );
}
