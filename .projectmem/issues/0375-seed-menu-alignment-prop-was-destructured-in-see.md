# #0375 Seed menu alignment prop was destructured in SeedSettings instead of SeedControl, leaving menuAlign undefined when menu opens.

- 2026-07-29T13:43:56Z `issue`: Seed menu alignment prop was destructured in SeedSettings instead of SeedControl, leaving menuAlign undefined when menu opens. [frontend/components/SeedControl.tsx]
- 2026-07-29T13:44:11Z `attempt`: Moved menuAlign default destructuring from SeedSettings to SeedControl; focused interaction tests still pending rerun and TypeScript validation. [frontend/components/SeedControl.tsx] (partial)
- 2026-07-29T13:44:52Z `attempt`: Corrected menuAlign ownership and added inward-opening regression through PromptActions; focused shared-control and Camera Settings suites pass 13/13. [frontend/components/SeedControl.tsx; frontend/views/genspace/components/GenSpaceControls.test.tsx] (worked)
- 2026-07-29T13:56:45Z `fix`: SeedControl now accepts menuAlign and prompt footer selects left alignment; focused interaction test confirms inward-opening menu [frontend/components/SeedControl.tsx]
