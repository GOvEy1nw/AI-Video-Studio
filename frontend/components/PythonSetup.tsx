import { useEffect, useRef, useState } from "react";
import { AlertCircle, Folder, Loader2 } from "lucide-react";
import { AivsLogo } from "./AivsLogo";

interface PythonSetupProps {
  onReady: () => void;
}

interface SetupProgress {
  status: "downloading" | "extracting" | "installing" | "complete" | "error";
  percent: number;
  message?: string;
  detail?: string;
}

interface FolderLocation {
  path: string;
  custom: boolean;
  defaultPath: string;
}

export function PythonSetup({ onReady }: PythonSetupProps) {
  const [progress, setProgress] = useState<SetupProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runtimeReady, setRuntimeReady] = useState(false);
  const [projectAssetsPath, setProjectAssetsPath] = useState("");
  const [checkpointsLocation, setCheckpointsLocation] =
    useState<FolderLocation | null>(null);
  const [lorasLocation, setLorasLocation] =
    useState<FolderLocation | null>(null);
  const started = useRef(false);

  useEffect(() => {
    window.electronAPI.onPythonSetupProgress((data: unknown) =>
      setProgress(data as SetupProgress),
    );
    return () => window.electronAPI.removePythonSetupProgress();
  }, []);

  const startSetup = async () => {
    setError(null);
    try {
      await window.electronAPI.startPythonSetup();
      setRuntimeReady(true);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "First-time setup failed.",
      );
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void startSetup();
  }, []);

  useEffect(() => {
    if (!runtimeReady) return;
    void Promise.allSettled([
      window.electronAPI.getProjectAssetsPath(),
      window.electronAPI.getCheckpointsLocation(),
      window.electronAPI.getLorasLocation(),
    ]).then(([projects, checkpoints, loras]) => {
      if (projects.status === "fulfilled") setProjectAssetsPath(projects.value);
      if (checkpoints.status === "fulfilled") {
        setCheckpointsLocation(checkpoints.value);
      }
      if (loras.status === "fulfilled") setLorasLocation(loras.value);
      const failure = [projects, checkpoints, loras].find(
        (result) => result.status === "rejected",
      );
      if (failure?.status === "rejected") {
        setError(
          failure.reason instanceof Error
            ? failure.reason.message
            : "Storage folders could not be loaded. Choose them manually to continue.",
        );
      }
    });
  }, [runtimeReady]);

  const label = progress?.message ?? "Preparing AiVS";
  const detail =
    progress?.detail ??
    "AiVS downloads its Python and GPU runtime automatically. This only happens once.";
  const chooseProjectAssetsPath = async () => {
    const result = await window.electronAPI.chooseProjectAssetsPath();
    if (result.path) setProjectAssetsPath(result.path);
  };
  const chooseModelFolder = async (kind: "checkpoints" | "loras") => {
    const selected = await window.electronAPI.showOpenDirectoryDialog({
      title: kind === "checkpoints"
        ? "Choose WanGP checkpoints folder"
        : "Choose WanGP LoRAs folder",
    });
    if (!selected) return;
    setError(null);
    try {
      if (kind === "checkpoints") {
        setCheckpointsLocation(
          await window.electronAPI.setCheckpointsLocation(selected),
        );
      } else {
        setLorasLocation(await window.electronAPI.setLorasLocation(selected));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Model folder could not be saved.");
    }
  };
  const useDefaultModelFolder = async (kind: "checkpoints" | "loras") => {
    setError(null);
    try {
      if (kind === "checkpoints") {
        setCheckpointsLocation(
          await window.electronAPI.setCheckpointsLocation(null),
        );
      } else {
        setLorasLocation(await window.electronAPI.setLorasLocation(null));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Model folder could not be reset.");
    }
  };
  const finishSetup = async () => onReady();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-12">
        <AivsLogo className="h-16 w-auto text-foreground" />
        {!runtimeReady ? (
          <section className="mt-12 w-full max-w-xl rounded-xl border border-border bg-card p-6">
            {error ? (
              <div className="text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
                <p className="mt-3 text-sm text-red-300">{error}</p>
                <button
                  className="mt-4 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium hover:bg-violet-500"
                  onClick={() => void startSetup()}
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-300" />
                    {label}
                  </span>
                  <span className="text-violet-300">
                    {progress?.percent ?? 0}%
                  </span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-input">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-violet-400 to-blue-500 transition-[width]"
                    style={{ width: `${progress?.percent ?? 0}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{detail}</p>
              </>
            )}
          </section>
        ) : (
          <section className="mt-10 w-full rounded-xl border border-border bg-card p-6">
            <div className="mx-auto max-w-2xl">
              <div className="text-center">
                <Folder className="mx-auto h-8 w-8 text-violet-300" />
                <h1 className="mt-3 text-xl font-semibold">Choose storage folders</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Choose where projects, checkpoints, and LoRAs are stored. You can
                  change these later in Settings.
                </p>
              </div>
              <div className="mt-6 space-y-4 rounded-lg border border-border bg-input p-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Projects</span>
                  <div className="flex gap-2">
                    <div className="min-w-0 flex-1 truncate rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground select-text">
                      {projectAssetsPath || "Loading default location…"}
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-lg border border-border-strong px-3 text-xs text-foreground hover:bg-surface-hover"
                      onClick={() => void chooseProjectAssetsPath()}
                    >
                      Browse
                    </button>
                  </div>
                </div>
                {[
                  { kind: "checkpoints" as const, label: "Checkpoints", location: checkpointsLocation },
                  { kind: "loras" as const, label: "LoRAs", location: lorasLocation },
                ].map(({ kind, label, location }) => (
                  <div key={kind} className="space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    <div className="flex gap-2">
                      <div
                        className="min-w-0 flex-1 truncate rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground select-text"
                        title={location?.path}
                      >
                        {location?.path ?? "Loading…"}
                      </div>
                      {location?.custom && (
                        <button
                          type="button"
                          className="shrink-0 rounded-lg px-3 text-xs text-muted-foreground hover:bg-surface-hover"
                          onClick={() => void useDefaultModelFolder(kind)}
                        >
                          Use default
                        </button>
                      )}
                      <button
                        type="button"
                        className="shrink-0 rounded-lg border border-border-strong px-3 text-xs text-foreground hover:bg-surface-hover"
                        onClick={() => void chooseModelFolder(kind)}
                      >
                        Browse
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
              <div className="text-center">
                <button
                  disabled={!projectAssetsPath || !checkpointsLocation || !lorasLocation}
                  className="mt-5 rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium hover:bg-violet-500 disabled:opacity-50"
                  onClick={() => void finishSetup()}
                >
                  Finish setup
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
