# #0178 A new admission leaves the prior submitted job ID in the local cancel ref until the new POST resolves, so admission-time cancel can hit the old job.

- 2026-08-20T23:09:25Z `issue`: A new admission leaves the prior submitted job ID in the local cancel ref until the new POST resolves, so admission-time cancel can hit the old job. [frontend/hooks/use-generation.ts]
- 2026-08-20T23:10:11Z `attempt`: Cleared the retained submitted job ID before each admission and added submit-A/unresolved-B/cancel coverage so admission-time cancel is a safe no-op; validation pending. [frontend/hooks/use-generation.ts] (partial)
- 2026-08-20T23:10:41Z `attempt`: Focused 3-case hook suite confirms unresolved admission B cannot cancel prior job A; TypeScript passes. [frontend/hooks/use-generation.ts] (worked)
- 2026-08-20T23:10:46Z `fix`: Confirmed admission-time local cancel is a no-op until the new exact job ID is known, preventing cancellation of a prior job. [frontend/hooks/use-generation.ts]
