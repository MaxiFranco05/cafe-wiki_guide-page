/**
 * Initializes and guarantees the Dark-Only Kitchen Theme across the application.
 * Ensures data-theme="dark" and colorScheme="dark" on the root document element,
 * cleans up any light-mode classes or legacy localStorage overrides.
 */
export function initDarkTheme(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;

  // Enforce dark theme data attribute
  root.setAttribute('data-theme', 'dark');

  // Enforce browser dark color scheme
  root.style.colorScheme = 'dark';

  // Clean up any stray light classes
  root.classList.remove('light', 'theme-light');

  // Ensure localStorage is aligned to dark-only
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', 'dark');
    }
  } catch {
    // Ignore storage errors in restricted iframe/private mode environments
  }
}
