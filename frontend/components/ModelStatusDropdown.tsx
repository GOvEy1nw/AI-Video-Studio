import { useState, useEffect } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { useBackend } from '../hooks/use-backend'

export type ConnectionState = 'connecting' | 'ready' | 'disconnected'

interface ConnectionIndicatorProps {
  className?: string
  reconnecting?: boolean
}

export function ConnectionIndicator({ className = '', reconnecting = false }: ConnectionIndicatorProps) {
  const { status, processStatus } = useBackend()
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting')

  const bridgeReady = status.connected && processStatus === 'alive'
  const wangpReady = bridgeReady && status.modelsLoaded && !reconnecting
  const readyCount = (bridgeReady ? 1 : 0) + (wangpReady ? 1 : 0)
  const isReady = readyCount === 2

  // Watch ready state
  useEffect(() => {
    if (isReady) {
      setConnectionState('ready')
    } else if (processStatus === 'dead' && !reconnecting) {
      setConnectionState('disconnected')
    } else {
      setConnectionState('connecting')
    }
  }, [isReady, processStatus, reconnecting])

  // Timer for 60 seconds limit on backend connection. WanGP preload can take longer.
  useEffect(() => {
    if (connectionState !== 'connecting' || bridgeReady) return

    const timer = setTimeout(() => {
      if (!bridgeReady) {
        setConnectionState('disconnected')
      }
    }, 60000)

    return () => clearTimeout(timer)
  }, [bridgeReady, connectionState])

  const label =
    connectionState === 'ready'
      ? 'Ready'
      : connectionState === 'connecting'
        ? `Connecting ${readyCount}/2`
        : 'Disconnected'

  const title =
    connectionState === 'ready'
      ? 'Bridge connected. WanGP runtime ready.'
      : connectionState === 'disconnected'
        ? 'Bridge disconnected. WanGP unavailable.'
      : `Bridge ${bridgeReady ? 'connected' : 'connecting'}; WanGP ${wangpReady ? 'ready' : 'preloading'}`

  return (
    <div
      title={title}
      aria-label={title}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg select-none text-xs font-medium
        ${connectionState === 'ready' ? 'bg-green-500/10 text-green-400' :
          connectionState === 'connecting' ? 'bg-amber-500/10 text-amber-400' :
          'bg-red-500/10 text-red-400'}
        ${className}
      `}
    >
      {connectionState === 'connecting' && (
        <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />
      )}
      {connectionState === 'ready' && (
        <div className="w-2 h-2 bg-green-500 rounded-full" />
      )}
      {connectionState === 'disconnected' && (
        <AlertCircle className="h-3.5 w-3.5 text-red-400" />
      )}

      <span>{label}</span>
    </div>
  )
}
