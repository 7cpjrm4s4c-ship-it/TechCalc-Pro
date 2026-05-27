import config from './config.js';
import schema from './schema.js';
import { state, initialState } from './state.js';
import { calculate, getFixture, toNumber } from './logic.js';
import { fixtureTypes, usageTypes } from './tables.js';
import { card, field, selectField, segmented, renderModuleShell, stack, grid, mainResult, resultRows, inlineStats, esc } from '../../core/renderer.js';
import { mountModule } from '../../core/mount.js';
import { fmt, fmtInput } from '../../utils/calculations.js';
import { bindEditModeClear, renderSavedRecordList, createRecordId } from '../../core/savedRecords.js';
import { readFieldValue, normalizeQuantityInput } from '../../core/formActions.js';
import { bindSavedCalculationActions } from '../../core/savedCalculationController.js';
import { preserveActionScroll } from '../../core/scrollManager.js';

const opts = items => items.map(([value, label]) => ({ value, label }));
const fixtureOptions = fixtureTypes.map(item => ({ value: item.id, label: item.name }));
const usageOptions = usageTypes.map(item => ({ value: item.value, label: item.label }));
const lineTypeOptions = [
  { value:'single-unvented', label:'Einzelanschluss unbelüftet' },
  { value:'single-vented', label:'Einzelanschluss belüftet' },
  { value:'branch-unvented', label:'Anschlussleitung unbelüftet' },
  { value:'branch-vented', label:'Anschlussleitung belüftet' },
  { value:'stack', label:'Fallleitung' },
  { value:'collector', label:'Sammelleitung' },
  { value:'ground-inside', label:'Grundleitung innen' },
  { value:'ground-outside', label:'Grundleitung außen' }
];

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
  }[value] || value;
}

function lineFamilyValue(lineType) {
  if (String(lineType).startsWith('single-')) return 'single';
  if (String(lineType).startsWith('branch-')) return 'branch';
  if (lineType === 'ground-full' || lineType === 'ventilation') return 'ground-outside';
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
function miniSegment(buttons, extraClass = '') {
  const cls = extraClass ? ` ${extraClass}` : '';
  return `<div class="segmented segmented--green${cls}" role="tablist">${buttons.map(btn => `<button type="button" ${btn.attr}="${esc(btn.value)}" class="${btn.active ? 'is-active' : ''}">${esc(btn.label)}</button>`).join('')}</div>`;
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
    ['ground-outside', 'Grund außen']
  ];
  const blocks = [miniSegment(families.map(([value, label]) => ({ attr:'data-line-family', value, label, active: family === value })), 'wastewater-line-selector')];
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
    id: s.activeCalculationId || createRecordId('wastewater'),
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
  return renderSavedRecordList(s.savedCalculations || [], {
    activeId: s.activeCalculationId,
    emptyText: 'Noch keine Schmutzwasser-Berechnungen gespeichert.',
    loadAttr: 'data-wastewater-select',
    toggleAttr: 'data-line-toggle',
    deleteAttr: 'data-wastewater-delete',
    title: item => item.name || 'Berechnung',
    subtitle: item => {
      const r = item.result || {};
      return [`${fmt(r.qtot || 0,2)} l/s`, r.dn, lineTypeLabel(r.lineType)].filter(Boolean).join(' · ');
    },
    stats: item => {
      const r = item.result || {};
      return [
        { label:'Qtot', value:fmt(r.qtot || 0,2), unit:'l/s' },
        { label:'Qww', value:fmt(r.qww || 0,2), unit:'l/s' },
        { label:'ΣDU', value:fmt(r.sumDu || 0,1), unit:'l/s' },
        { label:'Empfohlene DN', value:r.dn || '—' }
      ];
    },
    className: 'ph-saved-list'
  });
}
function fixturesTable(s, r) {
  if (!r.fixtures.length) return '<div class="empty-state empty-state--compact">Noch keine Entwässerungsgegenstände hinzugefügt.</div>';
  return `<div class="tc-consumer-list dw-consumer-list wastewater-fixture-list">${r.fixtures.map(item => `<div class="tc-consumer-row dw-consumer-row wastewater-fixture-row wastewater-fixture-row--editable">
    <div><strong>${esc(item.name)}</strong><span>ΣDU ${fmt(item.totalDu,1)} l/s · DU/Stk. ${fmt(item.du,1)} l/s · Einzelanschluss ${esc(item.dn || '—')}</span></div>
    <label class="mini-edit-field tc-quantity-field"><span>Anzahl</span><input type="number" min="0" step="1" value="${esc(item.qty)}" data-fixture-qty="${esc(item.id)}" inputmode="numeric"></label>
    <button type="button" data-fixture-delete="${esc(item.id)}" aria-label="Entwässerungsgegenstand entfernen">×</button>
  </div>`).join('')}</div>`;
}

function fixtureInputBlock(s) {
  const selected = getFixture(s.fixtureType || 'washbasin');
  const custom = selected?.custom;
  return stack([
    grid([
      selectField({ id:'fixtureType', label:'Gegenstand hinzufügen', value:s.fixtureType || 'washbasin', options:fixtureOptions }),
      field({ id:'fixtureQuantity', label:'Anzahl', value:fmtInput(s.fixtureQuantity || '1',0), unit:'Stk.', inputmode:'numeric' })
    ].join(''), 2),
    custom ? grid([
      field({ id:'fixtureCustomName', label:'Bezeichnung', value:s.fixtureCustomName || '', placeholder:'z. B. Laborbecken', inputmode:'text' }),
      field({ id:'fixtureCustomDu', label:'DU', value:s.fixtureCustomDu || '', unit:'l/s' }),
      field({ id:'fixtureCustomDn', label:'Mindest-DN', value:s.fixtureCustomDn || '', placeholder:'DN 50', inputmode:'text' })
    ].join(''), 3) : '',
    '<button type="button" class="action-button action-button--secondary" data-fixture-add>Gegenstand hinzufügen</button>',
    fixturesTable(s, calculate(s))
  ].join(''));
}



function lineTypeHints(lineType) {
  const hints = {
    'single-unvented': ['Einzelanschlussleitungen: max. 4 m Leitungslänge.', 'Maximal drei 90°-Umlenkungen innerhalb eines Fließwegs.', 'Mindestgefälle unbelüftet: 1,0 cm/m.'],
    'single-vented': ['Belüftete Einzelanschlussleitungen: max. 10 m Leitungslänge.', 'Mindestgefälle belüftet: 0,5 cm/m.', 'Belüftung ist erforderlich, wenn die Grenzen der unbelüfteten Einzelanschlussleitung nicht eingehalten werden.'],
    'branch-unvented': ['Anschlussleitungen: max. 10 m Leitungslänge.', 'Maximal drei 90°-Umlenkungen innerhalb eines Fließwegs prüfen.', 'Mindestgefälle unbelüftet: 1,0 cm/m.'],
    'branch-vented': ['Belüftete Anschlussleitungen: max. 10 m Leitungslänge.', 'Maximal drei 90°-Umlenkungen innerhalb eines Fließwegs prüfen.', 'Mindestgefälle belüftet: 0,5 cm/m.'],
    stack: ['Fallleitungen werden nach Tabelle 8 mit Hauptlüftung vorbemessen.', 'Bei angeschlossenen WC-Anlagen wird mindestens DN 100 empfohlen.', 'Abzweigart mit/ohne Innenradius beeinflusst das zulässige Abflussvermögen.'],
    collector: ['Sammelleitungen innerhalb des Gebäudes: Füllungsgrad h/di = 0,5 bzw. 0,7.', 'Mindestgefälle: 0,5 cm/m.', 'Mindestfließgeschwindigkeit v ≥ 0,5 m/s prüfen.'],
    'ground-inside': ['Grundleitungen innerhalb des Gebäudes: Füllungsgrad h/di = 0,5.', 'Mindestgefälle: 0,5 cm/m.', 'Mindestfließgeschwindigkeit v ≥ 0,5 m/s prüfen.'],
    'ground-outside': ['Grundleitungen außerhalb des Gebäudes: Füllungsgrad h/di = 0,7.', 'Mindestgefälle: 1,0 cm/m.', 'Mindestfließgeschwindigkeit v ≥ 0,7 m/s und vmax 2,5 m/s prüfen.']
  };
  return hints[lineType] || [];
}
function warningList(warnings, lineType) {
  const fixed = '<div class="tc-warning ph-warning ph-warning--norm"><span>Normgrundlage:</span><strong>Berechnung erfolgt auf Grundlage der DIN 1986 - 100, aktuellste Fassung.</strong></div>';
  const lineHints = lineTypeHints(lineType).map(item => `<div class="tc-warning ph-warning"><span>Hinweis:</span><strong>${esc(item)}</strong></div>`).join('');
  const dynamic = warnings.map(item => `<div class="tc-warning ph-warning"><span>Hinweis:</span><strong>${esc(item)}</strong></div>`).join('');
  const body = `${fixed}${lineHints}${dynamic}`;
  if (!lineHints && !warnings.length) return `<div class="tc-warning-list ph-warnings">${fixed}<div class="empty-state empty-state--compact">Keine Regelverletzungen erkannt.</div></div>`;
  return `<div class="tc-warning-list ph-warnings">${body}</div>`;
}
function inputCards(s, r) {
  const lineFields = [
    selectField({ id:'lineType', label:'Leitungsart', value:s.lineType || 'single-unvented', options:lineTypeOptions }),
    grid([
      field({ id:'slopeCmM', label:'Gefälle J', value:fmtDecimalInput(s.slopeCmM,1), unit:'cm/m' }),
      selectField({ id:'fillRatio', label:'Füllungsgrad h/di', value:s.fillRatio, options:opts([['0.5','0,5'],['0.7','0,7'],['1.0','1,0']]) })
    ].join(''), 2),
    ''
  ];
  if (s.lineType === 'stack') lineFields.push(segmented('branchType', opts([['with-radius','Abzweige mit Innenradius'],['without-radius','ohne Innenradius']]), s.branchType, { accent:'green' }));
  return stack([
    card('Nutzung / Abflusskennzahl', stack([
      selectField({ id:'usageType', label:'Gebäudeart und Benutzung', value:s.usageType, options:usageOptions }),
      s.usageType === 'custom' ? field({ id:'kValue', label:'Abflusskennzahl K', value:fmtInput(s.kValue,2) }) : inlineStats([{ label:'K', value:fmt(r.k,1) }])
    ].join('')), 'green'),
    card('Leitungsart / Randbedingungen', stack(lineFields.join('')), 'green'),
    card('Entwässerungsgegenstände', fixtureInputBlock(s), 'green'),
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
  const effectiveLineType = ['ground-full','ventilation'].includes(s.lineType) ? 'ground-outside' : s.lineType;
  const dn = r.selected?.dn || '—';
  const fillApplies = ['collector','ground-inside','ground-outside','branch-vented'].includes(effectiveLineType);
  return stack([
    mainResult('Ergebnis / Dimensionierung Schmutzwasser', { label:'Empfohlene Dimension', value:dn, unit:'' }, [
      { label:'Qww', value:fmt(r.qww,2), unit:'l/s' },
      { label:'ΣDU', value:fmt(r.sumDu,1), unit:'l/s' },
      { label:'K', value:fmt(r.k,1) },
      { label:'Qtot', value:fmt(r.qtot,2), unit:'l/s' }
    ], 'green'),
    card('Dimensionierung und Berechnungsansatz', stack([
      resultRows([
        { label:'Leitungsart', value:lineTypeLabel(effectiveLineType) },
        { label:'Bemessungsgrundlage', value:r.dimensionBasis },
        { label:'Kapazität', value:r.selected?.capacity ? fmt(r.selected.capacity,1) : '—', unit:r.selected?.capacity ? 'l/s' : '' },
        { label:'Füllungsgrad', value:fillApplies ? `h/di ${String(s.fillRatio).replace('.', ',')}` : '—' },
        { label:'angesetztes Gefälle', value:fmtStateNumber(s.slopeCmM,1), unit:'cm/m' },
        { label:'größter Einzel-DU', value:fmt(r.largestDu,1), unit:'l/s' },
        { label:'Zusatzabflüsse', value:fmt(r.qc + r.qp + r.qra,2), unit:'l/s' }
      ]),
      '<div class="tc-formula ph-formula ph-formula--small">Qww = K × √ΣDU · Qtot = Qww + Qc + Qp + Qr,a</div>'
    ].join('')), 'green'),
    card('Normhinweise / Plausibilität', warningList(r.warnings, effectiveLineType), 'green')
  ].join(''));
}

function view(s) {
  const r = calculate(s);
  return renderModuleShell(config, `<div class="span-6">${inputCards(s, r)}</div><div class="span-6">${resultCards(s, r)}</div>`);
}

function normalizedFixtureQuantity(value) {
  return Math.max(0, Math.round(normalizeQuantityInput(value, 1)) || 0);
}
function fixtureKey(item = {}) {
  return [item.typeId || '', item.customName || '', item.customDu || '', item.customDn || ''].join('|');
}
function readFixtureDraft(root, current = {}) {
  const typeId = readFieldValue(root, 'fixtureType', current.fixtureType || 'washbasin');
  const base = getFixture(typeId);
  const quantity = normalizedFixtureQuantity(readFieldValue(root, 'fixtureQuantity', current.fixtureQuantity || '1'));
  const record = { id: createRecordId('fixture'), typeId, quantity: String(quantity) };
  if (base?.custom) {
    record.customName = readFieldValue(root, 'fixtureCustomName', current.fixtureCustomName || 'Freier Gegenstand');
    record.customDu = readFieldValue(root, 'fixtureCustomDu', current.fixtureCustomDu || '0');
    record.customDn = readFieldValue(root, 'fixtureCustomDn', current.fixtureCustomDn || '—');
  }
  return record;
}
function keepViewport(action) {
  preserveActionScroll(action);
}

function addFixtureFromCurrentInputs(root) {
  const current = state.get();
  const record = readFixtureDraft(root, current);
  if (normalizedFixtureQuantity(record.quantity) <= 0) return;
  const key = fixtureKey(record);
  let merged = false;
  const fixtures = (current.fixtures || []).map(item => {
    if (fixtureKey(item) !== key) return item;
    merged = true;
    const nextQty = normalizedFixtureQuantity(item.quantity) + normalizedFixtureQuantity(record.quantity);
    return { ...item, quantity: String(nextQty) };
  });
  const nextFixtures = merged ? fixtures : [...fixtures, record];
  state.set({ fixtures: nextFixtures, fixtureQuantity: '1', fixtureCustomName: '', fixtureCustomDu: '', fixtureCustomDn: '' });
}

function bindActions(root) {
  bindEditModeClear(root, { state, activeIdKey: 'activeCalculationId', nameKey: 'name', onClear: () => state.set(clearedInputs(state.get())) });

  if (!root.__wastewaterDelegatedBound) {
    root.__wastewaterDelegatedBound = true;
    root.addEventListener('click', event => {
      const addBtn = event.target.closest('[data-fixture-add]');
      if (addBtn) {
        event.preventDefault();
        event.stopPropagation();
        const now = Date.now();
        const last = Number(root.dataset.wastewaterAddAt || 0);
        if (now - last < 250) return;
        root.dataset.wastewaterAddAt = String(now);
        addFixtureFromCurrentInputs(root);
        return;
      }

      const deleteBtn = event.target.closest('[data-fixture-delete]');
      if (deleteBtn) {
        event.preventDefault();
        event.stopPropagation();
        const current = state.get();
        state.set({ fixtures: (current.fixtures || []).filter(item => String(item.id) !== String(deleteBtn.dataset.fixtureDelete)) });
      }
    });

    root.addEventListener('input', event => {
      const input = event.target.closest('[data-fixture-qty]');
      if (!input) return;
      event.stopPropagation();
      const current = state.get();
      const fixtures = (current.fixtures || []).map(item => String(item.id) === String(input.dataset.fixtureQty) ? { ...item, quantity: String(normalizedFixtureQuantity(input.value)) } : item);
      state.set({ fixtures }, { notify:false });
    });
    root.addEventListener('blur', event => {
      const input = event.target.closest('[data-fixture-qty]');
      if (!input) return;
      event.stopPropagation();
      const current = state.get();
      const fixtures = (current.fixtures || []).map(item => String(item.id) === String(input.dataset.fixtureQty) ? { ...item, quantity: String(normalizedFixtureQuantity(input.value)) } : item);
      state.set({ fixtures }, { notify:true });
    }, true);
    root.addEventListener('keydown', event => {
      const input = event.target.closest('[data-fixture-qty]');
      if (!input || event.key !== 'Enter') return;
      event.preventDefault();
      const current = state.get();
      const fixtures = (current.fixtures || []).map(item => String(item.id) === String(input.dataset.fixtureQty) ? { ...item, quantity: String(normalizedFixtureQuantity(input.value)) } : item);
      state.set({ fixtures }, { notify:true });
    });
  }
  bindSavedCalculationActions(root, {
    state,
    calculate,
    snapshot: savedSnapshot,
    clearInputs: clearedInputs,
    saveSelector: '[data-wastewater-save]',
    updateSelector: '[data-wastewater-update]',
    loadAttr: 'data-wastewater-select',
    toggleAttr: 'data-line-toggle',
    deleteAttr: 'data-wastewater-delete'
  });
}

export default { config, schema, state, mount(root) { return mountModule(root, state, view, bindActions); } };
