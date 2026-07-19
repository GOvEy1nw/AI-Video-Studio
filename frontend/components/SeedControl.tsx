import { useEffect, useRef, useState } from 'react'
import { Dices, Lock } from 'lucide-react'
import {
  clampGenSpaceSeed,
  DEFAULT_GENSPACE_LOCKED_SEED,
  MAX_GENSPACE_SEED,
} from '../types/project'

interface SeedControlProps {
  seedLocked: boolean
  lockedSeed: number
  onChange: (seed: { seedLocked: boolean; lockedSeed: number }) => void
  disabled?: boolean
}

export function SeedSettings({
  seedLocked,
  lockedSeed,
  onChange,
  disabled = false,
}: SeedControlProps) {
  const handleSeedInput = (raw: string) => {
    const parsed = raw === '' ? DEFAULT_GENSPACE_LOCKED_SEED : Number(raw)
    onChange({ seedLocked, lockedSeed: clampGenSpaceSeed(parsed) })
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-zinc-300">Lock seed</span>
        <button
          type="button"
          role="switch"
          aria-checked={seedLocked}
          disabled={disabled}
          onClick={() => onChange({ seedLocked: !seedLocked, lockedSeed })}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
            seedLocked ? 'bg-blue-500' : 'bg-zinc-600'
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              seedLocked ? 'left-[18px]' : 'left-0.5'
            }`}
          />
        </button>
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-zinc-300">Seed value</span>
        <input
          type="number"
          min={0}
          max={MAX_GENSPACE_SEED}
          step={1}
          value={lockedSeed}
          disabled={disabled}
          onChange={(event) => handleSeedInput(event.target.value)}
          className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-2.5 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none disabled:opacity-40"
        />
      </label>

      <p className="text-[10px] leading-relaxed text-zinc-500">
        {seedLocked
          ? 'Generations in this project use the locked seed.'
          : 'Each generation uses a random seed.'}
      </p>
    </div>
  )
}

export function SeedControl({
  seedLocked,
  lockedSeed,
  onChange,
  disabled = false,
}: SeedControlProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium transition-colors disabled:opacity-40 ${
          seedLocked
            ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
        } disabled:hover:bg-transparent disabled:hover:text-zinc-400`}
        aria-expanded={open}
        aria-haspopup="true"
        title={seedLocked ? `Locked seed: ${lockedSeed}` : 'Random seed'}
      >
        {seedLocked ? (
          <Lock className="h-3.5 w-3.5" />
        ) : (
          <Dices className="h-3.5 w-3.5" />
        )}
        Seed
      </button>

      {open && (
        <div className="absolute bottom-full right-0 z-50 mb-2 min-w-[220px] rounded-md border border-zinc-700 bg-zinc-800 p-3 shadow-xl">
          <SeedSettings
            seedLocked={seedLocked}
            lockedSeed={lockedSeed}
            onChange={onChange}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  )
}
