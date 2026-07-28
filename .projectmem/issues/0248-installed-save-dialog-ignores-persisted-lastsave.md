# #0248 Installed save dialog ignores persisted lastSaveDirectory when caller defaultPath is filename-only; opens in prior directory-picker location.

- 2026-07-27T09:22:36Z `issue`: Installed save dialog ignores persisted lastSaveDirectory when caller defaultPath is filename-only; opens in prior directory-picker location. [electron/ipc/file-handlers.ts]
- 2026-07-27T09:26:35Z `attempt`: Added pure save-default resolver so filename-only defaults join valid remembered/fallback directory; wired IPC handler and regression tests. Awaiting automated/native confirmation. [electron/dialog-paths.ts] (partial)
- 2026-07-27T09:28:46Z `attempt`: Focused Vitest passed: filename-only save defaults join remembered/fallback directories; directory-bearing defaults remain unchanged (5/5 tests). [electron/dialog-paths.test.ts] (worked)
- 2026-07-27T09:36:56Z `fix`: Filename-only save defaults now resolve under valid persisted lastSaveDirectory; regression tests pass and installed Video Editor dialog opened at C:\tmp\AiVS-phase2-save with expected filename. [electron/ipc/file-handlers.ts]
