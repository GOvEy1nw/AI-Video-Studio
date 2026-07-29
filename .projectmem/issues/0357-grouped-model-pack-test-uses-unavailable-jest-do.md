# #0357 Grouped model-pack test uses unavailable jest-dom toBeDisabled matcher in project Chai setup

- 2026-07-28T14:37:34Z `issue`: Grouped model-pack test uses unavailable jest-dom toBeDisabled matcher in project Chai setup [frontend/components/ModelPackManager.test.tsx]
- 2026-07-28T14:38:13Z `attempt`: Replaced unavailable toBeDisabled matcher with direct HTMLButtonElement.disabled assertion; focused grouped-card test passes. [frontend/components/ModelPackManager.test.tsx] (worked)
- 2026-07-28T14:38:20Z `fix`: Grouped model-pack test now uses project-compatible direct disabled-property assertion and passes. [frontend/components/ModelPackManager.test.tsx]
