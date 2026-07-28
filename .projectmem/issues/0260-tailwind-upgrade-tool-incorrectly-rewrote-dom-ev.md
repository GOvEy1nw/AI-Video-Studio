# #0260 Tailwind upgrade tool incorrectly rewrote DOM event name "blur" to "blur-sm" in renderer logic

- 2026-07-27T11:16:22Z `issue`: Tailwind upgrade tool incorrectly rewrote DOM event name "blur" to "blur-sm" in renderer logic [frontend/views/VideoEditor.tsx; frontend/views/director/DirectorWorkspacePanel.tsx]
- 2026-07-27T11:17:55Z `attempt`: Restored DOM blur event names and persisted EffectType blur identifiers while retaining only class-level Tailwind blur utility migrations [frontend/types/project.ts; frontend/views/director; frontend/views/editor] (worked)
- 2026-07-27T11:21:02Z `fix`: Restored blur event/effect contracts; TypeScript, 75 frontend tests, and Tailwind 4 production build pass [frontend/types/project.ts; frontend/views/director; frontend/views/editor]
