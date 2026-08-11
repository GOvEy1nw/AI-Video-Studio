# #0015 Two-speaker Speech can enable Generate for a compiled dialogue longer than the backend 4096-character contract and may retain stale segments after normal prompt edits.

- 2026-08-11T13:47:45Z `issue`: Two-speaker Speech can enable Generate for a compiled dialogue longer than the backend 4096-character contract and may retain stale segments after normal prompt edits. [frontend/views/genspace/audio/SpeechGenPanel.tsx]
- 2026-08-11T13:59:34Z `attempt`: Cleared cached dialogue segments on normal prompt edits and enforced the 4096-character compiled dialogue limit in both UI gating and request compilation; focused frontend tests pass. [frontend/views/genspace/audio/SpeechGenPanel.tsx] (worked)
- 2026-08-11T13:59:42Z `fix`: Speech dialogue submission now stays within the backend prompt contract and does not revive stale segments after normal prompt edits. [frontend/views/genspace/audio/SpeechGenPanel.tsx]
