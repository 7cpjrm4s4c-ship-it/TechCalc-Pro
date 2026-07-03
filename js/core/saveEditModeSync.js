const SAVE_SELECTORS = [
  '[data-line-save]',
  '[data-dw-add-unit]',
  '[data-dw-add-single]'
].join(',');

const UPDATE_SELECTORS = [
  '[data-line-update]',
  '[data-dw-update-unit]',
  '[data-dw-update-single]'
].join(',');

function hasActiveRecord(panel) {
  return Boolean(panel?.querySelector?.(
    '.saved-record-card.is-active, .line-section-card.is-active, [data-saved-record-card].is-active, [data-line-card].is-active'
  ));
}

function setDisabled(button, disabled) {
  if (!button) return;
  button.disabled = Boolean(disabled);
  if (disabled) {
    button.setAttribute('disabled', '');
    button.setAttribute('aria-disabled', 'true');
  } else {
    button.removeAttribute('disabled');
    button.setAttribute('aria-disabled', 'false');
  }
}

export function syncSaveEditMode(root = document) {
  const scope = root?.querySelectorAll ? root : document;
  scope.querySelectorAll('.tc-save-actions').forEach(actions => {
    const panel = actions.closest('.tc-saved-record-panel, .card, .tc-card, section, article') || actions.parentElement;
    const active = hasActiveRecord(panel);
    actions.querySelectorAll(SAVE_SELECTORS).forEach(button => setDisabled(button, active));
    actions.querySelectorAll(UPDATE_SELECTORS).forEach(button => setDisabled(button, !active));
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
      attributeFilter: ['class', 'disabled', 'aria-disabled', 'data-saved-record-id', 'data-line-select']
    });
  }

  schedule();
}
