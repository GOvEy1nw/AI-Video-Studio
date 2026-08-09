# #0724 AIVS-043 cancelled Scenema manifests can leave completed runtime audio orphaned because the handler cannot clean the configured output root.

- 2026-08-09T11:29:47Z `issue`: AIVS-043 cancelled Scenema manifests can leave completed runtime audio orphaned because the handler cannot clean the configured output root. [backend/handlers/speech_generation_handler.py]
- 2026-08-09T11:37:20Z `attempt`: Added output-root-contained cancellation cleanup and regression coverage; focused backend run reached the new test, with 34 passing, but the fixture assumed its output directory did not already exist. [backend/services/wangp_bridge.py] (partial)
- 2026-08-09T11:37:31Z `attempt`: Made the cancellation regression fixture tolerate an existing pytest output directory; confirmation rerun is pending. [backend/tests/test_wangp_bridge.py] (partial)
- 2026-08-09T11:37:56Z `attempt`: Cancellation regression rerun exposed the shared test bridge's unavailable E: config path; the production cleanup was not reached. [backend/tests/test_wangp_bridge.py] (failed)
- 2026-08-09T11:38:06Z `attempt`: Scoped the cancellation regression bridge config directory to pytest's temp root; confirmation rerun is pending. [backend/tests/test_wangp_bridge.py] (partial)
- 2026-08-09T11:39:01Z `attempt`: Moved the new cancellation regression out of the middle of the existing Scenema mapping test after the rerun exposed the bad patch anchor; confirmation pending. [backend/tests/test_wangp_bridge.py] (partial)
- 2026-08-09T11:43:53Z `fix`: WanGP manifest cancellation now deletes reported outputs only when they resolve beneath the configured output root; focused mapping and containment regression tests pass. [backend/services/wangp_bridge.py]
