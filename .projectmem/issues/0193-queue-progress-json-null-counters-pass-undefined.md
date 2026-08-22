# #0193 Queue progress JSON null counters pass undefined-only guards and render Step/Phase/Section null/null in Selected Generation.

- 2026-08-21T12:16:40Z `issue`: Queue progress JSON null counters pass undefined-only guards and render Step/Phase/Section null/null in Selected Generation. [frontend/views/genspace/hooks/useGenSpaceController.tsx]
- 2026-08-21T12:19:00Z `attempt`: Aligned the queue progress contract with nullable JSON and restricted formatted counters to complete numeric pairs; validation remains pending. [frontend/contexts/GenerationQueueContext.tsx; frontend/views/genspace/hooks/useGenSpaceController.tsx] (partial)
- 2026-08-21T12:21:44Z `attempt`: Reformatted the nullable counter guards without changing their numeric-only behavior. [frontend/views/genspace/hooks/useGenSpaceController.tsx] (worked)
- 2026-08-21T12:22:10Z `fix`: Nullable queue progress fields are typed honestly and Selected Generation formats only complete numeric counters, preventing null/null output; TypeScript passes. [frontend/views/genspace/hooks/useGenSpaceController.tsx]
