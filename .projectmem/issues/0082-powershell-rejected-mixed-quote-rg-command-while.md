# #0082 PowerShell rejected mixed-quote rg command while locating GenerationSettings consumers.

- 2026-07-24T19:47:44Z `issue`: PowerShell rejected mixed-quote rg command while locating GenerationSettings consumers. [package.json; frontend]
- 2026-07-24T19:48:01Z `attempt`: Retried the searches with PowerShell-safe single-quoted patterns; dependency, type-consumer, and hook-caller inventory completed. [package.json; frontend] (worked)
- 2026-07-24T19:48:05Z `fix`: Used PowerShell-safe rg quoting and completed the requested inventory. [package.json; frontend]
