# #0113 context-mode ctx_execute_file blocked the user-attached log because the attachment path is outside the AiVS project root

- 2026-08-19T11:58:44Z `issue`: context-mode ctx_execute_file blocked the user-attached log because the attachment path is outside the AiVS project root [investigation/tooling]
- 2026-08-19T11:58:52Z `attempt`: Tried processing the attached pasted-text log with ctx_execute_file; workspace-root confinement rejected the external attachment path [investigation/tooling] (failed)
- 2026-08-19T12:00:52Z `attempt`: Retried attached-log analysis with ctx_execute reading the absolute attachment path; extracted the request failure and stack trace [investigation/tooling] (worked)
- 2026-08-19T12:00:52Z `fix`: Use ctx_execute with an absolute path to process user attachments that ctx_execute_file rejects outside the workspace root [investigation/tooling]
