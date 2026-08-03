# #0510 FloatingMenu test used unavailable jest-dom toHaveClass matcher

- 2026-08-03T14:14:54Z `issue`: FloatingMenu test used unavailable jest-dom toHaveClass matcher [frontend/components/FloatingMenu.test.tsx:98]
- 2026-08-03T14:14:57Z `attempt`: Ran FloatingMenu and AssetContextMenu focused tests; 5 passed, portal test failed only on unsupported toHaveClass matcher [frontend/components/FloatingMenu.test.tsx:98] (partial)
- 2026-08-03T14:15:08Z `attempt`: Replaced jest-dom-only toHaveClass assertion with native classList check [frontend/components/FloatingMenu.test.tsx:98] (partial)
- 2026-08-03T14:15:59Z `attempt`: Focused FloatingMenu and AssetContextMenu tests pass 6/6 with native class assertion [frontend/components/FloatingMenu.test.tsx] (worked)
- 2026-08-03T14:16:07Z `fix`: FloatingMenu portal test now uses project-compatible native DOM assertions and passes [frontend/components/FloatingMenu.test.tsx]
