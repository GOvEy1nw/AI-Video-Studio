# #0018 Removing a Speech reference leaves old dialogue segments, so re-adding a new voice can silently reuse stale speaker text and enable Generate.

- 2026-08-11T14:05:07Z `issue`: Removing a Speech reference leaves old dialogue segments, so re-adding a new voice can silently reuse stale speaker text and enable Generate. [frontend/views/genspace/audio/SpeechGenPanel.tsx]
- 2026-08-11T14:06:12Z `attempt`: Clear dialogue segments whenever reference removal leaves fewer than two voices; rendered remove/re-add test now proves Speaker 2 resets empty and Generate stays disabled. [frontend/views/genspace/audio/SpeechGenPanel.tsx] (worked)
- 2026-08-11T14:06:21Z `fix`: Speech reference replacement cannot silently reuse dialogue authored for a removed voice. [frontend/views/genspace/audio/SpeechGenPanel.tsx]
