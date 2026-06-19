const THEME_STORAGE_KEY = 'techcalc-theme-mode';
const SUPPORTED_THEME_MODES = new Set(['dark', 'light', 'system']);

function getSafeStorageValue(storage, key) {
  try {
    return storage?.getItem(key) || '';
  } catch (error) {
    console.warn('Theme-Einstellung konnte nicht gelesen werden.', error);
    return '';
  }
}

function setSafeStorageValue(storage, key, value) {
  try {
    storage?.setItem(key, value);
  } catch (error) {
    console.warn('Theme-Einstellung konnte nicht gespeichert werden.', error);
  }
}

export function normalizeThemeMode(mode = 'system') {
  return SUPPORTED_THEME_MODES.has(mode) ? mode : 'system';
}

export function getCurrentTheme() {
  return normalizeThemeMode(
    getSafeStorageValue(localStorage, THEME_STORAGE_KEY)
      || getSafeStorageValue(sessionStorage, THEME_STORAGE_KEY)
      || 'system'
  );
}

export function applyTheme(mode = getCurrentTheme(), root = document.documentElement) {
  const value = normalizeThemeMode(mode);

  if (value === 'system') {
    root?.removeAttribute('data-theme');
  } else {
    root?.setAttribute('data-theme', value);
  }

  setSafeStorageValue(localStorage, THEME_STORAGE_KEY, value);
  setSafeStorageValue(sessionStorage, THEME_STORAGE_KEY, value);

  document.querySelectorAll('.theme-switch__option').forEach(item => {
    const active = item.dataset.theme === value;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-pressed', String(active));
  });

  return value;
}

export function toggleTheme() {
  const current = getCurrentTheme();
  return applyTheme(current === 'dark' ? 'light' : 'dark');
}

let themeControllerInitialized = false;

export function initializeThemeController({ root = document } = {}) {
  applyTheme(getCurrentTheme(), document.documentElement);

  if (themeControllerInitialized) return;
  themeControllerInitialized = true;

  root.querySelectorAll('.theme-switch__option').forEach(button => {
    button.addEventListener('click', () => {
      applyTheme(button.dataset.theme || 'system');
    });
  });
}
