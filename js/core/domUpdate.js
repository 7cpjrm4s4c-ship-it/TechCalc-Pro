import { restoreFocus as restorePlatformFocus } from './focusManager.js';

const KEYBOARD_SELECT_RESTORE_WINDOW_MS = 350;
let keyboardSelectSnapshot = null;

function stableKey(element) {
  return element?.id || element?.dataset?.field || element?.name || null;
}

function rememberKeyboardSelect(event) {
  const select = event?.target?.closest?.('select');
  if (!select) return;
  keyboardSelectSnapshot = {
    element: select,
    key: stableKey(select),
    at: Date.now()
  };
}

function clearKeyboardSelectSnapshot() {
  keyboardSelectSnapshot = null;
}

function recentKeyboardSelect(root, active) {
  const snapshot = keyboardSelectSnapshot;
  if (!snapshot?.key || Date.now() - snapshot.at > KEYBOARD_SELECT_RESTORE_WINDOW_MS) return null;
  if (!root?.contains?.(snapshot.element)) return null;
  if (active && active !== document.body && active !== snapshot.element) return null;
  return snapshot;
}

if (typeof document !== 'undefined' && document?.addEventListener) {
  document.addEventListener('keydown', rememberKeyboardSelect, true);
  document.addEventListener('pointerdown', clearKeyboardSelectSnapshot, true);
  document.addEventListener('touchstart', clearKeyboardSelectSnapshot, true);
}

export function safeReplaceContent(root, html, options = {}) {
  if (!root || root.__tcReplacingContent) return false;
  if (root.isConnected === false) return false;
  const next = String(html ?? '');
  // The HTML cache is only valid when the actual DOM still contains the same
  // markup. Some migrated reference modules still write via root.innerHTML, and
  // the global router also writes a loading placeholder directly. If the cache
  // alone is trusted, a later module mount can skip the replacement and leave
  // "Modul wird geladen..." visible forever.
  if (root.__tcLastHtml === next && root.innerHTML === next) return false;

  const active = document.activeElement;
  const activeKey = active && root.contains(active) ? stableKey(active) : null;
  const keyboardSelect = recentKeyboardSelect(root, active);
  const focusKey = activeKey || keyboardSelect?.key || null;
  const selection = captureSelection(active, root);

  try {
    root.__tcReplacingContent = true;
    root.innerHTML = next;
    root.__tcLastHtml = next;
  } catch (error) {
    // Browser-runtime guard: blur/focus handlers can synchronously mutate a
    // dynamic island while another replacement is in progress. In that case the
    // original anchor is no longer a child of this node. Do not escalate this to
    // an uncaught console error; the next scheduled render will reconcile the
    // current state.
    if (error?.name !== 'NotFoundError' && !/no longer a child/i.test(String(error?.message || ''))) {
      throw error;
    }
    return false;
  } finally {
    root.__tcReplacingContent = false;
  }

  if (options.restoreFocus !== false && focusKey) {
    restoreFocus(root, focusKey, selection, { allowSelect: Boolean(keyboardSelect) });
  }
  if (keyboardSelect) clearKeyboardSelectSnapshot();
  return true;
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

function restoreFocus(root, key, selection, options = {}) {
  const selector = `[id="${cssEscape(key)}"], [data-field="${cssEscape(key)}"], [name="${cssEscape(key)}"]`;
  const next = root.querySelector(selector);
  if (!next || next.disabled) return;
  // Native select focus restoration remains disabled for pointer/touch-driven
  // commits because mobile Safari/Chrome can reopen the picker after a render.
  // A recent keyboard interaction on the same select is safe to restore and is
  // required to keep the central Tab/Enter traversal chain intact.
  if (next.tagName === 'SELECT' && options.allowSelect !== true) return;
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
