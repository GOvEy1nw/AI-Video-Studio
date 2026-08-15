# #0059 context-mode execute unexpectedly lost the AiVS working directory and could not read backend/model_profiles/profiles.py

- 2026-08-13T13:13:36Z `issue`: context-mode execute unexpectedly lost the AiVS working directory and could not read backend/model_profiles/profiles.py [investigation/tooling]
- 2026-08-13T13:13:46Z `attempt`: Retried source inspection with an absolute AiVS path; context-mode read the intended profile source successfully [investigation/tooling] (worked)
- 2026-08-13T13:13:51Z `fix`: Use absolute workspace paths when context-mode loses the repository working directory [investigation/tooling]
