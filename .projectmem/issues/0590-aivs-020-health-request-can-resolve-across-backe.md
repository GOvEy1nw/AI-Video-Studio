# #0590 AIVS-020 health request can resolve across backend lifecycle generations and publish stale readiness.

- 2026-08-05T12:53:31Z `issue`: AIVS-020 health request can resolve across backend lifecycle generations and publish stale readiness. [frontend/contexts/BackendLifecycleContext.tsx]
- 2026-08-05T12:59:09Z `attempt`: Bound health requests to lifecycle generations and invalidated old in-flight readiness updates on transitions. [frontend/contexts/BackendLifecycleContext.tsx] (worked)
- 2026-08-05T13:08:36Z `fix`: Backend health requests are lifecycle-generation gated; stale readiness cannot publish after restart and regression passes. [frontend/contexts/BackendLifecycleContext.tsx]
