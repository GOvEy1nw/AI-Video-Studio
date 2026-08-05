# #0620 AIVS-023 EXDEV fallback test cannot spy on fs/promises ESM namespace export in Vitest.

- 2026-08-05T16:15:32Z `issue`: AIVS-023 EXDEV fallback test cannot spy on fs/promises ESM namespace export in Vitest. [electron/lib/project-asset-import.test.ts]
- 2026-08-05T16:16:09Z `attempt`: Tested EXDEV fallback through transferFile's injected fs/promises operations after ESM namespace spy failed. [electron/lib/project-asset-import.test.ts] (worked)
- 2026-08-05T16:16:11Z `fix`: EXDEV fallback coverage uses injectable production transfer operations, avoiding unsupported ESM namespace spying. [electron/lib/project-asset-import.test.ts]
