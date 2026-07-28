# #0139 Root-started Pyright scanned far beyond backend and unified exec cannot interrupt the long-running process.

- 2026-07-25T17:26:41Z `issue`: Root-started Pyright scanned far beyond backend and unified exec cannot interrupt the long-running process. [backend/pyrightconfig.json]
- 2026-07-25T17:26:50Z `attempt`: Tried to verify the exact Pyright process tree before stopping it; managed sandbox denied Win32 process command-line access. [backend/pyrightconfig.json] (failed)
- 2026-07-25T17:27:12Z `attempt`: Verified and stopped only the root-started uv/Pyright process tree; prepared to rerun from backend so pyrightconfig scope applies. [backend/pyrightconfig.json] (partial)
- 2026-07-25T17:27:27Z `attempt`: Reran Pyright from backend; it completed in 2.5 seconds under the intended config and reported one real schema typing error. [backend/pyrightconfig.json] (worked)
- 2026-07-25T17:27:31Z `fix`: Backend Pyright now runs from the backend directory with correct scope; the runaway validation tree was safely removed. [backend/pyrightconfig.json]
