# #0196 Full pytest launched from repository root breaks inspector subprocess import because the test expects backend as its working directory

- 2026-07-26T12:57:10Z `issue`: Full pytest launched from repository root breaks inspector subprocess import because the test expects backend as its working directory [backend/tests/test_wangp_creation_inspector.py]
- 2026-07-26T12:57:38Z `attempt`: Reran pytest from backend working directory; inspector subprocess import passes and only timing assertions remain [backend/tests/test_wangp_creation_inspector.py] (worked)
- 2026-07-26T12:57:43Z `fix`: Full backend suite now runs from its expected backend working directory; inspector import regression passes [backend/tests/test_wangp_creation_inspector.py]
