const FOCUSABLE_SELECTOR = [
  'input:not([type="hidden"]):not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  'button:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]'
].join(',');

const PLATFORM_FIELD_SELECTOR = [
  'input[data-field]:not([type="hidden"]):not([disabled])',
  'textarea[data-field]:not([disabled])',
  'select[data-field]:not([disabled])',
  '[data-platform-focus]:not([disabled])'
].join(',');

function isElementVisible(element) {
  if (!element) return false;
  if (element.hidden || element.getAttribute?.('aria-hidden') === 'true') return false;
  if (typeof getComputedStyle === 'function') {
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
  }
  if (element.closest?.('[hidden], [aria-hidden="true"]')) return false;
  return true;
}

function closedDetailsAncestor(element) {
  const details = element?.closest?.('details:not([open])');
  if (!details) return null;
  const summary = details.querySelector?.('summary');
  if (summary && summary.contains?.(element)) return null;
  return details;
}

function isPlatformFieldReachable(element) {
  if (!element || element.tabIndex < 0) return false;
  if (isElementVisible(element)) return true;
  const details = closedDetailsAncestor(element);
  if (!details) return false;

  // Allow fields hidden only because their parent details is closed.
  // Still reject explicitly hidden/aria-hidden elements or nested hidden wrappers.
  if (element.hidden || element.getAttribute?.('aria-hidden') === 'true') return false;
  const hiddenContainer = element.closest?.('[hidden], [aria-hidden="true"]');
  if (hiddenContainer && hiddenContainer !== details) return false;
  return true;
}

function openClosedDetailsForField(element) {
  const details = closedDetailsAncestor(element);
  if (!details) return false;
  details.open = true;
  try {
    details.dispatchEvent?.(new Event('toggle', { bubbles: true }));
  } catch { /* toggle event is best-effort */ }
  return true;
}

export function safeFocus(element, options = {}) {
  if (!element || typeof element.focus !== 'function') return false;
  const focusOptions = { preventScroll: options.preventScroll !== false };
  try {
    element.focus(focusOptions);
  } catch {
    try { element.focus(); } catch { return false; }
  }
  if (options.select && typeof element.select === 'function' && element.tagName !== 'SELECT') {
    try { element.select(); } catch { /* ignore selection failures */ }
  }
  return true;
}

export function blurActiveElement(root = document) {
  const active = typeof document !== 'undefined' ? document.activeElement : null;
  if (!active || active === document.body) return false;
  if (root?.contains && !root.contains(active)) return false;
  try { active.blur(); return true; } catch { return false; }
}

export function getFocusableElements(root = document, selector = FOCUSABLE_SELECTOR) {
  if (!root?.querySelectorAll) return [];
  return [...root.querySelectorAll(selector)].filter(element => {
    if (element.tabIndex < 0) return false;
    return isElementVisible(element);
  });
}

export function getPlatformFields(root = document) {
  if (!root?.querySelectorAll) return [];
  return [...root.querySelectorAll(PLATFORM_FIELD_SELECTOR)].filter(isPlatformFieldReachable);
}

export function focusNext(root, current, options = {}) {
  const fields = options.fields || getPlatformFields(root);
  if (!fields.length) return false;
  const index = fields.indexOf(current);
  const direction = options.direction === 'previous' ? -1 : 1;
  const nextIndex = index >= 0 ? index + direction : 0;
  const next = fields[nextIndex];
  if (!next) return false;

  const applyFocus = () => {
    openClosedDetailsForField(next);
    return safeFocus(next, { preventScroll: true, select: options.select !== false });
  };

  if (options.defer === false) return applyFocus();
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(applyFocus);
  else setTimeout(applyFocus, 0);
  return true;
}


export function shouldHandleEnterNavigation(event) {
  if (!event || event.key !== 'Enter') return false;
  if (event.altKey || event.ctrlKey || event.metaKey) return false;
  return true;
}

export function shouldHandleTabNavigation(event) {
  if (!event || event.key !== 'Tab') return false;
  if (event.altKey || event.ctrlKey || event.metaKey) return false;
  return true;
}

export function focusByEnter(root, current, options = {}) {
  if (!current?.matches?.('[data-field], [data-platform-focus]')) return false;
  const direction = options.direction || (options.event?.shiftKey ? 'previous' : 'next');
  return focusNext(root, current, {
    direction: direction === 'previous' ? 'previous' : 'next',
    select: options.select !== false,
    defer: options.defer
  });
}

export function handleEnterNavigation(root, current, event, options = {}) {
  if (!shouldHandleEnterNavigation(event)) return false;
  if (options.preventDefault !== false) event?.preventDefault?.();
  return focusByEnter(root, current, { ...options, event });
}

export function focusByTab(root, current, options = {}) {
  if (!current?.matches?.('[data-field], [data-platform-focus]')) return false;
  const direction = options.direction || (options.event?.shiftKey ? 'previous' : 'next');
  return focusNext(root, current, {
    direction: direction === 'previous' ? 'previous' : 'next',
    select: options.select !== false,
    defer: options.defer
  });
}

export function handleTabNavigation(root, current, event, options = {}) {
  if (!shouldHandleTabNavigation(event)) return false;
  if (options.preventDefault !== false) event?.preventDefault?.();
  return focusByTab(root, current, { ...options, event });
}

export function handlePlatformFieldNavigation(root, current, event, options = {}) {
  if (shouldHandleEnterNavigation(event)) return handleEnterNavigation(root, current, event, options);
  if (shouldHandleTabNavigation(event)) return handleTabNavigation(root, current, event, options);
  return false;
}


export function captureActiveField(root = document, options = {}) {
  const active = typeof document !== 'undefined' ? document.activeElement : null;
  if (!active || active === document.body) return null;
  if (root?.contains && !root.contains(active)) return null;
  const field = active.closest?.('[data-field]') || active;
  if (!field?.matches?.('[data-field]')) return null;
  const key = field.dataset.field || field.id || field.name || null;
  if (!key) return null;
  const fields = getPlatformFields(root);
  const index = fields.indexOf(field);
  return {
    key,
    index,
    tagName: field.tagName,
    value: 'value' in field ? field.value : null,
    selectionStart: 'selectionStart' in field ? field.selectionStart : null,
    selectionEnd: 'selectionEnd' in field ? field.selectionEnd : null,
    select: options.select === true
  };
}

function findFieldBySnapshot(root, snapshot) {
  if (!root?.querySelector || !snapshot) return null;
  const escaped = cssEscape(snapshot.key);
  const byKey = root.querySelector(`[data-field="${escaped}"], [id="${escaped}"], [name="${escaped}"]`);
  if (byKey && byKey.matches?.('[data-field]') && !byKey.disabled && isElementVisible(byKey)) return byKey;
  const fields = getPlatformFields(root);
  if (snapshot.index >= 0 && fields[snapshot.index]) return fields[snapshot.index];
  return null;
}

export function restoreCapturedField(root = document, snapshot, options = {}) {
  const next = findFieldBySnapshot(root, snapshot);
  if (!next) return false;
  if (options.skipSelect !== false && next.tagName === 'SELECT') return false;
  const restored = safeFocus(next, { preventScroll: true, select: snapshot.select && options.select !== false });
  if (!restored) return false;
  if (snapshot && 'setSelectionRange' in next && next.value === snapshot.value && Number.isFinite(snapshot.selectionStart) && Number.isFinite(snapshot.selectionEnd)) {
    try { next.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd); } catch { /* ignore */ }
  }
  return true;
}

export function preserveFocusDuring(root = document, mutate, options = {}) {
  const snapshot = captureActiveField(root, options);
  const result = typeof mutate === 'function' ? mutate() : undefined;
  const restore = () => {
    if (snapshot && options.restoreFocus !== false) restoreCapturedField(root, snapshot, options);
  };
  if (result && typeof result.then === 'function') {
    return result.finally(() => {
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(restore);
      else setTimeout(restore, 0);
    });
  }
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(restore);
  else setTimeout(restore, 0);
  return result;
}

function cssEscape(value) {
  if (typeof window !== 'undefined' && window.CSS?.escape) return window.CSS.escape(value);
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function restoreFocus(element, options = {}) {
  return safeFocus(element, { preventScroll: true, ...options });
}

export const PlatformFocusManager = Object.freeze({
  safeFocus,
  restoreFocus,
  blurActiveElement,
  getFocusableElements,
  getPlatformFields,
  focusNext,
  shouldHandleEnterNavigation,
  shouldHandleTabNavigation,
  focusByEnter,
  handleEnterNavigation,
  focusByTab,
  handleTabNavigation,
  handlePlatformFieldNavigation,
  captureActiveField,
  restoreCapturedField,
  preserveFocusDuring
});
