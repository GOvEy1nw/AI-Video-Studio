# #0589 AIVS-020 model-pack completion can coalesce into a pre-mutation profile request and leave pack availability stale.

- 2026-08-05T12:53:24Z `issue`: AIVS-020 model-pack completion can coalesce into a pre-mutation profile request and leave pack availability stale. [frontend/contexts/ModelProfilesContext.tsx; frontend/components/ModelPackManager.tsx]
- 2026-08-05T12:59:04Z `attempt`: Added coalesced trailing refreshAfterModelPackMutation action and routed download/delete completion through it. [frontend/contexts/ModelProfilesContext.tsx; frontend/components/ModelPackManager.tsx] (worked)
- 2026-08-05T13:08:32Z `fix`: Model-pack mutations now queue one generation-safe trailing shared profile refresh; coalescing regression passes. [frontend/contexts/ModelProfilesContext.tsx; frontend/components/ModelPackManager.tsx]
