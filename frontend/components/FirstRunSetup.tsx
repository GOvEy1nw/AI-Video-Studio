import { useEffect, useState } from 'react'
import { logger } from '../lib/logger'
import './FirstRunSetup.css'

interface LaunchGateProps {
  licenseOnly?: boolean
  showLicenseStep?: boolean
  onComplete: () => Promise<void>
  onAcceptLicense?: () => Promise<void>
}

type Step = 'license' | 'models' | 'complete'

export function LaunchGate({
  licenseOnly,
  showLicenseStep = true,
  onComplete,
  onAcceptLicense,
}: LaunchGateProps) {
  const [currentStep, setCurrentStep] = useState<Step>(showLicenseStep ? 'license' : 'models')
  const [licenseAccepted, setLicenseAccepted] = useState(false)
  const [licenseText, setLicenseText] = useState<string | null>(null)
  const [licenseError, setLicenseError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isActionPending, setIsActionPending] = useState(false)

  useEffect(() => {
    if (!showLicenseStep) return
    void window.electronAPI.fetchLicenseText()
      .then(setLicenseText)
      .catch((error: unknown) => {
        logger.error(`Failed to fetch license text: ${error}`)
        setLicenseError(error instanceof Error ? error.message : 'Failed to fetch license text.')
      })
  }, [showLicenseStep])

  const handleFinish = async () => {
    setActionError(null)
    setIsActionPending(true)
    try {
      await onComplete()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to complete setup.')
    } finally {
      setIsActionPending(false)
    }
  }

  const handleNext = async () => {
    if (currentStep === 'license') {
      if (!licenseAccepted) return
      setActionError(null)
      setIsActionPending(true)
      try {
        await onAcceptLicense?.()
        if (licenseOnly) {
          await onComplete()
          return
        }
        setCurrentStep('models')
      } catch (error) {
        setActionError(error instanceof Error ? error.message : 'Failed to accept license.')
      } finally {
        setIsActionPending(false)
      }
      return
    }
    if (currentStep === 'models') {
      setCurrentStep('complete')
      return
    }
    await handleFinish()
  }

  const title = currentStep === 'license'
    ? 'WanGP model license'
    : currentStep === 'models'
      ? 'Models on demand'
      : 'Ready to create'
  const buttonLabel = currentStep === 'license'
    ? (licenseOnly ? 'Accept' : 'Next')
    : currentStep === 'models'
      ? 'Continue'
      : 'Finish'

  return (
    <div className="h-screen flex flex-col bg-black text-white" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <header className="border-b border-zinc-900 px-8 py-5">
        <div className="text-sm font-semibold tracking-wide">AI Video Studio</div>
      </header>
      <main className="flex flex-1 items-center justify-center overflow-auto p-8">
        <section className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-950 p-8">
          <h1 className="mb-3 text-2xl font-bold">{title}</h1>
          {currentStep === 'license' && (
            <>
              <p className="mb-4 text-sm text-zinc-400">Accept the WanGP model license before continuing.</p>
              {licenseError && <p className="mb-4 text-sm text-red-400">{licenseError}</p>}
              <pre className="mb-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-900 p-4 text-xs text-zinc-300">
                {licenseText ?? 'Loading license…'}
              </pre>
              <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-200">
                <input
                  type="checkbox"
                  checked={licenseAccepted}
                  onChange={(event) => setLicenseAccepted(event.target.checked)}
                />
                I accept the license terms.
              </label>
            </>
          )}
          {currentStep === 'models' && (
            <p className="text-sm leading-6 text-zinc-400">
              Bundled WanGP manages compatible model files and downloads required files automatically when you generate for the first time.
            </p>
          )}
          {currentStep === 'complete' && (
            <p className="text-sm leading-6 text-zinc-400">WanGP is ready. Start generating.</p>
          )}
          {actionError && <p className="mt-4 text-sm text-red-400">{actionError}</p>}
        </section>
      </main>
      <footer className="flex justify-end border-t border-zinc-900 px-8 py-5">
        <button
          type="button"
          onClick={() => void handleNext()}
          disabled={isActionPending || (currentStep === 'license' && !licenseAccepted)}
          className="rounded-full bg-violet-700 px-6 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {buttonLabel}
        </button>
      </footer>
    </div>
  )
}
