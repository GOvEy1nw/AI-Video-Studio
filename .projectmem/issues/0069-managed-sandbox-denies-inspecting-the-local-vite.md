# #0069 Managed sandbox denies inspecting the local Vite port owner, preventing shutdown before full Electron QA.

- 2026-07-22T17:18:11Z `issue`: Managed sandbox denies inspecting the local Vite port owner, preventing shutdown before full Electron QA. [localhost:5173]
- 2026-07-22T17:18:15Z `attempt`: Tried to identify and stop only the verified workspace Vite listener; Get-NetTCPConnection was access denied. [localhost:5173] (failed)
- 2026-07-22T17:18:34Z `attempt`: Verified port 5173 belonged to this workspace's Vite process and stopped only that process with approved inspection access. [localhost:5173] (worked)
- 2026-07-22T17:18:42Z `fix`: Freed localhost:5173 after verifying and stopping the workspace-only Vite process. [localhost:5173]
