# #0182 AIVS-018 profile-label lookup added required provider dependencies to isolated useGeneration and GenSpaceModeTabs tests, breaking focused tests.

- 2026-08-21T10:04:30Z `issue`: AIVS-018 profile-label lookup added required provider dependencies to isolated useGeneration and GenSpaceModeTabs tests, breaking focused tests. [frontend/hooks/use-generation.test.tsx]
- 2026-08-21T10:07:33Z `attempt`: Mocked the newly required profile/settings contexts only in existing isolated tests; queue panel plus focused queue/selected-generation/settings tests pass 15/15. [frontend/hooks/use-generation.test.tsx] (worked)
- 2026-08-21T10:07:33Z `fix`: Isolated tests now provide the narrow context values required by queue summary labels and Quick Gen theme controls. [frontend/hooks/use-generation.test.tsx]
