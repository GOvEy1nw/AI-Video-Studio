# #0624 AIVS-023 async directory search changed duplicate-name resolution from depth-first to breadth-first

- 2026-08-05T16:22:54Z `issue`: AIVS-023 async directory search changed duplicate-name resolution from depth-first to breadth-first [electron/ipc/file-handlers.ts]
- 2026-08-05T16:25:41Z `attempt`: Moved async directory search into production helper retaining recursive immediate descent and added duplicate-name parity test. [electron/lib/directory-search.ts] (worked)
- 2026-08-05T16:25:47Z `fix`: Async directory search now preserves prior DFS duplicate resolution, depth cap, skips, and early-stop behavior. [electron/lib/directory-search.ts]
