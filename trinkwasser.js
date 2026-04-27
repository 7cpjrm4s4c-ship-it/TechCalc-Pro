/* ═══════════════════════════════════════════════════════
   trinkwasser.js — TechCalc Pro
   Trinkwasser Schnellberechnung · V1.2
   Nutzungseinheiten · freie Verbraucher · PDF Export
   Abhängigkeit: app.js muss zuerst geladen sein ($, show, loc)
═══════════════════════════════════════════════════════ */
'use strict';

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
  { id:'av15',label:'Auslaufventil DN15 o. SR',vr:0.30, cold:true, warm:false },
  { id:'av20',label:'Auslaufventil DN20 o. SR',vr:0.50, cold:true, warm:false },
];

const TW_BUILDINGS = {
  wohn:  { label:'Wohngebäude', a:1.48, b:0.19, c:0.94 },
  hotel: { label:'Hotel / Beherbergung', a:0.70, b:0.48, c:0.13 },
  verw:  { label:'Verwaltung / Büro', a:0.91, b:0.31, c:0.38 },
  schule:{ label:'Schule / Sportstätte', a:0.91, b:0.31, c:0.38 },
  pflege:{ label:'Pflege / Krankenhaus', a:0.75, b:0.44, c:0.18 },
};

const TW_NE_TYPES = {
  bad:      { label:'Bad / Badezimmer',       mode:'top2',   gl:null, editable:false, hint:'Normnaher NE-Ansatz: die zwei größten Entnahmestellen.' },
  gaeste:   { label:'Gäste-WC',               mode:'top2',   gl:null, editable:false, hint:'Normnaher NE-Ansatz: die zwei größten Entnahmestellen.' },
  kueche:   { label:'Küche',                  mode:'top2',   gl:null, editable:false, hint:'Normnaher NE-Ansatz: die zwei größten Entnahmestellen.' },
  hwr:      { label:'Hauswirtschaftsraum',    mode:'top2',   gl:null, editable:false, hint:'Normnaher NE-Ansatz: die zwei größten Entnahmestellen.' },
  oeffwc:   { label:'Öffentliches WC',        mode:'factor', gl:0.35, editable:true,  hint:'Praxisansatz über GL-Faktor. Bei Objektvorgaben anpassen.' },
  dusch:    { label:'Großraumdusche',         mode:'factor', gl:0.65, editable:true,  hint:'Praxisansatz über GL-Faktor. Bei Objektvorgaben anpassen.' },
  teekueche:{ label:'Teeküche',               mode:'factor', gl:0.50, editable:true,  hint:'Praxisansatz über GL-Faktor. Bei Objektvorgaben anpassen.' },
  manuell:  { label:'Sonderbereich / manuell',mode:'factor', gl:1.00, editable:true,  hint:'Manueller Gleichzeitigkeitsansatz.' },
};

const TW_STATE = { nes: [] };
window.TW_STATE = TW_STATE;

function twNum(id) {
  const el = $(id);
  if (!el) return 0;
  const n = parseFloat(String(el.value).replace(',', '.'));
  return isNaN(n) || n < 0 ? 0 : n;
}
function twFmt(v, d=2) { return isNaN(v) ? '–' : loc(v, d); }
function twSet(id, txt) { const e=$(id); if(e) e.textContent = txt; }
function twEsc(s) { return String(s || '').replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }

function twPeak(sum, buildingKey) {
  if (!sum || sum <= 0) return 0;
  const b = TW_BUILDINGS[buildingKey] || TW_BUILDINGS.wohn;
  return Math.max(0, b.a * Math.pow(sum, b.b) - b.c);
}

function twRecommendDN(vsLs) {
  if (vsLs <= 0) return '–';
  if (vsLs <= 0.45) return 'DN 20';
  if (vsLs <= 0.85) return 'DN 25';
  if (vsLs <= 1.45) return 'DN 32';
  if (vsLs <= 2.30) return 'DN 40';
  if (vsLs <= 3.80) return 'DN 50';
  if (vsLs <= 6.00) return 'DN 65';
  return 'DN 80+';
}

function twRecommendMeter(vsLs) {
  if (vsLs <= 0) return '–';
  const m3h = vsLs * 3.6;
  if (m3h <= 3.2) return 'Q3 4';
  if (m3h <= 5.0) return 'Q3 6,3';
  if (m3h <= 8.0) return 'Q3 10';
  if (m3h <= 12.8) return 'Q3 16';
  return 'größer Q3 16 prüfen';
}

function twFixtureInput(id, value='0') {
  return `<div class="iwrap" style="min-width:0">
    <input class="inp-sm tw-in" id="${id}" type="number" min="0" step="1" value="${value}" inputmode="numeric" style="padding:10px 12px;font-size:16px"/>
    <span class="iunit">St.</span>
  </div>`;
}

function twFixtureRows(prefix, counts={}) {
  return TW_FIXTURES.map(f => `
    <div class="tw-row" style="display:grid;grid-template-columns:1fr 86px;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--gb-soft)">
      <div>
        <div style="font-family:var(--f);font-size:13px;font-weight:700;color:var(--t2)">${f.label}</div>
        <div style="font-family:var(--fm);font-size:11px;color:var(--t3)">V<sub>R</sub> ${twFmt(f.vr,2)} l/s ${f.dauer?'· Dauerverbraucher':''}</div>
      </div>
      ${twFixtureInput(`${prefix}-${f.id}`, counts[f.id] || 0)}
    </div>`).join('');
}

function buildTwFreeFixtures() {
  const wrap = $('tw-free-fixtures');
  if (!wrap) return;
  const counts = {};
  TW_FIXTURES.forEach(f => counts[f.id] = twNum('tw-free-' + f.id));
  wrap.innerHTML = twFixtureRows('tw-free', counts);
  wrap.querySelectorAll('input').forEach(el => el.addEventListener('input', calcTrinkwasser));
}

function twAddNe() {
  const type = $('tw-new-ne-type')?.value || 'bad';
  const def = TW_NE_TYPES[type] || TW_NE_TYPES.bad;
  TW_STATE.nes.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2,5),
    type,
    name: '',
    gl: def.gl == null ? 1 : def.gl,
    open: true,
    counts: {},
  });
  renderTwNes();
  calcTrinkwasser();
}

function twRemoveNe(id) {
  const idx = TW_STATE.nes.findIndex(n => n.id === id);
  if (idx >= 0) TW_STATE.nes.splice(idx, 1);
  renderTwNes();
  calcTrinkwasser();
}

function twToggleNe(id) {
  const ne = TW_STATE.nes.find(n => n.id === id);
  if (ne) ne.open = !ne.open;
  renderTwNes();
  calcTrinkwasser();
}

function twUpdateNeMeta(id, field, val) {
  const ne = TW_STATE.nes.find(n => n.id === id);
  if (!ne) return;
  if (field === 'type') {
    ne.type = val;
    const def = TW_NE_TYPES[val] || TW_NE_TYPES.bad;
    if (def.gl != null) ne.gl = def.gl;
  } else if (field === 'name') {
    ne.name = val;
  } else if (field === 'gl') {
    const n = parseFloat(String(val).replace(',', '.'));
    ne.gl = isNaN(n) ? 1 : Math.max(0, n);
    twRefreshNeSummary(id);
    calcTrinkwasser();
    return;
  }
  renderTwNes();
  calcTrinkwasser();
}

function twUpdateNeCount(id, fixtureId, val) {
  const ne = TW_STATE.nes.find(n => n.id === id);
  if (!ne) return;
  const n = parseInt(String(val).replace(',', '.'), 10);
  ne.counts[fixtureId] = isNaN(n) || n < 0 ? 0 : n;
  twRefreshNeSummary(id);
  calcTrinkwasser();
}

function twNeCalc(ne) {
  const wwMode = $('tw-ww-mode')?.value || 'zentral';
  const def = TW_NE_TYPES[ne.type] || TW_NE_TYPES.bad;
  let raw = 0, cold = 0, warm = 0;
  const values = [];
  const rows = [];
  TW_FIXTURES.forEach(f => {
    const count = Math.max(0, Number(ne.counts[f.id] || 0));
    if (!count) return;
    const sum = count * f.vr;
    raw += sum;
    if (f.cold) cold += sum;
    if (f.warm && wwMode === 'zentral') warm += sum;
    for (let i = 0; i < count; i++) values.push(f.vr);
    rows.push({ group: twNeTitle(ne), neId: ne.id, label:f.label, n:count, vr:f.vr, sum });
  });
  values.sort((a,b)=>b-a);
  const top2 = values.slice(0,2).reduce((s,v)=>s+v,0);
  const peak = def.mode === 'top2' ? top2 : raw * Math.max(0, Number(ne.gl || 0));
  return { raw, cold, warm, peak, top2, rows, mode:def.mode, gl:ne.gl, typeLabel:def.label, hint:def.hint };
}

function twNeTitle(ne) {
  const def = TW_NE_TYPES[ne.type] || TW_NE_TYPES.bad;
  return ne.name ? `${twEsc(ne.name)} (${def.label})` : def.label;
}

function twNeSummary(ne) {
  const c = twNeCalc(ne);
  const approach = c.mode === 'top2' ? '2 größte Entnahmen' : `GL ${twFmt(Number(ne.gl || 0),2)}`;
  return `ΣV<sub>R</sub> ${twFmt(c.raw,2)} l/s · V<sub>S,NE</sub> ${twFmt(c.peak,2)} l/s · ${approach}`;
}

function twRefreshNeSummary(id) {
  const ne = TW_STATE.nes.find(n => n.id === id);
  const el = document.getElementById('tw-ne-summary-' + id);
  if (ne && el) el.innerHTML = twNeSummary(ne);
}

function twToggleFree() {
  const body = $('tw-free-fixtures');
  const icon = $('tw-free-toggle-icon');
  if (!body) return;
  const open = body.style.display === 'none';
  body.style.display = open ? '' : 'none';
  if (icon) icon.textContent = open ? '▼' : '▶';
}

function renderTwNes(preserveFocus=true) {
  const wrap = $('tw-ne-list');
  if (!wrap) return;
  const active = preserveFocus ? document.activeElement?.id : null;
  wrap.innerHTML = TW_STATE.nes.length ? TW_STATE.nes.map((ne, idx) => {
    const def = TW_NE_TYPES[ne.type] || TW_NE_TYPES.bad;
    const open = ne.open;
    const typeOpts = Object.entries(TW_NE_TYPES).map(([k, v]) => `<option value="${k}"${k===ne.type?' selected':''}>${v.label}</option>`).join('');
    const rows = TW_FIXTURES.map(f => `
      <div style="display:grid;grid-template-columns:1fr 82px;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--gb-soft)">
        <div>
          <div style="font-family:var(--f);font-size:12px;font-weight:700;color:var(--t2)">${f.label}</div>
          <div style="font-family:var(--fm);font-size:10px;color:var(--t3)">V<sub>R</sub> ${twFmt(f.vr,2)} l/s</div>
        </div>
        ${twFixtureInput(`tw-ne-${ne.id}-${f.id}`, ne.counts[f.id] || 0)}
      </div>`).join('');
    return `<div class="gc tw-ne-card" data-ne-id="${ne.id}" style="padding:0;margin-top:10px;overflow:hidden;background:rgba(255,255,255,.025)">
      <button type="button" class="tw-ne-head" data-act="toggle" data-id="${ne.id}" style="width:100%;border:0;background:transparent;color:var(--t1);text-align:left;padding:13px 14px;display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;cursor:pointer">
        <span style="font-size:17px;color:var(--blue)">${open?'▼':'▶'}</span>
        <span>
          <span style="display:block;font-family:var(--f);font-size:13px;font-weight:800;color:var(--t1)">NE ${idx+1} · ${twNeTitle(ne)}</span>
          <span id="tw-ne-summary-${ne.id}" style="display:block;font-family:var(--fm);font-size:11px;color:var(--t3);margin-top:3px">${twNeSummary(ne)}</span>
        </span>
        <span type="button" class="tw-ne-del" data-act="remove" data-id="${ne.id}" style="font-family:var(--f);font-size:12px;color:var(--danger);padding:6px 8px">Löschen</span>
      </button>
      <div style="display:${open?'block':'none'};padding:0 14px 14px;border-top:1px solid var(--gb-soft)">
        <div class="igrp" style="margin-top:12px">
          <div class="ilbl">Nutzungseinheit</div>
          <select class="gl-sel tw-ne-type" id="tw-ne-type-${ne.id}" data-id="${ne.id}">${typeOpts}</select>
        </div>
        <div class="igrp">
          <div class="ilbl">Bezeichnung optional</div>
          <div class="iwrap"><input class="inp tw-ne-name" id="tw-ne-name-${ne.id}" data-id="${ne.id}" type="text" value="${twEsc(ne.name)}" placeholder="z. B. WC Damen EG" style="font-size:15px;padding:11px 14px"/></div>
        </div>
        <div class="igrp">
          <div class="ilbl">Gleichzeitigkeitsansatz</div>
          <div style="display:grid;grid-template-columns:1fr 130px;gap:10px;align-items:center">
            <div class="info-txt" style="margin:0">${def.hint}</div>
            <div class="iwrap"><input class="inp-sm tw-ne-gl" id="tw-ne-gl-${ne.id}" data-id="${ne.id}" type="number" min="0" step="0.05" value="${Number(ne.gl || 0).toFixed(2)}" ${def.editable?'':'disabled'} style="font-size:15px;padding:10px 12px"/><span class="iunit">GL</span></div>
          </div>
        </div>
        <div class="slbl" style="margin-top:8px">Verbraucher dieser NE</div>
        ${rows}
      </div>
    </div>`;
  }).join('') : '<div class="info-txt">Noch keine Nutzungseinheit angelegt. Wähle oben einen Typ und tippe auf „NE hinzufügen“.</div>';

  wrap.querySelectorAll('[data-act="toggle"]').forEach(b => b.addEventListener('click', e => {
    if (e.target?.dataset?.act === 'remove') return;
    twToggleNe(b.dataset.id);
  }));
  wrap.querySelectorAll('[data-act="remove"]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); twRemoveNe(b.dataset.id); }));
  wrap.querySelectorAll('.tw-ne-type').forEach(el => el.addEventListener('change', () => twUpdateNeMeta(el.dataset.id, 'type', el.value)));
  wrap.querySelectorAll('.tw-ne-name').forEach(el => el.addEventListener('input', () => { const ne=TW_STATE.nes.find(n=>n.id===el.dataset.id); if(ne){ne.name=el.value; calcTrinkwasser();} }));
  wrap.querySelectorAll('.tw-ne-name').forEach(el => el.addEventListener('change', () => twUpdateNeMeta(el.dataset.id, 'name', el.value)));
  wrap.querySelectorAll('.tw-ne-gl').forEach(el => el.addEventListener('input', () => twUpdateNeMeta(el.dataset.id, 'gl', el.value)));
  wrap.querySelectorAll('.tw-in').forEach(el => {
    const parts = el.id.match(/^tw-ne-(.+)-([^-]+)$/);
    if (!parts) return;
    el.addEventListener('input', () => twUpdateNeCount(parts[1], parts[2], el.value));
  });
  if (active) {
    const el = document.getElementById(active);
    if (el) {
      try { el.focus({ preventScroll:true }); } catch(e) { el.focus(); }
    }
  }
}

function calcTrinkwasser() {
  const buildingKey = $('tw-building')?.value || 'wohn';
  const wwMode = $('tw-ww-mode')?.value || 'zentral';
  const lineVol = Math.max(0, twNum('tw-line-vol'));

  let cold = 0, warm = 0, total = 0, dauer = 0, freeNonDauer = 0;
  const rows = [];
  const freeRows = [];

  TW_FIXTURES.forEach(f => {
    const n = twNum('tw-free-' + f.id);
    if (!n) return;
    const vrTot = n * f.vr;
    total += vrTot;
    if (f.cold) cold += vrTot;
    if (f.warm && wwMode === 'zentral') warm += vrTot;
    if (f.dauer) dauer += vrTot; else freeNonDauer += vrTot;
    const row = { group:'frei im Gebäude', label:f.label, n, vr:f.vr, sum:vrTot };
    rows.push(row); freeRows.push(row);
  });

  let neRaw = 0, nePeakSum = 0;
  const neRows = [];
  const neSummary = [];
  TW_STATE.nes.forEach((ne, idx) => {
    const c = twNeCalc(ne);
    neRaw += c.raw;
    nePeakSum += c.peak;
    cold += c.cold;
    warm += c.warm;
    total += c.raw;
    rows.push(...c.rows);
    neRows.push(...c.rows);
    neSummary.push({ index:idx+1, title:twNeTitle(ne), type:c.typeLabel, raw:c.raw, peak:c.peak, mode:c.mode, gl:ne.gl, rows:c.rows });
  });

  const curveInput = freeNonDauer + neRaw;
  const formulaPeak = twPeak(curveInput, buildingKey);
  const freePeak = twPeak(freeNonDauer, buildingKey);
  const neBasedPeak = (TW_STATE.nes.length ? (nePeakSum + freePeak) : formulaPeak);
  const useNeLimit = TW_STATE.nes.length > 0 && nePeakSum > 0;
  const peakBase = useNeLimit ? Math.min(formulaPeak, neBasedPeak) : formulaPeak;
  const peak = peakBase + dauer;
  const peakM3h = peak * 3.6;
  const dn = twRecommendDN(peak);
  const meter = twRecommendMeter(peak);
  const neInfo = useNeLimit
    ? `${TW_STATE.nes.length} NE · Vₛ Gebäude ${twFmt(formulaPeak,2)} l/s · Vₛ NE ${twFmt(neBasedPeak,2)} l/s · maßgebend ${twFmt(peakBase,2)} l/s`
    : 'keine Nutzungseinheiten angelegt';
  const circ = wwMode === 'zentral'
    ? (lineVol > 3 ? 'Zirkulation/Begleitheizung prüfen (> 3 l)' : '3-Liter-Regel prüfen')
    : 'nicht relevant bei dezentraler WW-Bereitung';

  twSet('tw-sum-cold',  twFmt(cold,2) + ' l/s');
  twSet('tw-sum-warm',  twFmt(warm,2) + ' l/s');
  twSet('tw-sum-total', twFmt(total,2) + ' l/s');
  twSet('tw-peak',      twFmt(peak,2) + ' l/s');
  twSet('tw-peak-m3h',  twFmt(peakM3h,2) + ' m³/h');
  twSet('tw-dn',        dn);
  twSet('tw-meter',     meter);
  twSet('tw-ne-info',   neInfo);
  twSet('tw-vs-building', twFmt(formulaPeak,2) + ' l/s');
  twSet('tw-vs-ne',       useNeLimit ? twFmt(neBasedPeak,2) + ' l/s' : '–');
  twSet('tw-vs-final',    twFmt(peak,2) + ' l/s');
  twSet('tw-circ',      circ);

  const hint = $('tw-hints');
  if (hint) {
    hint.innerHTML = wwMode === 'zentral' ? `
      <p><strong>Zentrale Warmwasserbereitung:</strong> 3-Liter-Regel zwischen Punkt sicherer Temperatureinhaltung und entferntester Entnahmestelle prüfen. Bei &gt; 3 l Zirkulation oder Begleitheizung vorsehen.</p>
      <p>Probeentnahmestellen und Spüleinrichtungen objektspezifisch vorsehen. Stagnationsbereiche vermeiden.</p>
      <p>Diese Schnellberechnung ersetzt keine vollständige Druckverlust- und Hygieneplanung.</p>` : `
      <p><strong>Dezentrale Warmwasserbereitung:</strong> zentrale PWH-/PWH-C-Verteilung entfällt. DLE-Leistung, Elektroanschluss und Mindestfließdruck separat prüfen.</p>
      <p>Probeentnahmestellen und Spüleinrichtungen für PWC bzw. Anlagenbereiche objektspezifisch berücksichtigen.</p>
      <p>Diese Schnellberechnung ersetzt keine vollständige Fachplanung.</p>`;
  }

  window.TW_LAST = { buildingKey, building:TW_BUILDINGS[buildingKey]?.label || 'Wohngebäude', wwMode, neInfo, cold, warm, total, curveInput, formulaPeak, freePeak, nePeakSum, neBasedPeak, peakBase, peak, peakM3h, dn, meter, circ, rows, neRows, freeRows, neSummary, lineVol };
}

function twBind() {
  buildTwFreeFixtures();
  renderTwNes();
  $('tw-add-ne')?.addEventListener('click', twAddNe);
  $('tw-free-toggle')?.addEventListener('click', twToggleFree);
  const freeBody = $('tw-free-fixtures');
  if (freeBody && !freeBody.dataset.init) { freeBody.style.display = 'none'; freeBody.dataset.init = '1'; }
  document.querySelectorAll('#tab-trinkwasser select, #tab-trinkwasser input').forEach(el => {
    if (el.closest('#tw-ne-list') || el.closest('#tw-free-fixtures')) return;
    el.addEventListener('input', calcTrinkwasser);
    el.addEventListener('change', calcTrinkwasser);
  });
  calcTrinkwasser();
}

document.addEventListener('DOMContentLoaded', twBind);
