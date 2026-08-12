# #0053 Focused pytest commands fail from repository root because backend tests are resolved relative to backend/

- 2026-08-12T17:00:07Z `issue`: Focused pytest commands fail from repository root because backend tests are resolved relative to backend/ [backend/tests/test_settings.py]
- 2026-08-12T17:00:11Z `attempt`: Ran backend test paths from repository root rather than backend working directory [backend/tests] (failed)
- 2026-08-12T17:01:19Z `fix`: Reran focused backend tests from backend/; settings and bridge suites passed [backend/tests]
