# #0088 AIVS-015 Upscale source picker duplicates MediaInputSlot and uses a non-keyboard-accessible clickable div.

- 2026-08-16T19:29:35Z `issue`: AIVS-015 Upscale source picker duplicates MediaInputSlot and uses a non-keyboard-accessible clickable div. [frontend/views/genspace/components/UpscalePanel.tsx]
- 2026-08-16T19:32:42Z `attempt`: Replaced the custom Upscale source tile with the existing accessible MediaInputSlot and retained focused method/scale controls. [frontend/views/genspace/components/UpscalePanel.tsx] (worked)
- 2026-08-16T19:32:48Z `fix`: Upscale media selection now reuses the keyboard-accessible shared MediaInputSlot contract. [frontend/views/genspace/components/UpscalePanel.tsx]
