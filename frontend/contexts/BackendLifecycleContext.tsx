import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { backendFetch, resetBackendCredentials } from "../lib/backend";
import { logger } from "../lib/logger";

export interface BackendStatus {
  connected: boolean;
  modelsLoaded: boolean;
  gpuInfo: {
    name: string;
    vram: number;
    vramUsed: number;
  } | null;
}

export type BackendProcessStatus = "alive" | "restarting" | "dead";

interface BackendHealthStatusPayload {
  status: BackendProcessStatus;
  exitCode?: number | null;
}

export interface BackendLifecycleValue {
  status: BackendStatus;
  processStatus: BackendProcessStatus | null;
  isLoading: boolean;
  error: string | null;
  checkHealth: () => Promise<boolean>;
  restart: () => Promise<void>;
}

interface HealthRequest {
  generation: number;
  promise: Promise<boolean>;
}

const initialStatus: BackendStatus = {
  connected: false,
  modelsLoaded: false,
  gpuInfo: null,
};

const BackendLifecycleContext = createContext<BackendLifecycleValue | null>(null);

function toBackendHealthStatus(value: unknown): BackendHealthStatusPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as { status?: unknown; exitCode?: unknown };
  if (record.status !== "alive" && record.status !== "restarting" && record.status !== "dead") {
    return null;
  }

  return {
    status: record.status,
    exitCode: typeof record.exitCode === "number" || record.exitCode === null ? record.exitCode : undefined,
  };
}

export function BackendLifecycleProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<BackendStatus>(initialStatus);
  const [processStatus, setProcessStatus] = useState<BackendProcessStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const healthRequestRef = useRef<HealthRequest | null>(null);
  const lifecycleGenerationRef = useRef(0);
  const restartRequestRef = useRef<Promise<void> | null>(null);

  const checkHealth = useCallback((): Promise<boolean> => {
    const generation = lifecycleGenerationRef.current;
    if (healthRequestRef.current?.generation === generation) {
      return healthRequestRef.current.promise;
    }

    const request = (async () => {
      try {
        logger.info("Checking backend health...");
        const response = await backendFetch("/health");

        if (response.ok) {
          const data = await response.json();
          if (generation !== lifecycleGenerationRef.current) {
            return false;
          }
          logger.info(`Backend health: ${JSON.stringify(data)}`);
          setStatus({
            connected: true,
            modelsLoaded: data.models_loaded,
            gpuInfo: data.gpu_info,
          });
          setError(null);
          return true;
        }

        if (generation !== lifecycleGenerationRef.current) {
          return false;
        }
        logger.warn(`Backend health check failed with status: ${response.status}`);
        return false;
      } catch (err) {
        if (generation !== lifecycleGenerationRef.current) {
          return false;
        }
        logger.error(`Backend health check error: ${err}`);
        setStatus((previous) => ({ ...previous, connected: false }));
        return false;
      }
    })();

    healthRequestRef.current = { generation, promise: request };
    void request.finally(() => {
      if (healthRequestRef.current?.promise === request) {
        healthRequestRef.current = null;
      }
    });
    return request;
  }, []);

  const restart = useCallback(() => {
    if (restartRequestRef.current) {
      return restartRequestRef.current;
    }

    lifecycleGenerationRef.current += 1;
    healthRequestRef.current = null;
    setProcessStatus("restarting");
    const request = window.electronAPI.restartPythonBackend();
    restartRequestRef.current = request;
    const clearRequest = () => {
      if (restartRequestRef.current === request) {
        restartRequestRef.current = null;
      }
    };
    void request.then(clearRequest, clearRequest);
    return request;
  }, []);

  const handleBackendStatus = useCallback(
    async (payload: BackendHealthStatusPayload) => {
      setProcessStatus(payload.status);

      if (payload.status === "alive") {
        const generation = lifecycleGenerationRef.current;
        resetBackendCredentials();
        const healthy = await checkHealth();
        if (generation !== lifecycleGenerationRef.current) {
          return;
        }
        if (!healthy) {
          setError("Failed to connect to backend");
        }
        setIsLoading(false);
        return;
      }

      if (payload.status === "restarting") {
        lifecycleGenerationRef.current += 1;
        healthRequestRef.current = null;
        return;
      }

      lifecycleGenerationRef.current += 1;
      healthRequestRef.current = null;
      setStatus((previous) => ({ ...previous, connected: false }));
      setError("The backend process crashed and could not be restarted");
      setIsLoading(false);
    },
    [checkHealth],
  );

  useEffect(() => {
    let cancelled = false;

    const applyStatus = async (value: unknown) => {
      const payload = toBackendHealthStatus(value);
      if (!payload || cancelled) {
        return;
      }
      await handleBackendStatus(payload);
    };

    const unsubscribe = window.electronAPI.onBackendHealthStatus((data) => {
      void applyStatus(data);
    });

    void window.electronAPI.getBackendHealthStatus()
      .then(applyStatus)
      .catch((reason: unknown) => {
        logger.error(`Failed to load backend health status snapshot: ${reason}`);
      });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [handleBackendStatus]);

  useEffect(() => {
    if (!status.connected || status.modelsLoaded || processStatus !== "alive") {
      return;
    }

    const interval = window.setInterval(() => {
      void checkHealth();
    }, 1500);
    return () => window.clearInterval(interval);
  }, [checkHealth, processStatus, status.connected, status.modelsLoaded]);

  const value = useMemo<BackendLifecycleValue>(
    () => ({ status, processStatus, isLoading, error, checkHealth, restart }),
    [checkHealth, error, isLoading, processStatus, restart, status],
  );

  return <BackendLifecycleContext.Provider value={value}>{children}</BackendLifecycleContext.Provider>;
}

export function useBackendLifecycle(): BackendLifecycleValue {
  const context = useContext(BackendLifecycleContext);
  if (!context) {
    throw new Error("useBackendLifecycle must be used within BackendLifecycleProvider");
  }
  return context;
}
