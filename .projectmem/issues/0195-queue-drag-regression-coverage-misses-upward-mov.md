# #0195 Queue drag regression coverage misses upward movement from a lower source to an earlier target.

- 2026-08-21T12:28:47Z `issue`: Queue drag regression coverage misses upward movement from a lower source to an earlier target. [frontend/components/GenerationQueuePanel.test.tsx]
- 2026-08-21T12:32:15Z `attempt`: Added a three-job last-to-first native drag assertion expecting [last, first, middle]. [frontend/components/GenerationQueuePanel.test.tsx] (partial)
- 2026-08-21T12:32:39Z `attempt`: Ran the two focused UI files; the new third fixture duplicated the active model label, making an unrelated single-text query ambiguous before drag assertions. [frontend/components/GenerationQueuePanel.test.tsx] (failed)
- 2026-08-21T12:33:02Z `attempt`: Scoped the active model-chip assertion to the active row so the three-job drag fixture can reuse a legitimate model label. [frontend/components/GenerationQueuePanel.test.tsx] (partial)
- 2026-08-21T12:33:17Z `attempt`: Focused queue test reached drag assertions but the pre-existing two-item expected orders were not extended for the new third fixture. [frontend/components/GenerationQueuePanel.test.tsx] (failed)
- 2026-08-21T12:33:30Z `attempt`: Updated the downward drag and keyboard expectations to preserve the third queued job. [frontend/components/GenerationQueuePanel.test.tsx] (partial)
- 2026-08-21T12:33:45Z `attempt`: The focused queue test now passes both first-to-second and last-to-first drag ordering plus keyboard reordering with three jobs. [frontend/components/GenerationQueuePanel.test.tsx] (worked)
- 2026-08-21T12:33:52Z `fix`: Three-job focused coverage confirms upward and downward native drag order plus keyboard reorder; the test passes. [frontend/components/GenerationQueuePanel.test.tsx]
