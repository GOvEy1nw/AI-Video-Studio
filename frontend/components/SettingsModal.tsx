import { Folder, Info, Settings, X } from 'lucide-react'

import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { logger } from '../lib/logger'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: TabId
}

type TabId = 'general' | 'about'

export function SettingsModal({ isOpen, onClose, initialTab }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('general')
  const [appVersion, setAppVersion] = useState('')
  const [noticesText, setNoticesText] = useState<string | null>(null)
  const [noticesLoading, setNoticesLoading] = useState(false)
  const [showNotices, setShowNotices] = useState(false)
  const [modelLicenseText, setModelLicenseText] = useState<string | null>(null)
  const [modelLicenseLoading, setModelLicenseLoading] = useState(false)
  const [showModelLicense, setShowModelLicense] = useState(false)
  const [projectAssetsPath, setProjectAssetsPath] = useState('')

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])

  useEffect(() => {
    if (activeTab !== 'about' || appVersion) return
    window.electronAPI.getAppInfo().then(info => setAppVersion(info.version)).catch(() => {})
  }, [activeTab, appVersion])

  useEffect(() => {
    if (!isOpen) return
    window.electronAPI.getProjectAssetsPath()
      .then((p: string) => setProjectAssetsPath(p))
      .catch(() => {})
  }, [isOpen])

  const handleLoadModelLicense = async () => {
    setModelLicenseLoading(true)
    try {
      const text = await window.electronAPI.fetchLicenseText()
      setModelLicenseText(text)
      setShowModelLicense(true)
    } catch (e) {
      logger.error(`Failed to load model license: ${e}`)
    } finally {
      setModelLicenseLoading(false)
    }
  }

  const handleLoadNotices = async () => {
    setNoticesLoading(true)
    try {
      const text = await window.electronAPI.getNoticesText()
      setNoticesText(text)
      setShowNotices(true)
    } catch (e) {
      logger.error(`Failed to load notices: ${e}`)
    } finally {
      setNoticesLoading(false)
    }
  }

  const tabs = [
    { id: 'general' as TabId, label: 'General', icon: Settings },
    { id: 'about' as TabId, label: 'About', icon: Info },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-zinc-400" />
            <h2 className="text-lg font-semibold text-white">Settings</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-blue-500 -mb-px'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6 h-[60vh] overflow-y-auto">
          {activeTab === 'general' && (
            <>
              {/* Project Assets Path */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-white">Project Assets Path</h3>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Where generated video and image assets are saved. Each project gets a subfolder.
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm truncate select-text">
                    {projectAssetsPath || <span className="text-zinc-600">Not set</span>}
                  </div>
                  <Button
                    variant="outline"
                    className="border-zinc-700 flex-shrink-0"
                    onClick={async () => {
                      const dir = await window.electronAPI.showOpenDirectoryDialog({ title: 'Select Project Assets Path' })
                      if (dir) {
                        setProjectAssetsPath(dir)
                        window.electronAPI.setProjectAssetsPath(dir)
                      }
                    }}
                  >
                    <Folder className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Preload on startup — greyed out (WanGP-managed) */}
              <div className="space-y-3 pt-4 border-t border-zinc-800 opacity-50 pointer-events-none">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                      </svg>
                      <label className="text-sm font-medium text-white">
                        Preload models on startup
                      </label>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Managed by WanGP. Models are loaded on first generation.
                    </p>
                  </div>
                  <button disabled className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent bg-zinc-700">
                    <span className="inline-block h-5 w-5 rounded-full bg-white shadow translate-x-0" />
                  </button>
                </div>
              </div>

              {/* Torch Compile — greyed out (WanGP-managed) */}
              <div className="space-y-3 pt-4 border-t border-zinc-800 opacity-50 pointer-events-none">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="h-4 w-4 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                      <label className="text-sm font-medium text-white">
                        Torch Compile
                      </label>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Managed by WanGP. Compilation settings are handled automatically.
                    </p>
                  </div>
                  <button disabled className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent bg-zinc-700">
                    <span className="inline-block h-5 w-5 rounded-full bg-white shadow translate-x-0" />
                  </button>
                </div>
              </div>

              {/* Seed Lock — greyed out (WanGP-managed) */}
              <div className="space-y-3 pt-4 border-t border-zinc-800 opacity-50 pointer-events-none">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <label className="text-sm font-medium text-white">
                        Lock Seed
                      </label>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Managed by WanGP. Seed control will be available in QuickGen.
                    </p>
                  </div>
                  <button disabled className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent bg-zinc-700">
                    <span className="inline-block h-5 w-5 rounded-full bg-white shadow translate-x-0" />
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'about' && (
            <>
              {showModelLicense ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Model License</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowModelLicense(false)}
                      className="h-7 px-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
                      Back
                    </Button>
                  </div>
                  <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono bg-zinc-800/50 rounded-lg p-4 max-h-[50vh] overflow-y-auto border border-zinc-700/50">
                    {modelLicenseText}
                  </pre>
                </div>
              ) : showNotices ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Third-Party Notices</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNotices(false)}
                      className="h-7 px-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
                      Back
                    </Button>
                  </div>
                  <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono bg-zinc-800/50 rounded-lg p-4 max-h-[50vh] overflow-y-auto border border-zinc-700/50">
                    {noticesText}
                  </pre>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* App Identity */}
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-bold text-white">AiVS</h3>
                    <p className="text-sm text-zinc-400">Version {appVersion || '...'}</p>
                    <p className="text-xs text-zinc-500">AI Video Studio — Local-First Creative Studio</p>
                  </div>

                  {/* License */}
                  <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-medium text-white">License</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Licensed under the Apache License, Version 2.0
                    </p>
                  </div>

                  {/* Model License */}
                  <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      </svg>
                      <span className="text-sm font-medium text-white">Model Licenses</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      AI models are subject to their respective license agreements.
                    </p>
                    <Button
                      size="sm"
                      onClick={handleLoadModelLicense}
                      disabled={modelLicenseLoading}
                      className="w-full bg-zinc-700 hover:bg-zinc-600 text-white text-xs"
                    >
                      {modelLicenseLoading ? 'Loading...' : 'View Model License'}
                    </Button>
                  </div>

                  {/* Third-Party Notices */}
                  <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                      <span className="text-sm font-medium text-white">Third-Party Notices</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      This application uses open-source software and AI models subject to their own license terms.
                    </p>
                    <Button
                      size="sm"
                      onClick={handleLoadNotices}
                      disabled={noticesLoading}
                      className="w-full bg-zinc-700 hover:bg-zinc-600 text-white text-xs"
                    >
                      {noticesLoading ? 'Loading...' : 'View Third-Party Notices'}
                    </Button>
                  </div>

                  {/* Built on WanGP */}
                  <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                      <span className="text-sm font-medium text-white">Powered by WanGP</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      All generation runs locally through WanGP. No cloud API required.
                    </p>
                  </div>

                  {/* Copyright */}
                  <p className="text-center text-xs text-zinc-600">
                    Built on the LTX-Desktop-WanGP open-source project
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-zinc-700 hover:bg-zinc-600 text-white"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}

export type { TabId as SettingsTabId }