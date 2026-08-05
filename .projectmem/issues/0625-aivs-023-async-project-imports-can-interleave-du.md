# #0625 AIVS-023 async project imports can interleave duplicate planning and overwrite same destination

- 2026-08-05T16:22:57Z `issue`: AIVS-023 async project imports can interleave duplicate planning and overwrite same destination [electron/lib/project-asset-import.ts]
- 2026-08-05T16:25:49Z `attempt`: Serialized import plan and transfer operations by canonical destination directory and added concurrent suffix regression. [electron/lib/project-asset-import.ts] (worked)
- 2026-08-05T16:25:52Z `fix`: Concurrent same-basename suffix imports serialize to distinct files while preserving source bytes. [electron/lib/project-asset-import.ts]
