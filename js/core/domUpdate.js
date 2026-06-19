import { restoreFocus as restorePlatformFocus } from './focusManager.js';
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
  const activeKey = active && root.contains(active) ? getStableKey(active) : null;
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
