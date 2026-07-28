# #0309 Managed sandbox denies GitHub CLI config access during Phase 10 action-version and workflow checks

- 2026-07-27T15:48:07Z `issue`: Managed sandbox denies GitHub CLI config access during Phase 10 action-version and workflow checks [Phase 10 GitHub Actions validation; C:\Users\rais\AppData\Roaming\GitHub CLI\config.yml]
- 2026-07-27T15:48:19Z `attempt`: Ran gh auth status in managed sandbox; GitHub CLI failed before startup on denied AppData config read [Phase 10 GitHub Actions validation] (failed)
- 2026-07-27T15:49:29Z `attempt`: Retried gh auth status with approved AppData access; authenticated GitHub account and workflow scope confirmed [Phase 10 GitHub Actions validation] (worked)
- 2026-07-27T15:49:34Z `fix`: Approved GitHub CLI config access restores authenticated Phase 10 action and workflow queries [Phase 10 GitHub Actions validation]
