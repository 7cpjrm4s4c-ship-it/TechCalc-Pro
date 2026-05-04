/* ═══════════════════════════════════════════════════════
   hx-engine.js — PHASE 3 PREPARATION (v2)
   
   WICHTIG:
   - Phase 3: NUR Preparation für Phase 4!
   - Phase 4: Complete Canvas Rewrite!
   
   Strategie für Phase 4:
   1. Bestehender Code bleibt (alt version)
   2. Neue Canvas-basierte Version wird separat entwickelt
   3. Schnittstelle wird definiert
   4. Integration in Phase 5
═══════════════════════════════════════════════════════ */
'use strict';

// ─────────────────────────────────────────
// HX-ENGINE STATE
// ─────────────────────────────────────────

const HXState = {
  mode: 'mollier',  // mollier, calc, comparison
  P: 101.325,       // Druck [kPa]
  T1: 0,            // Temperatur 1 [°C]
  phi1: 50,         // relative Feuchte 1 [%]
  T2: 0,            // Temperatur 2 [°C]
  phi2: 50,         // relative Feuchte 2 [%]
  state1: null,
  state2: null,
};

// ─────────────────────────────────────────
// UI RENDERING (NEW with UI.* Components)
// Phase 4 wird Canvas implementieren
// ─────────────────────────────────────────

function buildHXEngineUI() {
  let html = '';

  // Title
  html += UI.SectionTitle('Mollier-Diagramm & Zustandsänderung');

  // Mode Selection
  html += UI.SectionTitle('Betriebsart', 'small');
  const modes = ['Mollier-Diagramm', 'Zustandsberechnung', 'Vergleich'];
  html += UI.SegmentControl('hx-mode', modes, 0);

  // Input Section
  html += UI.SectionTitle('Eingabe', 'small');

  html += UI.Card(
    UI.InputGroup('Luftdruck', 'hx-pressure', { type: 'number', unit: 'kPa', value: 101.325, step: 0.1 }),
    'neutral'
  );

  html += UI.Card(
    UI.InputGroup('Temperatur 1', 'hx-t1', { type: 'number', unit: '°C', value: 0, step: 0.1 }),
    'neutral'
  );

  html += UI.Card(
    UI.InputGroup('Relative Feuchte 1', 'hx-phi1', { type: 'number', unit: '%', value: 50, min: 0, max: 100, step: 1 }),
    'neutral'
  );

  html += UI.Card(
    UI.InputGroup('Temperatur 2', 'hx-t2', { type: 'number', unit: '°C', value: 20, step: 0.1 }),
    'neutral'
  );

  html += UI.Card(
    UI.InputGroup('Relative Feuchte 2', 'hx-phi2', { type: 'number', unit: '%', value: 50, min: 0, max: 100, step: 1 }),
    'neutral'
  );

  // Results Section
  html += UI.SectionTitle('Zustandsgrößen', 'small');

  html += UI.Card(
    '<strong>Zustand 1:</strong><br/>' +
    'Absolute Feuchte: <span id="hx-x1">–</span> g/kg<br/>' +
    'Enthalpie: <span id="hx-h1">–</span> kJ/kg',
    'neutral'
  );

  html += UI.Card(
    '<strong>Zustand 2:</strong><br/>' +
    'Absolute Feuchte: <span id="hx-x2">–</span> g/kg<br/>' +
    'Enthalpie: <span id="hx-h2">–</span> kJ/kg',
    'neutral'
  );

  // Canvas placeholder (Phase 4!)
  html += UI.SectionTitle('Diagramm', 'small');
  html += '<div id="hx-canvas-container" style="' +
    'width: 100%; aspect-ratio: 4/3; ' +
    'background: #f0f0f0; border-radius: 8px; ' +
    'display: flex; align-items: center; justify-content: center;' +
    '">' +
    '<p style="color: #999; text-align: center;">' +
    '🎨 Canvas Diagramm wird in Phase 4 implementiert!<br/>' +
    '(Mollier-Diagramm mit Zustandsänderungen)' +
    '</p>' +
    '</div>';

  return html;
}

// ─────────────────────────────────────────
// CALCULATIONS (PLACEHOLDER)
// Echte Implementierung in Phase 4!
// ─────────────────────────────────────────

function calculateAirState(T, phi, P = 101.325) {
  // Phase 4: Komplette psychrometric calculations
  // Für jetzt: Simple placeholder
  return {
    T: T,
    phi: phi,
    x: phi * 0.6,  // Placeholder für absolute Feuchte
    h: T * 1.005 + phi * 2.5,  // Placeholder für Enthalpie
  };
}

function updateHXResults() {
  const P = parseFloat(window.$('hx-pressure')?.value || 101.325);
  const T1 = parseFloat(window.$('hx-t1')?.value || 0);
  const phi1 = parseFloat(window.$('hx-phi1')?.value || 50);
  const T2 = parseFloat(window.$('hx-t2')?.value || 20);
  const phi2 = parseFloat(window.$('hx-phi2')?.value || 50);

  HXState.P = P;
  HXState.T1 = T1;
  HXState.phi1 = phi1;
  HXState.T2 = T2;
  HXState.phi2 = phi2;

  HXState.state1 = calculateAirState(T1, phi1, P);
  HXState.state2 = calculateAirState(T2, phi2, P);

  // Update display
  const x1El = window.$('hx-x1');
  const h1El = window.$('hx-h1');
  const x2El = window.$('hx-x2');
  const h2El = window.$('hx-h2');

  if (x1El) x1El.textContent = window.loc(HXState.state1.x, 1);
  if (h1El) h1El.textContent = window.loc(HXState.state1.h, 1);
  if (x2El) x2El.textContent = window.loc(HXState.state2.x, 1);
  if (h2El) h2El.textContent = window.loc(HXState.state2.h, 1);
}

// ─────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────

function initHXEngine() {
  const container = window.$('hx-section');
  if (!container) return;

  container.innerHTML = buildHXEngineUI();

  // Attach listeners
  ['hx-pressure', 'hx-t1', 'hx-phi1', 'hx-t2', 'hx-phi2'].forEach(id => {
    const el = window.$(id);
    if (el) {
      el.addEventListener('input', updateHXResults);
      el.addEventListener('change', updateHXResults);
    }
  });

  const modeControl = window.$('hx-mode');
  if (modeControl) {
    modeControl.addEventListener('change', (e) => {
      HXState.mode = ['mollier', 'calc', 'comparison'][e.target.selectedIndex || 0];
      // Phase 4: Mode-spezifische UI
    });
  }

  console.log('✅ HX-Engine v2 initialized (Phase 4 Preparation!)');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHXEngine);
} else {
  initHXEngine();
}

// Export for Phase 4
window.hxCalculateAirState = calculateAirState;
window.HXState = HXState;

/*

═══════════════════════════════════════════════════════
 PHASE 4 PLAN (HX-ENGINE COMPLETE REWRITE)
═══════════════════════════════════════════════════════

Phase 3 Task: Preparation ONLY!
  ✅ Define input/output interface
  ✅ Plan Canvas implementation
  ✅ Placeholder UI with UI.* Components

Phase 4 Task: Complete Rewrite!
  ✅ Implement psychrometric calculations
     (absolute humidity, enthalpy, dew point, etc.)
  
  ✅ Implement Canvas-based Mollier-Diagramm
     • Constant humidity lines
     • Temperature lines
     • Enthalpy lines
     • Current state points (1, 2)
     • Process line (1→2)
  
  ✅ Interactive mode:
     • Click on diagram to select state
     • Automatic calculation of properties
     • Real-time updates
  
  ✅ Export mode:
     • Save diagram as image
     • Export state data

Details: See PHASE4_HX_ENGINE_PLAN.md

═══════════════════════════════════════════════════════
*/
