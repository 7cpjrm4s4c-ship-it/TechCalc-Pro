const SAVE_SELECTORS = [
  '[data-line-save]',
  '[data-dw-add-unit]',
  '[data-dw-add-single]',
  '[data-tc-action$=":save"]',
  '[data-tc-action$=":add"]',
  '[data-tc-action*="save"]'
].join(',');

const UPDATE_SELECTORS = [
  '[data-line-update]',
  '[data-dw-update-unit]',
  '[data-dw-update-single]',
  '[data-tc-action$=":update"]',
  '[data-tc-action*="update"]'
].join(',');
function hasActiveRecord(panel) {
  if (!panel?.querySelector) return false;
  return Boolean(panel.querySelector(
    [
      '.saved-record-card.is-active',
      '.line-section-card.is-active',
      '[data-saved-record-card].is-active',
      '[data-line-card].is-active',
      '.saved-record-card[aria-current="true"]',
      '.line-section-card[aria-current="true"]',
      '.saved-record-card[aria-selected="true"]',
      '.line-section-card[aria-selected="true"]',
      '[data-selected="true"].saved-record-card',
      '[data-selected="true"].line-section-card'
    ].join(',')
  ));
}
function actionButtons(actions, explicitSelectors, fallbackPattern) {
  const explicit = [...actions.querySelectorAll(explicitSelectors)];
  if (explicit.length) return explicit;
  return [...actions.querySelectorAll('button')].filter(button => fallbackPattern.test((button.textContent || '').trim()));
}

function setButtonRole(button, role) {
  if (!button) return;
  button.dataset.saveModeRole = role;
}
function setDisabled(button, disabled, { secondaryWhenDisabled = false } = {}) {
  if (!button) return;
  const isDisabled = Boolean(disabled);
  button.disabled = isDisabled;
  button.toggleAttribute('disabled', isDisabled);
  button.setAttribute('aria-disabled', String(isDisabled));
  button.classList.toggle('is-disabled', isDisabled);
  button.classList.toggle('is-enabled', !isDisabled);
  button.classList.toggle('action-button--secondary', secondaryWhenDisabled && isDisabled);
  button.dataset.enabled = String(!isDisabled);
}

export function syncSaveEditMode(root = document) {
  const scope = root?.querySelectorAll ? root : document;
  scope.querySelectorAll('.tc-save-actions').forEach(actions => {
    const panel = actions.closest('.tc-saved-record-panel, .card, .tc-card, section, article') || actions.parentElement;
    const active = hasActiveRecord(panel);
    actions.dataset.editMode = active ? 'edit' : 'create';
    const saveButtons = actionButtons(actions, SAVE_SELECTORS, /^Speichern$/i);
    const updateButtons = actionButtons(actions, UPDATE_SELECTORS, /^Aktualisieren$/i);
    saveButtons.forEach(button => { setButtonRole(button, 'save'); setDisabled(button, active); });
    updateButtons.forEach(button => { setButtonRole(button, 'update'); setDisabled(button, !active, { secondaryWhenDisabled: true }); });
  });
}
export function initializeSaveEditModeSync(root = document) {
  if (!root || root.__tcSaveEditModeSyncInitialized) return;
  root.__tcSaveEditModeSyncInitialized = true;

  let raf = 0;
  const schedule = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      syncSaveEditMode(root);
    });
  };

  ['click', 'pointerup', 'keyup', 'change', 'input', 'techcalc-project-loaded'].forEach(eventName => {
    root.addEventListener?.(eventName, schedule, true);
  });
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(schedule);
    observer.observe(root === document ? document.documentElement : root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'disabled', 'aria-disabled', 'aria-current', 'aria-selected', 'data-selected', 'data-saved-record-id', 'data-line-select']
    });
  }

  schedule();
}
