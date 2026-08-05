# #0538 Lexical path containment permits symlink or junction escapes from approved/project directories

- 2026-08-04T13:48:47Z `issue`: Lexical path containment permits symlink or junction escapes from approved/project directories [electron/path-validation.ts; electron/lib/project-asset-import.ts]
- 2026-08-04T13:57:54Z `attempt`: Added realpath-based containment resolution and junction/symlink regressions for allowed reads and project asset destinations. [electron/path-validation.ts] (worked)
- 2026-08-04T14:00:10Z `attempt`: Hardened containment helper to detect broken symlink entries with lstat and reject unresolved realpaths before missing suffixes are appended; focused symlink tests pass. [electron/path-validation.ts] (worked)
- 2026-08-04T14:56:23Z `fix`: Containment validation canonicalizes real paths and nearest existing ancestors, rejecting symlink/junction escapes for existing and future targets. [electron/path-validation.ts]
