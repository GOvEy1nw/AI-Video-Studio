# #0009 Picker-imported Speech references lose their gallery asset ID, allowing Copy Settings to retain a different project's native path.

- 2026-08-10T14:53:39Z `issue`: Picker-imported Speech references lose their gallery asset ID, allowing Copy Settings to retain a different project's native path. [frontend/views/genspace/audio/SpeechGenPanel.tsx]
- 2026-08-10T14:55:43Z `attempt`: Changed gallery input synchronization to return the project Asset, stored its ID/path/URL in Speech references, and added rendered Index reference-gating coverage. [frontend/views/genspace/audio/SpeechGenPanel.tsx] (partial)
- 2026-08-10T14:58:17Z `attempt`: Speech picker imports now retain the project Asset ID and Index TTS 2 remains disabled until that reference is present; TypeScript, 25 focused frontend tests, and the production build pass. [frontend/views/genspace/audio/SpeechGenPanel.tsx] (worked)
- 2026-08-10T14:58:26Z `fix`: Picker-imported Speech references store the project-owned asset ID/path/URL, so Copy Settings refreshes lineage safely across projects. [frontend/views/genspace/audio/SpeechGenPanel.tsx]
