# #0664 AIVS-027 effect-operation deletion patch did not match multiline helper formatting.

- 2026-08-05T18:38:18Z `issue`: AIVS-027 effect-operation deletion patch did not match multiline helper formatting. [frontend/views/editor/useClipOperations.ts]
- 2026-08-05T18:38:41Z `attempt`: Re-read multiline effect helpers and removed dormant effect editing operations with current source context. [frontend/views/editor/useClipOperations.ts] (worked)
- 2026-08-05T18:38:41Z `fix`: Dormant effect-operation helpers removed without touching persisted effect fields. [frontend/views/editor/useClipOperations.ts]
