export type UiTheme = 'dark' | 'light'

export const DEFAULT_UI_THEME: UiTheme = 'dark'
// Keep this in sync with public/theme-bootstrap.js, which must remain dependency-free.
export const UI_THEME_STORAGE_KEY = 'aivs.uiTheme.v1'

export function isUiTheme(value: unknown): value is UiTheme {
  return value === 'dark' || value === 'light'
}

export function readCachedUiTheme(): UiTheme {
  try {
    const cachedTheme = window.localStorage.getItem(UI_THEME_STORAGE_KEY)
    return isUiTheme(cachedTheme) ? cachedTheme : DEFAULT_UI_THEME
  } catch {
    return DEFAULT_UI_THEME
  }
}

export function writeCachedUiTheme(theme: UiTheme): void {
  try {
    window.localStorage.setItem(UI_THEME_STORAGE_KEY, theme)
  } catch {
    // A blocked storage area must not prevent an immediate theme change.
  }
}

export function applyUiTheme(theme: UiTheme): void {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}
