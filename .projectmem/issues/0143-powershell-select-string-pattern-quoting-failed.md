# #0143 PowerShell Select-String pattern quoting failed while inspecting the built theme bootstrap reference.

- 2026-08-20T18:05:28Z `issue`: PowerShell Select-String pattern quoting failed while inspecting the built theme bootstrap reference. [investigation/tooling]
- 2026-08-20T18:05:42Z `attempt`: Used rg to inspect the built HTML after the quoted Select-String pattern failed; it confirmed the dark fallback and relative bootstrap path. [investigation/tooling] (worked)
- 2026-08-20T18:05:43Z `fix`: Built bootstrap verification is reliable with rg: dist/theme-bootstrap.js exists and dist/index.html references it relatively. [investigation/tooling]
