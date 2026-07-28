# #0338 GenSpaceControls test environment lacks jest-dom toHaveClass matcher

- 2026-07-28T09:56:55Z `issue`: GenSpaceControls test environment lacks jest-dom toHaveClass matcher [frontend/views/genspace/components/GenSpaceControls.test.tsx]
- 2026-07-28T09:57:00Z `attempt`: Used toHaveClass for menu placement assertion; Vitest Chai and TypeScript rejected unavailable matcher [frontend/views/genspace/components/GenSpaceControls.test.tsx] (failed)
- 2026-07-28T09:57:12Z `attempt`: Replaced unavailable toHaveClass with native classList.contains assertion [frontend/views/genspace/components/GenSpaceControls.test.tsx] (partial)
- 2026-07-28T09:57:37Z `attempt`: Native classList assertion passes focused GenSpaceControls tests and strict TypeScript [frontend/views/genspace/components/GenSpaceControls.test.tsx] (worked)
- 2026-07-28T09:57:41Z `fix`: Menu placement test now uses supported native DOM class assertion [frontend/views/genspace/components/GenSpaceControls.test.tsx]
