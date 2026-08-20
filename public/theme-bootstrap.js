// Keep this key in sync with frontend/lib/theme.ts. This runs before the React bundle.
(function () {
  var theme = 'dark'

  try {
    var cachedTheme = window.localStorage.getItem('aivs.uiTheme.v1')
    if (cachedTheme === 'dark' || cachedTheme === 'light') {
      theme = cachedTheme
    }
  } catch (_error) {
    // Dark is the safe startup fallback.
  }

  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
})()
