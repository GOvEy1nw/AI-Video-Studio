# #0380 Targeted rg query failed because unescaped JSX brace was parsed as regex quantifier

- 2026-07-29T14:10:26Z `issue`: Targeted rg query failed because unescaped JSX brace was parsed as regex quantifier [gallery investigation]
- 2026-07-29T14:10:39Z `attempt`: Searched JSX/card-size terms with one regex; unescaped cardSize={ caused rg parse failure [gallery investigation] (failed)
- 2026-07-29T14:22:06Z `fix`: Re-ran targeted source search with separate escaped expressions and completed gallery investigation [gallery investigation]
