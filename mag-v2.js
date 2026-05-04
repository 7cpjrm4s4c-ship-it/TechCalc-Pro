/* ═══════════════════════════════════════════════════════
   mag.js — PHASE 3 REFACTORED (v2)
   MAG Druckhaltung — Auslegung
═══════════════════════════════════════════════════════ */
'use strict';

const MAG_SIZES = [8,12,18,25,35,50,80,100,140,200,250,300,400,500,600,800,1000,1500,2000,2500,3000,4000,5000];

function magNum(id) {
  const n = parseFloat(window.$(id)?.value || 0);
  return isNaN(n) ? 0 : n;
}

function magFmt(v, d = 1, u = '') {
  if (v == null || isNaN(v)) return '–';
  return Number(v).toLocaleString('de-DE', {
    minimumFractionDigits: d, maximumFractionDigits: d
  }) + (u ? ' ' + u : '');
}

function expansionCoeff(tMin, tMax, medium) {
  const table = [
    [0,0],[10,0],[20,.002],[30,.004],[40,.008],[50,.012],
    [60,.017],[70,.023],[80,.029],[90,.036],[100,.043],
    [110,.052],[120,.062]
  ];

  const interp = T => {
    if (T <= table[0][0]) return table[0][1];
    for (let i = 1; i < table.length; i++) {
      const [t1,e1] = table[i-1];
      const [t2,e2] = table[i];
      if (T <= t2) return e1 + (e2-e1)*((T-t1)/(t2-t1));
    }
    return table[table.length-1][1];
  };

  let e = Math.max(0, interp(tMax) - interp(tMin));
  if (medium === 'glycol25') e *= 1.08;
  if (medium === 'glycol35') e *= 1.14;
  return e;
}

function calcMAG() {
  const VA = magNum('mag-volume');
  const tMin = magNum('mag-tmin');
  const tMax = magNum('mag-tmax');
  const h = magNum('mag-height');
  const pSV = magNum('mag-sv');
  const medium = window.$('mag-medium')?.value || 'water';

  const hintEl = window.$('mag-hints');
  const set = (id, txt) => {
    const el = window.$(id);
    if (el) el.textContent = txt;
  };

  if ([VA, tMin, tMax, h, pSV].some(isNaN) || VA <= 0 || pSV <= 0 || tMax <= tMin) {
    ['mag-ve','mag-vn','mag-p0','mag-pe'].forEach(id => set(id, '–'));
    if (hintEl) hintEl.innerHTML = 'Alle Werte eingeben!';
    return;
  }

  const pSys = h * 0.1 + 0.5;
  const e = expansionCoeff(tMin, tMax, medium);
  const VE = VA * e;
  const reserve = Math.max(3, VA * 0.005);
  const p0 = Math.max(0.8, h * 0.1 + 0.3);
  const pe = Math.max(p0 + 0.5, pSV - 0.5);
  const VNmin = (VE + reserve) * ((pe + 1) / (pe - p0));
  const recommended = MAG_SIZES.find(s => s >= VNmin) || Math.ceil(VNmin / 500) * 500;

  set('mag-ve', magFmt(VE, 1, 'l'));
  set('mag-vn', magFmt(VNmin, 1, 'l'));
  set('mag-recommended', recommended + ' l');
  set('mag-p0', magFmt(p0, 1, 'bar'));
  set('mag-pe', magFmt(pe, 1, 'bar'));

  const warnings = [];
  if (pSV <= pSys) warnings.push('⚠ Sicherheitsventil zu klein!');
  if (pe >= pSV - 0.2) warnings.push('⚠ Enddruck kritisch!');
  warnings.push('Quick-Check nach DIN EN 12828');

  if (hintEl) hintEl.innerHTML = warnings.map(w => '• ' + w).join('<br>');
}

function buildMAGUI() {
  let html = '';
  html += UI.SectionTitle('MAG Druckhaltung');

  html += UI.SectionTitle('System', 'small');
  html += UI.Card(
    UI.InputGroup('System-Volumen', 'mag-volume', { type: 'number', unit: 'l', value: 100, step: 10 }),
    'neutral'
  );

  html += UI.Card(
    UI.InputGroup('Min. Temperatur', 'mag-tmin', { type: 'number', unit: '°C', value: 10, step: 1 }),
    'neutral'
  );

  html += UI.Card(
    UI.InputGroup('Max. Temperatur', 'mag-tmax', { type: 'number', unit: '°C', value: 80, step: 1 }),
    'neutral'
  );

  html += UI.Card(
    UI.InputGroup('Statische Höhe', 'mag-height', { type: 'number', unit: 'm', value: 10, step: 1 }),
    'neutral'
  );

  html += UI.Card(
    UI.InputGroup('Sicherheitsventil', 'mag-sv', { type: 'number', unit: 'bar', value: 3, step: 0.1 }),
    'neutral'
  );

  html += UI.SectionTitle('Fluid', 'small');
  const mediums = ['Wasser', 'Ethylenglykol 25%', 'Propylenglykol 25%'];
  html += UI.SegmentControl('mag-medium', mediums, 0);

  html += UI.SectionTitle('Ergebnisse', 'small');
  html += UI.ResultCard('Expansionsvolumen', 0, 'l', { id: 'mag-result-ve' });
  html += UI.ResultCard('MAG-Volumen (min)', 0, 'l', { id: 'mag-result-vn' });
  html += UI.Card('<strong>Empfohlene Größe:</strong><br><span id="mag-recommended">–</span>', 'neutral');
  html += UI.Card('<strong>Vordruck:</strong> <span id="mag-p0">–</span> | <strong>Enddruck:</strong> <span id="mag-pe">–</span>', 'neutral');

  html += UI.SectionTitle('Hinweise', 'small');
  html += UI.Card('<div id="mag-hints" style="font-size:12px;line-height:1.6;color:var(--t2)"></div>', 'neutral');

  return html;
}

function initMAG() {
  const container = window.$('mag-section');
  if (!container) return;
  container.innerHTML = buildMAGUI();

  ['mag-volume','mag-tmin','mag-tmax','mag-height','mag-sv'].forEach(id => {
    window.$(id)?.addEventListener('input', calcMAG);
    window.$(id)?.addEventListener('change', calcMAG);
  });

  window.$('mag-medium')?.addEventListener('change', calcMAG);
  calcMAG();
  console.log('✅ MAG v2 initialized');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMAG);
} else {
  initMAG();
}

window.calcMAG = calcMAG;
