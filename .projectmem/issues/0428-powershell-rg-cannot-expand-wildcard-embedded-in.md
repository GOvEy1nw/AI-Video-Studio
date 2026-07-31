# #0428 PowerShell rg cannot expand wildcard embedded in lucide-react node_modules path

- 2026-07-31T10:41:44Z `issue`: PowerShell rg cannot expand wildcard embedded in lucide-react node_modules path [frontend icon discovery tooling]
- 2026-07-31T10:41:48Z `attempt`: Tried rg against node_modules path containing embedded wildcard; Windows treated it as invalid literal path [frontend icon discovery tooling] (failed)
- 2026-07-31T10:41:59Z `attempt`: Resolved lucide definition path with Get-ChildItem before rg; icon exports confirmed [frontend icon discovery tooling] (worked)
- 2026-07-31T10:42:03Z `fix`: Use Get-ChildItem to resolve pnpm package directory before passing exact Windows path to rg [frontend icon discovery tooling]
