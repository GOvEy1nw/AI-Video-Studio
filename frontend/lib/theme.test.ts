import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applyUiTheme,
  DEFAULT_UI_THEME,
  isUiTheme,
  readCachedUiTheme,
  UI_THEME_STORAGE_KEY,
  writeCachedUiTheme,
} from './theme'

describe('theme helpers', () => {
  afterEach(() => {
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.colorScheme = ''
    vi.restoreAllMocks()
  })

  it('accepts only supported themes', () => {
    expect(isUiTheme('dark')).toBe(true)
    expect(isUiTheme('light')).toBe(true)
    expect(isUiTheme('system')).toBe(false)
  })

  it('uses dark for missing, invalid, or unavailable cached values', () => {
    expect(readCachedUiTheme()).toBe(DEFAULT_UI_THEME)
    window.localStorage.setItem(UI_THEME_STORAGE_KEY, 'system')
    expect(readCachedUiTheme()).toBe(DEFAULT_UI_THEME)
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    expect(readCachedUiTheme()).toBe(DEFAULT_UI_THEME)
  })

  it('caches and applies the selected theme at the document root', () => {
    writeCachedUiTheme('light')
    expect(readCachedUiTheme()).toBe('light')

    applyUiTheme('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(document.documentElement.style.colorScheme).toBe('light')

    applyUiTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('keeps theme changes safe when cached storage is unavailable', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => { throw new Error('blocked') })

    expect(() => writeCachedUiTheme('light')).not.toThrow()
  })
})
