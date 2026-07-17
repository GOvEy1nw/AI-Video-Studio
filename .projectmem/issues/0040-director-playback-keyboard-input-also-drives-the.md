# #0040 Director playback keyboard input also drives the still-mounted Video Editor timeline because inactive editor shortcuts remain global.

- 2026-07-17T16:01:56Z `issue`: Director playback keyboard input also drives the still-mounted Video Editor timeline because inactive editor shortcuts remain global. [frontend/views/editor/useEditorKeyboard.ts; frontend/views/VideoEditor.tsx]
- 2026-07-17T16:03:56Z `attempt`: Gated Video Editor global shortcuts to its active tab and stop timeline/source playback whenever Video Editor becomes inactive. [frontend/views/editor/useEditorKeyboard.ts; frontend/views/VideoEditor.tsx] (partial)
- 2026-07-17T16:04:53Z `attempt`: TypeScript and production Vite/Electron build confirm active-tab keyboard gating and inactive Video Editor transport shutdown compile cleanly. [frontend/views/editor/useEditorKeyboard.ts; frontend/views/VideoEditor.tsx] (worked)
- 2026-07-17T16:04:58Z `fix`: Video Editor playback and keyboard transport now stop/ignore input whenever its project tab is inactive, preventing Director playback from driving it. [frontend/views/editor/useEditorKeyboard.ts; frontend/views/VideoEditor.tsx]
