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
  'select[data-field]:not([disabled])'
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
  return getFocusableElements(root, PLATFORM_FIELD_SELECTOR);
}

export function focusNext(root, current, options = {}) {
  const fields = options.fields || getPlatformFields(root);
  if (!fields.length) return false;
  const index = fields.indexOf(current);
  const direction = options.direction === 'previous' ? -1 : 1;
  const nextIndex = index >= 0 ? index + direction : 0;
  const next = fields[nextIndex];
  if (!next) return false;
  const applyFocus = () => safeFocus(next, { preventScroll: true, select: options.select !== false });
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
  if (!current?.matches?.('[data-field]')) return false;
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
  if (!current?.matches?.('[data-field]')) return false;
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
  handlePlatformFieldNavigation
});
