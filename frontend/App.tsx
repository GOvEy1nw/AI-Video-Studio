import { useEffect, useRef, useState } from 'react'
import { Loader2, AlertCircle, Settings, FileText, RefreshCw } from 'lucide-react'
import { ProjectProvider, useProjects } from './contexts/ProjectContext'
import { KeyboardShortcutsProvider } from './contexts/KeyboardShortcutsContext'
import { AppSettingsProvider } from './contexts/AppSettingsContext'
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal'
import { useBackend } from './hooks/use-backend'
import { logger } from './lib/logger'
import { Home } from './views/Home'
import { Project } from './views/Project'
import { Playground } from './views/Playground'
import { PythonSetup } from './components/PythonSetup'
import { SettingsModal, type SettingsTabId } from './components/SettingsModal'
import { LogViewer } from './components/LogViewer'
import { Button } from './components/ui/button'
import { ConnectionIndicator } from './components/ModelStatusDropdown'

function AppContent() {
  const { currentView } = useProjects()
  const { processStatus, checkHealth } = useBackend()

  const [pythonReady, setPythonReady] = useState<boolean | null>(null)
  const [backendStarted, setBackendStarted] = useState(false)
  const [firstRunResolved, setFirstRunResolved] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTabId | undefined>(undefined)
  const [isLogViewerOpen, setIsLogViewerOpen] = useState(false)
  const firstRunCompletionInFlightRef = useRef<Promise<void> | null>(null)

  const handleReconnect = async () => {
    setIsReconnecting(true)
    try {
      await window.electronAPI.restartPythonBackend()
      // Attempt health checks in a loop to establish connection quickly
      for (let i = 0; i < 15; i++) {
        const healthy = await checkHealth()
        if (healthy) break
        await new Promise(r => setTimeout(r, 1000))
      }
    } catch (e) {
      logger.error(`Failed to restart/reconnect backend: ${e}`)
    } finally {
      setIsReconnecting(false)
    }
  }

  const isBackendRestarting = processStatus === 'restarting'
  const isBackendDead = processStatus === 'dead'

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.tab) setSettingsInitialTab(detail.tab)
      setIsSettingsOpen(true)
    }
    window.addEventListener('open-settings', handler)
    return () => window.removeEventListener('open-settings', handler)
  }, [])

  useEffect(() => {
    const check = async () => {
      try {
        const result = await window.electronAPI.checkPythonReady()
        setPythonReady(result.ready)
      } catch (e) {
        logger.error(`Failed to check Python readiness: ${e}`)
        setPythonReady(true)
      }
    }
    void check()
  }, [])

  useEffect(() => {
    if (pythonReady !== true || backendStarted) return
    setBackendStarted(true)
    const start = async () => {
      try {
        logger.info('Starting Python backend...')
        await window.electronAPI.startPythonBackend()
        logger.info('Python backend started successfully')
      } catch (e) {
        logger.error(`Failed to start Python backend: ${e}`)
      }
    }
    void start()
  }, [pythonReady, backendStarted])

  // Auto-complete first-run setup — AiVS doesn't need the license / location / model download wizard.
  useEffect(() => {
    if (firstRunResolved) return

    const resolve = async () => {
      if (firstRunCompletionInFlightRef.current) {
        return firstRunCompletionInFlightRef.current
      }
      const inFlight = (async () => {
        try {
          const state = await window.electronAPI.checkFirstRun()
          if (state.needsLicense) {
            await window.electronAPI.acceptLicense()
          }
          if (state.needsSetup) {
            await window.electronAPI.completeSetup()
          }
        } catch (e) {
          logger.error(`First-run auto-resolve failed: ${e}`)
        }
      })()
      firstRunCompletionInFlightRef.current = inFlight
      await inFlight
      setFirstRunResolved(true)
    }

    void resolve()
  }, [firstRunResolved])

  const waitingForBackend =
    pythonReady === null ||
    !firstRunResolved

  const restartingOverlay = isBackendRestarting ? (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="rounded-lg border border-zinc-700 bg-zinc-900/95 px-6 py-4 text-center shadow-xl">
        <div className="flex items-center justify-center gap-2 text-zinc-100">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-medium">Reconnecting...</span>
        </div>
        <p className="mt-2 text-sm text-zinc-400">The backend process stopped unexpectedly. Attempting to restart...</p>
      </div>
    </div>
  ) : null

  if (pythonReady === null) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    )
  }

  if (pythonReady === false) {
    return <PythonSetup onReady={() => setPythonReady(true)} />
  }

  if (isBackendDead) {
    return (
      <div className="h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-5xl rounded-xl border border-zinc-700 bg-zinc-900/80 p-6 shadow-2xl">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">The backend process crashed and could not be restarted</h2>
            <p className="text-muted-foreground mb-4">Review the logs below and restart the application.</p>
          </div>
          <div className="h-[50vh]">
            <LogViewer isOpen={true} onClose={() => {}} embedded={true} />
          </div>
          <div className="mt-4 flex justify-center">
            <Button onClick={() => window.location.reload()}>Restart Application</Button>
          </div>
        </div>
      </div>
    )
  }

  if (waitingForBackend) {
    return (
      <div className="relative h-screen w-screen">
        <div className="h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Starting AiVS...</h2>
            <p className="text-muted-foreground">Initializing environment</p>
          </div>
        </div>
        {restartingOverlay}
      </div>
    )
  }

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home />
      case 'project':
        return <Project />
      case 'playground':
        return <Playground />
      default:
        return <Home />
    }
  }

  return (
    <div className="relative h-screen w-screen">
      {renderView()}

      <div className="fixed top-[18px] right-3 z-50 flex items-center gap-1.5">
        <ConnectionIndicator reconnecting={isReconnecting} />
        <button
          onClick={handleReconnect}
          disabled={isReconnecting}
          className="h-8 w-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:hover:bg-transparent transition-colors disabled:opacity-50"
          title="Restart WanGP Backend"
        >
          <RefreshCw className={`h-4 w-4 ${isReconnecting ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={() => setIsLogViewerOpen(true)}
          className="h-8 w-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="View Backend Logs"
        >
          <FileText className="h-4 w-4" />
        </button>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="h-8 w-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      <LogViewer isOpen={isLogViewerOpen} onClose={() => setIsLogViewerOpen(false)} />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false)
          setSettingsInitialTab(undefined)
        }}
        initialTab={settingsInitialTab}
      />

      {restartingOverlay}
    </div>
  )
}

export default function App() {
  return (
    <ProjectProvider>
      <KeyboardShortcutsProvider>
        <AppSettingsProvider>
          <AppContent />
          <KeyboardShortcutsModal />
        </AppSettingsProvider>
      </KeyboardShortcutsProvider>
    </ProjectProvider>
  )
}
