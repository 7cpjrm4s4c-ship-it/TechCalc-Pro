import { logger } from '../../core/logger.js';
import { trackGlobalEventListener } from '../../core/eventManager.js';
import { initializeUnsavedWorkGuard } from '../../core/unsavedWorkGuard.js';

const SETTINGS_UI_STORAGE_KEY = 'techcalc-settings-ui';
const CORPORATE_BLOCK_FIELD_IDS = [
  'pdfCompanyName',
  'pdfCompanyAddress',
  'pdfDocumentVersion',
  'pdfCheckedBy',
  'pdfApprovedBy'
];

function readStorageJson(key, fallback = {}) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (error) {
    logger.warn('Gespeicherte UI-Einstellungen konnten nicht geladen werden.', error, { module: 'settings' });
    return fallback;
  }
}
function writeStorageJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    logger.warn('UI-Einstellungen konnten nicht gespeichert werden.', error, { module: 'settings' });
  }
}

function removeSettingsControlById(id) {
  const element = document.getElementById(id);
  if (!element) return;
  const removable = element.closest('label') || element.closest('.settings-actions') || element;
  removable.remove();
}

function ensureTechCalcBrandingControl(projectSettings) {
  if (!projectSettings || document.getElementById('pdfShowTechCalcBranding')) return;
  const input = document.createElement('input');
  input.id = 'pdfShowTechCalcBranding';
  input.type = 'checkbox';
  input.checked = true;
  input.setAttribute('aria-label', 'TechCalc-Branding im PDF anzeigen');

  const label = document.createElement('label');
  label.append('TechCalc-Branding im PDF anzeigen');
  label.append(input);

  const anchor = projectSettings.querySelector('#pdfCompanyLogoStatus')
    || projectSettings.querySelector('#pdfCompanyLogoPreview')
    || projectSettings.querySelector('#pdfCompanyLogo')?.closest('label')
    || null;
  if (anchor) anchor.insertAdjacentElement('afterend', label);
  else projectSettings.append(label);
}

function normalizeProjectSettingsPanel(settingsPanel) {
  const projectSettings = settingsPanel?.querySelector('#projectPdfSettings');
  if (!projectSettings) return;
  const description = projectSettings.querySelector('p');
  if (description) {
    description.textContent = 'Die Projektdaten gelten für die Kopfzeile der PDF-Ausgabe und für gespeicherte Projektdateien. Firmenlogo und TechCalc-Branding werden im PDF-Header gesteuert.';
  }
  CORPORATE_BLOCK_FIELD_IDS.forEach(removeSettingsControlById);
  ensureTechCalcBrandingControl(projectSettings);
}

let settingsControllerInitialized = false;
export function initializeSettingsController({
  settingsButton = document.getElementById('settingsButton'),
  settingsPanel = document.getElementById('settingsPanel'),
  closeSettings = document.getElementById('closeSettings'),
  ensurePdfExport = () => Promise.resolve()
} = {}) {
  initializeUnsavedWorkGuard();
  if (settingsControllerInitialized) return;
  settingsControllerInitialized = true;
  normalizeProjectSettingsPanel(settingsPanel);
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
  function setSubmenuOpenState(details, open) {
    if (!details) return;
    details.open = Boolean(open);
    details.classList.toggle('is-open', Boolean(open));
    details.setAttribute('aria-expanded', String(Boolean(open)));
  }
  function closeAllSubmenus(except = null) {
    settingsPanel?.querySelectorAll('.settings-submenu').forEach(details => {
      if (details !== except) setSubmenuOpenState(details, false);
    });
  }
  function clearPersistedOpenSubmenu() {
    const current = readStorageJson(SETTINGS_UI_STORAGE_KEY, {});
    const { openSubmenu, ...rest } = current;
    writeStorageJson(SETTINGS_UI_STORAGE_KEY, rest);
  }
  function restoreSettingsUiState() {
    const state = readStorageJson(SETTINGS_UI_STORAGE_KEY, {});
    if (!settingsPanel) return;
    settingsPanel.querySelectorAll('.settings-submenu').forEach(details => {
      setSubmenuOpenState(details, details.dataset.settingsIndex === state.openSubmenu);
    });
  }
  function saveSettingsOpenSubmenu(details) {
    const current = readStorageJson(SETTINGS_UI_STORAGE_KEY, {});
    if (!details?.open) {
      if (current.openSubmenu === details?.dataset?.settingsIndex) {
        const { openSubmenu, ...rest } = current;
        writeStorageJson(SETTINGS_UI_STORAGE_KEY, rest);
      }
      return;
    }
    writeStorageJson(SETTINGS_UI_STORAGE_KEY, {
      ...current,
      openSubmenu: details.dataset.settingsIndex
    });
  }
  function scrollSubmenuIntoView(details, mode = 'nearest') {
    const body = settingsBody;
    if (!body || !details || !body.contains(details)) return;
    const summary = details.querySelector('summary') || details;
    const targetTop = details.offsetTop - body.offsetTop - 8;
    if (mode === 'start') {
      body.scrollTo({ top: Math.max(0, targetTop), left: 0, behavior: 'auto' });
      return;
    }
    const bodyRect = body.getBoundingClientRect();
    const detailsRect = details.getBoundingClientRect();
    const summaryRect = summary.getBoundingClientRect();
    const topOverflow = bodyRect.top - summaryRect.top + 8;
    const bottomOverflow = detailsRect.bottom - bodyRect.bottom + 24;
    if (details.offsetHeight >= body.clientHeight) {
      body.scrollTo({ top: Math.max(0, targetTop), left: 0, behavior: 'auto' });
      return;
    }
    if (topOverflow > 0) body.scrollBy({ top: -topOverflow, left: 0, behavior: 'auto' });
    else if (bottomOverflow > 0) body.scrollBy({ top: bottomOverflow, left: 0, behavior: 'auto' });
    requestAnimationFrame(() => {
      const nextBodyRect = body.getBoundingClientRect();
      const nextDetailsRect = details.getBoundingClientRect();
      const nextBottomOverflow = nextDetailsRect.bottom - nextBodyRect.bottom + 96;
      if (nextBottomOverflow > 0 && nextDetailsRect.height < body.clientHeight) {
        body.scrollBy({ top: nextBottomOverflow, left: 0, behavior: 'auto' });
      }
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
        const openSubmenu = settingsPanel.querySelector('.settings-submenu[open]');
        if (openSubmenu) scrollSubmenuIntoView(openSubmenu, 'start');
        else settingsBody?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        closeSettings?.focus?.({ preventScroll: true });
      });
      return;
    }
    closeAllSubmenus();
    clearPersistedOpenSubmenu();
    settingsBody?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
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
    details.classList.toggle('is-open', details.open);
    details.setAttribute('aria-expanded', String(Boolean(details.open)));
    details.addEventListener('toggle', () => {
      setSubmenuOpenState(details, details.open);
      saveSettingsOpenSubmenu(details);
      if (!details.open) return;
      closeAllSubmenus(details);
      requestAnimationFrame(() => scrollSubmenuIntoView(details, 'nearest'));
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
  trackGlobalEventListener(document, 'touchmove', event => {
    if (!isSettingsOpen()) return;
    const panel = event.target.closest('#settingsPanel');
    const scrollHost = event.target.closest('.settings-panel__body');
    if (panel && scrollHost && scrollHost.scrollHeight > scrollHost.clientHeight) return;
    event.preventDefault();
  }, { passive: false });
}
export default initializeSettingsController;
