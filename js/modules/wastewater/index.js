import config from './config.js';
import { state, initialState } from './state.js';
import { calculate, getFixture, toNumber } from './logic.js';
import { fixtureTypes, usageTypes } from './tables.js';
import { card, field, selectField, segmented, renderModuleShell, stack, grid, mainResult, resultRows, inlineStats, esc } from '../../core/renderer.js';
import { mountModule } from '../../core/mount.js';
import { fmt, fmtInput } from '../../utils/calculations.js';
import { bindEditModeClear } from '../../core/savedRecords.js';

const opts = items => items.map(([value, label]) => ({ value, label }));
const fixtureOptions = fixtureTypes.map(item => ({ value: item.id, label: item.name }));
const usageOptions = usageTypes.map(item => ({ value: item.value, label: item.label }));

const fmtDecimalInput = (value, digits = 1) => {
  if (value === '' || value === null || value === undefined) return '';
  const n = toNumber(value);
  if (!Number.isFinite(n)) return String(value ?? '');
  return n.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};
const fmtStateNumber = (value, digits = 1) => {
  if (value === '' || value === null || value === undefined) return '—';
  const n = toNumber(value);
  if (!Number.isFinite(n)) return String(value ?? '—');
  return n.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

function lineTypeLabel(value) {
  return {
    'single-unvented': 'Einzelanschluss unbelüftet',
    'single-vented': 'Einzelanschluss belüftet',
    'branch-unvented': 'Anschlussleitung unbelüftet',
    'branch-vented': 'Anschlussleitung belüftet',
    stack: 'Fallleitung',
    collector: 'Sammelleitung',
    'ground-inside': 'Grundleitung innen',
    'ground-outside': 'Grundleitung außen',
    'ground-full': 'Grundleitung Vollfüllung',
    ventilation: 'Lüftungsleitung'
  }[value] || value;
}

function lineFamilyValue(lineType) {
  if (String(lineType).startsWith('single-')) return 'single';
  if (String(lineType).startsWith('branch-')) return 'branch';
  return lineType || 'single-unvented';
}
function lineVentilationValue(lineType) {
  return String(lineType).endsWith('-vented') && !String(lineType).endsWith('unvented') ? 'vented' : 'unvented';
}
function resolveLineType(family, ventilation, previous = 'single-unvented') {
  if (family === 'single') return ventilation === 'vented' ? 'single-vented' : 'single-unvented';
  if (family === 'branch') return ventilation === 'vented' ? 'branch-vented' : 'branch-unvented';
  return family || previous;
}
function miniSegment(buttons) {
  return `<div class="segmented segmented--green" role="tablist">${buttons.map(btn => `<button type="button" ${btn.attr}="${esc(btn.value)}" class="${btn.active ? 'is-active' : ''}">${esc(btn.label)}</button>`).join('')}</div>`;
}
function lineTypeSelector(s) {
  const family = lineFamilyValue(s.lineType);
  const ventilation = lineVentilationValue(s.lineType);
  const families = [
    ['single', 'Einzelanschluss'],
    ['branch', 'Anschlussleitung'],
    ['stack', 'Fallleitung'],
    ['collector', 'Sammelleitung'],
    ['ground-inside', 'Grund innen'],
    ['ground-outside', 'Grund außen'],
    ['ground-full', 'Vollfüllung'],
    ['ventilation', 'Lüftung']
  ];
  const blocks = [miniSegment(families.map(([value, label]) => ({ attr:'data-line-family', value, label, active: family === value })) )];
  if (family === 'single' || family === 'branch') {
    blocks.push(`<div class="wastewater-subselect"><span>Ausführung</span>${miniSegment([
      { attr:'data-line-ventilation', value:'unvented', label:'unbelüftet', active: ventilation === 'unvented' },
      { attr:'data-line-ventilation', value:'vented', label:'belüftet', active: ventilation === 'vented' }
    ])}</div>`);
  }
  return blocks.join('');
}

function savedSnapshot(s, r) {
  const saved = Array.isArray(s.savedCalculations) ? s.savedCalculations : [];
  const copy = { ...s };
  delete copy.savedCalculations;
  delete copy.activeCalculationId;
  return {
    id: s.activeCalculationId || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: s.name?.trim() || `Schmutzwasser ${saved.length + 1}`,
    createdAt: s.activeCalculationId ? (saved.find(x => x.id === s.activeCalculationId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    state: copy,
    result: { qtot: r.qtot, qww: r.qww, sumDu: r.sumDu, dn: r.selected?.dn, lineType: s.lineType }
  };
}
function clearedInputs(current = {}) {
  return { ...initialState, savedCalculations: current.savedCalculations || [] };
}
function savedRows(s) {
  const items = Array.isArray(s.savedCalculations) ? s.savedCalculations : [];
  if (!items.length) return '<div class="empty-state empty-state--compact">Noch keine Schmutzwasser-Berechnungen gespeichert.</div>';
  return `<div class="ph-saved-list">${items.map(item => {
    const r = item.result || {};
    const active = String(s.activeCalculationId || '') === String(item.id);
    const subtitle = [`${fmt(r.qtot || 0,2)} l/s`, r.dn, lineTypeLabel(r.lineType)].filter(Boolean).join(' · ');
    return `<article class="ph-saved-item line-section-card is-collapsed ${active ? 'is-active' : ''}" data-line-card data-wastewater-select="${esc(item.id)}">
      <div class="line-section-card__head">
        <div class="line-section-card__title"><strong>${esc(item.name || 'Berechnung')}</strong><small>${esc(subtitle)}</small></div>
        <button type="button" class="line-section-card__toggle" data-line-toggle aria-expanded="false" aria-label="Gespeicherte Berechnung aufklappen"><span>▾</span></button>
        <button type="button" class="line-section-card__delete" data-wastewater-delete="${esc(item.id)}" aria-label="Berechnung löschen">×</button>
      </div>
      <div class="line-section-card__body">${resultRows([
        { label:'Qtot', value:fmt(r.qtot || 0,2), unit:'l/s' },
        { label:'Qww', value:fmt(r.qww || 0,2), unit:'l/s' },
        { label:'ΣDU', value:fmt(r.sumDu || 0,1), unit:'l/s' },
        { label:'Empfohlene DN', value:r.dn || '—' }
      ])}</div>
    </article>`;
  }).join('')}</div>`;
}
function fixturesTable(s, r) {
  if (!r.fixtures.length) return '<div class="empty-state empty-state--compact">Noch keine Entwässerungsgegenstände hinzugefügt.</div>';
  return `<div class="wastewater-compact-list">${r.fixtures.map(item => {
    const custom = item.base.custom;
    const selector = selectField({ id:`fixture-type-${item.id}`, label:'Gegenstand', value:item.typeId, options:fixtureOptions })
      .replaceAll('data-field="fixture-type-', 'data-fixture-field="typeId" data-field-disabled="fixture-type-');
    const qty = field({ id:`fixture-qty-${item.id}`, label:'Anzahl', value:item.quantity || '1', unit:'Stk.' })
      .replaceAll('data-field="fixture-qty-', 'data-fixture-field="quantity" data-field-disabled="fixture-qty-');
    const customFields = custom ? `<div class="wastewater-compact-row__custom">${grid([
      field({ id:`fixture-name-${item.id}`, label:'Bezeichnung', value:item.customName || '', placeholder:'z. B. Laborbecken', inputmode:'text' }).replaceAll('data-field="fixture-name-', 'data-fixture-field="customName" data-field-disabled="fixture-name-'),
      field({ id:`fixture-du-${item.id}`, label:'DU', value:item.customDu || '', unit:'l/s' }).replaceAll('data-field="fixture-du-', 'data-fixture-field="customDu" data-field-disabled="fixture-du-'),
      field({ id:`fixture-dn-${item.id}`, label:'Mindest-DN', value:item.customDn || '', placeholder:'DN 50', inputmode:'text' }).replaceAll('data-field="fixture-dn-', 'data-fixture-field="customDn" data-field-disabled="fixture-dn-')
    ].join(''), 3)}</div>` : '';
    return `<article class="wastewater-compact-row" data-fixture-id="${esc(item.id)}">
      <div class="wastewater-compact-row__inputs">${selector}${qty}<button type="button" class="line-section-card__delete wastewater-fixture__delete" data-fixture-delete="${esc(item.id)}" aria-label="Gegenstand löschen">×</button></div>
      ${customFields}
      <div class="wastewater-compact-row__meta">DU/Stk. ${fmt(item.du,1)} l/s · ΣDU ${fmt(item.totalDu,1)} l/s · Einzelanschluss ${esc(item.dn || '—')}</div>
    </article>`;
  }).join('')}</div>`;
}


function lineTypeHints(lineType) {
  const hints = {
    'single-unvented': ['Unbelüftete Einzelanschlussleitungen: max. 4 m Leitungslänge.', 'Maximal drei 90°-Umlenkungen innerhalb eines Fließwegs.', 'Mindestgefälle: 1,0 cm/m.'],
    'single-vented': ['Belüftete Einzelanschlussleitungen: max. 10 m Leitungslänge.', 'Mindestgefälle: 0,5 cm/m.', 'Belüftung ist erforderlich, wenn die Grenzen der unbelüfteten Einzelanschlussleitung nicht eingehalten werden.'],
    'branch-unvented': ['Unbelüftete Anschlussleitungen sind über Tabelle 7 vorzubemessen.', 'Mindestgefälle: 1,0 cm/m.', 'Rohrlänge und Höhenversatz sind zusätzlich gemäß Norm zu prüfen.'],
    'branch-vented': ['Belüftete Anschlussleitungen werden hydraulisch über die Tabellen A.3 bis A.5 vorbemessen.', 'Mindestgefälle: 0,5 cm/m.', 'Rohrlänge, Höhenversatz und Umlenkungen sind zusätzlich gemäß Norm zu prüfen.'],
    stack: ['Fallleitungen werden nach Tabelle 8 mit Hauptlüftung vorbemessen.', 'Bei angeschlossenen WC-Anlagen wird mindestens DN 100 empfohlen.', 'Abzweigart mit/ohne Innenradius beeinflusst das zulässige Abflussvermögen.'],
    collector: ['Sammelleitungen innerhalb des Gebäudes: Füllungsgrad h/di = 0,5 bzw. 0,7.', 'Mindestgefälle: 0,5 cm/m.', 'Mindestfließgeschwindigkeit v ≥ 0,5 m/s prüfen.'],
    'ground-inside': ['Grundleitungen innerhalb des Gebäudes: Füllungsgrad h/di = 0,5.', 'Mindestgefälle: 0,5 cm/m.', 'Mindestfließgeschwindigkeit v ≥ 0,5 m/s prüfen.'],
    'ground-outside': ['Grundleitungen außerhalb des Gebäudes: Füllungsgrad h/di = 0,7.', 'Mindestgefälle: 1,0 cm/m.', 'Mindestfließgeschwindigkeit v ≥ 0,7 m/s und vmax 2,5 m/s prüfen.'],
    'ground-full': ['Vollfüllung h/di = 1,0 ist nur für zulässige Anwendungsfälle anzusetzen.', 'Anwendungsgrenzen und Schachtanordnung gemäß Norm prüfen.'],
    ventilation: ['Lüftungsleitungen sind in Abhängigkeit der zugehörigen Fallleitung auszulegen.', 'Sammel-Hauptlüftungen müssen mindestens der halben Summe der Einzelquerschnitte entsprechen.']
  };
  return hints[lineType] || [];
}
function hintList(items = []) {
  if (!items.length) return '';
  return `<div class="wastewater-line-hints">${items.map(item => `<p>${esc(item)}</p>`).join('')}</div>`;
}

function warningList(warnings) {
  const fixed = '<div class="ph-warning ph-warning--norm"><span>Normgrundlage:</span><strong>Berechnung erfolgt auf Grundlage der DIN 1986 - 100, aktuellste Fassung.</strong></div>';
  if (!warnings.length) return `<div class="ph-warnings">${fixed}<div class="empty-state empty-state--compact">Keine Regelverletzungen erkannt.</div></div>`;
  return `<div class="ph-warnings">${fixed}${warnings.map(item => `<div class="ph-warning"><span>Hinweis:</span><strong>${esc(item)}</strong></div>`).join('')}</div>`;
}
function inputCards(s, r) {
  const lineFields = [
    lineTypeSelector(s),
    grid([
      field({ id:'slopeCmM', label:'Gefälle J', value:fmtDecimalInput(s.slopeCmM,1), unit:'cm/m' }),
      selectField({ id:'fillRatio', label:'Füllungsgrad h/di', value:s.fillRatio, options:opts([['0.5','0,5'],['0.7','0,7'],['1.0','1,0']]) })
    ].join(''), 2),
    '<p class="ph-help">Rohrlängen, Höhenversätze und Umlenkungen sind gemäß Norm zusätzlich zu prüfen. Die Vorbemessung erfolgt hier über Gefälle, Füllungsgrad und angeschlossene Entwässerungsgegenstände.</p>',
    hintList(lineTypeHints(s.lineType))
  ];
  if (s.lineType === 'branch-vented') lineFields.push('<p class="ph-help">Belüftete Anschlussleitungen werden über die hydraulischen Tabellen A.3 bis A.5 vorbemessen.</p>');
  if (s.lineType === 'stack') lineFields.push(segmented('branchType', opts([['with-radius','Abzweige mit Innenradius'],['without-radius','ohne Innenradius']]), s.branchType, { accent:'green' }));
  if (s.lineType === 'ventilation') lineFields.push(segmented('ventilationType', opts([['single-main','Einzel-Hauptlüftung'],['collective-main','Sammel-Hauptlüftung'],['bypass','Umgehungsleitung'],['loop','Umlüftungsleitung']]), s.ventilationType, { accent:'green' }));
  return stack([
    card('Nutzung / Abflusskennzahl', stack([
      selectField({ id:'usageType', label:'Gebäudeart und Benutzung', value:s.usageType, options:usageOptions }),
      s.usageType === 'custom' ? field({ id:'kValue', label:'Abflusskennzahl K', value:fmtInput(s.kValue,2) }) : inlineStats([{ label:'K', value:fmt(r.k,1) }])
    ].join('')), 'green'),
    card('Leitungsart / Randbedingungen', stack(lineFields.join('')), 'green'),
    card('Entwässerungsgegenstände', stack([
      fixturesTable(s, r),
      '<button type="button" class="action-button" data-fixture-add>Gegenstand hinzufügen</button>'
    ].join('')), 'green'),
    card('Zusatzabflüsse', grid([
      field({ id:'continuousFlow', label:'Dauerabfluss Qc', value:fmtInput(s.continuousFlow,2), unit:'l/s' }),
      field({ id:'pumpFlow', label:'Pumpenförderstrom Qp', value:fmtInput(s.pumpFlow,2), unit:'l/s' }),
      field({ id:'rainFlow', label:'verunreinigtes Niederschlagswasser Qr,a', value:fmtInput(s.rainFlow,2), unit:'l/s' }),
      selectField({ id:'hasWc', label:'WC angeschlossen', value:s.hasWc, options:opts([['no','automatisch / nein'],['yes','ja']]) })
    ].join(''), 2), 'green'),
    card('Berechnung speichern', stack([
      field({ id:'name', label:'Bezeichnung', value:s.name || '', placeholder:'z. B. Strang WC-Kern Nord', inputmode:'text' }),
      `<div class="tc-save-actions"><button type="button" class="action-button" data-wastewater-save ${s.activeCalculationId ? 'disabled' : ''}>Speichern</button><button type="button" class="action-button" data-wastewater-update ${s.activeCalculationId ? '' : 'disabled'}>Aktualisieren</button></div>`,
      savedRows(s)
    ].join('')), 'green')
  ].join(''));
}
function resultCards(s, r) {
  const dn = r.selected?.dn || '—';
  const fillApplies = ['collector','ground-inside','ground-outside','ground-full','branch-vented'].includes(s.lineType);
  return stack([
    mainResult('Ergebnis / Dimensionierung Schmutzwasser', { label:'Empfohlene Dimension', value:dn, unit:'' }, [
      { label:'Qww', value:fmt(r.qww,2), unit:'l/s' },
      { label:'ΣDU', value:fmt(r.sumDu,1), unit:'l/s' },
      { label:'K', value:fmt(r.k,1) },
      { label:'Qtot', value:fmt(r.qtot,2), unit:'l/s' }
    ], 'green'),
    card('Dimensionierung und Berechnungsansatz', stack([
      resultRows([
        { label:'Leitungsart', value:lineTypeLabel(s.lineType) },
        { label:'Bemessungsgrundlage', value:r.dimensionBasis },
        { label:'Kapazität', value:r.selected?.capacity ? fmt(r.selected.capacity,1) : '—', unit:r.selected?.capacity ? 'l/s' : '' },
        { label:'Füllungsgrad', value:fillApplies ? `h/di ${String(s.fillRatio).replace('.', ',')}` : '—' },
        { label:'angesetztes Gefälle', value:fmtStateNumber(s.slopeCmM,1), unit:'cm/m' },
        { label:'größter Einzel-DU', value:fmt(r.largestDu,1), unit:'l/s' },
        { label:'Zusatzabflüsse', value:fmt(r.qc + r.qp + r.qra,2), unit:'l/s' }
      ]),
      '<div class="ph-formula ph-formula--small">Qww = K × √ΣDU · Qtot = Qww + Qc + Qp + Qr,a</div>'
    ].join('')), 'green'),
    card('Normhinweise / Plausibilität', warningList(r.warnings), 'green')
  ].join(''));
}

function view(s) {
  const r = calculate(s);
  return renderModuleShell(config, `<div class="span-6">${inputCards(s, r)}</div><div class="span-6">${resultCards(s, r)}</div>`);
}
function updateFixture(id, patch) {
  const current = state.get();
  state.set({ fixtures: (current.fixtures || []).map(item => String(item.id) === String(id) ? { ...item, ...patch } : item) });
}
function bindActions(root) {
  bindEditModeClear(root, { state, activeIdKey: 'activeCalculationId', nameKey: 'name', onClear: () => state.set(clearedInputs(state.get())) });
  root.querySelector('[data-fixture-add]')?.addEventListener('click', () => {
    const current = state.get();
    state.set({ fixtures: [...(current.fixtures || []), { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, typeId: 'washbasin', quantity: '1', uiOpen: true }] });
  });
  root.querySelectorAll('[data-fixture-field]').forEach(el => {
    const commit = (options = {}) => {
      const current = state.get();
      const id = el.closest('[data-fixture-id]')?.dataset.fixtureId;
      state.set({ fixtures: (current.fixtures || []).map(item => String(item.id) === String(id) ? { ...item, [el.dataset.fixtureField]: el.value } : item) }, options);
    };
    el.addEventListener('change', () => commit());
    if (el.matches('input')) {
      el.addEventListener('input', () => commit({ notify: false }), { passive: true });
      el.addEventListener('blur', () => state.set({}, { notify: true }));
      el.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        commit({ notify: false });
        state.set({}, { notify: true });
      });
    }
  });
  root.querySelectorAll('[data-fixture-delete]').forEach(btn => btn.addEventListener('click', event => {
    event.stopPropagation();
    const current = state.get();
    state.set({ fixtures: (current.fixtures || []).filter(item => String(item.id) !== String(btn.dataset.fixtureDelete)) });
  }));
  root.querySelectorAll('[data-fixture-toggle]').forEach(btn => btn.addEventListener('click', event => {
    event.stopPropagation();
    const current = state.get();
    const id = btn.dataset.fixtureToggle;
    state.set({ fixtures: (current.fixtures || []).map(item => String(item.id) === String(id) ? { ...item, uiOpen: item.uiOpen !== true } : item) });
  }));
  root.querySelectorAll('[data-line-family]').forEach(btn => btn.addEventListener('click', () => {
    const current = state.get();
    const ventilation = lineVentilationValue(current.lineType);
    state.set({ lineType: resolveLineType(btn.dataset.lineFamily, ventilation, current.lineType) });
  }));
  root.querySelectorAll('[data-line-ventilation]').forEach(btn => btn.addEventListener('click', () => {
    const current = state.get();
    const family = lineFamilyValue(current.lineType);
    state.set({ lineType: resolveLineType(family, btn.dataset.lineVentilation, current.lineType) });
  }));
  root.querySelector('[data-wastewater-save]')?.addEventListener('click', () => {
    const current = state.get();
    const r = calculate(current);
    const saved = current.savedCalculations || [];
    const record = savedSnapshot({ ...current, activeCalculationId: null }, r);
    state.set({ savedCalculations: [record, ...saved], activeCalculationId: null, name: '' });
  });
  root.querySelector('[data-wastewater-update]')?.addEventListener('click', () => {
    const current = state.get();
    const id = current.activeCalculationId;
    if (!id) return;
    const saved = current.savedCalculations || [];
    const existing = saved.find(item => String(item.id) === String(id));
    if (!existing) return;
    const record = { ...savedSnapshot(current, calculate(current)), id, createdAt: existing.createdAt || new Date().toISOString() };
    state.set({ savedCalculations: saved.map(item => String(item.id) === String(id) ? record : item), activeCalculationId: id, name: record.name });
  });
  root.querySelectorAll('[data-line-toggle]').forEach(toggle => toggle.addEventListener('click', event => {
    event.stopPropagation();
    const itemCard = toggle.closest('[data-line-card]');
    const collapsed = itemCard?.classList.toggle('is-collapsed');
    toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }));
  root.querySelectorAll('[data-wastewater-select]').forEach(cardEl => cardEl.addEventListener('click', event => {
    if (event.target.closest('[data-wastewater-delete]') || event.target.closest('[data-line-toggle]')) return;
    const current = state.get();
    const item = (current.savedCalculations || []).find(entry => String(entry.id) === String(cardEl.dataset.wastewaterSelect));
    if (!item?.state) return;
    if (String(current.activeCalculationId || '') === String(item.id)) {
      state.set(clearedInputs(current));
      return;
    }
    state.set({ ...item.state, savedCalculations: current.savedCalculations || [], activeCalculationId: item.id, name: item.name || item.state.name || '' });
  }));
  root.querySelectorAll('[data-wastewater-delete]').forEach(btn => btn.addEventListener('click', event => {
    event.stopPropagation();
    const current = state.get();
    const next = (current.savedCalculations || []).filter(item => String(item.id) !== String(btn.dataset.wastewaterDelete));
    state.set({ savedCalculations: next, activeCalculationId: String(current.activeCalculationId) === String(btn.dataset.wastewaterDelete) ? null : current.activeCalculationId });
  }));
}

export default { config, state, mount(root) { return mountModule(root, state, view, bindActions); } };
