# #0213 Image Generate reference media incorrectly forces the selected aspect ratio to Auto.

- 2026-08-22T17:31:42Z `issue`: Image Generate reference media incorrectly forces the selected aspect ratio to Auto. [frontend/views/genspace]
- 2026-08-22T17:34:22Z `attempt`: Restricted aspect-ratio locking to Image Edit source images and video start/end frames; updated the existing focused predicate regression. [frontend/views/genspace/logic/media-inputs.ts] (partial)
- 2026-08-22T17:35:18Z `attempt`: Focused media-input regression passed 10/10 and TypeScript passed with only unrelated unused-symbol diagnostics disabled. [frontend/views/genspace/logic/media-inputs.test.ts] (worked)
- 2026-08-22T17:35:23Z `fix`: Aspect-ratio Auto locking now applies only to Image Edit sources and video start/end frames; Image Generate references preserve the selected ratio. [frontend/views/genspace/logic/media-inputs.ts]
