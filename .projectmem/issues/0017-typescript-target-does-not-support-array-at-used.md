# #0017 TypeScript target does not support Array.at used by the new Speech add-segment control.

- 2026-08-11T13:56:11Z `issue`: TypeScript target does not support Array.at used by the new Speech add-segment control. [frontend/views/genspace/audio/SpeechGenPanel.tsx]
- 2026-08-11T13:56:46Z `attempt`: Replaced Array.at with target-compatible indexed access in the Speech segment alternation logic; TypeScript passes. [frontend/views/genspace/audio/SpeechGenPanel.tsx] (worked)
- 2026-08-11T13:56:53Z `fix`: Speech segment addition now compiles under the repository TypeScript target. [frontend/views/genspace/audio/SpeechGenPanel.tsx]
