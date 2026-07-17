# #0041 Director timeline has no focused Space shortcut for play/pause while all project workspaces stay mounted.

- 2026-07-17T16:02:04Z `issue`: Director timeline has no focused Space shortcut for play/pause while all project workspaces stay mounted. [frontend/views/DirectorEditor.tsx; frontend/views/director/DirectorWorkspacePanel.tsx]
- 2026-07-17T16:04:05Z `attempt`: Added active-only Director Space handler with editable-control guards and stopped Director playback when its tab becomes inactive. [frontend/views/DirectorEditor.tsx; frontend/views/director/DirectorWorkspacePanel.tsx] (partial)
- 2026-07-17T16:05:04Z `attempt`: TypeScript and production build confirm active-only Director Space play/pause handling and inactive-tab shutdown compile cleanly. [frontend/views/DirectorEditor.tsx; frontend/views/director/DirectorWorkspacePanel.tsx] (worked)
- 2026-07-17T16:05:08Z `fix`: Space now toggles Director play/pause only while Director is active, ignores editable controls and repeats, and Director stops when its tab hides. [frontend/views/DirectorEditor.tsx; frontend/views/director/DirectorWorkspacePanel.tsx]
