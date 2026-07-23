import { useEffect, useState } from "react";
import { Download, Loader2, RefreshCw, Square, Trash2 } from "lucide-react";
import type { ModelPackProgress } from "@/types/progress";
import {
  clampPercent,
  formatEta,
  formatTransferRate,
} from "@/lib/transfer-format";
import { Button } from "./ui/button";

interface ModelPack {
  id: string;
  name: string;
  estimatedSize: string;
  installed: boolean;
}

interface ModelPackManagerProps {
  firstRun?: boolean;
  onContinue?: () => void;
}

export function ModelPackManager({
  firstRun = false,
  onContinue,
}: ModelPackManagerProps) {
  const [packs, setPacks] = useState<ModelPack[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [progress, setProgress] = useState<ModelPackProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [operationActive, setOperationActive] = useState(false);
  const [failedPackId, setFailedPackId] = useState<string | null>(null);
  const downloading =
    progress?.status === "preparing" || progress?.status === "downloading";
  const busy = operationActive || downloading || deleting !== null || checking;

  const refresh = async (scan = false) => {
    const result = scan
      ? await window.electronAPI.refreshModelPacks()
      : await window.electronAPI.getModelPacks();
    setPacks(result as ModelPack[]);
  };

  useEffect(() => {
    void refresh();
    let mounted = true;
    let receivedLiveProgress = false;
    window.electronAPI.onModelPackProgress((data) => {
      receivedLiveProgress = true;
      if (mounted) {
        setProgress(data);
        if (data.status === "error" && data.packId) {
          setFailedPackId(data.packId);
          setSelected((current) =>
            current.filter((value) => value !== data.packId),
          );
        }
      }
    });
    void window.electronAPI.getModelPackProgress().then((current) => {
      if (mounted && !receivedLiveProgress && current) {
        setProgress(current);
      }
    });
    return () => {
      mounted = false;
      window.electronAPI.removeModelPackProgress();
    };
  }, []);

  const toggle = (id: string) => {
    if (busy) return;
    if (failedPackId === id) setFailedPackId(null);
    if (progress?.status === "error") setProgress(null);
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
    const attemptedPackId = selected[0] ?? null;
    setError(null);
    setFailedPackId(null);
    setOperationActive(true);
    setProgress({
      status: "preparing",
      packId: null,
      packName: null,
      packIndex: null,
      packCount: null,
      message: null,
      transfer: null,
    });
    try {
      const complete = await window.electronAPI.downloadModelPacks(selected);
      await refresh();
      setSelected([]);
      if (complete) {
        setProgress(null);
        onContinue?.();
      }
    } catch (reason) {
      setFailedPackId(attemptedPackId);
      setSelected((current) =>
        current.filter((value) => value !== attemptedPackId),
      );
      setProgress((current) => ({
        status: "error",
        packId: current?.packId ?? attemptedPackId,
        packName: current?.packName ?? null,
        packIndex: current?.packIndex ?? null,
        packCount: current?.packCount ?? null,
        message: current?.message ?? null,
        transfer: current?.transfer ?? null,
      }));
      setError(
        reason instanceof Error ? reason.message : "Model download failed.",
      );
    } finally {
      setOperationActive(false);
    }
  };

  const deletePack = async (pack: ModelPack) => {
    if (
      busy ||
      !window.confirm(
        `Delete ${pack.name}? Files shared with another model pack will be kept.`,
      )
    ) {
      return;
    }
    setError(null);
    setDeleting(pack.id);
    try {
      await window.electronAPI.deleteModelPack(pack.id);
      await refresh();
      setSelected((current) =>
        current.filter((value) => value !== pack.id),
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Model-pack deletion failed.",
      );
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className={firstRun ? "w-full max-w-3xl" : "space-y-4"}>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">Model Manager</h3>
            <Button
              variant="outline"
              className="h-8 border-zinc-600 px-2.5 text-xs"
              disabled={busy}
              onClick={() => {
                setError(null);
                setChecking(true);
                void refresh(true)
                  .catch((reason: unknown) =>
                    setError(
                      reason instanceof Error
                        ? reason.message
                        : "Model check failed.",
                    ),
                  )
                  .finally(() => setChecking(false));
              }}
            >
              <RefreshCw
                className={`mr-1.5 h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
          {selected.length > 0 && (
            <span className="text-sm text-zinc-400">
              {selected.length} selected
            </span>
          )}
        </div>
        <p className="text-xs leading-relaxed text-zinc-400">
          Shared files are skipped automatically, so estimated sizes can be
          smaller when another pack is already installed.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {packs.map((pack) => {
          const checked = selected.includes(pack.id);
          const matchesProgress =
            progress?.packId === pack.id ||
            (progress?.packName !== null && progress?.packName === pack.name);
          const active =
            downloading &&
            (matchesProgress ||
              (progress?.status === "preparing" &&
                progress.packId === null &&
                selected[0] === pack.id));
          const failed =
            !pack.installed &&
            (failedPackId === pack.id ||
              (progress?.status === "error" && matchesProgress));
          const transfer = active ? progress?.transfer : null;
          const percent = clampPercent(transfer?.percent);
          const speed = formatTransferRate(transfer?.speedBps);
          const eta = formatEta(transfer?.etaSeconds);
          const stateClasses = active
            ? "border-amber-400 bg-amber-950/30"
            : pack.installed
              ? "border-emerald-500 bg-emerald-500/15"
              : failed
                ? "border-red-500 bg-red-500/15 hover:bg-red-500/20"
                : checked
                  ? "border-blue-500 bg-blue-500/20"
                  : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-500";
          const statusLabel = active
            ? [speed, eta ? `ETA ${eta}` : ""].filter(Boolean).join(" · ") ||
              "Preparing"
            : pack.installed
              ? "Ready"
              : failed
                ? "Retry download"
                : checked
                  ? "Selected"
                  : "Missing";
          return (
            <div
              key={pack.id}
              className={`relative min-h-20 overflow-hidden rounded-xl border-2 transition-colors ${stateClasses}`}
              role={active ? "progressbar" : undefined}
              aria-valuenow={active && percent !== null ? percent : undefined}
              aria-valuemin={active ? 0 : undefined}
              aria-valuemax={active ? 100 : undefined}
            >
              {active && (
                <div
                  className={`absolute inset-y-0 left-0 bg-amber-400/20 transition-[width] ${percent === null ? "w-1/3 animate-pulse" : ""}`}
                  style={percent === null ? undefined : { width: `${percent}%` }}
                />
              )}
              <button
                type="button"
                onClick={() => toggle(pack.id)}
                disabled={busy || pack.installed}
                className="relative z-10 flex min-h-20 w-full min-w-0 items-center justify-between gap-4 px-4 py-3 text-left disabled:cursor-default"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-white">
                    {pack.name}
                  </span>
                  <span className="mt-1 block text-xs text-zinc-400">
                    {pack.estimatedSize}
                  </span>
                </span>
                <span className="min-w-0 shrink-0 text-right">
                  <span
                    className={`block text-xs ${
                      active
                        ? "text-amber-300"
                        : pack.installed
                          ? "text-emerald-400"
                          : failed
                            ? "text-red-400"
                            : checked
                              ? "text-blue-300"
                              : "text-zinc-400"
                    }`}
                  >
                    {statusLabel}
                  </span>
                  {active && transfer?.filename && (
                    <span className="mt-1 block max-w-52 truncate text-xs text-amber-300/80">
                      {transfer.filename}
                    </span>
                  )}
                </span>
              </button>
              {pack.installed && (
                <button
                  type="button"
                  onClick={() => void deletePack(pack)}
                  disabled={busy}
                  className="absolute bottom-2 right-2 z-20 rounded p-1 text-emerald-300/60 transition-colors hover:bg-zinc-900/40 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Delete ${pack.name}`}
                  title={`Delete ${pack.name}`}
                >
                  {deleting === pack.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {progress?.status === "cancelled" && (
        <p className="mt-3 text-xs text-zinc-400">
          {progress.message ?? "Download cancelled."}
        </p>
      )}
      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

      {(downloading || firstRun || selected.length > 0) && (
        <div className="mt-4 flex justify-end gap-2">
          {operationActive || downloading ? (
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
                className="bg-blue-600 hover:bg-blue-500"
                onClick={downloadSelected}
              >
                <Download className="mr-2 h-4 w-4" />{" "}
                {selected.length
                  ? `Download ${selected.length} pack${selected.length === 1 ? "" : "s"}`
                  : "Continue"}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
