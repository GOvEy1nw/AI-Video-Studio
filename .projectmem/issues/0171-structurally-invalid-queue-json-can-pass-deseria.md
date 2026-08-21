# #0171 Structurally invalid queue JSON can pass deserialization and later crash the worker; dataclass TypeError also escapes corruption quarantine.

- 2026-08-20T22:44:41Z `issue`: Structurally invalid queue JSON can pass deserialization and later crash the worker; dataclass TypeError also escapes corruption quarantine. [backend/services/generation_queue_store.py]
- 2026-08-20T22:50:26Z `attempt`: Added structural validation and corrupt-file quarantine for invalid queue JSON; focused queue suite passed. [backend/services/generation_queue_store.py] (worked)
- 2026-08-20T22:50:30Z `fix`: Confirmed invalid queue documents are rejected and quarantined while valid persisted state remains typed; backend queue tests pass. [backend/services/generation_queue_store.py]
