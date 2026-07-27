# #0277 React 19 types expose nullable DOM refs incompatible with non-null RefObject contracts

- 2026-07-27T12:58:13Z `issue`: React 19 types expose nullable DOM refs incompatible with non-null RefObject contracts [frontend]
- 2026-07-27T12:58:18Z `attempt`: Ran immediate React 19 TypeScript gate; 31 assignments failed because prop/helper contracts omit DOM-ref nullability [frontend] (failed)
- 2026-07-27T13:04:08Z `attempt`: Updated every DOM RefObject prop/helper contract and compatibility cast to include mount-time nullability [frontend] (partial)
- 2026-07-27T13:04:19Z `attempt`: Reran React 19 TypeScript gate after nullable DOM ref contract migration; zero errors [frontend] (worked)
- 2026-07-27T13:04:22Z `fix`: React 19 DOM ref nullability is represented end-to-end in prop and helper contracts; TypeScript gate passes [frontend]
