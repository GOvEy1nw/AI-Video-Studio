# #0611 AIVS-022 Strict Mode effect replay batch-validates loaded project paths twice

- 2026-08-05T15:19:07Z `issue`: AIVS-022 Strict Mode effect replay batch-validates loaded project paths twice [frontend/contexts/ProjectContext.tsx]
- 2026-08-05T15:22:28Z `attempt`: Guarded startup load with effect generation, preserved pre-ready local mutations/deletes, and added deferred-load plus Strict Mode regressions. [frontend/contexts/ProjectContext.tsx] (worked)
- 2026-08-05T15:22:34Z `fix`: Only active ProjectProvider load generation can approve paths, publish state, or set storage ready; Strict Mode regression passes. [frontend/contexts/ProjectContext.tsx]
