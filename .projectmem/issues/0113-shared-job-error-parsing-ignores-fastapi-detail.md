# #0113 Shared job error parsing ignores FastAPI `detail` responses and may consume plain-text bodies before fallback, changing visible backend error messages.

- 2026-07-24T21:42:16Z `issue`: Shared job error parsing ignores FastAPI `detail` responses and may consume plain-text bodies before fallback, changing visible backend error messages. [frontend/hooks/generation/useGenerationJob.ts]
- 2026-07-24T21:43:40Z `attempt`: Read non-OK response bodies once, preserving plain text while extracting existing JSON error fields. [frontend/hooks/generation/useGenerationJob.ts] (worked)
- 2026-07-24T21:43:58Z `fix`: Backend error bodies are preserved through single-read parsing; focused lifecycle suite passes. [frontend/hooks/generation/useGenerationJob.ts]
