import { cn } from '@/lib/utils'
import { Video, ImageIcon, Scissors } from 'lucide-react'

export type GenerationMode = 'text-to-video' | 'image-to-video' | 'text-to-image' | 'retake'

// Simplified tab modes shown in the UI
type TabMode = 'video' | 'text-to-image' | 'retake'

interface ModeTabsProps {
  mode: GenerationMode
  onModeChange: (mode: GenerationMode) => void
  disabled?: boolean
}

const tabs: { id: TabMode; label: string; genMode: GenerationMode; icon: React.ElementType }[] = [
  { id: 'video', label: 'Video', genMode: 'text-to-video', icon: Video },
  { id: 'text-to-image', label: 'Image', genMode: 'text-to-image', icon: ImageIcon },
  { id: 'retake', label: 'Retake', genMode: 'retake', icon: Scissors },
]

export function ModeTabs({ mode, onModeChange, disabled }: ModeTabsProps) {
  const activeTab: TabMode = mode === 'text-to-image' ? 'text-to-image' : mode === 'retake' ? 'retake' : 'video'

  return (
    <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => !disabled && onModeChange(tab.genMode)}
            disabled={disabled}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              isActive
                ? 'bg-foreground text-background shadow-xs'
                : 'text-muted hover:bg-surface-hover hover:text-foreground',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
