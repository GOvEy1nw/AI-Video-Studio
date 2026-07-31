# #0407 Image Edit layout test expected raw numeric aspectRatio but jsdom normalizes CSS value to '<ratio> / 1'

- 2026-07-30T13:58:33Z `issue`: Image Edit layout test expected raw numeric aspectRatio but jsdom normalizes CSS value to '<ratio> / 1' [frontend/views/genspace/image/ImageEditMediaInputs.test.tsx]
- 2026-07-30T13:59:08Z `attempt`: Changed source-ratio assertion to compare parsed numeric CSS value; focused Image Edit suite passes [frontend/views/genspace/image/ImageEditMediaInputs.test.tsx] (worked)
- 2026-07-30T13:59:13Z `fix`: Image Edit layout test now accepts standards-normalized CSS aspect-ratio serialization [frontend/views/genspace/image/ImageEditMediaInputs.test.tsx]
