# #0037 The ignored local Wan2GP directory disappeared during the unpacked build after it had been removed from Git tracking.

- 2026-08-12T10:04:03Z `issue`: The ignored local Wan2GP directory disappeared during the unpacked build after it had been removed from Git tracking. [Wan2GP/]
- 2026-08-12T10:04:36Z `attempt`: Traced build scripts and found no command deleting Wan2GP; verified the external dev checkout remains clean on dev with all durable source and three output files preserved. [Wan2GP/] (worked)
- 2026-08-12T10:04:37Z `fix`: Confirmed no user data loss: the removed repo-local copy was redundant and the external Wan2GP dev checkout retains source and outputs. [..\Wan2GP]
