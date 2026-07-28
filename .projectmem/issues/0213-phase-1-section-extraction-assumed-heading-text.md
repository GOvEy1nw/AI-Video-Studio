# #0213 Phase 1 section extraction assumed heading text not used by runbook and failed with negative Substring index

- 2026-07-26T17:52:20Z `issue`: Phase 1 section extraction assumed heading text not used by runbook and failed with negative Substring index [docs/dependency-modernisation/00_MASTER_RUNBOOK.md]
- 2026-07-26T17:52:34Z `attempt`: Searched expected Markdown Phase/Exit headings with rg; runbook uses different section labels and returned no matches [docs/dependency-modernisation/00_MASTER_RUNBOOK.md] (failed)
- 2026-07-26T17:52:47Z `attempt`: Read runbook structure directly; it defines protocol while numbered phase details live in separate phase documents [docs/dependency-modernisation/00_MASTER_RUNBOOK.md] (worked)
- 2026-07-26T17:52:54Z `fix`: Resolved extraction error by using separate numbered phase document rather than assuming Phase headings in master runbook [docs/dependency-modernisation/00_MASTER_RUNBOOK.md]
