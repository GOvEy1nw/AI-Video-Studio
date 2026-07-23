# #0072 New model trigger imports ReactNode from lucide-react instead of React.

- 2026-07-22T18:58:54Z `issue`: New model trigger imports ReactNode from lucide-react instead of React. [frontend/components/ModelDropdownTrigger.tsx:1]
- 2026-07-22T18:59:00Z `attempt`: Added the shared rich model trigger, then caught its ReactNode type imported from the icon package. [frontend/components/ModelDropdownTrigger.tsx] (partial)
- 2026-07-22T19:01:40Z `attempt`: Corrected ReactNode to import from React; TypeScript reached unrelated user-edited ReframePanel code with no model-trigger type errors. [frontend/components/ModelDropdownTrigger.tsx] (worked)
- 2026-07-22T19:01:48Z `fix`: ModelDropdownTrigger now imports ReactNode from React and type-checks. [frontend/components/ModelDropdownTrigger.tsx]
