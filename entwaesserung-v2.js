/* ═══════════════════════════════════════════════════════
   entwaesserung.js — PHASE 3 REFACTORED (v2)
   Entwässerung Dimensionierung
═══════════════════════════════════════════════════════ */
'use strict';

const EW_FIXTURES = [
  { key:'wc_6',       label:'WC 6 l',                    du:2.0 },
  { key:'wc_9',       label:'WC 9 l',                    du:2.5 },
  { key:'washbasin',  label:'Waschtisch',                du:0.5 },
  { key:'shower',     label:'Dusche',                    du:0.8 },
  { key:'bath',       label:'Badewanne',                 du:0.8 },
  { key:'sink',       label:'Küchenspüle',               du:0.8 },
  { key:'dishwasher', label:'Geschirrspüler',            du:0.8 },
  { key:'washer',     label:'Waschmaschine',             du:0.8 },
  { key:'floor',      label:'Bodenablauf',               du:0.8 },
];

const EW_K = {
  wohn:   { label:'Wohngebäude', k:0.5 },
  buero:  { label:'Büro', k:0.5 },
  hotel:  { label:'Hotel', k:0.7 },
  schule: { label:'Schule', k:0.7 },
  gewerb: { label:'Gewerbe', k:1.0 },
};

const EW_STATE = { result: null, straenge: [] };

function ewNum(v) {
  if (v == null) return 0;
  const n = parseFloat(String(v).replace(',', '.').trim());
  return isNaN(n) ? 0 : n;
}

function ewFmt(v, d=2) {
  return (isNaN(v) || v == null) ? '–' : Number(v).toFixed(d).replace('.', ',');
}

function calcEntwaesserung() {
  const use = window.$('ew-use')?.value || 'wohn';
  const kData = EW_K[use] || EW_K.wohn;
  let duTotal = 0;

  const rows = [];
  EW_FIXTURES.forEach(f => {
    const n = Math.max(0, Math.round(ewNum(window.$('ew-' + f.key)?.value)));
    const du = n * f.du;
    if (n > 0) rows.push({ ...f, count: n, du });
    duTotal += du;
  });

  const qww = duTotal > 0 ? kData.k * Math.sqrt(duTotal) : 0;
  const result = { use, useLabel: kData.label, k: kData.k, duTotal, qww, rows };
  EW_STATE.result = result;
  renderEntwaesserung(result);
  return result;
}

function renderEntwaesserung(r) {
  const set = (id, txt) => {
    const el = window.$(id);
    if (el) el.textContent = txt;
  };

  set('ew-du-total', ewFmt(r.duTotal, 1));
  set('ew-qww', ewFmt(r.qww, 2));
  set('ew-k-label', `K = ${ewFmt(r.k, 2)} · ${r.useLabel}`);

  const detail = window.$('ew-detail');
  if (detail) {
    detail.innerHTML = r.rows.length ? r.rows.map(row =>
      `<div style="padding:8px;background:var(--glass);border-radius:var(--r-s);display:flex;justify-content:space-between;font-size:13px">
        <span>${row.count}× ${row.label}</span><strong>${ewFmt(row.du,1)} DU</strong>
      </div>`).join('')
      : '<p style="color:var(--t3);font-size:12px;text-align:center;padding:8px">Gegenstände eingeben →</p>';
  }
}

function buildEntwaesserungUI() {
  let html = '';
  html += UI.SectionTitle('Entwässerung');

  html += UI.SectionTitle('Gebäudetyp', 'small');
  const useLabels = Object.keys(EW_K).map(k => EW_K[k].label);
  html += UI.SegmentControl('ew-use', useLabels, 0);

  html += UI.SectionTitle('Entwässerungsgegenstände', 'small');
  EW_FIXTURES.forEach(f => {
    html += UI.Card(
      UI.InputGroup(f.label, `ew-${f.key}`, 
        { type: 'number', unit: 'Stk.', min: 0, step: 1, value: 0 }),
      'neutral'
    );
  });

  html += UI.SectionTitle('Ergebnisse', 'small');
  html += UI.ResultCard('DU Summe', 0, 'DU', { id: 'ew-result-du' });
  html += UI.ResultCard('Abflussmenge', 0, 'l/s', { id: 'ew-result-qww' });

  html += UI.SectionTitle('Dimensionierung', 'small');
  html += UI.Card(
    '<strong>K-Faktor:</strong> <span id="ew-k-label">–</span><br>' +
    '<div id="ew-detail" style="margin-top:8px"></div>',
    'neutral'
  );

  return html;
}

function updateEntwaesserung() {
  const result = calcEntwaesserung();
  const set = (id, val) => {
    const el = window.$(id);
    if (!el) return;
    const valEl = el.querySelector('.result-card__value');
    if (valEl) valEl.textContent = val > 0 ? window.loc(val, 2) : '–';
  };
  set('ew-result-du', result.duTotal);
  set('ew-result-qww', result.qww);
}

function initEntwaesserung() {
  const container = window.$('ew-section');
  if (!container) return;

  container.innerHTML = buildEntwaesserungUI();

  EW_FIXTURES.forEach(f => {
    const input = window.$('ew-' + f.key);
    if (input) {
      input.addEventListener('input', updateEntwaesserung);
      input.addEventListener('change', updateEntwaesserung);
    }
  });

  const useSelect = window.$('ew-use');
  if (useSelect) {
    useSelect.addEventListener('change', updateEntwaesserung);
  }

  console.log('✅ Entwaesserung v2 initialized');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEntwaesserung);
} else {
  initEntwaesserung();
}

window.calcEntwaesserung = calcEntwaesserung;
