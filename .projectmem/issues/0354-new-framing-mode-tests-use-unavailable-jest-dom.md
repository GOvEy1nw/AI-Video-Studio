# #0354 New framing/mode tests use unavailable jest-dom matcher and leak DOM between tests.

- 2026-07-28T13:54:11Z `issue`: New framing/mode tests use unavailable jest-dom matcher and leak DOM between tests. [frontend/views/genspace/components/FramingControl.test.tsx]
- 2026-07-28T13:54:27Z `attempt`: Replaced jest-dom matcher with direct attribute checks and added explicit cleanup; awaiting rerun. [frontend/views/genspace/components/FramingControl.test.tsx] (partial)
- 2026-07-28T13:54:48Z `attempt`: Direct attribute checks plus explicit cleanup made focused tests and strict TypeScript pass. [frontend/views/genspace/components/FramingControl.test.tsx] (worked)
- 2026-07-28T13:54:52Z `fix`: Aligned new tests with project Chai setup and explicit Testing Library cleanup. [frontend/views/genspace/components/FramingControl.test.tsx]
