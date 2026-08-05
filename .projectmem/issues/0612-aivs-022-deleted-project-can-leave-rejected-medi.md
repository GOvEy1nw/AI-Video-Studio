# #0612 AIVS-022 deleted project can leave rejected media paths attached to a reused project ID

- 2026-08-05T15:19:11Z `issue`: AIVS-022 deleted project can leave rejected media paths attached to a reused project ID [frontend/contexts/ProjectContext.tsx]
- 2026-08-05T15:22:29Z `attempt`: deleteProject now clears rejected persisted paths and active recovery bookkeeping for its ID. [frontend/contexts/ProjectContext.tsx] (worked)
- 2026-08-05T15:22:35Z `fix`: Project deletion clears rejected persisted-path and active recovery bookkeeping for the deleted ID. [frontend/contexts/ProjectContext.tsx]
- 2026-08-05T15:24:31Z `attempt`: Recovery-generation guard left stale in-flight request uncleared after project switch, blocking current-project recovery test. [frontend/contexts/ProjectContext.tsx] (failed)
- 2026-08-05T15:25:02Z `attempt`: Stale recovery completion now always releases its in-flight slot while generation guard still blocks stale path state; all seven provider tests and TypeScript pass. [frontend/contexts/ProjectContext.tsx] (worked)
