import React from 'react'
import { Magnet, Type } from 'lucide-react'
import { PRIMARY_TOOLS, TRIM_TOOLS, ToolType } from './video-editor-utils'
import { getShortcutLabel, type KeyboardLayout } from './video-editor-utils'
import { Tooltip } from '@/components/ui/tooltip'
import { FloatingMenu } from '../../components/FloatingMenu'

interface ToolsPanelProps {
  activeTool: ToolType
  setActiveTool: (t: ToolType) => void
  lastTrimTool: ToolType
  setLastTrimTool: (t: ToolType) => void
  showTrimFlyout: boolean
  setShowTrimFlyout: (v: boolean) => void
  trimFlyoutOpenedRef: React.MutableRefObject<boolean>
  trimLongPressRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  snapEnabled: boolean
  setSnapEnabled: (v: boolean) => void
  showEffectsBrowser: boolean
  setShowEffectsBrowser: (v: boolean) => void
  addTextClip: () => void
  kbLayout: KeyboardLayout
}

export function ToolsPanel({
  activeTool, setActiveTool,
  lastTrimTool, setLastTrimTool,
  showTrimFlyout, setShowTrimFlyout,
  trimFlyoutOpenedRef, trimLongPressRef,
  snapEnabled, setSnapEnabled,
  showEffectsBrowser: _showEffectsBrowser, setShowEffectsBrowser: _setShowEffectsBrowser, // EFFECTS HIDDEN
  addTextClip, kbLayout,
}: ToolsPanelProps) {
  const trimTriggerRef = React.useRef<HTMLButtonElement>(null)
  return (
    <div className="w-10 shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-1 gap-0.5 overflow-y-auto">
      {PRIMARY_TOOLS.map(tool => (
        <Tooltip
          key={tool.id}
          side="right"
          content={(() => { const s = getShortcutLabel(kbLayout, tool.actionId); return <>{tool.label}{s && <span className="text-zinc-400"> ({s})</span>}</>; })()}
        >
          <button
            onClick={() => setActiveTool(tool.id)}
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${
              activeTool === tool.id
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <tool.icon className="h-4 w-4" />
          </button>
        </Tooltip>
      ))}

      {/* Trim tools group button */}
      {(() => {
        const trimToolIds = new Set(TRIM_TOOLS.map(t => t.id))
        const isTrimActive = trimToolIds.has(activeTool)
        const currentTrimTool = TRIM_TOOLS.find(t => t.id === (isTrimActive ? activeTool : lastTrimTool)) || TRIM_TOOLS[0]
        return (
          <div className="relative shrink-0">
            <Tooltip
              side="right"
              content={(() => { const s = getShortcutLabel(kbLayout, currentTrimTool.actionId); return <>{currentTrimTool.label}<span className="text-zinc-400">{s ? ` (${s}) — ` : ' — '}right-click or hold for more</span></>; })()}
            >
              <button
                ref={trimTriggerRef}
                onClick={() => {
                  if (trimFlyoutOpenedRef.current) { trimFlyoutOpenedRef.current = false; return }
                  setActiveTool(currentTrimTool.id)
                  setLastTrimTool(currentTrimTool.id)
                }}
                onContextMenu={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (trimLongPressRef.current) { clearTimeout(trimLongPressRef.current); trimLongPressRef.current = null }
                  trimFlyoutOpenedRef.current = true
                  setShowTrimFlyout(true)
                }}
                onMouseDown={(e) => {
                  if (e.button !== 0) return
                  trimFlyoutOpenedRef.current = false
                  trimLongPressRef.current = setTimeout(() => {
                    trimLongPressRef.current = null
                    trimFlyoutOpenedRef.current = true
                    setShowTrimFlyout(true)
                  }, 400)
                }}
                onMouseUp={() => {
                  if (trimLongPressRef.current) { clearTimeout(trimLongPressRef.current); trimLongPressRef.current = null }
                }}
                onMouseLeave={() => {
                  if (trimLongPressRef.current) { clearTimeout(trimLongPressRef.current); trimLongPressRef.current = null }
                }}
                data-trim-group-btn=""
                className={`p-1.5 rounded-lg transition-colors relative ${
                  isTrimActive
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <currentTrimTool.icon className="h-4 w-4" />
                <div className="absolute bottom-0 right-0 w-0 h-0 border-l-4 border-l-transparent border-b-4 border-b-current opacity-60" />
              </button>
            </Tooltip>
            {showTrimFlyout && (
                <>
                  <div className="fixed inset-0 z-9998" onMouseDown={() => setShowTrimFlyout(false)} onContextMenu={(e) => { e.preventDefault(); setShowTrimFlyout(false) }} />
                  <FloatingMenu
                    anchorRef={trimTriggerRef}
                    placement="right-start"
                    gap={4}
                    role="menu"
                    className="min-w-[160px] overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-xl"
                  >
                    {TRIM_TOOLS.map(t => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setActiveTool(t.id)
                          setLastTrimTool(t.id)
                          setShowTrimFlyout(false)
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                          activeTool === t.id ? 'bg-blue-600/30 text-white' : 'text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        <t.icon className="h-3.5 w-3.5" />
                        <span className="flex-1">{t.label}</span>
                        <span className="text-zinc-500 text-[10px]">{getShortcutLabel(kbLayout, t.actionId)}</span>
                      </button>
                    ))}
                  </FloatingMenu>
                </>
            )}
          </div>
        )
      })()}

      <div className="w-6 h-px bg-zinc-700 my-1 shrink-0" />

      <Tooltip side="right" content={snapEnabled ? 'Snapping On' : 'Snapping Off'}>
        <button
          onClick={() => setSnapEnabled(!snapEnabled)}
          className={`p-1.5 rounded-lg transition-colors shrink-0 ${
            snapEnabled
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <Magnet className="h-4 w-4" />
        </button>
      </Tooltip>

      {/* EFFECTS HIDDEN - FX button hidden because effects are not applied during export
      <div className="w-6 h-px bg-zinc-700 my-1 shrink-0" />

      <Tooltip side="right" content="Effects Browser">
        <button
          onClick={() => setShowEffectsBrowser(!showEffectsBrowser)}
          className={`p-1.5 rounded-lg transition-colors shrink-0 text-[10px] font-bold ${
            showEffectsBrowser
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          FX
        </button>
      </Tooltip>
      EFFECTS HIDDEN */}

      <div className="w-6 h-px bg-zinc-700 my-1 shrink-0" />

      <Tooltip side="right" content="Add Text Overlay">
        <button
          onClick={() => addTextClip()}
          className="p-1.5 rounded-lg transition-colors shrink-0 text-cyan-400 hover:bg-cyan-900/30 hover:text-cyan-300"
        >
          <Type className="h-4 w-4" />
        </button>
      </Tooltip>
    </div>
  )
}
