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
import { backendFetch } from "../lib/backend";
import { logger } from "../lib/logger";
import { applyModelPackAvailability } from "../lib/model-profile-availability";
import type { ModelProfile, ModelProfileListResponse } from "../types/model-profiles";
import { useBackendLifecycle } from "./BackendLifecycleContext";

type CuratedMediaType = "image" | "video" | "audio" | "tts";

export interface ModelProfilesValue {
  all: readonly ModelProfile[];
  loading: boolean;
  stale: boolean;
  error: string | null;
  refresh: () => Promise<boolean>;
  refreshAfterModelPackMutation: () => Promise<boolean>;
}

interface ModelPackRefresh {
  generation: number;
  promise: Promise<boolean>;
}

const ModelProfilesContext = createContext<ModelProfilesValue | null>(null);

export function ModelProfilesProvider({ children }: { children: ReactNode }) {
  const { processStatus } = useBackendLifecycle();
  const [all, setAll] = useState<readonly ModelProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef<Promise<boolean> | null>(null);
  const modelPackRefreshRef = useRef<ModelPackRefresh | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const lifecycleRef = useRef(processStatus);
  const requestVersionRef = useRef(0);
  const lifecycleGenerationRef = useRef(0);
  const mountedRef = useRef(true);
  const hasProfilesRef = useRef(false);

  lifecycleRef.current = processStatus;

  const clearRetry = useCallback(() => {
    if (retryTimerRef.current !== null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const refresh = useCallback((): Promise<boolean> => {
    if (inFlightRef.current) {
      return inFlightRef.current;
    }
    if (lifecycleRef.current !== "alive") {
      return Promise.resolve(false);
    }

    clearRetry();
    setLoading(true);
    const requestVersion = requestVersionRef.current;
    const request = (async () => {
      try {
        const [response, modelPacks] = await Promise.all([
          backendFetch("/api/model-profiles"),
          typeof window.electronAPI.getModelPacks === "function"
            ? window.electronAPI.getModelPacks().catch(() => [])
            : Promise.resolve([]),
        ]);
        if (!response.ok) {
          throw new Error(`Failed to load model profiles: ${response.status}`);
        }

        const data: ModelProfileListResponse = await response.json();
        if (
          !data ||
          !Array.isArray(data.profiles) ||
          !mountedRef.current ||
          lifecycleRef.current !== "alive" ||
          requestVersion !== requestVersionRef.current
        ) {
          return false;
        }

        setAll(Object.freeze([...applyModelPackAvailability(data.profiles, modelPacks)]));
        hasProfilesRef.current = true;
        setStale(false);
        setError(null);
        return true;
      } catch (reason) {
        const message = reason instanceof Error ? reason.message : "Unknown error";
        if (mountedRef.current && lifecycleRef.current === "alive") {
          setStale(true);
          setError(message);
          logger.error(`ModelProfilesProvider: ${message}`);
        }
        return false;
      } finally {
        if (mountedRef.current && requestVersion === requestVersionRef.current) {
          setLoading(false);
        }
      }
    })();

    inFlightRef.current = request;
    void request.finally(() => {
      if (inFlightRef.current === request) {
        inFlightRef.current = null;
      }
    });
    return request;
  }, [clearRetry]);

  const refreshAfterModelPackMutation = useCallback((): Promise<boolean> => {
    const generation = lifecycleGenerationRef.current;
    if (modelPackRefreshRef.current?.generation === generation) {
      return modelPackRefreshRef.current.promise;
    }

    const currentRefresh = inFlightRef.current;
    if (!currentRefresh) {
      return refresh();
    }

    const trailingRefresh = currentRefresh.then(() => {
      if (
        lifecycleGenerationRef.current !== generation ||
        lifecycleRef.current !== "alive"
      ) {
        return false;
      }
      return refresh();
    });
    modelPackRefreshRef.current = { generation, promise: trailingRefresh };
    void trailingRefresh.finally(() => {
      if (modelPackRefreshRef.current?.promise === trailingRefresh) {
        modelPackRefreshRef.current = null;
      }
    });
    return trailingRefresh;
  }, [refresh]);

  useEffect(() => {
    if (processStatus !== "alive") {
      requestVersionRef.current += 1;
      lifecycleGenerationRef.current += 1;
      inFlightRef.current = null;
      modelPackRefreshRef.current = null;
      clearRetry();
      setLoading(false);
      if (hasProfilesRef.current) {
        setStale(true);
      }
      return;
    }

    let cancelled = false;
    const load = async () => {
      const loaded = await refresh();
      if (!loaded && !cancelled && lifecycleRef.current === "alive") {
        retryTimerRef.current = window.setTimeout(() => {
          retryTimerRef.current = null;
          void load();
        }, 1500);
      }
    };

    void load();
    return () => {
      cancelled = true;
      clearRetry();
    };
  }, [clearRetry, processStatus, refresh]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearRetry();
      requestVersionRef.current += 1;
      lifecycleGenerationRef.current += 1;
      inFlightRef.current = null;
      modelPackRefreshRef.current = null;
    };
  }, [clearRetry]);

  const value = useMemo<ModelProfilesValue>(
    () => ({ all, loading, stale, error, refresh, refreshAfterModelPackMutation }),
    [all, error, loading, refresh, refreshAfterModelPackMutation, stale],
  );

  return <ModelProfilesContext.Provider value={value}>{children}</ModelProfilesContext.Provider>;
}

export function useModelProfiles(): ModelProfilesValue {
  const context = useContext(ModelProfilesContext);
  if (!context) {
    throw new Error("useModelProfiles must be used within ModelProfilesProvider");
  }
  return context;
}

export function useProfilesByMediaType(mediaType: CuratedMediaType) {
  const { all, loading, error, refresh } = useModelProfiles();
  const profiles = useMemo(
    () => all.filter((profile) => profile.mediaType === mediaType),
    [all, mediaType],
  );
  return useMemo(
    () => ({ profiles, loading, error, refresh }),
    [error, loading, profiles, refresh],
  );
}
