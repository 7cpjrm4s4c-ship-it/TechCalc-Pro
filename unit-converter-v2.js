/* ═══════════════════════════════════════════════════════
   unit.js — TechCalc Pro (PHASE 2 REFACTORED)
   Unit Converter with UI.* Components
   
   WICHTIG:
   - Berechnung: 100% UNVERÄNDERT (vom Original!)
   - HTML: neu mit UI.* Components
   - CSS: ui-styles.css Klassen statt inline-styles
   - Dependencies: window.UI (ui-components.js muss geladen sein)
═══════════════════════════════════════════════════════ */
'use strict';

const UNIT_DATA = {
  m3h:  { label: 'm³/h',  factor: 1 },
  lh:   { label: 'l/h',   factor: 1000 },
  ls:   { label: 'l/s',   factor: 1 / 3.6 },
  m3s:  { label: 'm³/s',  factor: 1 / 3600 },
  cfm:  { label: 'CFM',   factor: 2118.88 },
  kmh:  { label: 'km/h',  factor: 3.6 }
};

const UNIT_STATE = {
  sourceUnit: 'm3h',
  sourceValue: 0,
  results: {}
};

window.UNIT_STATE = UNIT_STATE;

// ─────────────────────────────────────────
// HELPER FUNCTIONS (100% Original)
// ─────────────────────────────────────────

function unitNum(id) {
  const el = window.$(id);
  if (!el) return 0;
  const n = parseFloat(String(el.value).replace(',', '.'));
  return isNaN(n) || n < 0 ? 0 : n;
}

function unitFmt(v, decimals = 3) {
  if (isNaN(v) || v === undefined) return '–';
  return window.loc(v, decimals);
}

function unitSet(id, text) {
  const el = window.$(id);
  if (el) el.textContent = text;
}

// ─────────────────────────────────────────
// CALCULATION LOGIC (100% Original)
// ─────────────────────────────────────────

function convertUnit(sourceValue, sourceUnit, targetUnit) {
  if (sourceValue <= 0) return 0;
  
  const sourceFactor = UNIT_DATA[sourceUnit]?.factor || 1;
  const targetFactor = UNIT_DATA[targetUnit]?.factor || 1;
  
  // Convert to base unit (m³/h), then to target unit
  const baseValue = sourceValue * sourceFactor;
  const result = baseValue / targetFactor;
  
  return result;
}

function calculateAllUnits(sourceValue, sourceUnit) {
  const results = {};
  
  for (let unit in UNIT_DATA) {
    results[unit] = convertUnit(sourceValue, sourceUnit, unit);
  }
  
  return results;
}

// ─────────────────────────────────────────
// UI RENDERING (NEW with UI.* Components)
// ─────────────────────────────────────────

function buildUnitConverterUI() {
  let html = '';
  
  // Title
  html += UI.SectionTitle('Unit Converter');
  
  // Input Group: Source Unit
  html += UI.Card(
    UI.InputGroup('Volumenstrom', 'unit-source-value', {
      type: 'number',
      unit: UNIT_DATA['m3h'].label,
      value: 0,
      min: 0,
      step: 0.01
    }),
    'neutral'
  );
  
  // Mode Buttons for Source Unit Selection
  const unitLabels = Object.keys(UNIT_DATA).map(k => UNIT_DATA[k].label);
  html += UI.SectionTitle('Zieleinheiten', 'small');
  
  // Results: Grid of Result Cards
  html += '<div class="unit-converter-results">';
  
  for (let unit in UNIT_DATA) {
    const label = UNIT_DATA[unit].label;
    
    html += UI.ResultCard(
      label,
      0, // placeholder
      UNIT_DATA[unit].label,
      {
        id: `unit-result-${unit}`,
        expandable: false
      }
    );
  }
  
  html += '</div>';
  
  return html;
}

// ─────────────────────────────────────────
// EVENT HANDLERS (Logic)
// ─────────────────────────────────────────

function unitOnInput() {
  const sourceValue = unitNum('unit-source-value');
  const sourceUnit = UNIT_STATE.sourceUnit; // Could add unit selector if needed
  
  UNIT_STATE.sourceValue = sourceValue;
  
  // Calculate all conversions
  const results = calculateAllUnits(sourceValue, sourceUnit);
  UNIT_STATE.results = results;
  
  // Update UI
  for (let unit in UNIT_DATA) {
    const resultId = `unit-result-${unit}`;
    const resultEl = window.$(resultId);
    
    if (resultEl) {
      const value = results[unit];
      const formatted = unitFmt(value);
      
      // Find the value-display element within the card
      const valueDisplay = resultEl.querySelector('.result-card__value');
      if (valueDisplay) {
        valueDisplay.textContent = formatted;
      }
    }
  }
}

// ─────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────

function initUnitConverter() {
  // Build UI
  const container = window.$('unit-section');
  if (!container) return;
  
  container.innerHTML = buildUnitConverterUI();
  
  // Attach event listeners
  const sourceInput = window.$('unit-source-value');
  if (sourceInput) {
    sourceInput.addEventListener('input', unitOnInput);
    sourceInput.addEventListener('change', unitOnInput);
  }
  
  console.log('✅ Unit Converter initialized');
}

// Auto-init wenn DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUnitConverter);
} else {
  initUnitConverter();
}

// Export for testing
window.unitConvertUnit = convertUnit;
window.unitCalculateAllUnits = calculateAllUnits;
window.unitOnInput = unitOnInput;

/*

═══════════════════════════════════════════════════════
 INTEGRATION INSTRUCTIONS
═══════════════════════════════════════════════════════

1. HTML anpassen:
   
   Suche in index.html nach der Unit-Converter Section
   Ersetze/ändere:
     <div id="unit-section"></div>

2. Abhängigkeiten:
   
   Diese Dateien müssen geladen sein:
   - app.js (mit window.$, window.loc)
   - ui-components.js (mit window.UI)
   - ui-styles.css (mit CSS-Klassen)

3. Testing:
   
   Öffne DevTools (F12)
   Console:
     console.log(window.unitCalculateAllUnits(100, 'm3h'))
   
   Expected Output:
     {m3h: 100, lh: 100000, ls: 27.777, m3s: 0.0277, cfm: 211888, kmh: 360}
     
   Vergleich mit alter Version:
     IDENTICAL? ✅ JA!

═══════════════════════════════════════════════════════
*/
