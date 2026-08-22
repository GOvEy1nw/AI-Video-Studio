# #0191 Reading the required orchestrate skill in one call exceeded the context output limit and was truncated.

- 2026-08-21T12:13:41Z `issue`: Reading the required orchestrate skill in one call exceeded the context output limit and was truncated. [tooling/orchestrate-skill-read]
- 2026-08-21T12:14:14Z `attempt`: Read the 332-line orchestrate skill in three bounded chunks to avoid the output cap. [tooling/orchestrate-skill-read] (worked)
- 2026-08-21T12:14:17Z `fix`: The required orchestrate workflow was fully loaded by chunking the skill file. [tooling/orchestrate-skill-read]
