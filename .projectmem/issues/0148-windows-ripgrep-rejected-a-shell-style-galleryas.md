# #0148 Windows ripgrep rejected a shell-style GalleryAsset*.tsx path during the Music variations card audit.

- 2026-07-25T22:32:07Z `issue`: Windows ripgrep rejected a shell-style GalleryAsset*.tsx path during the Music variations card audit. [frontend/components/]
- 2026-07-25T22:33:48Z `attempt`: Retried Gallery asset discovery with explicit file paths and directory-scoped rg filters; all relevant card/take call sites were found. [frontend/components/] (worked)
- 2026-07-25T22:33:50Z `fix`: Gallery audit completed with Windows-safe explicit paths; no repository fix was needed. [frontend/components/]
