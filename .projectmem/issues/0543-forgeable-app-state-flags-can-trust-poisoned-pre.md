# #0543 Forgeable app-state flags can trust poisoned pre-hardening roots and exact-file approvals

- 2026-08-04T14:33:50Z `issue`: Forgeable app-state flags can trust poisoned pre-hardening roots and exact-file approvals [electron/app-state.ts]
- 2026-08-04T14:35:43Z `attempt`: Added random main-created path-trust nonce stored outside legacy renderer-writable userData; root and exact-file approvals now require matching scoped tokens, with poisoned-state regression. [electron/app-state.ts] (partial)
- 2026-08-04T14:37:09Z `attempt`: Poisoned legacy root and exact-file tokens are quarantined unless they match main-created appData provenance; focused tests and frontend build pass. [electron/app-state.ts] (worked)
- 2026-08-04T14:56:44Z `fix`: Persisted exact-file, project-root, and model-folder trust requires matching main-created provenance stored outside legacy renderer-writable state. [electron/app-state.ts]
