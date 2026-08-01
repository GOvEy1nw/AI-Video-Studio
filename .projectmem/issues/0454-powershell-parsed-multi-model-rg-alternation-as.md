# #0454 PowerShell parsed multi-model rg alternation as commands while inspecting profile metadata.

- 2026-08-01T16:41:01Z `issue`: PowerShell parsed multi-model rg alternation as commands while inspecting profile metadata. [backend/model_profiles/profiles.py search tooling]
- 2026-08-01T16:41:06Z `attempt`: Tried one alternation regex for six display names; PowerShell stripped quoting and executed Flux as a command. [backend/model_profiles/profiles.py search tooling] (failed)
- 2026-08-01T16:52:20Z `attempt`: Retried profile lookup with single-quoted fixed-string -e patterns; all six profile sections returned correctly. [backend/model_profiles/profiles.py search tooling] (worked)
- 2026-08-01T16:52:24Z `fix`: Use single-quoted fixed-string rg patterns for multi-name PowerShell source inspection. [backend/model_profiles/profiles.py search tooling]
