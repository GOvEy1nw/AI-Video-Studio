# #0071 PowerShell/rg quoting broke the WanGP LoRA manifest search pattern before it could inspect loras settings

- 2026-08-15T18:03:25Z `issue`: PowerShell/rg quoting broke the WanGP LoRA manifest search pattern before it could inspect loras settings [investigation/tooling]
- 2026-08-15T18:03:42Z `attempt`: Retried the LoRA search with separate fixed patterns instead of a quoted alternation [investigation/tooling] (worked)
- 2026-08-15T18:03:42Z `fix`: Fixed-pattern rg inspection now exposes WanGP LoRA path, URL-cache, multiplier, and required-LoRA behavior [investigation/tooling]
