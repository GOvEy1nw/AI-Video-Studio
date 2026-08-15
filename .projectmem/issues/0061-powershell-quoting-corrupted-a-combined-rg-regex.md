# #0061 PowerShell quoting corrupted a combined rg regex while locating stale LTX 2.5 expectations

- 2026-08-13T13:24:26Z `issue`: PowerShell quoting corrupted a combined rg regex while locating stale LTX 2.5 expectations [investigation/tooling]
- 2026-08-13T13:24:36Z `attempt`: Re-ran stale-expectation search with fixed-string patterns; it succeeded and exposed an unrelated sandbox denial on two test files [investigation/tooling] (partial)
- 2026-08-13T13:29:28Z `fix`: Use fixed-string rg patterns for PowerShell searches containing brackets and quotes [investigation/tooling]
