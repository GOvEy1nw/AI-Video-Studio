# #0531 Combined audit-package split patch failed because README PR06 row had already moved

- 2026-08-04T13:05:54Z `issue`: Combined audit-package split patch failed because README PR06 row had already moved [docs/AiVS-Code-Health-Performance-Audit/README.md]
- 2026-08-04T13:05:59Z `attempt`: Applied one multi-file patch that expected PR06 in both old and reordered README positions; verification failed atomically [docs/AiVS-Code-Health-Performance-Audit/README.md] (failed)
- 2026-08-04T13:07:39Z `attempt`: Split package update into atomic file additions and targeted edits against current README ordering [docs/AiVS-Code-Health-Performance-Audit] (worked)
- 2026-08-04T13:07:43Z `fix`: Created standalone PR00 security plan and updated package ordering with targeted patches [docs/AiVS-Code-Health-Performance-Audit]
