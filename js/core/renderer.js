import { bindCentralEventPipeline } from './eventPipeline.js';

export function cssEscape(value) {
  const text = String(value ?? '');
  if (typeof window !== 'undefined' && window.CSS?.escape) return window.CSS.escape(text);
  return text.replace(/[\0-\x1F\x7F]|^-?\d|^-$|[^a-zA-Z0-9_-]/g, (char, index) => {
    if (char === '\0') return '\uFFFD';
    const hex = char.charCodeAt(0).toString(16).toUpperCase();
    return index === 0 || /[^a-zA-Z0-9_-]/.test(char) ? `\\${hex} ` : `\\${char}`;
  });
}

export function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function pressureBadge(r) {
  if (!r?.rating) return '';
  return `<span class="traffic traffic--${esc(r.rating.key)}" aria-label="${esc(r.rating.label || '')}"></span>`;
}

export function toggleNumericSign(value) {
  const raw = String(value ?? '').trim();
  if (!raw || raw === '0') return '-';
  return raw.startsWith('-') ? raw.slice(1) : `-${raw}`;
}

export function signedTempField(id, label, value, signAttribute = 'data-sign') {
  return `<div class="field field--signed-temp">
    <label for="${esc(id)}">${esc(label)}</label>
    <div class="control control--with-sign">
      <button type="button" tabindex="-1" class="sign-toggle" ${signAttribute}="${esc(id)}" aria-label="Vorzeichen umschalten">±</button>
      <input id="${esc(id)}" data-field="${esc(id)}" type="text" inputmode="decimal" value="${esc(value ?? '')}" placeholder="0" autocomplete="off">
      <span class="unit">°C</span>
    </div>
  </div>`;
}

export function stack(content, modifier = '') {
  return `<div class="tc-stack ${modifier}">${content}</div>`;
}

export function grid(content, cols = 2) {
  const cls = cols === 1 ? 'tc-fields tc-fields--1' : cols === 3 ? 'tc-fields tc-fields--3' : 'tc-fields';
  return `<div class="${cls}">${content}</div>`;
}

export function card(title, body, accent = 'blue', options = {}) {
  const compact = options.compact ? ' card--compact' : '';
  return `<section class="card card--accent-${esc(accent)}${compact}"><h2 class="card__title">${esc(title)}</h2><div class="card__body">${body}</div></section>`;
}

export function field({ id, label, unit = '', value = '', placeholder = '0', type = 'text', inputmode = 'decimal', disabled = false, readonly = false, unitField = '', unitOptions = [] }) {
  const unitHtml = unitOptions.length
    ? `<select class="unit unit-select" aria-label="Einheit" data-field="${esc(unitField)}" data-commit="immediate">${unitOptions.map(o => `<option value="${esc(o.value)}" ${o.value === unit ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`
    : unit ? `<span class="unit">${esc(unit)}</span>` : '';
  return `<div class="field"><label for="${esc(id)}">${esc(label)}</label><div class="control"><input id="${esc(id)}" data-field="${esc(id)}" type="${esc(type)}" inputmode="${esc(inputmode)}" value="${esc(value ?? '')}" placeholder="${esc(placeholder)}" ${disabled ? 'disabled' : ''} ${readonly ? 'readonly aria-readonly="true"' : ''} autocomplete="off">${unitHtml}</div></div>`;
}

export function selectField({ id, label, value, options, commit = 'immediate', lookup = true, render = '' }) {
  const commitAttr = commit ? ` data-commit="${esc(commit)}"` : '';
  const lookupAttr = lookup ? ' data-lookup="true"' : '';
  const renderAttr = render ? ` data-render="${esc(render)}"` : '';
  return `<div class="field"><label for="${esc(id)}">${esc(label)}</label><div class="control"><select id="${esc(id)}" data-field="${esc(id)}"${commitAttr}${lookupAttr}${renderAttr}>${options.map(o => `<option value="${esc(o.value)}" ${o.value === value ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select></div></div>`;
}

// Default central segment marker remains data-tc-action="segment" for legacy/global tests.
export function segmented(name, options, value, settings = {}) {
  const accent = settings.accent ? ` segmented--${esc(settings.accent)}` : '';
  const action = settings.action || 'segment';
  return `<div class="segmented${accent}" role="tablist">${options.map(o => `<button type="button" data-tc-action="${esc(action)}" data-segment="${esc(name)}" data-value="${esc(o.value)}" class="${o.value === value ? 'is-active' : ''}">${esc(o.label)}</button>`).join('')}</div>`;
}


export function inlineStats(items) {
  return `<div class="inline-stats">${items.map(item => `<div class="inline-stat"><span>${esc(item.label)}</span><strong>${esc(item.value ?? '—')}${item.unit ? ` <small>${esc(item.unit)}</small>` : ''}</strong></div>`).join('')}</div>`;
}

export function mainResult(title, main, details = [], accent = 'blue') {
  return card(title, `<div class="main-result"><span>${esc(main.label)}</span><strong>${esc(main.value ?? '—')}${main.unit ? ` <small>${esc(main.unit)}</small>` : ''}</strong></div>${inlineStats(details)}`, accent);
}

export function resultRows(rows) {
  return `<div class="result-list">${rows.map(r => `<div class="result-row"><span>${esc(r.label)}</span><strong>${esc(r.value ?? '—')}${r.unit ? ` <small>${esc(r.unit)}</small>` : ''}</strong></div>`).join('')}</div>`;
}

export function formCard(title, fields, accent = 'blue', cols = 2) {
  return card(title, grid(fields.join(''), cols), accent);
}

export function resultCard(title, rows, accent = 'blue') {
  return card(title, resultRows(rows), accent);
}

export function emptyCard(title, message, accent = 'blue') {
  return card(title, `<div class="empty-state">${message}</div>`, accent);
}


export function isMobileViewport() {
  return Boolean(
    window.matchMedia?.('(max-width: 768px)').matches ||
    window.visualViewport && Math.abs(window.innerHeight - window.visualViewport.height) > 80
  );
}

export function snapshotViewport(options = {}) {
  const doc = document.scrollingElement || document.documentElement;
  const anchor = options.anchor || findViewportAnchor(options.event?.target) || findViewportAnchor(document.activeElement);
  const anchorInfo = getAnchorSnapshot(anchor);
  return {
    x: window.scrollX || doc.scrollLeft || 0,
    y: window.scrollY || doc.scrollTop || 0,
    anchor: anchorInfo
  };
}

export function restoreViewport(snapshot) {
  if (!snapshot) return;
  if (snapshot.anchor?.selector) {
    const anchor = document.querySelector(snapshot.anchor.selector);
    if (anchor) {
      const currentTop = anchor.getBoundingClientRect().top;
      const delta = currentTop - snapshot.anchor.top;
      if (Math.abs(delta) > 1) {
        window.scrollTo(snapshot.x || 0, Math.max(0, (window.scrollY || 0) + delta));
        return;
      }
    }
  }
  window.scrollTo(snapshot.x || 0, snapshot.y || 0);
}

export function restoreViewportStable(snapshot, { frames = 3, delays = [40, 120] } = {}) {
  if (!snapshot) return;
  let remaining = Math.max(1, frames);
  const restoreFrame = () => {
    restoreViewport(snapshot);
    remaining -= 1;
    if (remaining > 0) requestAnimationFrame(restoreFrame);
  };
  requestAnimationFrame(restoreFrame);
  delays.forEach(delay => setTimeout(() => restoreViewport(snapshot), delay));
}

function findViewportAnchor(target) {
  if (!target?.closest) return null;
  return target.closest('[data-scroll-anchor], [data-line-card], [data-saved-record-card], .saved-record-card, [data-field], .module-view, main, #app');
}

function getAnchorSnapshot(anchor) {
  if (!anchor || !anchor.getBoundingClientRect) return null;
  const selector = getStableSelector(anchor);
  if (!selector) return null;
  return { selector, top: anchor.getBoundingClientRect().top };
}

function getStableSelector(element) {
  if (!element) return '';
  if (element.id) return `#${cssEscape(element.id)}`;
  if (element.matches?.('[data-field]')) return `[data-field="${cssEscape(element.dataset.field)}"]`;
  const loadAttr = [...element.attributes || []].find(attr => attr.name.startsWith('data-') && /load|saved/.test(attr.name) && attr.value);
  if (loadAttr) return `[${loadAttr.name}="${cssEscape(loadAttr.value)}"]`;
  if (element.matches?.('[data-line-card]')) {
    const indexed = stableNthOfType(element, '[data-line-card]');
    if (indexed) return indexed;
  }
  if (element.matches?.('.module-view') && element.dataset.module) return `.module-view[data-module="${cssEscape(element.dataset.module)}"]`;
  if (element.id === 'app') return '#app';
  return '';
}

function stableNthOfType(element, selector) {
  const parent = element.parentElement;
  if (!parent) return '';
  const parentSelector = parent.id ? `#${cssEscape(parent.id)}` : parent.classList?.length ? `.${[...parent.classList].map(cssEscape).join('.')}` : '';
  if (!parentSelector) return '';
  const index = [...parent.querySelectorAll(selector)].indexOf(element) + 1;
  return index > 0 ? `${parentSelector} > ${selector}:nth-of-type(${index})` : '';
}

export function shouldPreserveViewportForClick(target) {
  if (!target || !target.closest) return true;
  // Textfelder dürfen beim Fokussieren natürlich in den sichtbaren Bereich scrollen.
  if (target.closest('input, textarea, select, [contenteditable="true"]')) return false;
  // Interaktive Elemente werden gezielt ueber die jeweilige Aktion stabilisiert.
  // Die globale Klick-Restaurierung darf diese Aktionen nicht uebersteuern, sonst entstehen
  // verzögerte Rueckspruenge nach dem eigentlichen State-Render.
  if (target.closest('a[href], button, summary, details, [role="button"], [data-line-card], [data-saved-record-card], .saved-record-card, [data-allow-scroll]')) return false;
  return true;
}

export function bindNoClickScroll(root) {
  if (!root || root.__tcNoClickScrollBound) return;
  root.__tcNoClickScrollBound = true;
  let snapshot = null;
  let startPoint = null;
  const MOVE_CANCEL_PX = 8;

  const pointFromEvent = event => {
    const touch = event?.touches?.[0] || event?.changedTouches?.[0];
    const source = touch || event;
    if (!source) return null;
    return { x: Number(source.clientX || 0), y: Number(source.clientY || 0) };
  };

  const capture = event => {
    snapshot = shouldPreserveViewportForClick(event.target) ? snapshotViewport({ event, anchor: findViewportAnchor(event.target) }) : null;
    startPoint = snapshot ? pointFromEvent(event) : null;
  };

  const cancelIfMoved = event => {
    if (!snapshot || !startPoint) return;
    const point = pointFromEvent(event);
    if (!point) return;
    const dx = Math.abs(point.x - startPoint.x);
    const dy = Math.abs(point.y - startPoint.y);
    if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) {
      snapshot = null;
      startPoint = null;
    }
  };

  const cancelOnScroll = () => {
    snapshot = null;
    startPoint = null;
  };

  const restore = event => {
    if (!snapshot || !shouldPreserveViewportForClick(event.target)) return;
    const frames = isMobileViewport() ? 8 : 3;
    const delays = isMobileViewport() ? [16, 48, 120, 260] : [32, 96];
    restoreViewportStable(snapshot, { frames, delays });
    snapshot = null;
    startPoint = null;
  };

  root.addEventListener('pointerdown', capture, true);
  root.addEventListener('mousedown', capture, true);
  root.addEventListener('touchstart', capture, { capture: true, passive: true });
  root.addEventListener('pointermove', cancelIfMoved, { capture: true, passive: true });
  root.addEventListener('touchmove', cancelIfMoved, { capture: true, passive: true });
  root.addEventListener('scroll', cancelOnScroll, { capture: true, passive: true });
  root.addEventListener('click', restore, true);
}

export function preserveViewport(action, { frames = 3, blurActive = false, delays = [40, 120], anchor = null, event = null } = {}) {
  const mobile = isMobileViewport();
  const snapshot = snapshotViewport({ anchor: anchor || findViewportAnchor(event?.target), event });
  // Auf mobilen Browsern verursacht blur() bei geöffneter Bildschirmtastatur oft den größten Viewport-Sprung.
  // Deshalb wird dort nicht aktiv geblurt; Fokus wird über safeReplaceContent mit preventScroll restauriert.
  if (blurActive && !mobile) {
    try { document.activeElement?.blur?.(); } catch { /* ignore */ }
  }
  action?.();
  const stableFrames = mobile ? Math.max(frames, 10) : frames;
  const stableDelays = mobile ? uniqueDelays([0, 16, 48, 120, 260, 520, ...delays]) : delays;
  restoreViewportStable(snapshot, { frames: stableFrames, delays: stableDelays });
}

function uniqueDelays(values) {
  return [...new Set(values.filter(value => Number.isFinite(value) && value >= 0))].sort((a, b) => a - b);
}

export function renderModuleShell(module, inner) {
  return `<section class="module-view" data-module="${esc(module.id)}">
    <div class="module-content">${inner}</div>
  </section>`;
}

function markCommittedInteraction(root) {
  if (!root?.dataset) return;
  root.dataset.tcCommittedActionAt = String(Date.now());
}

function bindCommittedInteractionGuard(root) {
  if (!root || root.__tcCommittedInteractionGuardBound) return;
  root.__tcCommittedInteractionGuardBound = true;
  const selector = [
    'button',
    '[role="button"]',
    '[data-line-card]',
    '[data-saved-record-card]',
    '.saved-record-card',
    '[data-saved-load]',
    '[data-rainwater-select]',
    '[data-wastewater-select]',
    '[data-pipe-load]',
    '[data-buffer-select]',
    '[data-line-select]',
    '[data-vent-line-select]'
  ].join(',');
  const capture = event => {
    if (event.target?.closest?.(selector)) markCommittedInteraction(root);
  };
  root.addEventListener('pointerdown', capture, true);
  root.addEventListener('mousedown', capture, true);
  root.addEventListener('touchstart', capture, { capture: true, passive: true });
}

export function bindCommonInputs(root, state) {
  // hasUnrenderedInput, renderCommittedInput(), confirmBySurfaceTouch and event.key !== 'Enter' are now owned by the central event pipeline.
  bindCommittedInteractionGuard(root);
  bindCentralEventPipeline(root, state, { renderOnBlur: true });
}

