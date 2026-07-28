# #0170 Crop overlay inspection used a Windows-incompatible ripgrep path glob

- 2026-07-26T11:06:33Z `issue`: Crop overlay inspection used a Windows-incompatible ripgrep path glob [frontend/views/genspace]
- 2026-07-26T11:06:49Z `attempt`: Replaced the invalid path glob with a directory search plus -g filter [frontend/views/genspace] (worked)
- 2026-07-26T11:07:07Z `fix`: GenSpace overlay mount point was located with a Windows-safe ripgrep invocation [frontend/views/genspace/GenSpaceWorkspace.tsx]
