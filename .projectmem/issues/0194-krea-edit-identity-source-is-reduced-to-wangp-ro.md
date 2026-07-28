# #0194 Krea Edit identity source is reduced to WanGP role I instead of required KI by hard-coded reference-role selection

- 2026-07-26T12:54:18Z `issue`: Krea Edit identity source is reduced to WanGP role I instead of required KI by hard-coded reference-role selection [backend/handlers/image_generation_handler.py]
- 2026-07-26T12:54:32Z `attempt`: Included identity_image in the shared KI reference-role selection; focused regression rerun pending [backend/handlers/image_generation_handler.py] (partial)
- 2026-07-26T12:54:50Z `attempt`: Focused Krea Edit routing regression passes with identity source compiled as KI [backend/handlers/image_generation_handler.py] (worked)
- 2026-07-26T12:54:59Z `fix`: Krea whole-image Edit now binds identity source as WanGP KI and passes its integration regression [backend/handlers/image_generation_handler.py]
