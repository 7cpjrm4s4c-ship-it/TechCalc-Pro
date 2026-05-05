export function card(title, body, accent = 'blue') { return `<section class="card card--accent-${accent}"><h2 class="card__title">${title}</h2>${body}</section>`; }
export function field({ id, label, unit = '', value = '', placeholder = '0', type = 'number', disabled = false }) {
  return `<div class="field"><label for="${id}">${label}</label><div class="control"><input id="${id}" data-field="${id}" type="${type}" value="${value ?? ''}" placeholder="${placeholder}" ${disabled?'disabled':''}>${unit ? `<span class="unit">${unit}</span>`:''}</div></div>`;
}
export function selectField({ id, label, value, options }) {
  return `<div class="field"><label for="${id}">${label}</label><div class="control"><select id="${id}" data-field="${id}">${options.map(o=>`<option value="${o.value}" ${o.value===value?'selected':''}>${o.label}</option>`).join('')}</select></div></div>`;
}
export function segmented(name, options, value) {
  return `<div class="segmented" role="tablist">${options.map(o=>`<button type="button" data-segment="${name}" data-value="${o.value}" class="${o.value===value?'is-active':''}">${o.label}</button>`).join('')}</div>`;
}
export function resultRows(rows) {
  return `<div class="result-list">${rows.map(r=>`<div class="result-row"><span>${r.label}</span><strong>${r.value ?? '—'} ${r.unit ? `<small>${r.unit}</small>`:''}</strong></div>`).join('')}</div>`;
}
export function renderModuleShell(module, inner) {
  return `<section class="module-view grid-12" data-module="${module.id}"><div class="module-head"><div><h1>${module.title}</h1><p>${module.description ?? ''}</p></div><span class="badge">${module.group ?? 'HLSK'}</span></div>${inner}</section>`;
}
export function bindCommonInputs(root, state, calculateAndRender) {
  root.querySelectorAll('[data-field]').forEach(el => {
    el.addEventListener('input', () => state.set({ [el.dataset.field]: el.value }));
    el.addEventListener('change', () => state.set({ [el.dataset.field]: el.value }));
  });
  root.querySelectorAll('[data-segment]').forEach(btn => btn.addEventListener('click', () => state.set({ [btn.dataset.segment]: btn.dataset.value })));
  state.subscribe(calculateAndRender);
}
