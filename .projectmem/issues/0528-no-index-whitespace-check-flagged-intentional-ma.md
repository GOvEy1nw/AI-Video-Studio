# #0528 No-index whitespace check flagged intentional Markdown hard breaks and Windows line-ending warnings

- 2026-08-04T12:57:25Z `issue`: No-index whitespace check flagged intentional Markdown hard breaks and Windows line-ending warnings [docs/AiVS-Code-Health-Performance-Audit]
- 2026-08-04T12:57:28Z `attempt`: Compared each untracked Markdown file to NUL with git diff --check; intentional two-space hard breaks were reported as trailing whitespace [docs/AiVS-Code-Health-Performance-Audit] (failed)
- 2026-08-04T12:58:15Z `attempt`: Used a Markdown-aware whitespace scan that permits metadata hard breaks and rejects other trailing whitespace [docs/AiVS-Code-Health-Performance-Audit] (worked)
- 2026-08-04T12:58:19Z `fix`: Validated audit Markdown with intentional hard-break allowlist; no unintended trailing whitespace [docs/AiVS-Code-Health-Performance-Audit]
