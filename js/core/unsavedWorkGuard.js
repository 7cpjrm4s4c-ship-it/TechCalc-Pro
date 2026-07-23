import { trackGlobalEventListener } from './eventManager.js';

const EDITABLE_SELECTOR = [
  '#app input',
  '#app select',
  '#app textarea',
  '#app [contenteditable="true"]',
  '#projectPdfSettings input',
  '#projectPdfSettings select',
  '#projectPdfSettings textarea'
].join(',');

const MUTATING_ACTION_SELECTOR = [
  '#app button:not([data-module-id])',
  '#app [role="button"]',
  '#projectPdfSettings button'
].join(',');

let dirty = false;
let initialized = false;

export function hasUnsavedWork() {
  return dirty;
}

export function markUnsavedWork() {
  dirty = true;
}

export function clearUnsavedWork() {
  dirty = false;
}

function isEditableChange(event) {
  return Boolean(event.target?.matches?.(EDITABLE_SELECTOR));
}

function isMutatingAction(event) {
  const action = event.target?.closest?.(MUTATING_ACTION_SELECTOR);
  if (!action) return false;
  if (action.disabled || action.getAttribute('aria-disabled') === 'true') return false;
  return !action.matches('[data-nonmutating], [data-action="cancel"], [data-action="close"]');
}

export function applyBeforeUnloadGuard(event) {
  if (!hasUnsavedWork()) return undefined;
  event.preventDefault?.();
  event.returnValue = '';
  return '';
}

export function initializeUnsavedWorkGuard() {
  if (initialized || typeof window === 'undefined' || typeof document === 'undefined') return;
  initialized = true;

  ['input', 'change'].forEach(eventName => {
    trackGlobalEventListener(document, eventName, event => {
      if (isEditableChange(event)) markUnsavedWork();
    }, true);
  });

  trackGlobalEventListener(document, 'click', event => {
    if (isMutatingAction(event)) markUnsavedWork();
  }, true);

  trackGlobalEventListener(document, 'techcalc-project-dirty', markUnsavedWork);
  trackGlobalEventListener(document, 'techcalc-project-saved', clearUnsavedWork);
  trackGlobalEventListener(document, 'techcalc-project-loaded', clearUnsavedWork);
  trackGlobalEventListener(document, 'techcalc-project-reset', clearUnsavedWork);

  trackGlobalEventListener(window, 'beforeunload', applyBeforeUnloadGuard);
}

export default initializeUnsavedWorkGuard;
