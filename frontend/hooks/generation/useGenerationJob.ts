import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { backendFetch } from "../../lib/backend";
import type { GenerationProgressResponse } from "../../types/progress";
import { normaliseProgressResponse } from "./progress";
import {
  emptyGenerationState,
  type GenerationState,
  type ProgressFormatter,
} from "./types";

export interface JobCompletion<T> {
  value: T;
  patch: Partial<GenerationState>;
}

export interface RunGenerationJobOptions<T> {
  endpoint: string;
  body: unknown;
  initialStatus: string;
  parseResponse: (response: Response) => Promise<JobCompletion<T>>;
  formatProgress?: ProgressFormatter;
  markGenerating?: boolean;
  preserveResults?: boolean;
  failureMessage?: string;
}

export function useGenerationJob() {
  const [state, setState] = useState<GenerationState>(emptyGenerationState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRunRef = useRef(0);
  const mountedRef = useRef(true);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      activeRunRef.current += 1;
      stopPolling();
      abortControllerRef.current?.abort();
    };
  }, [stopPolling]);

  const runJob = useCallback(
    async <T,>({
      endpoint,
      body,
      initialStatus,
      parseResponse,
      formatProgress,
      markGenerating = true,
      preserveResults = false,
      failureMessage = "Generation failed",
    }: RunGenerationJobOptions<T>): Promise<T | null> => {
      stopPolling();
      abortControllerRef.current?.abort();
      const runId = activeRunRef.current + 1;
      activeRunRef.current = runId;
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const startedAt = Date.now();
      let pollingActive = true;
      setState((current) => ({
        ...(preserveResults ? current : emptyGenerationState()),
        isGenerating: markGenerating,
        isCancelling: false,
        statusMessage: initialStatus,
        error: null,
      }));

      const poll = async () => {
        if (
          !pollingActive ||
          !mountedRef.current ||
          activeRunRef.current !== runId
        ) {
          return;
        }
        try {
          const response = await backendFetch("/api/generation/progress");
          if (
            !pollingActive ||
            !response.ok ||
            activeRunRef.current !== runId
          ) {
            return;
          }
          const progress: GenerationProgressResponse = await response.json();
          const patch = formatProgress
            ? formatProgress(progress, Date.now() - startedAt)
            : normaliseProgressResponse(progress);
          if (
            !pollingActive ||
            !mountedRef.current ||
            activeRunRef.current !== runId
          ) {
            return;
          }
          setState((current) => ({
            ...current,
            ...patch,
            previewUrl: patch.previewUrl ?? current.previewUrl,
          }));
        } catch {
          // Progress is best-effort while the synchronous request is active.
        }
      };
      intervalRef.current = setInterval(() => void poll(), 500);

      try {
        const response = await backendFetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        pollingActive = false;
        stopPolling();
        if (!response.ok) {
          const text = await response.text().catch(() => "");
          let message = text || failureMessage;
          try {
            const payload: unknown = JSON.parse(text);
            if (payload && typeof payload === "object" && "error" in payload) {
              message = String(payload.error);
            }
          } catch {
            // Plain-text backend errors are already user-readable.
          }
          throw new Error(message);
        }
        const completion = await parseResponse(response);
        if (!mountedRef.current || activeRunRef.current !== runId) return null;
        setState((current) => ({
          ...current,
          ...completion.patch,
          isGenerating: false,
          isCancelling: false,
        }));
        return completion.value;
      } catch (error) {
        if (!mountedRef.current || activeRunRef.current !== runId) return null;
        const cancelled = error instanceof Error && error.name === "AbortError";
        setState((current) => ({
          ...current,
          isGenerating: false,
          isCancelling: false,
          statusMessage: cancelled ? "Cancelled" : current.statusMessage,
          error: cancelled
            ? null
            : error instanceof Error
              ? error.message
              : "Unknown error",
        }));
        return null;
      } finally {
        pollingActive = false;
        if (activeRunRef.current === runId) {
          stopPolling();
          abortControllerRef.current = null;
        }
      }
    },
    [stopPolling],
  );

  const cancel = useCallback(async () => {
    setState((current) => ({
      ...current,
      isCancelling: true,
      statusMessage: "Cancelling...",
    }));
    try {
      await backendFetch("/api/generate/cancel", { method: "POST" });
    } catch {
      setState((current) => ({
        ...current,
        isCancelling: false,
        error: "Failed to cancel generation",
      }));
    }
  }, []);

  const reset = useCallback(() => {
    activeRunRef.current += 1;
    stopPolling();
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setState(emptyGenerationState());
  }, [stopPolling]);

  return { state, runJob, cancel, reset };
}
