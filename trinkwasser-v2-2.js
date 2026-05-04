/* ═══════════════════════════════════════════════════════
   trinkwasser.js — PHASE 3 REFACTORED (v2)
   Mit UI.* Components statt inline HTML
   
   WICHTIG:
   - Berechnung: 100% UNVERÄNDERT
   - HTML: Neu mit UI.* Components
   - CSS: ui-styles.css Klassen
═══════════════════════════════════════════════════════ */
'use strict';

// ─────────────────────────────────────────
// DATA (100% Original — UNVERÄNDERT)
// ─────────────────────────────────────────

const TW_FIXTURES = [
  { id:'wt',  label:'Waschtisch',              vr:0.07, cold:true, warm:true },
  { id:'ks',  label:'Küchenspüle',             vr:0.07, cold:true, warm:true },
  { id:'gs',  label:'Geschirrspüler',          vr:0.07, cold:true, warm:false },
  { id:'wc',  label:'WC-Spülkasten',           vr:0.13, cold:true, warm:false },
  { id:'du',  label:'Dusche',                  vr:0.15, cold:true, warm:true },
  { id:'bw',  label:'Badewanne',               vr:0.15, cold:true, warm:true },
  { id:'wm',  label:'Waschmaschine',           vr:0.15, cold:true, warm:false },
  { id:'az',  label:'Außenzapfstelle',         vr:0.15, cold:true, warm:false, dauer:true },
  { id:'ur',  label:'Urinal-Druckspüler',      vr:0.30, cold:true, warm:false },
  { id:'av15',label:'Auslaufventil DN15',     vr:0.30, cold:true, warm:false },
  { id:'av20',label:'Auslaufventil DN20',     vr:0.50, cold:true, warm:false },
];

const TW_BUILDINGS = {
  wohn:  { label:'Wohngebäude', a:1.48, b:0.19, c:0.94 },
  hotel: { label:'Hotel', a:0.70, b:0.48, c:0.13 },
  verw:  { label:'Verwaltung', a:0.91, b:0.31, c:0.38 },
  schule:{ label:'Schule', a:0.91, b:0.31, c:0.38 },
  pflege:{ label:'Pflege', a:0.75, b:0.44, c:0.18 },
};

const TW_STATE = { building: 'wohn', fixtures: {}, results: {} };

// ─────────────────────────────────────────
// CALCULATIONS (100% Original — UNVERÄNDERT)
// ─────────────────────────────────────────

function twNum(id) {
  const el = window.$(id);
  if (!el) return 0;
  const n = parseFloat(String(el.value).replace(',', '.'));
  return isNaN(n) || n < 0 ? 0 : n;
}

function twFmt(v, decimals = 2) {
  return isNaN(v) ? '–' : window.loc(v, decimals);
}

function twPeak(sum, buildingKey) {
  if (!sum || sum <= 0) return 0;
  const b = TW_BUILDINGS[buildingKey] || TW_BUILDINGS.wohn;
  return Math.max(0, b.a * Math.pow(sum, b.b) - b.c);
}

function calculateTrinkwasser(fixtureMap, buildingKey = 'wohn') {
  let totalFlow = 0;
  for (let fixtureId in fixtureMap) {
    const fixture = TW_FIXTURES.find(f => f.id === fixtureId);
    if (!fixture) continue;
    const count = fixtureMap[fixtureId] || 0;
    const flow = fixture.vr * count;
    totalFlow += flow;
  }
  const peakFlow = twPeak(totalFlow, buildingKey);
  return {
    sumFlow: totalFlow,
    peakFlow: peakFlow,
    flowM3h: peakFlow * 3.6
  };
}

// ─────────────────────────────────────────
// UI RENDERING (NEW with UI.* Components)
// ─────────────────────────────────────────

function buildTrinkwasserUI() {
  let html = '';
  html += UI.SectionTitle('Trinkwasser');
  html += UI.SectionTitle('Gebäudetyp', 'small');
  const buildingLabels = Object.keys(TW_BUILDINGS).map(k => TW_BUILDINGS[k].label);
  html += UI.SegmentControl('tw-building', buildingLabels, 0);
  html += UI.SectionTitle('Entnahmestellen', 'small');
  for (let fixture of TW_FIXTURES) {
    html += UI.Card(
      UI.InputGroup(fixture.label, `tw-fixture-${fixture.id}`, 
        { type: 'number', unit: 'St.', min: 0, step: 1, value: 0 }),
      'neutral'
    );
  }
  html += UI.SectionTitle('Ergebnisse', 'small');
  html += UI.ResultCard('Summen-Volumenstrom', 0, 'l/s', { id: 'tw-result-sum' });
  html += UI.ResultCard('Spitzenlast', 0, 'l/s', { id: 'tw-result-peak' });
  html += UI.ResultCard('Spitzenlast', 0, 'm³/h', { id: 'tw-result-m3h' });
  return html;
}

function updateTrinkwasserResults() {
  const fixtureMap = {};
  for (let fixture of TW_FIXTURES) {
    const count = twNum(`tw-fixture-${fixture.id}`);
    if (count > 0) fixtureMap[fixture.id] = count;
  }
  TW_STATE.fixtures = fixtureMap;
  const result = calculateTrinkwasser(fixtureMap, TW_STATE.building);
  TW_STATE.results = result;
  updateResultDisplay('tw-result-sum', result.sumFlow, 'l/s');
  updateResultDisplay('tw-result-peak', result.peakFlow, 'l/s');
  updateResultDisplay('tw-result-m3h', result.flowM3h, 'm³/h');
}

function updateResultDisplay(elementId, value, unit) {
  const el = window.$(elementId);
  if (!el) return;
  const valueEl = el.querySelector('.result-card__value');
  if (valueEl) valueEl.textContent = value ? twFmt(value) : '–';
}

function initTrinkwasser() {
  const container = window.$('tw-section');
  if (!container) return;
  container.innerHTML = buildTrinkwasserUI();
  for (let fixture of TW_FIXTURES) {
    const input = window.$(`tw-fixture-${fixture.id}`);
    if (input) {
      input.addEventListener('input', updateTrinkwasserResults);
      input.addEventListener('change', updateTrinkwasserResults);
    }
  }
  const buildingSelector = window.$('tw-building');
  if (buildingSelector) {
    buildingSelector.addEventListener('change', (e) => {
      TW_STATE.building = Object.keys(TW_BUILDINGS)[e.target.selectedIndex || 0];
      updateTrinkwasserResults();
    });
  }
  console.log('✅ Trinkwasser v2 initialized');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTrinkwasser);
} else {
  initTrinkwasser();
}

window.twCalculateTrinkwasser = calculateTrinkwasser;
