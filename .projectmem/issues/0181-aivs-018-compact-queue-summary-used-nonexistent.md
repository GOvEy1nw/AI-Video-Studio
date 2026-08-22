# #0181 AIVS-018 compact queue summary used nonexistent profileId fields on music, SFX, and speech request types; TypeScript typecheck fails.

- 2026-08-21T10:01:42Z `issue`: AIVS-018 compact queue summary used nonexistent profileId fields on music, SFX, and speech request types; TypeScript typecheck fails. [frontend/hooks/use-generation.ts]
- 2026-08-21T10:02:22Z `attempt`: Switched music, SFX, and speech summary lookup to their existing modelProfileId request field; TypeScript typecheck passes. [frontend/hooks/use-generation.ts] (worked)
- 2026-08-21T10:02:23Z `fix`: Queue summaries now use the typed modelProfileId fields for all audio admissions. [frontend/hooks/use-generation.ts]
