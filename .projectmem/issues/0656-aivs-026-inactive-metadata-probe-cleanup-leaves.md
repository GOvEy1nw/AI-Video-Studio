# #0656 AIVS-026 inactive metadata-probe cleanup leaves aborted URLs in probing set, blocking reactivation retry.

- 2026-08-05T18:08:30Z `issue`: AIVS-026 inactive metadata-probe cleanup leaves aborted URLs in probing set, blocking reactivation retry. [frontend/views/VideoEditor.tsx]
- 2026-08-05T18:09:13Z `attempt`: Metadata cleanup now removes aborted URL ownership and detaches stale media callbacks before release. [frontend/views/VideoEditor.tsx] (partial)
- 2026-08-05T18:09:32Z `fix`: Inactive metadata cleanup clears probe ownership and stale handlers, allowing reactivation retries; focused checks pass. [frontend/views/VideoEditor.tsx]
