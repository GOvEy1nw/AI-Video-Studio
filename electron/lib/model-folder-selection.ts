import { validatePath } from '../path-validation'

export function validateModelFolderSelection(value: string | null): string | null {
  return value === null ? null : validatePath(value, [])
}
