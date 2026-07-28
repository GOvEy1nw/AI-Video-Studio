# #0331 Post-uninstall verification still finds LocalAppData Programs\AiVS\AiVS.exe despite user installer-pass confirmation

- 2026-07-28T07:03:25Z `issue`: Post-uninstall verification still finds LocalAppData Programs\AiVS\AiVS.exe despite user installer-pass confirmation [Phase 11 installer uninstall verification]
- 2026-07-28T07:03:34Z `attempt`: Compared Phase 1 project backup after user uninstall: 100/100 project files remain byte-identical, but default installed executable still exists [Phase 11 installer uninstall verification] (partial)
- 2026-07-28T07:04:43Z `attempt`: Launched verified installed uninstaller for user; post-run check shows install directory/executable absent, zero processes, and 100/100 backup project files unchanged [Phase 11 installer uninstall verification] (worked)
- 2026-07-28T07:04:46Z `fix`: Installed candidate fully uninstalled after explicit rerun; project media and user-data directory preserved [Phase 11 installer uninstall verification]
