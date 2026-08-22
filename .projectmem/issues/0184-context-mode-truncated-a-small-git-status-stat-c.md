# #0184 context-mode truncated a small git status/stat capture instead of returning the requested concise output

- 2026-08-21T10:12:27Z `issue`: context-mode truncated a small git status/stat capture instead of returning the requested concise output [tooling/context-mode]
- 2026-08-21T10:12:38Z `attempt`: used direct git status because its bounded output is safe to inspect [tooling/context-mode] (worked)
- 2026-08-21T10:12:43Z `fix`: worked around the context-mode truncation with a bounded direct status command [tooling/context-mode]
