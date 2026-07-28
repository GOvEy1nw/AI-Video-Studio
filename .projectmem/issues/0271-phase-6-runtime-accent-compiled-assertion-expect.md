# #0271 Phase 6 runtime accent compiled assertion expects wrong blue utility output form

- 2026-07-27T12:25:43Z `issue`: Phase 6 runtime accent compiled assertion expects wrong blue utility output form [frontend/index.css; dist CSS]
- 2026-07-27T12:25:46Z `attempt`: Asserted exact standalone bg-blue-500/600 compiled rules; assertion failed despite successful build [frontend/index.css; dist CSS] (failed)
- 2026-07-27T12:26:07Z `attempt`: Adjusted assertion for Tailwind's grouped selectors; blue-500/600, opacity, and semantic mappings all passed [frontend/index.css; dist CSS] (worked)
- 2026-07-27T12:26:12Z `fix`: Compiled assertion now accepts Tailwind grouped selectors while verifying exact runtime token values [frontend/index.css; dist CSS]
