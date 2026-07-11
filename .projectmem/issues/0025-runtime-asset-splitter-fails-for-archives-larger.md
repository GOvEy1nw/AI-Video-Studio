# #0025 Runtime asset splitter fails for archives larger than 2 GB because Math.Min coerces remaining bytes to Int32.

- 2026-07-10T16:03:27Z `issue`: Runtime asset splitter fails for archives larger than 2 GB because Math.Min coerces remaining bytes to Int32. [scripts/create-python-runtime-assets.ps1]
- 2026-07-10T16:03:48Z `attempt`: Changed splitter calculations to Int64 while casting individual buffer reads back to Int32; rerun pending. [scripts/create-python-runtime-assets.ps1] (partial)
- 2026-07-10T16:07:00Z `attempt`: Int64 splitter passed, but archive manifest write failed under Windows PowerShell 5.1 because utf8NoBOM encoding is unsupported. [scripts/create-python-runtime-assets.ps1] (failed)
- 2026-07-10T16:07:12Z `attempt`: Replaced PowerShell-version-specific manifest encoding with .NET UTF8Encoding without BOM; rerun pending. [scripts/create-python-runtime-assets.ps1] (partial)
- 2026-07-10T16:10:25Z `attempt`: Rebuilt runtime archive successfully after Int64 splitter and .NET UTF-8 manifest fixes. [scripts/create-python-runtime-assets.ps1] (worked)
- 2026-07-10T16:10:28Z `fix`: Runtime asset splitter supports >2 GB archives and writes BOM-free JSON under Windows PowerShell 5.1 and 7. [scripts/create-python-runtime-assets.ps1]
