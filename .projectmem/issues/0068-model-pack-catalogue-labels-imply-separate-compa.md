# #0068 Model-pack catalogue labels imply separate compact/Turbo bases even though Base and Turbo share each family’s full base model set

- 2026-08-13T15:17:19Z `issue`: Model-pack catalogue labels imply separate compact/Turbo bases even though Base and Turbo share each family’s full base model set [electron/python-setup.ts]
- 2026-08-13T15:18:29Z `attempt`: Removed model-construction wording from all four catalogue entries; they now display only the family Base/Turbo names with no separate compact/base-plus-LoRA size description [electron/python-setup.ts] (worked)
- 2026-08-13T15:18:35Z `fix`: Model Manager now presents only LTX 2.5 Base/Turbo and MiniMax H3 Base/Turbo; both variants retain the same family base models and Turbo is distinguished only by LoRA/settings [electron/python-setup.ts]
