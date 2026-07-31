# #0406 Image Edit workflow toolbars change panel height, canvases stay square/fixed-height, and reference inputs disappear outside Edit

- 2026-07-30T13:53:44Z `issue`: Image Edit workflow toolbars change panel height, canvases stay square/fixed-height, and reference inputs disappear outside Edit [frontend/views/genspace/image/ImageEditMediaInputs.tsx]
- 2026-07-30T13:59:18Z `attempt`: Moved compact tool controls into fixed headers, shared source-ratio canvas across workflows, and kept references visible in a disabled fieldset [frontend/views/genspace/image/ImageEditMediaInputs.tsx] (worked)
- 2026-07-30T14:02:21Z `fix`: Image Edit now uses compact fixed headers, one full-width source-aspect canvas, and visible disabled references outside Edit; focused/full tests, TypeScript, build, diff check, and Retouch Electron smoke pass [frontend/views/genspace/image/]
