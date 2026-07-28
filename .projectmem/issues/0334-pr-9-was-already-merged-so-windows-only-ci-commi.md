# #0334 PR #9 was already merged, so Windows-only CI commit d3d9fdc pushed only to stale feature branch and did not reach dev or trigger CI

- 2026-07-28T08:07:30Z `issue`: PR #9 was already merged, so Windows-only CI commit d3d9fdc pushed only to stale feature branch and did not reach dev or trigger CI [chore/dependency-modernisation-2026 / PR #9]
- 2026-07-28T08:09:25Z `attempt`: Fetched merged dev, created fresh codex/windows-only-ci from origin/dev, and cherry-picked CI cleanup plus audit records cleanly [codex/windows-only-ci] (partial)
- 2026-07-28T08:12:03Z `attempt`: Pushed dev-based replacement branch, opened draft PR #11, and hosted Windows frontend workflow passed run 30341303522 [codex/windows-only-ci / PR #11] (worked)
- 2026-07-28T08:12:06Z `fix`: Windows-only CI cleanup now targets dev through draft PR #11 with passing hosted Windows validation [codex/windows-only-ci / PR #11]
