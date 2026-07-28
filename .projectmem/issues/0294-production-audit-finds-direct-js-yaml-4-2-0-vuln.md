# #0294 Production audit finds direct js-yaml 4.2.0 vulnerable to quadratic merge-key CPU consumption

- 2026-07-27T14:19:10Z `issue`: Production audit finds direct js-yaml 4.2.0 vulnerable to quadratic merge-key CPU consumption [package.json; pnpm-lock.yaml]
- 2026-07-27T14:23:08Z `attempt`: Updated shared js-yaml graph to patched 4.3.0, removed unused direct js-yaml/type declarations, and reran production audit [package.json; pnpm-lock.yaml] (worked)
- 2026-07-27T14:23:15Z `fix`: Production dependency graph now resolves js-yaml 4.3.0 transitively; pnpm audit --prod reports no known vulnerabilities [package.json; pnpm-lock.yaml]
