# #0409 Image Reframe regression test assumed exact square pixels, but integer percentage padding yields a subpixel 0.99875 aspect

- 2026-07-30T14:23:15Z `issue`: Image Reframe regression test assumed exact square pixels, but integer percentage padding yields a subpixel 0.99875 aspect [frontend/views/genspace/image/ImageEditMediaInputs.test.tsx]
- 2026-07-30T14:24:04Z `attempt`: Changed square-frame assertion to verify full canvas height, centering, and ratio tolerance rather than impossible exact padding pixels [frontend/views/genspace/image/ImageEditMediaInputs.test.tsx] (worked)
- 2026-07-30T14:24:07Z `fix`: Image Reframe test now validates fitted geometry without brittle exact equality against rounded padding percentages [frontend/views/genspace/image/ImageEditMediaInputs.test.tsx]
