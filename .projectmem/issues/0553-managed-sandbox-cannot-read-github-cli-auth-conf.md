# #0553 Managed sandbox cannot read GitHub CLI auth config during publish prerequisites

- 2026-08-05T08:33:52Z `issue`: Managed sandbox cannot read GitHub CLI auth config during publish prerequisites [GitHub CLI auth configuration]
- 2026-08-05T08:33:56Z `attempt`: Ran GitHub CLI prerequisite checks in managed sandbox; gh could not read AppData GitHub CLI config.yml [GitHub CLI auth configuration] (failed)
- 2026-08-05T08:34:15Z `attempt`: Retried gh auth status with approved AppData access; authenticated GitHub account confirmed [GitHub CLI auth configuration] (worked)
- 2026-08-05T08:34:23Z `fix`: GitHub publish prerequisites can run with approved access to existing gh auth config [GitHub CLI auth configuration]
