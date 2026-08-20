# #0127 Quick Gen reference media tiles lost the visible X removal control

- 2026-08-20T15:35:15Z `issue`: Quick Gen reference media tiles lost the visible X removal control [frontend/views/genspace/components/MediaInputSlot.tsx]
- 2026-08-20T16:19:54Z `attempt`: Restored the shared relative group wrapper so occupied reference tiles reveal and focus their existing remove button; focused removal regression passes. [frontend/views/genspace/components/MediaInputSlot.tsx] (worked)
- 2026-08-20T16:19:58Z `fix`: Shared reference tiles now restore the visible hover and keyboard-focus remove X, confirmed by focused UI test and TypeScript build. [frontend/views/genspace/components/MediaInputSlot.tsx]
