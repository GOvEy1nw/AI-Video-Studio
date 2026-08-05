import { useBackendLifecycle } from "../contexts/BackendLifecycleContext";

export type { BackendProcessStatus, BackendStatus } from "../contexts/BackendLifecycleContext";

export function useBackend() {
  return useBackendLifecycle();
}
