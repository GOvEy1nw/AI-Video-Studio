# #0677 AIVS-027 raw dev archive could not write to managed C:\tmp, blocking same-method baseline line counting.

- 2026-08-05T19:37:30Z `issue`: AIVS-027 raw dev archive could not write to managed C:\tmp, blocking same-method baseline line counting. [AIVS-027 LOC verification tooling]
- 2026-08-05T19:37:52Z `attempt`: Used a validated workspace-local git archive and identical Get-Content counting for dev/current, then removed exact temporary artifacts; measurements confirm 5744→3029 and 19628→18982. [AIVS-027 LOC verification tooling] (worked)
- 2026-08-05T19:37:57Z `fix`: Reproducible same-method baseline/current LOC measurement completed and temporary archive removed. [AIVS-027 LOC verification tooling]
