import { useEffect, useRef, useState } from "react";
import { AlertCircle, Folder, Loader2 } from "lucide-react";
import { AivsLogo } from "./AivsLogo";
import { ModelPackManager } from "./ModelPackManager";

interface PythonSetupProps {
  onReady: () => void;
}

interface SetupProgress {
  status: "downloading" | "extracting" | "installing" | "complete" | "error";
  percent: number;
  message?: string;
  detail?: string;
}

export function PythonSetup({ onReady }: PythonSetupProps) {
  const [progress, setProgress] = useState<SetupProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runtimeReady, setRuntimeReady] = useState(false);
  const [projectAssetsPath, setProjectAssetsPath] = useState("");
  const [setupStage, setSetupStage] = useState<"packs" | "projects">("packs");
  const started = useRef(false);

  useEffect(() => {
    window.electronAPI.onPythonSetupProgress((data: unknown) => setProgress(data as SetupProgress));
    return () => window.electronAPI.removePythonSetupProgress();
  }, []);

  const startSetup = async () => {
    setError(null);
    try {
      await window.electronAPI.startPythonSetup();
      setRuntimeReady(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "First-time setup failed.");
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void startSetup();
  }, []);

  const label = progress?.message ?? "Preparing AiVS";
  const detail = progress?.detail ?? "AiVS downloads its Python and GPU runtime automatically. This only happens once.";
  const loadProjectAssetsPath = async () => setProjectAssetsPath(await window.electronAPI.getProjectAssetsPath());
  const chooseProjectAssetsPath = async () => {
    const selected = await window.electronAPI.showOpenDirectoryDialog({ title: "Choose AiVS projects folder" });
    if (selected) setProjectAssetsPath(selected);
  };
  const finishSetup = async () => {
    if (projectAssetsPath) await window.electronAPI.setProjectAssetsPath(projectAssetsPath);
    onReady();
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-12">
        <AivsLogo className="h-16 w-auto text-white" />
        {!runtimeReady ? (
          <section className="mt-12 w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-950 p-6">
            {error ? (
              <div className="text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
                <p className="mt-3 text-sm text-red-300">{error}</p>
                <button className="mt-4 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium hover:bg-violet-500" onClick={() => void startSetup()}>Retry</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 font-medium"><Loader2 className="h-4 w-4 animate-spin text-violet-300" />{label}</span>
                  <span className="text-violet-300">{progress?.percent ?? 0}%</span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-blue-500 transition-[width]" style={{ width: `${progress?.percent ?? 0}%` }} /></div>
                <p className="mt-3 text-xs text-zinc-400">{detail}</p>
              </>
            )}
          </section>
        ) : (
          <section className="mt-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-6">
            {setupStage === "packs" ? <>
            <h1 className="text-center text-xl font-semibold">Choose optional model packs</h1>
            <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-zinc-400">Pre-download anything you want ready now. Skip this step and AiVS will download a model pack automatically when you use its feature.</p>
            <div className="mt-6"><ModelPackManager firstRun onContinue={() => { void loadProjectAssetsPath(); setSetupStage("projects"); }} /></div>
            </> : <div className="mx-auto max-w-xl text-center">
              <Folder className="mx-auto h-8 w-8 text-violet-300" />
              <h1 className="mt-3 text-xl font-semibold">Choose project storage</h1>
              <p className="mt-2 text-sm text-zinc-400">Projects, imports and generated media are saved here. You can change this later in Settings.</p>
              <div className="mt-6 flex gap-2 text-left">
                <div className="min-w-0 flex-1 truncate rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200">{projectAssetsPath || "Loading default location…"}</div>
                <button className="rounded-lg border border-zinc-600 px-3 text-sm text-zinc-200 hover:bg-zinc-800" onClick={() => void chooseProjectAssetsPath()}>Browse</button>
              </div>
              <button disabled={!projectAssetsPath} className="mt-5 rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium hover:bg-violet-500 disabled:opacity-50" onClick={() => void finishSetup()}>Finish setup</button>
            </div>}
          </section>
        )}
      </div>
    </main>
  );
}
