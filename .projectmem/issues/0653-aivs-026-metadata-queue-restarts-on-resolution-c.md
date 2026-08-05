# #0653 AIVS-026 metadata queue restarts on resolution cache updates, cancelling concurrent probes and leaving queued URLs orphaned.

- 2026-08-05T18:04:19Z `issue`: AIVS-026 metadata queue restarts on resolution cache updates, cancelling concurrent probes and leaving queued URLs orphaned. [frontend/views/VideoEditor.tsx:2142]
- 2026-08-05T18:04:59Z `attempt`: Kept metadata workers stable across resolution cache publications so queued probes remain owned by one effect. [frontend/views/VideoEditor.tsx] (partial)
- 2026-08-05T18:05:19Z `fix`: Metadata probes no longer cancel siblings on each cache update; worker queue remains bounded and active-only. [frontend/views/VideoEditor.tsx]
