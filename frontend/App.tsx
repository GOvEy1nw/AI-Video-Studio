import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import {
  ProjectProvider,
  useProjectMeta,
  useProjectNavigation,
} from "./contexts/ProjectContext";
import { KeyboardShortcutsProvider } from "./contexts/KeyboardShortcutsContext";
import { AppSettingsProvider } from "./contexts/AppSettingsContext";
import { BackendLifecycleProvider } from "./contexts/BackendLifecycleContext";
import { ModelProfilesProvider } from "./contexts/ModelProfilesContext";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";
import { useBackend } from "./hooks/use-backend";
import { logger } from "./lib/logger";
import { Home } from "./views/Home";
import { Project } from "./views/Project";
import { ReferenceLibraryView } from "./views/reference-library/ReferenceLibraryView";
import { ReferenceLibraryProvider } from "./contexts/ReferenceLibraryContext";
import { SettingsModal, type SettingsTabId } from "./components/SettingsModal";
import { Button } from "./components/ui/button";
import { GenerationQueueProvider } from "./contexts/GenerationQueueContext";
import { AppTitleBar } from "./components/AppTitleBar";
import { LogViewer } from "./components/LogViewer";

const loadPythonSetup = () => import("./components/PythonSetup");

const LazyPythonSetup = lazy(async () => {
  const { PythonSetup } = await loadPythonSetup();
  return { default: PythonSetup };
});

function LoadingPanel() {
  return (
    <div className="flex h-full items-center justify-center bg-background">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
    </div>
  );
}

function AppContent() {
  const { currentView } = useProjectNavigation();
  const { currentProjectMeta } = useProjectMeta();
  const { processStatus } = useBackend();

  const [pythonReady, setPythonReady] = useState<boolean | null>(null);
  const [backendStarted, setBackendStarted] = useState(false);
  const [firstRunResolved, setFirstRunResolved] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<
    SettingsTabId | undefined
  >(undefined);
  const firstRunCompletionInFlightRef = useRef<Promise<void> | null>(null);

  const isBackendRestarting = processStatus === "restarting";
  const isBackendDead = processStatus === "dead";

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.tab) setSettingsInitialTab(detail.tab);
      setIsSettingsOpen(true);
    };
    window.addEventListener("open-settings", handler);
    return () => window.removeEventListener("open-settings", handler);
  }, []);

  useEffect(() => {
    const check = async () => {
      try {
        const result = await window.electronAPI.checkPythonReady();
        setPythonReady(result.ready);
      } catch (e) {
        logger.error(`Failed to check Python readiness: ${e}`);
        setPythonReady(true);
      }
    };
    void check();
  }, []);

  useEffect(() => {
    if (pythonReady !== true || backendStarted) return;
    setBackendStarted(true);
    const start = async () => {
      try {
        logger.info("Starting Python backend...");
        await window.electronAPI.startPythonBackend();
        logger.info("Python backend started successfully");
      } catch (e) {
        logger.error(`Failed to start Python backend: ${e}`);
      }
    };
    void start();
  }, [pythonReady, backendStarted]);

  // Auto-complete first-run setup — AiVS doesn't need the license / location / model download wizard.
  useEffect(() => {
    if (firstRunResolved) return;

    const resolve = async () => {
      if (firstRunCompletionInFlightRef.current) {
        return firstRunCompletionInFlightRef.current;
      }
      const inFlight = (async () => {
        try {
          const state = await window.electronAPI.checkFirstRun();
          if (state.needsLicense) {
            await window.electronAPI.acceptLicense();
          }
          if (state.needsSetup) {
            await window.electronAPI.completeSetup();
          }
        } catch (e) {
          logger.error(`First-run auto-resolve failed: ${e}`);
        }
      })();
      firstRunCompletionInFlightRef.current = inFlight;
      await inFlight;
      setFirstRunResolved(true);
    };

    void resolve();
  }, [firstRunResolved]);

  const waitingForBackend = pythonReady === null || !firstRunResolved;

  const restartingOverlay = isBackendRestarting ? (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-overlay/60 backdrop-blur-xs">
      <div className="rounded-lg border border-border bg-card/95 px-6 py-4 text-center shadow-xl">
        <div className="flex items-center justify-center gap-2 text-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-medium">Reconnecting...</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          The backend process stopped unexpectedly. Attempting to restart...
        </p>
      </div>
    </div>
  ) : null;

  if (pythonReady === null) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (pythonReady === false) {
    return (
      <Suspense fallback={<LoadingPanel />}>
        <LazyPythonSetup onReady={() => setPythonReady(true)} />
      </Suspense>
    );
  }

  if (isBackendDead) {
    return (
      <div className="h-full bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-5xl rounded-xl border border-border bg-card/80 p-6 shadow-2xl">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              The backend process crashed and could not be restarted
            </h2>
            <p className="text-muted-foreground mb-4">
              Review the logs below and restart the application.
            </p>
          </div>
          <div className="h-[50vh]">
            <LogViewer isOpen={true} onClose={() => {}} embedded />
          </div>
          <div className="mt-4 flex justify-center">
            <Button onClick={() => window.location.reload()}>
              Restart Application
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (waitingForBackend) {
    return (
      <div className="relative h-full w-full">
        <div className="h-full bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Starting AiVS...
            </h2>
            <p className="text-muted-foreground">Initializing environment</p>
          </div>
        </div>
        {restartingOverlay}
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case "home":
        return <Home />;
      case "project":
        return <Project />;
      case "references":
        return currentProjectMeta ? <Project /> : <ReferenceLibraryView />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="relative h-full w-full">
      {renderView()}

      {isSettingsOpen ? (
        <SettingsModal
          isOpen={true}
          onClose={() => {
            setIsSettingsOpen(false);
            setSettingsInitialTab(undefined);
          }}
          initialTab={settingsInitialTab}
        />
      ) : null}

      {restartingOverlay}
    </div>
  );
}

export default function App() {
  return (
    <BackendLifecycleProvider>
      <AppSettingsProvider>
        <ModelProfilesProvider>
          <ProjectProvider>
            <ReferenceLibraryProvider>
            <div className="h-screen overflow-hidden">
              <AppTitleBar />
              <GenerationQueueProvider>
                <KeyboardShortcutsProvider>
                  <AppContent />
                  <KeyboardShortcutsModal />
                </KeyboardShortcutsProvider>
              </GenerationQueueProvider>
            </div>
            </ReferenceLibraryProvider>
          </ProjectProvider>
        </ModelProfilesProvider>
      </AppSettingsProvider>
    </BackendLifecycleProvider>
  );
}
