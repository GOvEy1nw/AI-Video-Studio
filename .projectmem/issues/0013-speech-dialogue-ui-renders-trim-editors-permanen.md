# #0013 Speech dialogue UI renders trim editors permanently with a no-op Confirm and does not wire the existing prompt-enhancement toggle.

- 2026-08-11T13:47:26Z `issue`: Speech dialogue UI renders trim editors permanently with a no-op Confirm and does not wire the existing prompt-enhancement toggle. [frontend/views/genspace/audio/SpeechGenPanel.tsx]
- 2026-08-11T13:59:00Z `attempt`: Wired PromptActions to the Speech enhancement preference and made each audio trim editor open from the existing media menu and close on Confirm; rendered test passes. [frontend/views/genspace/audio/SpeechGenPanel.tsx] (worked)
- 2026-08-11T13:59:07Z `fix`: Speech now exposes the enhancer toggle and video-style on-demand trim interactions without permanent expanded editors. [frontend/views/genspace/audio/SpeechGenPanel.tsx]
