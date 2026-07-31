# #0408 Image Reframe outer frame keeps a 20px inset instead of fitting its longest side to the full source-aspect canvas

- 2026-07-30T14:21:18Z `issue`: Image Reframe outer frame keeps a 20px inset instead of fitting its longest side to the full source-aspect canvas [frontend/views/genspace/image/ImageOutpaintEditor.tsx]
- 2026-07-30T14:23:22Z `attempt`: Removed ImageOutpaintEditor frame margin; 16:9 fills canvas, square fills height but existing integer padding produces a 0.99875 subpixel aspect [frontend/views/genspace/image/ImageOutpaintEditor.tsx] (partial)
- 2026-07-30T14:24:11Z `attempt`: Set image outpaint layout margin to zero; regression confirms 16:9 fills canvas and square target fills/centers on canvas height [frontend/views/genspace/image/ImageOutpaintEditor.tsx] (worked)
- 2026-07-30T14:38:13Z `fix`: Image Reframe now removes the 20px display inset so matching frames fill the canvas and differing aspects fill/center by longest side; regression, TS, full frontend suite, build, and diff check pass [frontend/views/genspace/image/ImageOutpaintEditor.tsx]
