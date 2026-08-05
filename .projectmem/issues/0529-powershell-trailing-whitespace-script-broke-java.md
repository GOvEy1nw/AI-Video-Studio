# #0529 PowerShell trailing-whitespace script broke JavaScript template parsing because command contained backticks

- 2026-08-04T12:57:48Z `issue`: PowerShell trailing-whitespace script broke JavaScript template parsing because command contained backticks [audit validation tooling]
- 2026-08-04T12:57:52Z `attempt`: Embedded PowerShell backtick escape inside JavaScript template literal; exec parser failed before shell ran [audit validation tooling] (failed)
- 2026-08-04T12:58:08Z `attempt`: Rewrote PowerShell formatting without backticks; validation script executed successfully [audit validation tooling] (worked)
- 2026-08-04T12:58:11Z `fix`: Avoid PowerShell backticks inside JavaScript template-literal tool commands [audit validation tooling]
