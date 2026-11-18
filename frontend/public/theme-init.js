// Applies the saved theme before first paint (external file so the CSP can forbid inline scripts).
try {
  var saved = localStorage.getItem('stickyboard-theme')
  var dark = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.classList.toggle('dark', dark)
} catch (e) {
  /* storage unavailable: fall back to the default theme */
}
