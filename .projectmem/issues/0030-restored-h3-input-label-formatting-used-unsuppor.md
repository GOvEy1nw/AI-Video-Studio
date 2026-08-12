# #0030 Restored H3 input label formatting used unsupported String.replaceAll under the repository TypeScript target.

- 2026-08-12T08:22:37Z `issue`: Restored H3 input label formatting used unsupported String.replaceAll under the repository TypeScript target. [frontend/views/genspace/video/VideoMediaInputs.tsx]
- 2026-08-12T08:23:02Z `attempt`: Replaced String.replaceAll with target-compatible split/join for restored media labels. [frontend/views/genspace/video/VideoMediaInputs.tsx] (worked)
- 2026-08-12T08:23:26Z `fix`: Restored H3 media labels now use target-compatible split/join and strict TypeScript passes. [frontend/views/genspace/video/VideoMediaInputs.tsx]
