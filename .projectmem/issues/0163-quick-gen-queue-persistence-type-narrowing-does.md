# #0163 Quick Gen queue persistence type narrowing does not distinguish image/video/retake add-take snapshots under strict TypeScript

- 2026-08-20T22:08:15Z `issue`: Quick Gen queue persistence type narrowing does not distinguish image/video/retake add-take snapshots under strict TypeScript [frontend/contexts/GenerationQueueContext.tsx]
- 2026-08-20T22:08:45Z `attempt`: Made add-take snapshot context a media-kind discriminated union and supplied the upscale media kind at admission [frontend/contexts/GenerationQueueContext.tsx] (partial)
- 2026-08-20T22:09:02Z `attempt`: Strict TypeScript now accepts all image/video add-take queue persistence branches [frontend/contexts/GenerationQueueContext.tsx] (worked)
- 2026-08-20T22:09:07Z `fix`: Add-take queue contexts now use explicit media discriminants with strict snapshot types [frontend/contexts/GenerationQueueContext.tsx]
