# #0622 AIVS-023 responsiveness benchmark cannot import Vite from Windows absolute ESM path without file URL

- 2026-08-05T16:21:29Z `issue`: AIVS-023 responsiveness benchmark cannot import Vite from Windows absolute ESM path without file URL [C:\tmp\aivs-023-responsive-benchmark.mjs]
- 2026-08-05T16:21:44Z `attempt`: Changed benchmark Vite import to Windows file URL; 256 MiB async copy/read completed with heartbeat preserved [C:\tmp\aivs-023-responsive-benchmark.mjs] (worked)
- 2026-08-05T16:21:47Z `fix`: Responsiveness benchmark now runs on Windows and confirms async 256 MiB copy/read preserve event-loop heartbeats [C:\tmp\aivs-023-responsive-benchmark.mjs]
