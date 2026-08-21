# #0161 Completed queue jobs with a deleted originating project trigger an immediate refresh-consume loop because consume resolves without acknowledgement

- 2026-08-20T21:59:35Z `issue`: Completed queue jobs with a deleted originating project trigger an immediate refresh-consume loop because consume resolves without acknowledgement [frontend/contexts/GenerationQueueContext.tsx]
- 2026-08-20T22:19:02Z `attempt`: Consumer now returns false for a missing originating project and only refreshes immediately after a successful acknowledgement; focused test confirms one detail fetch without a tight loop. [frontend/contexts/GenerationQueueContext.tsx] (worked)
- 2026-08-20T22:19:07Z `fix`: Deleted-project completed jobs remain unacknowledged and recoverable without immediate refetch loops; focused GenerationQueueContext test passes. [frontend/contexts/GenerationQueueContext.tsx]
