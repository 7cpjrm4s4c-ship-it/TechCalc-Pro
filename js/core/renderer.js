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

export function field({ id, label, unit = '', value = '', placeholder = '0', type = 'text', inputmode = 'decimal', disabled = false, unitField = '', unitOptions = [] }) {
  const unitHtml = unitOptions.length
    ? `<select class="unit unit-select" aria-label="Einheit" data-field="${esc(unitField)}">${unitOptions.map(o => `<option value="${esc(o.value)}" ${o.value === unit ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`
    : unit ? `<span class="unit">${esc(unit)}</span>` : '';
  return `<div class="field"><label for="${esc(id)}">${esc(label)}</label><div class="control"><input id="${esc(id)}" data-field="${esc(id)}" type="${esc(type)}" inputmode="${esc(inputmode)}" value="${esc(value ?? '')}" placeholder="${esc(placeholder)}" ${disabled ? 'disabled' : ''} autocomplete="off">${unitHtml}</div></div>`;
}

export function selectField({ id, label, value, options }) {
  return `<div class="field"><label for="${esc(id)}">${esc(label)}</label><div class="control"><select id="${esc(id)}" data-field="${esc(id)}">${options.map(o => `<option value="${esc(o.value)}" ${o.value === value ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select></div></div>`;
}

export function segmented(name, options, value, settings = {}) {
  const accent = settings.accent ? ` segmented--${esc(settings.accent)}` : '';
  return `<div class="segmented${accent}" role="tablist">${options.map(o => `<button type="button" data-segment="${esc(name)}" data-value="${esc(o.value)}" class="${o.value === value ? 'is-active' : ''}">${esc(o.label)}</button>`).join('')}</div>`;
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


export function snapshotViewport() {
  const doc = document.scrollingElement || document.documentElement;
  return { x: window.scrollX || doc.scrollLeft || 0, y: window.scrollY || doc.scrollTop || 0 };
}

export function restoreViewport(snapshot) {
  if (!snapshot) return;
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

export function shouldPreserveViewportForClick(target) {
  if (!target || !target.closest) return true;
  // Textfelder dürfen beim Fokussieren natürlich in den sichtbaren Bereich scrollen.
  if (target.closest('input, textarea, select, [contenteditable="true"]')) return false;
  // Explizite Navigation/Links dürfen ihr natives Verhalten behalten.
  if (target.closest('a[href], [data-allow-scroll]')) return false;
  return true;
}

export function bindNoClickScroll(root) {
  if (!root || root.__tcNoClickScrollBound) return;
  root.__tcNoClickScrollBound = true;
  let snapshot = null;
  const capture = event => {
    snapshot = shouldPreserveViewportForClick(event.target) ? snapshotViewport() : null;
  };
  const restore = event => {
    if (!snapshot || !shouldPreserveViewportForClick(event.target)) return;
    restoreViewportStable(snapshot, { frames: 3, delays: [32, 96] });
    snapshot = null;
  };
  root.addEventListener('pointerdown', capture, true);
  root.addEventListener('mousedown', capture, true);
  root.addEventListener('touchstart', capture, true);
  root.addEventListener('click', restore, true);
}

export function preserveViewport(action, { frames = 3, blurActive = false, delays = [40, 120] } = {}) {
  const snapshot = snapshotViewport();
  if (blurActive) {
    try { document.activeElement?.blur?.(); } catch { /* ignore */ }
  }
  action?.();
  restoreViewportStable(snapshot, { frames, delays });
}

export function renderModuleShell(module, inner) {
  return `<section class="module-view" data-module="${esc(module.id)}">
    <div class="module-content">${inner}</div>
  </section>`;
}

export function bindCommonInputs(root, state) {
  let pendingRender = null;

  const commitField = (el, options = {}) => {
    if (!el?.dataset?.field) return;
    state.set({ [el.dataset.field]: el.value }, options);
  };

  const scheduleRenderAfterEditing = () => {
    if (pendingRender) cancelAnimationFrame(pendingRender);
    pendingRender = requestAnimationFrame(() => {
      const active = document.activeElement;
      const committedActionAt = Number(root?.dataset?.tcCommittedActionAt || 0);
      // Klicks auf Aktionsbuttons sollen zuerst die Eingabe übernehmen und dann die Aktion ausführen.
      // Der Blur-Render wird in diesem kurzen Fenster unterdrückt, damit der Click nicht verloren geht.
      if (committedActionAt && Date.now() - committedActionAt < 500) return;
      // Beim Wechsel per Klick oder Tab in das nächste Eingabefeld nicht sofort neu rendern.
      // Dadurch bleibt der Fokus stabil und die Desktop-UX wirkt nicht ruckelig.
      if (active && root.contains(active) && active.matches('[data-field]')) return;
      state.set({}, { notify: true });
    }, 0);
  };

  root.querySelectorAll('[data-field]').forEach(el => {
    if (el.matches('input')) {
      // Während der Eingabe kein Re-Render: mobile Tastatur bleibt offen und Tab-Wechsel bleibt stabil.
      el.addEventListener('input', () => commitField(el, { notify: false }));
      el.addEventListener('change', () => {
        commitField(el, { notify: false });
        scheduleRenderAfterEditing();
      });
      el.addEventListener('blur', () => {
        commitField(el, { notify: false });
        scheduleRenderAfterEditing();
      });
      el.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        commitField(el, { notify: false });
        state.set({}, { notify: true });
      });
    } else {
      el.addEventListener('change', () => commitField(el));
    }
  });
  root.querySelectorAll('[data-segment]').forEach(btn => {
    btn.addEventListener('click', () => state.set({ [btn.dataset.segment]: btn.dataset.value }));
  });
}
