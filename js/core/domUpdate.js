import { restoreFocus as restorePlatformFocus } from './focusManager.js';
export function safeReplaceContent(root, html, options = {}) {
  if (!root) return false;
  const next = String(html ?? '');
  // The HTML cache is only valid when the actual DOM still contains the same
  // markup. Some migrated reference modules still write via root.innerHTML, and
  // the global router also writes a loading placeholder directly. If the cache
  // alone is trusted, a later module mount can skip the replacement and leave
  // "Modul wird geladen..." visible forever.
  if (root.__tcLastHtml === next && root.innerHTML === next) return false;

  const active = document.activeElement;
  const activeKey = active && root.contains(active) ? getStableKey(active) : null;
  const selection = captureSelection(active, root);

  root.innerHTML = next;
  root.__tcLastHtml = next;

  if (options.restoreFocus !== false && activeKey) {
    restoreFocus(root, activeKey, selection);
  }
  return true;
}

function getStableKey(element) {
  return element?.id || element?.dataset?.field || element?.name || null;
}

function captureSelection(active, root) {
  if (!active || !root.contains(active)) return null;
  if (!('selectionStart' in active)) return null;
  return {
    start: active.selectionStart,
    end: active.selectionEnd,
    value: active.value
  };
}

function restoreFocus(root, key, selection) {
  const selector = `[id="${cssEscape(key)}"], [data-field="${cssEscape(key)}"], [name="${cssEscape(key)}"]`;
  const next = root.querySelector(selector);
  if (!next || next.disabled) return;
  // Do not restore focus to native select elements. On mobile Safari/Chrome this
  // can reopen the picker after a render and makes lookup selections appear to
  // require a second screen tap. Text inputs still keep their caret normally.
  if (next.tagName === 'SELECT') return;
  try {
    restorePlatformFocus(next);
    if (selection && 'setSelectionRange' in next && next.value === selection.value) {
      next.setSelectionRange(selection.start, selection.end);
    }
  } catch { /* ignore focus restoration failures */ }
}

function cssEscape(value) {
  if (window.CSS?.escape) return window.CSS.escape(value);
  return String(value).replace(/"/g, '\\"');
}
