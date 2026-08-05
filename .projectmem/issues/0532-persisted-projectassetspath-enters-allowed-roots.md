# #0532 Persisted projectAssetsPath enters allowed roots without validation or recovery migration

- 2026-08-04T13:09:50Z `issue`: Persisted projectAssetsPath enters allowed roots without validation or recovery migration [electron/app-state.ts]
- 2026-08-04T13:10:25Z `attempt`: Added legacy custom-root quarantine, native re-selection, non-destructive recovery, and persisted-root regression requirements to audit PR00; production gap remains [docs/AiVS-Code-Health-Performance-Audit/00_PR_ELECTRON_PATH_BOUNDARY_HARDENING.md] (partial)
- 2026-08-04T13:36:57Z `attempt`: Implemented trusted project-root quarantine and native re-selection; TypeScript found no AIVS-017 diagnostics but remains blocked by 12 unrelated unused symbols. [electron/app-state.ts] (partial)
- 2026-08-04T14:56:11Z `fix`: Legacy persisted project roots without main-owned provenance are quarantined and require non-destructive native re-selection before trust. [electron/app-state.ts]
