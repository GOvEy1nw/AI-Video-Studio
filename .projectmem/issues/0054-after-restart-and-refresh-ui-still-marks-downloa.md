# #0054 After restart and refresh, UI still marks downloaded ACE-Step packs unready while standalone scanner reports installed.

- 2026-07-21T13:33:16Z `issue`: After restart and refresh, UI still marks downloaded ACE-Step packs unready while standalone scanner reports installed. [electron/python-setup.ts; frontend/components/ModelPackManager.tsx]
- 2026-07-21T13:35:11Z `attempt`: Routed dev model-pack refresh/download/delete through backend .venv instead of stale python-embed; packaged builds still use bundled runtime. [electron/python-setup.ts] (partial)
- 2026-07-21T13:36:42Z `attempt`: TypeScript passed; corrected .venv scanner rebuilt live AiVS state and native Electron QA showed ACE-Step Fast and XL as Ready. [electron/python-setup.ts] (worked)
- 2026-07-21T13:36:47Z `fix`: Dev model-pack operations now use backend .venv rather than stale python-embed; live model state recognizes both ACE-Step packs. [electron/python-setup.ts]
