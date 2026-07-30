# #0396 PowerShell stripped quotes from combined rg regex, producing an unclosed-group parse error

- 2026-07-29T17:14:49Z `issue`: PowerShell stripped quotes from combined rg regex, producing an unclosed-group parse error [Region prompt follow-up search]
- 2026-07-29T17:14:57Z `attempt`: Combined quoted alternation for old RegionPromptState fields was mangled by PowerShell before rg parsed it [Region prompt follow-up search] (failed)
- 2026-07-29T17:15:06Z `attempt`: Retried with rg fixed-string patterns and found one stale RegionPromptState fixture [Region prompt follow-up search] (worked)
- 2026-07-29T17:15:11Z `fix`: Fixed-string rg search completed and isolated stale fixture without scanning unrelated source [Region prompt follow-up search]
