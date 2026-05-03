/* ═══════════════════════════════════════════════════════
   entwaesserung.js — TechCalc Pro
   Entwässerung Quick Tool · DU · Schmutzwasserabfluss
   Quick-Check, keine vollständige Entwässerungsplanung
═══════════════════════════════════════════════════════ */
'use strict';

const EW_FIXTURES = [
  { key:'wc_6',       label:'WC 6 l',                    du:2.0,  pipe:'DN 90 / DN 100' },
  { key:'wc_9',       label:'WC 9 l / Bestand',          du:2.5,  pipe:'DN 100' },
  { key:'washbasin',  label:'Waschtisch',                du:0.5,  pipe:'DN 40 / DN 50' },
  { key:'shower',     label:'Dusche',                    du:0.8,  pipe:'DN 50' },
  { key:'bath',       label:'Badewanne',                 du:0.8,  pipe:'DN 50' },
  { key:'urinal',     label:'Urinal',                    du:0.5,  pipe:'DN 50' },
  { key:'sink',       label:'Küchenspüle',               du:0.8,  pipe:'DN 50' },
  { key:'dishwasher', label:'Geschirrspüler',            du:0.8,  pipe:'DN 50' },
  { key:'washer',     label:'Waschmaschine',             du:0.8,  pipe:'DN 50' },
  { key:'floor',      label:'Bodenablauf',               du:0.8,  pipe:'DN 50 / DN 70' },
  { key:'special',    label:'Sonderverbraucher',         du:1.0,  pipe:'objektbezogen' },
];

const EW_K = {
  wohn:   { label:'Wohngebäude / wohnähnlich', k:0.5 },
  buero:  { label:'Büro / Verwaltung',         k:0.5 },
  hotel:  { label:'Hotel / Beherbergung',      k:0.7 },
  schule: { label:'Schule / Sport / öffentlich', k:0.7 },
  gewerb: { label:'Gewerbe / hohe Gleichzeitigkeit', k:1.0 },
};

const EW_STATE = { result:null, editingName:null, straenge: JSON.parse(localStorage.getItem('ew_straenge') || '[]')};
window.EW_STATE = EW_STATE;

function ewNum(v) {
  if (v == null) return 0;
  const n = parseFloat(String(v).replace(',', '.').trim());
  return isNaN(n) ? 0 : n;
}
function ewFmt(v, d=2) { return (isNaN(v) || v == null) ? '–' : Number(v).toFixed(d).replace('.', ','); }
function ewGet(id) { return document.getElementById(id); }

function ewRecommendedPipe(qww, du) {
  if (du <= 2.5 && qww <= 1.0) return {
    aggregate: ewAggregateStraenge(), anschluss:'DN 50', sammel:'DN 70', fall:'DN 70 / DN 80', grund:'DN 100' };
  if (du <= 8 && qww <= 2.0)   return { anschluss:'DN 70', sammel:'DN 80 / DN 100', fall:'DN 100', grund:'DN 100' };
  if (du <= 20 && qww <= 3.5)  return { anschluss:'DN 100', sammel:'DN 100', fall:'DN 100', grund:'DN 125' };
  if (du <= 50 && qww <= 6.0)  return { anschluss:'DN 100', sammel:'DN 125', fall:'DN 125', grund:'DN 150' };
  return { anschluss:'objektbezogen', sammel:'objektbezogen', fall:'objektbezogen', grund:'objektbezogen' };
}

function ewHints(result) {
  const hints = [];
  hints.push('Lüftung der Entwässerungsanlage prüfen: Hauptlüftung / Nebenlüftung nach Anlagenaufbau berücksichtigen.');
  hints.push('Rückstauebene und ggf. Rückstausicherung/Hebeanlage objektbezogen prüfen.');
  hints.push('Gefälle, Füllungsgrad, Leitungslängen, Richtungsänderungen und örtliche Satzungen bleiben separat zu prüfen.');
  if (result.duTotal > 20) hints.push('Hohe DU-Summe: Dimensionierung und Lüftung fachplanerisch vertiefen.');
  if (result.floorCount > 0) hints.push('Bodenabläufe nur mit geeigneter Geruchsverschluss-/Sperrwasserlösung und Nutzungskonzept ansetzen.');
  return hints;
}

function ewRowsHtml() {
  return EW_FIXTURES.map(f => `
    <div class="ew-row" data-ew-key="${f.key}">
      <div class="ew-fixture">
        <strong>${f.label}</strong>
        <span>DU ${ewFmt(f.du,1)} · ${f.pipe}</span>
      </div>
      <div class="iwrap ew-count-wrap">
        <input class="inp-sm ew-count" id="ew-${f.key}" type="number" min="0" step="1" value="0" inputmode="numeric" aria-label="${f.label} Anzahl">
        <span class="iunit">Stk.</span>
      </div>
    </div>`).join('');
}

function initEntwaesserung() {
  const list = ewGet('ew-fixture-list');
  if (list && !list.dataset.ready) {
    list.innerHTML = ewRowsHtml();
    list.dataset.ready = '1';
  }
  document.querySelectorAll('#tab-entwaesserung input, #tab-entwaesserung select').forEach(el => {
    el.addEventListener('input', calcEntwaesserung);
    el.addEventListener('change', calcEntwaesserung);
  });
  ewGet('ew-calc-btn')?.addEventListener('click', addEntwaesserungStrang);
  renderStrangListe();
  renderEntwaesserungTotals();
  calcEntwaesserung();
}

function calcEntwaesserung() {
  const use = ewGet('ew-use')?.value || 'wohn';
  const kData = EW_K[use] || EW_K.wohn;
  let duTotal = 0;
  let floorCount = 0;
  const rows = [];

  EW_FIXTURES.forEach(f => {
    const n = Math.max(0, Math.round(ewNum(ewGet('ew-' + f.key)?.value)));
    const du = n * f.du;
    if (n > 0) rows.push({ ...f, count:n, du });
    duTotal += du;
    if (f.key === 'floor') floorCount += n;
  });

  const specialQ = ewNum(ewGet('ew-special-q')?.value); // l/s Zuschlag
  const qww = duTotal > 0 ? kData.k * Math.sqrt(duTotal) + specialQ : specialQ;
  const dims = ewRecommendedPipe(qww, duTotal);
  const result = { use, useLabel:kData.label, k:kData.k, duTotal, specialQ, qww, dims, rows, floorCount };
  EW_STATE.result = result;
  renderEntwaesserung(result);
  return result;
}

function renderEntwaesserung(r) {
  const set = (id, txt) => { const el = ewGet(id); if (el) el.textContent = txt; };
  // Ergebnis-Grid zeigt ausschließlich den aktuell eingegebenen / bearbeiteten Strang.
  // Die Summe aller gespeicherten Stränge steht separat in der Strangübersicht.
  set('ew-du-total', ewFmt(r.duTotal, 1));
  set('ew-qww', ewFmt(r.qww, 2));
  set('ew-dim-anschluss', r.dims.anschluss);
  set('ew-dim-sammel', r.dims.sammel);
  set('ew-dim-fall', r.dims.fall);
  set('ew-dim-grund', r.dims.grund);
  set('ew-k-label', `K = ${ewFmt(r.k, 2)} · ${r.useLabel}`);

  const detail = ewGet('ew-detail');
  if (detail) {
    detail.innerHTML = r.rows.length ? r.rows.map(row => `
      <div class="ew-detail-row"><span>${row.count}× ${row.label}</span><strong>${ewFmt(row.du,1)} DU</strong></div>`).join('')
      : '<p style="color:var(--t3);font-size:12px;text-align:center;padding:8px 0">Entwässerungsgegenstände eingeben →</p>';
  }
  const hints = ewGet('ew-hints');
  if (hints) hints.innerHTML = ewHints(r).map(h => `<div>• ${h}</div>`).join('');
}


function resetEntwaesserungInputs() {
  EW_FIXTURES.forEach(f => {
    const el = ewGet('ew-' + f.key);
    if (el) el.value = 0;
  });
  const sq = ewGet('ew-special-q');
  if (sq) sq.value = '';
}

function saveStraenge() {
  localStorage.setItem('ew_straenge', JSON.stringify(EW_STATE.straenge || []));
}

function addEntwaesserungStrang() {
  const r = calcEntwaesserung();
  if (!r || r.duTotal <= 0) return;
  const strang = {
    id: Date.now(),
    name: (ewGet('ew-strang-name')?.value?.trim() || EW_STATE.editingName || `Strang ${ (EW_STATE.straenge?.length || 0) + 1 }`),
    duTotal: r.duTotal,
    qww: r.qww,
    dims: r.dims,
    rows: r.rows
  };
  EW_STATE.straenge = EW_STATE.straenge || [];
  EW_STATE.straenge.push(strang);
  saveStraenge();
  renderStrangListe();
  renderEntwaesserungTotals();
  resetEntwaesserungInputs();
  const nameEl = ewGet('ew-strang-name'); if (nameEl) nameEl.value = '';
  EW_STATE.editingName = null;
  calcEntwaesserung();
}

function deleteStrang(id) {
  EW_STATE.straenge = (EW_STATE.straenge || []).filter(s => s.id !== id);
  saveStraenge();
  renderStrangListe();
  renderEntwaesserungTotals();
}
window.deleteStrang = deleteStrang;
window.deleteEntwaesserungStrang = deleteStrang;


function ewAggregateStraenge() {
  const list = EW_STATE.straenge || [];
  const totals = {};
  let duTotal = 0;
  let qwwTotal = 0;

  list.forEach(s => {
    duTotal += Number(s.duTotal) || 0;
    qwwTotal += Number(s.qww) || 0;

    (s.rows || []).forEach(r => {
      const key = r.key || r.label || 'unknown';
      if (!totals[key]) totals[key] = { key, label: r.label || key, count: 0, du: 0 };
      totals[key].count += Number(r.count) || 0;
      totals[key].du += Number(r.sum) || Number(r.du) || 0;
    });
  });

  return {
    list,
    duTotal,
    qwwTotal,
    fixtures: Object.values(totals).filter(x => x.count > 0)
  };
}

function renderEntwaesserungTotals() {
  const host = ewGet('ew-total-fixtures');
  if (!host) return;

  const agg = ewAggregateStraenge();
  if (!agg.list.length) {
    host.innerHTML = '<p style="color:var(--t3);font-size:12px">Noch keine Stränge angelegt.</p>';
    return;
  }

  const rows = agg.fixtures.map(f => `
    <div class="ew-fixture-total-row">
      <strong>${f.label}</strong>
      <span>${f.count} Stk.</span>
      <span>${ewFmt(f.du,1)} DU</span>
    </div>
  `).join('');

  const dims = agg.list.map((s, idx) => `
    <div class="ew-strang-dim-row ew-strang-fall-row">
      <strong>${s.name || ('Strang ' + (idx + 1))}</strong>
      <span>Fallleitung</span>
      <span>${s.dims?.fall || '–'}</span>
    </div>
  `).join('');

  host.innerHTML = `
    <div class="ew-total-head">
      <span>Stränge: <strong>${agg.list.length}</strong></span>
      <span>ΣDU: <strong>${ewFmt(agg.duTotal,1)}</strong></span>
      <span>ΣQww: <strong>${ewFmt(agg.qwwTotal,2)} l/s</strong></span>
    </div>
    <div class="ew-strang-dims">${dims}</div>
    <div class="ew-strang-summary">${rows || '<p style="color:var(--t3);font-size:12px">Keine Gegenstände gespeichert.</p>'}</div>
  `;
}


function editEntwaesserungStrang(id) {
  const list = EW_STATE.straenge || [];
  const s = list.find(x => Number(x.id) === Number(id));
  if (!s) return;

  resetEntwaesserungInputs();
  EW_STATE.editingName = s.name || null;
  const nameEl = ewGet('ew-strang-name'); if (nameEl) nameEl.value = s.name || '';

  (s.rows || []).forEach(r => {
    const el = ewGet('ew-' + r.key);
    if (el) el.value = Number(r.count) || 0;
  });

  EW_STATE.straenge = list.filter(x => Number(x.id) !== Number(id));
  saveStraenge();
  renderStrangListe();
  renderEntwaesserungTotals();
  calcEntwaesserung();
}
window.editEntwaesserungStrang = editEntwaesserungStrang;

function renderStrangListe() {
  const host = ewGet('ew-strang-list');
  if (!host) return;

  const list = EW_STATE.straenge || [];
  if (!list.length) {
    host.innerHTML = '<p style="color:var(--t3);font-size:12px">Noch keine Stränge angelegt.</p>';
    renderEntwaesserungTotals();
    return;
  }

  host.innerHTML = list.map(s => `
    <div class="ew-strang-row">
      <div class="ew-strang-main"><strong>${s.name}</strong><span>${ewFmt(s.duTotal,1)} DU · Qww ${ewFmt(s.qww,2)} l/s</span></div>
      <div class="ui-action-row">
        <button class="ew-mini-btn" type="button" onclick="editEntwaesserungStrang(${s.id})">Bearbeiten</button>
        <button class="ew-mini-btn danger" type="button" onclick="deleteEntwaesserungStrang(${s.id})">Löschen</button>
      </div>
    </div>
  `).join('');

  renderEntwaesserungTotals();
}

function getEntwaesserungPdfData() {
  const current = EW_STATE.result || calcEntwaesserung();
  return {
    current,
    straenge: EW_STATE.straenge || [],
    aggregate: ewAggregateStraenge()
  };
}
window.getEntwaesserungPdfData = getEntwaesserungPdfData;

document.addEventListener('DOMContentLoaded', initEntwaesserung);

/* Phase 17: PDF-Snapshot Provider */
window.TCP_PDF_SNAPSHOTS = window.TCP_PDF_SNAPSHOTS || {};
window.TCP_PDF_SNAPSHOTS.entwaesserung = function getEntwaesserungPdfSnapshot() {
  return (typeof getEntwaesserungPdfData === 'function') ? getEntwaesserungPdfData() : {
    current: window.EW_STATE?.result || null,
    aggregate: null,
    generatedAt: new Date().toISOString()
  };
};
