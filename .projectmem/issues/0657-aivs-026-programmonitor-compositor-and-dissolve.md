# #0657 AIVS-026 ProgramMonitor compositor and dissolve videos retain sources while inactive, bypassing playback pool teardown.

- 2026-08-05T18:12:01Z `issue`: AIVS-026 ProgramMonitor compositor and dissolve videos retain sources while inactive, bypassing playback pool teardown. [frontend/views/editor/ProgramMonitor.tsx]
- 2026-08-05T18:12:42Z `attempt`: Added ProgramMonitor activity gate and inactive cleanup for compositor/dissolve video sources. [frontend/views/editor/ProgramMonitor.tsx; frontend/views/VideoEditor.tsx] (partial)
- 2026-08-05T18:12:57Z `fix`: Inactive ProgramMonitor now detaches compositor and dissolve video sources; focused checks pass. [frontend/views/editor/ProgramMonitor.tsx; frontend/views/VideoEditor.tsx]
