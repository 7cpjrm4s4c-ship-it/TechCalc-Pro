import { inlineStats, esc } from '../../core/renderer.js';
import { renderResultModel } from '../../platform/resultRenderer/index.js';
import { fmt } from '../../utils/calculations.js';

function hasStoredConsumers(r = {}) {
  return Boolean((r.usageUnits || []).length || (r.singleGroups || []).length || (r.rawSingles || []).length);
}
function resultValue(r, value, digits = 2) {
  return hasStoredConsumers(r) ? fmt(value, digits) : '—';
}
function resultUnit(r, unit = '') {
  return hasStoredConsumers(r) ? unit : '';
}

export function consumerRows(consumers = []) {
  return `<div class="tc-consumer-list">${consumers.map(c => `<div class="tc-consumer-row"><div><strong>${esc(c.count)} × ${esc(c.label)}</strong><span>${fmt(c.vr * c.count, 2)} l/s gesamt · ${fmt(c.vr,2)} l/s je Verbraucher${c.hotWater ? ' · TWW/TWK' : ' · nur TWK'}${c.permanent ? ' · Dauerverbraucher' : ''}</span></div></div>`).join('')}</div>`;
}

export function selectedFixturesList(r, state = {}) {
  const aggregate = new Map();
  const add = (consumer) => {
    const label = String(consumer.label || '').replace(' TWW','').replace(' WW-Bereitung','');
    const key = `${label}|${consumer.vr}|${consumer.permanent ? '1' : '0'}|${consumer.hotWaterClone ? '1' : '0'}`;
    const current = aggregate.get(key) || { label, vr: Number(consumer.vr || 0), count: 0, permanent: Boolean(consumer.permanent), addon:Boolean(consumer.hotWaterClone) };
    current.count += Number(consumer.count) || 1;
    aggregate.set(key, current);
  };
  (r.usageUnits || []).forEach(unit => (unit.consumers || []).forEach(add));
  ((r.rawSingles && r.rawSingles.length) ? r.rawSingles : (r.singleGroups || []).flatMap(group => group.consumers || [])).forEach(add);
  const rows = [...aggregate.values()];
  if (!rows.length) return '<div class="empty-state empty-state--compact">Noch keine Einrichtungsgegenstände ausgewählt</div>';
  return `<div class="tc-fixture-list">${rows.map(item => `<div class="tc-fixture-row"><strong>${esc(item.count)} × ${esc(item.label)}</strong>${item.permanent ? '<em>Dauerverbraucher</em>' : ''}</div>`).join('')}</div>`;
}

export function unitStats(unit = {}){
  return [
    { label:'Verbraucher', value: unit.consumerCount },
    { label:'Σ NE', value: fmt(unit.sumFlow, 2), unit:'l/s' },
    { label:'Spitze NE', value: fmt(unit.peakFlow, 2), unit:'l/s' },
    { label:'Ansatz', value: unit.simultaneityFactor ? `GL ${fmt(unit.simultaneityFactor, 2)}` : '2 größte Entnahmestellen' }
  ];
}

export function singleStats(group = {}){
  const consumers = group.consumers || [];
  const count = consumers.reduce((sum, c) => sum + (Number(c.count) || 1), 0);
  const sumFlow = consumers.reduce((sum, c) => sum + Number(c.vr || 0) * (Number(c.count) || 1), 0);
  return [
    { label:'Gruppe', value: group.name },
    { label:'Verbraucher', value: count },
    { label:'Summendurchfluss', value: fmt(sumFlow, 2), unit:'l/s' },
    { label:'Dauerverbraucher', value: consumers.some(c => c.permanent) ? 'Ja' : 'Nein' }
  ];
}

export function buildDrinkingWaterResultModel(s = {}, r = {}, accent = 'blue'){
  return {
    primary: {
      title: 'Ergebnis — Trinkwasser',
      primary: { label:'Spitzendurchfluss', value:resultValue(r, r.peakFlow, 2), unit:resultUnit(r, 'l/s') },
      rows: [
        { label:'Σ NE', value:resultValue(r, r.neSumFlow, 2), unit:resultUnit(r, 'l/s') },
        { label:'NE-Spitzen', value:resultValue(r, r.nePeakSum, 2), unit:resultUnit(r, 'l/s') },
        { label:'Einzel', value:resultValue(r, r.singleSumFlow, 2), unit:resultUnit(r, 'l/s') },
        { label:'Gesamt Σ', value:resultValue(r, r.totalSumFlow, 2), unit:resultUnit(r, 'l/s') },
        { label:'Spitze', value:resultValue(r, r.peakFlow, 2), unit:resultUnit(r, 'l/s') },
        { label:'Spitze', value:resultValue(r, r.house?.flowM3h, 2), unit:resultUnit(r, 'm³/h') }
      ],
      accent
    },
    groups: [
      {
        title: 'Dimensionierung — Hauseinführung / Wasserzähler',
        rows: [
          { label:'Hauseinführung', value:hasStoredConsumers(r) ? (r.house?.dn || '—') : '—' },
          { label:'Wasserzähler', value:hasStoredConsumers(r) ? (r.house?.meter || '—') : '—' },
          { label:'Q3 Wasserzähler', value:resultValue(r, r.house?.q3, 0), unit:resultUnit(r, 'm³/h') },
          { label:'Auslegung', value:'Vorläufig über Spitzendurchfluss' }
        ],
        accent
      },
      {
        title: 'Zusammenstellung Einrichtungsgegenstände',
        html: selectedFixturesList(r, s),
        accent
      }
    ],
    notices: [{
      title: 'Hinweis',
      messages: ['Dauerverbraucher werden zum nach Gleichzeitigkeit ermittelten Spitzendurchfluss addiert.', '3-Liter-Regel, Probenahmestellen und hygienische Anforderungen sind separat zu prüfen.'],
      accent,
      prefix: 'Hinweis'
    }]
  };
}


export function renderDrinkingWaterResultModel(model, accent = 'blue'){
  return renderResultModel(model, accent);
}

export default buildDrinkingWaterResultModel;
