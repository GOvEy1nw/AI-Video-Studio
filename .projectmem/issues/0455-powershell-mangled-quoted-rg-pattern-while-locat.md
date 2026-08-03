# #0455 PowerShell mangled quoted rg pattern while locating Reframe mode setter

- 2026-08-02T09:05:55Z `issue`: PowerShell mangled quoted rg pattern while locating Reframe mode setter [frontend/views/genspace/hooks/useGenSpaceController.tsx search tooling]
- 2026-08-02T09:06:04Z `attempt`: Used single-quoted fixed-string rg searches to locate Reframe setter safely [frontend/views/genspace/hooks/useGenSpaceController.tsx search tooling] (worked)
- 2026-08-02T09:06:08Z `fix`: Fixed-string rg completed Reframe setter lookup without PowerShell regex mangling [frontend/views/genspace/hooks/useGenSpaceController.tsx search tooling]
