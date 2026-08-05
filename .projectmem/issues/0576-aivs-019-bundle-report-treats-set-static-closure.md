# #0576 AIVS-019 bundle report treats Set static closure as an array when checking Settings files.

- 2026-08-05T10:39:44Z `issue`: AIVS-019 bundle report treats Set static closure as an array when checking Settings files. [scripts/check-renderer-bundle.mjs]
- 2026-08-05T10:39:52Z `attempt`: Converted Settings static closure Set to an array before mapping output files. [scripts/check-renderer-bundle.mjs] (partial)
- 2026-08-05T10:40:20Z `attempt`: Changed ModelPackManager proof from invalid shared-runtime overlap check to manifest chunk plus Settings closure membership. [scripts/check-renderer-bundle.mjs] (partial)
- 2026-08-05T10:40:32Z `attempt`: Bundle report now passes structural graph validation and prints measured compression table. [scripts/check-renderer-bundle.mjs] (worked)
- 2026-08-05T10:40:35Z `fix`: Bundle report correctly traverses manifest Sets and permits shared initial runtime chunks while enforcing Settings-owned ModelPackManager. [scripts/check-renderer-bundle.mjs]
