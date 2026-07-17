import { useEffect, useState } from "react";
import { Download, Loader2, Square } from "lucide-react";
import { Button } from "./ui/button";

interface ModelPack {
  id: string;
  name: string;
  description: string;
  estimatedSize: string;
  installed: boolean;
}

interface PackProgress {
  status: "downloading" | "complete" | "cancelled" | "error";
  packId?: string;
  packName?: string;
  file?: string;
  percent?: number;
  downloadedBytes?: number;
  totalBytes?: number;
  speed?: number;
}

interface ModelPackManagerProps {
  firstRun?: boolean;
  onContinue?: () => void;
}

const formatBytes = (bytes?: number): string => {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** index).toFixed(1)} ${units[index]}`;
};

export function ModelPackManager({
  firstRun = false,
  onContinue,
}: ModelPackManagerProps) {
  const [packs, setPacks] = useState<ModelPack[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [progress, setProgress] = useState<PackProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const downloading = progress?.status === "downloading";

  const refresh = async () => {
    const result = await window.electronAPI.getModelPacks();
    setPacks(result as ModelPack[]);
  };

  useEffect(() => {
    void refresh();
    window.electronAPI.onModelPackProgress((data: unknown) =>
      setProgress(data as PackProgress),
    );
    return () => window.electronAPI.removeModelPackProgress();
  }, []);

  const toggle = (id: string) => {
    if (downloading) return;
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  };

  const downloadSelected = async () => {
    if (!selected.length) {
      onContinue?.();
      return;
    }
    setError(null);
    setProgress({ status: "downloading" });
    try {
      const complete = await window.electronAPI.downloadModelPacks(selected);
      await refresh();
      setSelected([]);
      if (complete) onContinue?.();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Model download failed.",
      );
    }
  };

  const currentFile = progress?.file
    ? `${progress.file}${progress.percent !== undefined ? ` — ${Math.round(progress.percent)}%` : ""}`
    : progress?.packName
      ? `Downloading ${progress.packName}`
      : "Preparing download";

  return (
    <div className={firstRun ? "w-full max-w-3xl" : "space-y-4"}>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-white">Model Manager</h3>
        <p className="text-xs leading-relaxed text-zinc-400">
          Shared files are skipped automatically, so estimated sizes can be
          smaller when another pack is already installed.
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {packs.map((pack) => {
          const checked = selected.includes(pack.id);
          return (
            <button
              key={pack.id}
              type="button"
              onClick={() => toggle(pack.id)}
              disabled={downloading || pack.installed}
              className={`rounded-lg border p-3 text-left transition-colors ${pack.installed ? "border-emerald-900/70 bg-emerald-950/20" : checked ? "border-violet-500 bg-violet-950/30" : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-500"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-white">
                  {pack.name}
                </span>
                <span
                  className={`text-xs ${pack.installed ? "text-emerald-400" : "text-zinc-400"}`}
                >
                  {pack.installed
                    ? "Ready"
                    : checked
                      ? "Selected"
                      : "Not downloaded"}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{pack.description}</p>
              <p className="mt-2 text-xs font-medium text-zinc-300">
                Approx. {pack.estimatedSize}
              </p>
            </button>
          );
        })}
      </div>

      {progress && (
        <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-800/60 p-3">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="truncate text-zinc-200">{currentFile}</span>
            {downloading && (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-300" />
            )}
          </div>
          {progress.percent !== undefined ? (
            <div className="mt-2 h-1.5 overflow-hidden rounded bg-zinc-700">
              <div
                className="h-full bg-violet-500 transition-[width]"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          ) : (
            downloading && (
              <div className="mt-2 h-1.5 overflow-hidden rounded bg-zinc-700">
                <div className="h-full w-1/3 animate-pulse rounded bg-violet-500" />
              </div>
            )
          )}
          {progress.downloadedBytes !== undefined && (
            <p className="mt-2 text-xs text-zinc-400">
              {formatBytes(progress.downloadedBytes)}
              {progress.totalBytes
                ? ` / ${formatBytes(progress.totalBytes)}`
                : " downloaded"}
              {progress.speed
                ? ` · ${(progress.speed / 1024 / 1024).toFixed(1)} MB/s`
                : ""}
            </p>
          )}
        </div>
      )}
      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

      <div className="mt-4 flex justify-end gap-2">
        {downloading ? (
          <Button
            variant="outline"
            className="border-zinc-600"
            onClick={() => void window.electronAPI.cancelModelPackDownload()}
          >
            <Square className="mr-2 h-3.5 w-3.5" /> Cancel download
          </Button>
        ) : (
          <>
            {firstRun && (
              <Button
                variant="ghost"
                className="text-zinc-300"
                onClick={onContinue}
              >
                Skip for now
              </Button>
            )}
            <Button
              className="bg-violet-600 hover:bg-violet-500"
              onClick={downloadSelected}
            >
              <Download className="mr-2 h-4 w-4" />{" "}
              {selected.length
                ? `Download ${selected.length} pack${selected.length === 1 ? "" : "s"}`
                : firstRun
                  ? "Continue"
                  : "Download selected"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
