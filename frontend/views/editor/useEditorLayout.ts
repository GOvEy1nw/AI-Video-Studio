import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clampVal,
  DEFAULT_LAYOUT,
  LAYOUT_LIMITS,
  loadLayout,
  loadLayoutPresets,
  saveLayout,
  saveLayoutPresets,
  type EditorLayout,
  type LayoutPreset,
} from './video-editor-utils'

export type EditorResizeTarget = 'left' | 'right' | 'timeline' | 'assets'

export function useEditorLayout() {
  const [layout, setLayout] = useState<EditorLayout>(loadLayout)
  const [showLayoutMenu, setShowLayoutMenu] = useState(false)
  const [layoutPresets, setLayoutPresets] = useState<LayoutPreset[]>(loadLayoutPresets)
  const [savingPresetName, setSavingPresetName] = useState<string | null>(null)
  const presetNameInputRef = useRef<HTMLInputElement>(null)
  const layoutMenuRef = useRef<HTMLDivElement>(null)
  const layoutMenuSurfaceRef = useRef<HTMLDivElement>(null)
  const resizeDragRef = useRef<{ type: EditorResizeTarget; startPos: number; startSize: number } | null>(null)

  const handleResizeDragStart = useCallback((type: EditorResizeTarget, event: React.MouseEvent) => {
    event.preventDefault()
    const isVertical = type === 'timeline' || type === 'assets'
    const startPos = isVertical ? event.clientY : event.clientX
    const startSize = type === 'left'
      ? layout.leftPanelWidth
      : type === 'right'
        ? layout.rightPanelWidth
        : type === 'assets'
          ? layout.assetsHeight
          : layout.timelineHeight
    resizeDragRef.current = { type, startPos, startSize }

    const handleMove = (moveEvent: MouseEvent) => {
      const drag = resizeDragRef.current
      if (!drag) return
      const isVerticalDrag = drag.type === 'timeline' || drag.type === 'assets'
      const delta = (isVerticalDrag ? moveEvent.clientY : moveEvent.clientX) - drag.startPos
      if (drag.type === 'left') setLayout((previous) => ({ ...previous, leftPanelWidth: clampVal(drag.startSize + delta, LAYOUT_LIMITS.leftPanelWidth) }))
      else if (drag.type === 'right') setLayout((previous) => ({ ...previous, rightPanelWidth: clampVal(drag.startSize - delta, LAYOUT_LIMITS.rightPanelWidth) }))
      else if (drag.type === 'assets') setLayout((previous) => ({ ...previous, assetsHeight: clampVal(drag.startSize + delta, LAYOUT_LIMITS.assetsHeight) }))
      else setLayout((previous) => ({ ...previous, timelineHeight: clampVal(drag.startSize - delta, LAYOUT_LIMITS.timelineHeight) }))
    }
    const handleUp = () => {
      resizeDragRef.current = null
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setLayout((previous) => {
        saveLayout(previous)
        return previous
      })
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    document.body.style.cursor = isVertical ? 'row-resize' : 'col-resize'
    document.body.style.userSelect = 'none'
  }, [layout])

  const handleResetLayout = useCallback(() => {
    const next = { ...DEFAULT_LAYOUT }
    setLayout(next)
    saveLayout(next)
  }, [])
  const handleSaveLayoutPreset = useCallback((name: string) => {
    const preset = { id: `preset-${Date.now()}`, name: name.trim() || 'Untitled', layout: { ...layout } }
    const updated = [...layoutPresets, preset]
    setLayoutPresets(updated)
    saveLayoutPresets(updated)
  }, [layout, layoutPresets])
  const handleDeleteLayoutPreset = useCallback((id: string) => {
    const updated = layoutPresets.filter((preset) => preset.id !== id)
    setLayoutPresets(updated)
    saveLayoutPresets(updated)
  }, [layoutPresets])
  const handleApplyLayoutPreset = useCallback((preset: LayoutPreset) => {
    const next = { ...DEFAULT_LAYOUT, ...preset.layout }
    setLayout(next)
    saveLayout(next)
  }, [])

  useEffect(() => {
    if (!showLayoutMenu) {
      setSavingPresetName(null)
      return
    }
    const handleClick = (event: MouseEvent) => {
      if (layoutMenuRef.current && !layoutMenuRef.current.contains(event.target as Node) && !layoutMenuSurfaceRef.current?.contains(event.target as Node)) setShowLayoutMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showLayoutMenu])

  return {
    layout,
    showLayoutMenu,
    setShowLayoutMenu,
    layoutPresets,
    savingPresetName,
    setSavingPresetName,
    presetNameInputRef,
    layoutMenuRef,
    layoutMenuSurfaceRef,
    handleResizeDragStart,
    handleResetLayout,
    handleSaveLayoutPreset,
    handleDeleteLayoutPreset,
    handleApplyLayoutPreset,
  }
}
