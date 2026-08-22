# #0196 Selected Generation lacks a focused regression proving nullable queue counters never render null/null.

- 2026-08-21T12:28:52Z `issue`: Selected Generation lacks a focused regression proving nullable queue counters never render null/null. [frontend/views/genspace/hooks/useGenSpaceController.tsx]
- 2026-08-21T12:32:19Z `attempt`: Extracted numeric-only queue progress badge formatting and rendered its null-plus-complete-pair output through Selected Generation in a focused regression. [frontend/contexts/GenerationQueueContext.tsx; frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx] (partial)
- 2026-08-21T12:32:44Z `attempt`: The Selected Generation null-counter regression passed, and strict TypeScript passed with the extracted queue badge formatter. [frontend/contexts/GenerationQueueContext.tsx; frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx] (worked)
- 2026-08-21T12:32:48Z `fix`: A focused Selected Generation test now proves nullable queue counters are omitted while complete numeric detail renders; TypeScript is clean. [frontend/contexts/GenerationQueueContext.tsx; frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx]
