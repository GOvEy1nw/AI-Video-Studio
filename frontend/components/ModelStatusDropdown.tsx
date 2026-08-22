import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useBackend } from "../hooks/use-backend";
import { logger } from "../lib/logger";

export type ConnectionState = "connecting" | "ready" | "disconnected";

interface ConnectionIndicatorProps {
  className?: string;
}

export function ConnectionIndicator({
  className = "",
}: ConnectionIndicatorProps) {
  const { status, processStatus, restart } = useBackend();
  const [connectionTimedOut, setConnectionTimedOut] = useState(false);

  const bridgeReady = status.connected && processStatus === "alive";
  const wangpReady = bridgeReady && status.modelsLoaded;
  const readyCount = (bridgeReady ? 1 : 0) + (wangpReady ? 1 : 0);
  const isReady = readyCount === 2;
  const isRestarting = processStatus === "restarting";

  // Timer for 60 seconds limit on backend connection. WanGP preload can take longer.
  useEffect(() => {
    if (bridgeReady || isRestarting) {
      setConnectionTimedOut(false);
      return;
    }

    const timer = setTimeout(() => setConnectionTimedOut(true), 60000);

    return () => clearTimeout(timer);
  }, [bridgeReady, isRestarting]);

  const connectionState: ConnectionState = isReady
    ? "ready"
    : processStatus === "dead" || (connectionTimedOut && !bridgeReady)
      ? "disconnected"
      : "connecting";

  const label =
    connectionState === "ready"
      ? "Inference Engine Ready"
      : connectionState === "connecting"
        ? `Launching Inference Engine ${readyCount}/2`
        : "Inference Engine Disconnected";

  const handleReconnect = async () => {
    try {
      await restart();
    } catch (error) {
      logger.error(`Failed to restart/reconnect backend: ${error}`);
    }
  };

  return (
    <button
      type="button"
      title={label}
      aria-label={`${label}. Restart Inference Engine`}
      aria-busy={isRestarting}
      disabled={isRestarting}
      onClick={() => void handleReconnect()}
      className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait ${
        connectionState === "ready"
          ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
          : connectionState === "connecting"
            ? "bg-amber-400 text-amber-950 hover:bg-amber-300"
            : "bg-red-500 text-white hover:bg-red-400"
      } ${className}`}
    >
      <RefreshCw className={`h-4 w-4 ${isRestarting ? "animate-spin" : ""}`} />
    </button>
  );
}
