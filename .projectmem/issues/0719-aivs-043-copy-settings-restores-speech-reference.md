# #0719 AIVS-043 Copy Settings restores Speech reference paths with no file URLs, leaving hidden disabled voice slots that cannot be cleared or reused.

- 2026-08-09T11:21:37Z `issue`: AIVS-043 Copy Settings restores Speech reference paths with no file URLs, leaving hidden disabled voice slots that cannot be cleared or reused. [frontend/views/genspace/logic/settings-restore.ts]
- 2026-08-09T11:22:36Z `attempt`: Restored each persisted Speech reference path to a usable file URL and extended the recipe restore assertion; rerunning focused frontend checks. [frontend/views/genspace/logic/settings-restore.ts] (partial)
- 2026-08-09T11:23:01Z `attempt`: Focused recipe restore test and strict TypeScript pass with Speech reference file URLs restored. [frontend/views/genspace/logic/settings-restore.ts] (worked)
- 2026-08-09T11:23:10Z `fix`: Copy Settings now restores usable file URLs for persisted Speech references; focused restore test and TypeScript pass. [frontend/views/genspace/logic/settings-restore.ts]
