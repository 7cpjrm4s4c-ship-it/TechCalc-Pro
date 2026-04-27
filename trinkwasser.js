/* ═══════════════════════════════════════════════════════
   trinkwasser.js — TechCalc Pro
   Trinkwasser Schnellberechnung · Integrationsversion V1
   Abhängigkeit: app.js muss zuerst geladen sein ($, show, loc)
═══════════════════════════════════════════════════════ */
'use strict';

const TW_FIXTURES = [
  { id:'wt',  label:'Waschtisch',             vr:0.07, cold:1, warm:1 },
  { id:'ks',  label:'Küchenspüle',            vr:0.07, cold:1, warm:1 },
  { id:'gs',  label:'Geschirrspüler',         vr:0.07, cold:1, warm:0 },
  { id:'wc',  label:'WC-Spülkasten',          vr:0.13, cold:1, warm:0 },
  { id:'du',  label:'Dusche',                 vr:0.15, cold:1, warm:1 },
  { id:'bw',  label:'Badewanne',              vr:0.15, cold:1, warm:1 },
  { id:'wm',  label:'Waschmaschine',          vr:0.15, cold:1, warm:0 },
  { id:'az',  label:'Außenzapfstelle',        vr:0.15, cold:1, warm:0, dauer:true },
  { id:'ur',  label:'Urinal-Druckspüler',     vr:0.30, cold:1, warm:0 },
  { id:'av15',label:'Auslaufventil DN15 o. SR',vr:0.30, cold:1, warm:0 },
  { id:'av20',label:'Auslaufventil DN20 o. SR',vr:0.50, cold:1, warm:0 },
];

const TW_BUILDINGS = {
  wohn:  { label:'Wohngebäude', a:1.48, b:0.19, c:0.94 },
  hotel: { label:'Hotel / Beherbergung', a:0.70, b:0.48, c:0.13 },
  verw:  { label:'Verwaltung / Büro', a:0.91, b:0.31, c:0.38 },
  schule:{ label:'Schule / Sportstätte', a:0.91, b:0.31, c:0.38 },
  pflege:{ label:'Pflege / Krankenhaus', a:0.75, b:0.44, c:0.18 },
};

function twNum(id) {
  const el = $(id);
  if (!el) return 0;
  const n = parseFloat(String(el.value).replace(',', '.'));
  return isNaN(n) || n < 0 ? 0 : n;
}
function twFmt(v, d=2) { return isNaN(v) ? '–' : loc(v, d); }
function twSet(id, txt) { const e=$(id); if(e) e.textContent = txt; }

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

function buildTwFixtureRows() {
  const wrap = $('tw-fixtures');
  if (!wrap) return;
  wrap.innerHTML = TW_FIXTURES.map(f => `
    <div class="tw-row" style="display:grid;grid-template-columns:1fr 86px;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--gb-soft)">
      <div>
        <div style="font-family:var(--f);font-size:13px;font-weight:700;color:var(--t2)">${f.label}</div>
        <div style="font-family:var(--fm);font-size:11px;color:var(--t3)">V<sub>R</sub> ${twFmt(f.vr,2)} l/s ${f.dauer?'· Dauerverbraucher':''}</div>
      </div>
      <div class="iwrap" style="min-width:0">
        <input class="inp-sm tw-in" id="tw-${f.id}" type="number" min="0" step="1" value="0" inputmode="numeric" style="padding:10px 12px;font-size:16px"/>
        <span class="iunit">St.</span>
      </div>
    </div>`).join('');
}

function calcTrinkwasser() {
  const buildingKey = $('tw-building')?.value || 'wohn';
  const wwMode = $('tw-ww-mode')?.value || 'zentral';
  const neMode = $('tw-ne-mode')?.checked;
  const neCount = Math.max(0, twNum('tw-ne-count'));
  const neVs = Math.max(0, twNum('tw-ne-vs'));
  const lineVol = Math.max(0, twNum('tw-line-vol'));

  let cold = 0, warm = 0, total = 0, dauer = 0;
  const rows = [];
  TW_FIXTURES.forEach(f => {
    const n = twNum('tw-' + f.id);
    if (!n) return;
    const vrTot = n * f.vr;
    total += vrTot;
    if (f.cold) cold += vrTot;
    if (f.warm && wwMode === 'zentral') warm += vrTot;
    if (f.dauer) dauer += vrTot;
    rows.push({ label:f.label, n, vr:f.vr, sum:vrTot });
  });

  let baseForPeak = Math.max(total - dauer, 0);
  let neInfo = 'nicht aktiv';
  if (neMode && neCount > 0 && neVs > 0) {
    const neSum = neCount * neVs;
    baseForPeak = Math.min(baseForPeak || neSum, neSum);
    neInfo = `${neCount} NE · Ansatz ${twFmt(neVs,2)} l/s je NE`;
  }
  const peak = twPeak(baseForPeak, buildingKey) + dauer;
  const peakM3h = peak * 3.6;
  const dn = twRecommendDN(peak);
  const meter = twRecommendMeter(peak);
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
  twSet('tw-circ',      circ);

  const hint = $('tw-hints');
  if (hint) {
    const central = wwMode === 'zentral';
    hint.innerHTML = central ? `
      <p><strong>Zentrale Warmwasserbereitung:</strong> 3-Liter-Regel zwischen Punkt sicherer Temperatureinhaltung und entferntester Entnahmestelle prüfen. Bei &gt; 3 l Zirkulation oder Begleitheizung vorsehen.</p>
      <p>Probeentnahmestellen und Spüleinrichtungen objektspezifisch vorsehen. Stagnationsbereiche vermeiden.</p>
      <p>Diese Schnellberechnung ersetzt keine vollständige Druckverlust- und Hygieneplanung.</p>` : `
      <p><strong>Dezentrale Warmwasserbereitung:</strong> zentrale PWH-/PWH-C-Verteilung entfällt. DLE-Leistung, Elektroanschluss und Mindestfließdruck separat prüfen.</p>
      <p>Probeentnahmestellen und Spüleinrichtungen für PWC bzw. Anlagenbereiche objektspezifisch berücksichtigen.</p>
      <p>Diese Schnellberechnung ersetzt keine vollständige Fachplanung.</p>`;
  }

  window.TW_LAST = { buildingKey, building:TW_BUILDINGS[buildingKey]?.label || 'Wohngebäude', wwMode, neMode, neInfo, cold, warm, total, baseForPeak, peak, peakM3h, dn, meter, circ, rows, lineVol };
}

function twBind() {
  buildTwFixtureRows();
  document.querySelectorAll('#tab-trinkwasser input, #tab-trinkwasser select')
    .forEach(el => el.addEventListener('input', calcTrinkwasser));
  calcTrinkwasser();
}

document.addEventListener('DOMContentLoaded', twBind);
