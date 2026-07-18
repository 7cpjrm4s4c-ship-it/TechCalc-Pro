import { trackGlobalEventListener } from './eventManager.js';

const EDITABLE_SELECTOR = [
  '#app input',
  '#app select',
  '#app textarea',
  '#projectPdfSettings input',
  '#projectPdfSettings textarea'
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

function isRelevantUserEdit(event) {
  return event?.isTrusted !== false && Boolean(event.target?.matches?.(EDITABLE_SELECTOR));
}

export function initializeUnsavedWorkGuard() {
  if (initialized || typeof window === 'undefined' || typeof document === 'undefined') return;
  initialized = true;

  ['input', 'change'].forEach(eventName => {
    trackGlobalEventListener(document, eventName, event => {
      if (isRelevantUserEdit(event)) markUnsavedWork();
    }, true);
  });

  trackGlobalEventListener(document, 'techcalc-project-saved', clearUnsavedWork);
  trackGlobalEventListener(document, 'techcalc-project-loaded', clearUnsavedWork);

  trackGlobalEventListener(window, 'beforeunload', event => {
    if (!hasUnsavedWork()) return;
    event.preventDefault();
    event.returnValue = 'Der aktuelle Arbeitsstand wurde noch nicht als Projektdatei gespeichert.';
    return event.returnValue;
  }, { capture: true });
}

export default initializeUnsavedWorkGuard;
