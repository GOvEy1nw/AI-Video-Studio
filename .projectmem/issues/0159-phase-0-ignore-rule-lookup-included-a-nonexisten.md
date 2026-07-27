# #0159 Phase 0 ignore-rule lookup included a nonexistent backend/.gitignore path; repository uses only the root .gitignore.

- 2026-07-26T10:27:26Z `issue`: Phase 0 ignore-rule lookup included a nonexistent backend/.gitignore path; repository uses only the root .gitignore. [.gitignore]
- 2026-07-26T10:27:30Z `attempt`: Searched both root and assumed backend ignore files; backend/.gitignore does not exist, while source discovery succeeded. [.gitignore] (partial)
- 2026-07-26T10:27:46Z `attempt`: Repeated the ignore-rule check against the actual root .gitignore; confirmed no diagnostics rule exists yet. [.gitignore] (worked)
- 2026-07-26T10:27:52Z `fix`: Ignore-rule inspection now targets the repository's single root .gitignore; no repository change was needed to resolve the lookup error. [.gitignore]
