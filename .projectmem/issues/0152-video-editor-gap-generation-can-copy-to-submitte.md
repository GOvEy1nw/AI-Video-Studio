# #0152 Video Editor gap generation can copy to submitted projectId but add the asset through mutable currentProjectId, risking cross-project persistence after a project switch.

- 2026-08-20T21:09:48Z `issue`: Video Editor gap generation can copy to submitted projectId but add the asset through mutable currentProjectId, risking cross-project persistence after a project switch. [frontend/views/editor/useGapGeneration.ts]
- 2026-08-20T22:17:41Z `attempt`: Queued editor results now update the submitted timeline in ProjectContext and same-timeline context changes replace local editor state after cancelling stale autosaves; awaiting focused verification. [frontend/views/VideoEditor.tsx] (partial)
- 2026-08-20T22:34:47Z `attempt`: Editor gap intent carries immutable project/timeline/track placement; global consumer copies, mutates and acknowledges only that submitted project. Focused two-project test passes. [frontend/contexts/GenerationQueueContext.tsx] (worked)
- 2026-08-20T22:34:52Z `fix`: Video Editor gap results now persist exclusively to the immutable submitted project and timeline; focused isolation test passes. [frontend/contexts/GenerationQueueContext.tsx]
