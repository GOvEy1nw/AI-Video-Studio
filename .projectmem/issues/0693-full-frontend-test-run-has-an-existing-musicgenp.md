# #0693 Full frontend test run has an existing MusicGenPanel accessibility assertion failure for the Instrumental language/voice menu.

- 2026-08-07T08:41:15Z `issue`: Full frontend test run has an existing MusicGenPanel accessibility assertion failure for the Instrumental language/voice menu. [frontend/views/genspace/music/MusicGenPanel.test.tsx]
- 2026-08-07T09:48:05Z `fix`: Repaired the stale role assertion: the focused MusicGenPanel test now opens the ModeSelector button menu before selecting Instrumental. The focused test passes. [frontend/views/genspace/music/MusicGenPanel.test.tsx]
