# #0200 Sidebar restart state can reset across Home and Quick Gen remounts, allowing overlapping backend restarts.

- 2026-08-21T15:32:54Z `issue`: Sidebar restart state can reset across Home and Quick Gen remounts, allowing overlapping backend restarts. [frontend/components/ModelStatusDropdown.tsx]
- 2026-08-21T15:34:24Z `attempt`: Coalesced restartPythonBackend calls behind one promise and published the existing restarting lifecycle status before shutdown. [electron/python-backend.ts] (partial)
- 2026-08-21T15:34:42Z `attempt`: Made renderer restart state shared in BackendLifecycleContext and coalesced callers, but the cleanup used a detached finally chain that could reject unhandled. [frontend/contexts/BackendLifecycleContext.tsx] (partial)
- 2026-08-21T15:34:54Z `attempt`: Replaced detached finally cleanup with a handled two-branch promise cleanup while preserving shared coalescing. [frontend/contexts/BackendLifecycleContext.tsx] (partial)
- 2026-08-21T15:35:32Z `attempt`: Connection button now consumes shared processStatus restarting state instead of remount-local busy state. [frontend/components/ModelStatusDropdown.tsx] (partial)
- 2026-08-21T15:37:51Z `attempt`: Focused busy-state test passed; shared renderer coalescing, main-process serialization, type relationships, and production bundles all validated. [frontend/contexts/BackendLifecycleContext.tsx] (worked)
- 2026-08-21T15:38:00Z `fix`: Restart state is shared in the lifecycle provider and restart calls are coalesced in both renderer and Electron main. [electron/python-backend.ts]
