import { trackGlobalEventListener } from '../../core/eventManager.js';

const SETTINGS_UI_STORAGE_KEY = 'techcalc-settings-ui';

function readStorageJson(key, fallback = {}) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (error) {
    console.warn('Gespeicherte UI-Einstellungen konnten nicht geladen werden.', error);
    return fallback;
  }
}

function writeStorageJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('UI-Einstellungen konnten nicht gespeichert werden.', error);
  }
}

let settingsControllerInitialized = false;

export function initializeSettingsController({
  settingsButton = document.getElementById('settingsButton'),
  settingsPanel = document.getElementById('settingsPanel'),
  closeSettings = document.getElementById('closeSettings'),
  ensurePdfExport = () => Promise.resolve()
} = {}) {
  if (settingsControllerInitialized) return;
  settingsControllerInitialized = true;

  const settingsBody = settingsPanel?.querySelector('.settings-panel__body');
  let settingsScrollY = 0;
  let lastFocusedElement = null;

  function isSettingsOpen() {
    return Boolean(settingsPanel?.classList.contains('is-open'));
  }

  function lockPageScroll() {
    settingsScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.documentElement.classList.add('settings-open');
    document.body.classList.add('settings-open');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${settingsScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  }

  function unlockPageScroll() {
    document.documentElement.classList.remove('settings-open');
    document.body.classList.remove('settings-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo(0, settingsScrollY || 0);
  }

  function closeAllSubmenus(except = null) {
    settingsPanel?.querySelectorAll('.settings-submenu').forEach(details => {
      if (details !== except) details.open = false;
    });
  }

  function restoreSettingsUiState() {
    const state = readStorageJson(SETTINGS_UI_STORAGE_KEY, {});
    if (!settingsPanel) return;
    settingsPanel.querySelectorAll('.settings-submenu').forEach(details => {
      details.open = details.dataset.settingsIndex === state.openSubmenu;
    });
  }

  function saveSettingsOpenSubmenu(details) {
    if (!details?.open) return;
    const current = readStorageJson(SETTINGS_UI_STORAGE_KEY, {});
    writeStorageJson(SETTINGS_UI_STORAGE_KEY, {
      ...current,
      openSubmenu: details.dataset.settingsIndex
    });
  }

  function setSettingsOpen(open) {
    if (!settingsPanel || !settingsButton) return;

    if (open) {
      restoreSettingsUiState();
      lastFocusedElement = document.activeElement;
      settingsPanel.hidden = false;
      settingsPanel.removeAttribute('hidden');
      settingsPanel.classList.add('is-open');
      settingsButton.setAttribute('aria-expanded', 'true');
      settingsPanel.setAttribute('aria-modal', 'true');
      lockPageScroll();
      ensurePdfExport();
      requestAnimationFrame(() => {
        settingsBody?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        closeSettings?.focus?.({ preventScroll: true });
      });
      return;
    }

    settingsPanel.classList.remove('is-open');
    settingsPanel.hidden = true;
    settingsPanel.setAttribute('hidden', '');
    settingsButton.setAttribute('aria-expanded', 'false');
    settingsPanel.removeAttribute('aria-modal');
    unlockPageScroll();
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus({ preventScroll: true });
    }
  }

  // Defensive cleanup in case an older cached build left the app locked.
  settingsPanel?.classList.remove('is-open');
  unlockPageScroll();
  setSettingsOpen(false);

  settingsButton?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    setSettingsOpen(!isSettingsOpen());
  });

  closeSettings?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    setSettingsOpen(false);
  });

  settingsPanel?.addEventListener('click', event => {
    event.stopPropagation();
  });

  settingsPanel?.querySelectorAll('.settings-submenu').forEach((details, index) => {
    details.dataset.settingsIndex = String(index);
  });

  settingsPanel?.querySelectorAll('.settings-submenu').forEach(details => {
    details.addEventListener('toggle', () => {
      if (!details.open) return;
      saveSettingsOpenSubmenu(details);
      closeAllSubmenus(details);
      requestAnimationFrame(() => {
        const body = settingsBody;
        if (!body) return;
        const summary = details.querySelector('summary');
        const bodyRect = body.getBoundingClientRect();
        const detailsRect = details.getBoundingClientRect();
        const summaryRect = summary?.getBoundingClientRect() || detailsRect;
        const bottomOverflow = detailsRect.bottom - bodyRect.bottom + 24;
        const topOverflow = bodyRect.top - summaryRect.top + 10;
        if (topOverflow > 0) body.scrollBy({ top: -topOverflow, behavior: 'smooth' });
        else if (bottomOverflow > 0) body.scrollBy({ top: bottomOverflow, behavior: 'smooth' });
        if (details.offsetHeight > body.clientHeight) summary?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      });
    });
  });

  trackGlobalEventListener(document, 'click', event => {
    if (!isSettingsOpen()) return;
    if (event.target.closest('#settingsButton') || event.target.closest('#settingsPanel')) return;
    setSettingsOpen(false);
  });

  trackGlobalEventListener(document, 'keydown', event => {
    if (event.key === 'Escape') setSettingsOpen(false);
  });

  // iOS/Safari: lock the app background; only the drawer body is scrollable.
  trackGlobalEventListener(document, 'touchmove', event => {
    if (!isSettingsOpen()) return;
    const panel = event.target.closest('#settingsPanel');
    const scrollHost = event.target.closest('.settings-panel__body');
    if (panel && scrollHost && scrollHost.scrollHeight > scrollHost.clientHeight) return;
    event.preventDefault();
  }, { passive: false });
}

export default initializeSettingsController;
