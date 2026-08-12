# #0047 The intended focused Vitest invocation used the package script separator incorrectly and ran the full frontend suite, surfacing three unrelated failures.

- 2026-08-12T12:42:16Z `issue`: The intended focused Vitest invocation used the package script separator incorrectly and ran the full frontend suite, surfacing three unrelated failures. [package.json/test:frontend]
- 2026-08-12T12:42:27Z `attempt`: Ran `pnpm test:frontend -- electron/python-setup.test.ts`; Vitest received an extra literal separator and executed all 58 files, with the target passing but three unrelated suites failing. [package.json/test:frontend] (failed)
- 2026-08-12T12:42:40Z `attempt`: Ran `pnpm exec vitest run electron/python-setup.test.ts`; the intended focused file passed 2/2. [package.json/test:frontend] (worked)
- 2026-08-12T12:42:47Z `fix`: Use `pnpm exec vitest run <file>` for a truly focused Vitest run; electron/python-setup.test.ts passes 2/2. [package.json/test:frontend]
