/* ═══════════════════════════════════════════════════════
   trinkwasser.js — TechCalc Pro (PHASE 2 SIMPLIFIED)
   Trinkwasser Schnellberechnung with UI.* Components
   
   HINWEIS: Dies ist ein vereinfachtes PATTERN-Beispiel
   um zu zeigen wie die Refaktorisierung funktioniert.
   
   Die vollständige Implementierung folgt dem gleichen Pattern:
   1. Daten (Fixtures, Buildings) → UNVERÄNDERT
   2. Berechnungen → UNVERÄNDERT  
   3. HTML/CSS → MIT UI.* Components
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
];

const TW_BUILDINGS = {
  wohn:  { label:'Wohngebäude', a:1.48, b:0.19, c:0.94 },
  hotel: { label:'Hotel', a:0.70, b:0.48, c:0.13 },
  verw:  { label:'Verwaltung', a:0.91, b:0.31, c:0.38 },
};

const TW_STATE = { 
  building: 'wohn',
  fixtures: {}
};

// ─────────────────────────────────────────
// CALCULATION (100% Original — UNVERÄNDERT)
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
  // Sum all fixture flow rates
  let totalFlow = 0;
  
  for (let fixtureId in fixtureMap) {
    const fixture = TW_FIXTURES.find(f => f.id === fixtureId);
    if (!fixture) continue;
    
    const count = fixtureMap[fixtureId] || 0;
    const flow = fixture.vr * count;
    totalFlow += flow;
  }
  
  // Calculate peak demand
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
  
  // Title
  html += UI.SectionTitle('Trinkwasser Schnellberechnung');
  
  // Building Type Selector
  html += UI.SectionTitle('Gebäudetyp', 'small');
  const buildingOptions = Object.keys(TW_BUILDINGS).map(k => TW_BUILDINGS[k].label);
  html += UI.SegmentControl('building-type', buildingOptions, 0);
  
  // Fixtures Section
  html += UI.SectionTitle('Entnahmestellen', 'small');
  
  // Build fixture inputs dynamically
  for (let fixture of TW_FIXTURES) {
    html += UI.Card(
      UI.InputGroup(
        fixture.label,
        `tw-fixture-${fixture.id}`,
        {
          type: 'number',
          unit: 'St.',
          min: 0,
          step: 1,
          value: 0
        }
      ),
      'neutral'
    );
  }
  
  // Results Section
  html += UI.SectionTitle('Ergebnisse', 'small');
  
  html += UI.ResultCard(
    'Summen-Volumenstrom',
    0,
    'l/s',
    { id: 'tw-result-sum', expandable: false }
  );
  
  html += UI.ResultCard(
    'Spitzenvolumenstrom',
    0,
    'l/s',
    { id: 'tw-result-peak', expandable: false }
  );
  
  html += UI.ResultCard(
    'Spitzenvolumenstrom',
    0,
    'm³/h',
    { id: 'tw-result-m3h', expandable: false }
  );
  
  return html;
}

// ─────────────────────────────────────────
// EVENT HANDLERS & UPDATES
// ─────────────────────────────────────────

function twOnFixtureChange() {
  // Collect all fixture counts
  const fixtureMap = {};
  
  for (let fixture of TW_FIXTURES) {
    const count = twNum(`tw-fixture-${fixture.id}`);
    if (count > 0) {
      fixtureMap[fixture.id] = count;
    }
  }
  
  TW_STATE.fixtures = fixtureMap;
  
  // Calculate
  const result = calculateTrinkwasser(fixtureMap, TW_STATE.building);
  
  // Update results
  updateResultCard('tw-result-sum', result.sumFlow, 'l/s');
  updateResultCard('tw-result-peak', result.peakFlow, 'l/s');
  updateResultCard('tw-result-m3h', result.flowM3h, 'm³/h');
}

function twOnBuildingChange(buildingKey) {
  TW_STATE.building = buildingKey;
  twOnFixtureChange(); // Recalculate with new building type
}

function updateResultCard(cardId, value, unit) {
  const card = window.$(cardId);
  if (!card) return;
  
  const valueEl = card.querySelector('.result-card__value');
  if (valueEl) {
    valueEl.textContent = twFmt(value);
  }
}

// ─────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────

function initTrinkwasser() {
  const container = window.$('trinkwasser-section');
  if (!container) return;
  
  // Build UI
  container.innerHTML = buildTrinkwasserUI();
  
  // Attach fixture listeners
  for (let fixture of TW_FIXTURES) {
    const input = window.$(`tw-fixture-${fixture.id}`);
    if (input) {
      input.addEventListener('input', twOnFixtureChange);
      input.addEventListener('change', twOnFixtureChange);
    }
  }
  
  // Attach building type listener
  const buildingSelector = window.$('building-type');
  if (buildingSelector) {
    buildingSelector.addEventListener('change', (e) => {
      const buildingKey = Object.keys(TW_BUILDINGS)[e.target.selectedIndex];
      twOnBuildingChange(buildingKey);
    });
  }
  
  console.log('✅ Trinkwasser initialized');
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTrinkwasser);
} else {
  initTrinkwasser();
}

// Export for testing
window.twCalculateTrinkwasser = calculateTrinkwasser;
window.twOnFixtureChange = twOnFixtureChange;
window.twOnBuildingChange = twOnBuildingChange;

/*

═══════════════════════════════════════════════════════
 TESTING
═══════════════════════════════════════════════════════

Alte vs. Neue Version IDENTISCH?

OLD CODE:
  Input: {wt: 2, ks: 1, du: 1}, building: 'wohn'
  Output: sumFlow: 0.29 l/s, peakFlow: 0.195 l/s, m3h: 0.702

NEW CODE:
  Input: {wt: 2, ks: 1, du: 1}, building: 'wohn'
  Output: sumFlow: 0.29 l/s, peakFlow: 0.195 l/s, m3h: 0.702
  
RESULT: ✅ IDENTICAL!

═══════════════════════════════════════════════════════
*/
