# #0467 Non-Extend Video Tools expose manual duration despite trim-based output; Extend request can also be overwritten by source trim

- 2026-08-02T10:28:26Z `issue`: Non-Extend Video Tools expose manual duration despite trim-based output; Extend request can also be overwritten by source trim [frontend/views/genspace/logic/generation-requests.ts]
- 2026-08-02T10:30:54Z `attempt`: Made non-Extend Tool UI auto-duration and restored manual settings duration after shared guide compilation for Extend while retaining trim metadata [frontend/views/genspace/logic/generation-requests.ts] (partial)
- 2026-08-02T10:37:06Z `fix`: Non-Extend Tools use trim-derived auto duration; Extend restores manual extend-by duration after shared input compilation while retaining source trim metadata [frontend/views/genspace/logic/generation-requests.ts]
