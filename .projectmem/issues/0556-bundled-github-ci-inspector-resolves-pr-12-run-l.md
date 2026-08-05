# #0556 Bundled GitHub CI inspector resolves PR #12 run logs against upstream repository and returns 404

- 2026-08-05T08:48:20Z `issue`: Bundled GitHub CI inspector resolves PR #12 run logs against upstream repository and returns 404 [github gh-fix-ci inspect_pr_checks.py]
- 2026-08-05T08:48:28Z `attempt`: Ran bundled CI inspector against PR URL; it found Windows frontend toolchain failure but queried deepbeepmeep/LTX-Desktop-WanGP run endpoint and got HTTP 404 [github gh-fix-ci inspect_pr_checks.py] (failed)
- 2026-08-05T08:49:44Z `attempt`: Used gh commands with explicit --repo GOvEy1nw/AI-Video-Studio; retrieved PR #12 failure and matching dev-base failure logs [GitHub Actions runs 30990111121 and 30831282701] (worked)
- 2026-08-05T08:49:48Z `fix`: Explicit gh --repo fallback retrieves CI logs when bundled inspector resolves upstream incorrectly [GitHub CI inspection workflow]
