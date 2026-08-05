# #0564 Parallel final-count and presentation-scan command lost successful count output because clean rg exit 1 failed the combined exec

- 2026-08-05T09:27:07Z `issue`: Parallel final-count and presentation-scan command lost successful count output because clean rg exit 1 failed the combined exec [AIVS-018 validation tooling]
- 2026-08-05T09:27:11Z `attempt`: Ran Vitest count and rg scan concurrently; clean no-match rg exit 1 caused wrapper to discard both outputs [AIVS-018 validation tooling] (failed)
- 2026-08-05T09:27:48Z `attempt`: Reran final count separately and used PowerShell Select-String for clean no-match scan; counts and empty scan captured [AIVS-018 validation tooling] (worked)
- 2026-08-05T09:27:52Z `fix`: Separated no-match policy scans from count collection so clean rg semantics cannot erase evidence [AIVS-018 validation tooling]
