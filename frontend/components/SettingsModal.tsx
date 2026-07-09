import { Folder, Info, Settings, X } from 'lucide-react'

import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { logger } from '../lib/logger'
import { useAppSettings } from '../contexts/AppSettingsContext'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: TabId
}

type TabId = 'general' | 'outputs' | 'about'

export function SettingsModal({ isOpen, onClose, initialTab }: SettingsModalProps) {
  const { settings, updateSettings } = useAppSettings()
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
    { id: 'outputs' as TabId, label: 'Outputs', icon: Folder },
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

              {/* Torch Compile */}
              <div className="space-y-3 pt-4 border-t border-zinc-800">
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
                      Uses WanGP's compile flag. Restart backend before generating if WanGP is already connected.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSettings({ useTorchCompile: !settings.useTorchCompile })}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${
                      settings.useTorchCompile ? 'bg-blue-600' : 'bg-zinc-700'
                    }`}
                    aria-pressed={settings.useTorchCompile}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        settings.useTorchCompile ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'outputs' && (
            <div className="space-y-5">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">Video Quality</h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="text-xs text-zinc-500">Container</span>
                    <select
                      value={settings.outputSettings.videoContainer}
                      onChange={(event) =>
                        updateSettings((prev) => ({
                          ...prev,
                          outputSettings: { ...prev.outputSettings, videoContainer: event.target.value as 'mp4' | 'mov' | 'mkv' },
                        }))
                      }
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                    >
                      <option value="mp4">MP4</option>
                      <option value="mov">MOV</option>
                      <option value="mkv">MKV</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-zinc-500">Codec</span>
                    <select
                      value={settings.outputSettings.videoCodec}
                      onChange={(event) =>
                        updateSettings((prev) => ({
                          ...prev,
                          outputSettings: { ...prev.outputSettings, videoCodec: event.target.value as typeof prev.outputSettings.videoCodec },
                        }))
                      }
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                    >
                      <option value="libx264_8">x264 Medium</option>
                      <option value="libx264_10">x264 High</option>
                      <option value="libx265_28">x265 Medium</option>
                      <option value="libx265_8">x265 Very High</option>
                      <option value="libx264_lossless">x264 Lossless</option>
                      <option value="prores_422" disabled={settings.outputSettings.videoContainer === 'mp4'}>
                        ProRes 422
                      </option>
                    </select>
                  </label>
                </div>
                <label className="space-y-1 block">
                  <span className="text-xs text-zinc-500">Audio Format</span>
                  <select
                    value={settings.outputSettings.audioCodec}
                    onChange={(event) =>
                      updateSettings((prev) => ({
                        ...prev,
                        outputSettings: { ...prev.outputSettings, audioCodec: event.target.value as typeof prev.outputSettings.audioCodec },
                      }))
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="aac_128">AAC 128 kbps</option>
                    <option value="aac_192">AAC 192 kbps</option>
                    <option value="aac_256">AAC 256 kbps</option>
                    <option value="aac_320">AAC 320 kbps</option>
                  </select>
                </label>
                <p className="text-xs text-zinc-500">
                  HDR output support depends on selected WanGP codec and model.
                </p>
              </div>

              <div className="space-y-3 border-t border-zinc-800 pt-4">
                <h3 className="text-sm font-semibold text-white">Image Quality</h3>
                <select
                  value={settings.outputSettings.imageCodec}
                  onChange={(event) =>
                    updateSettings((prev) => ({
                      ...prev,
                      outputSettings: { ...prev.outputSettings, imageCodec: event.target.value as typeof prev.outputSettings.imageCodec },
                    }))
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                >
                  <option value="jpeg">JPEG q95</option>
                  <option value="webp">WebP q95</option>
                  <option value="png">PNG lossless</option>
                  <option value="webp_lossless">WebP lossless</option>
                </select>
              </div>

              <div className="space-y-3 border-t border-zinc-800 pt-4">
                <h3 className="text-sm font-semibold text-white">Metadata Output</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'metadata', label: 'Embed metadata' },
                    { value: 'json', label: 'Export JSON files' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        updateSettings((prev) => ({
                          ...prev,
                          outputSettings: { ...prev.outputSettings, metadataMode: option.value as 'metadata' | 'json' },
                        }))
                      }
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        settings.outputSettings.metadataMode === option.value
                          ? 'border-blue-500 bg-blue-500/10 text-white'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={settings.outputSettings.keepIntermediateSlidingWindows}
                    onChange={(event) =>
                      updateSettings((prev) => ({
                        ...prev,
                        outputSettings: {
                          ...prev.outputSettings,
                          keepIntermediateSlidingWindows: event.target.checked,
                        },
                      }))
                    }
                    className="h-4 w-4 accent-blue-500"
                  />
                  Keep intermediate sliding windows
                </label>
              </div>
            </div>
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
