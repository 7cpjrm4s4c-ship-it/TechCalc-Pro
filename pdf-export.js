/* ═══════════════════════════════════════════════════════
   pdf-export.js  —  TechCalc Pro PWA
   A4-PDF-Export via separatem Print-DOM + window.print()

   Unterstützte Tabs:
   · Heizung/Kälte  (Leistung, Δt + Rohrempfehlung)
   · Lüftung        (Volumenstrom, Leistung, Δt)
   · Rohrdimensionierung
   · h,x-Diagramm   (Canvas-PNG + Zustandstabelle)
═══════════════════════════════════════════════════════ */
'use strict';

/* ───────────────────────────────────────
   MODAL — Projektdaten erfassen
─────────────────────────────────────── */
function openPdfSheet() {
  // Bestehenden Modal entfernen
  document.getElementById('pdf-modal')?.remove();

  const today = new Date().toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  const modal = document.createElement('div');
  modal.id = 'pdf-modal';
  modal.innerHTML = `
    <div id="pdf-overlay" onclick="closePdfSheet()"></div>
    <div id="pdf-sheet">
      <div class="sh-handle"></div>
      <div class="sh-title">PDF exportieren</div>
      <div class="sh-sub">Projektdaten für die Dokumentation</div>
      <div class="sh-body" style="padding-top:12px">

        <div class="igrp">
          <div class="ilbl">Sachbearbeiter</div>
          <div class="iwrap">
            <input class="inp" id="pdf-sb" type="text" placeholder="Name"
              style="font-size:16px;padding:12px 14px"/>
          </div>
        </div>

        <div class="igrp">
          <div class="ilbl">Projekt</div>
          <div class="iwrap">
            <input class="inp" id="pdf-pj" type="text" placeholder="Projektbezeichnung"
              style="font-size:16px;padding:12px 14px"/>
          </div>
        </div>

        <div class="igrp" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <div class="ilbl">Projektnummer</div>
            <div class="iwrap">
              <input class="inp" id="pdf-nr" type="text" placeholder="z.B. 2024-001"
                style="font-size:15px;padding:12px 14px"/>
            </div>
          </div>
          <div>
            <div class="ilbl">Datum</div>
            <div class="iwrap">
              <input class="inp" id="pdf-dt" type="text" value="${today}"
                style="font-size:15px;padding:12px 14px"/>
            </div>
          </div>
        </div>

        <button onclick="triggerPdfPrint()"
          style="width:100%;height:54px;border:none;border-radius:14px;
                 background:linear-gradient(135deg,#4fa8ff,#2e80d8);
                 color:#fff;font-size:16px;font-weight:700;cursor:pointer;
                 margin-top:8px;box-shadow:0 10px 30px rgba(79,168,255,.25)">
          Als PDF speichern
        </button>
        <button onclick="closePdfSheet()"
          style="width:100%;height:44px;border:none;border-radius:12px;
                 background:rgba(255,255,255,.07);color:rgba(255,255,255,.55);
                 font-size:14px;cursor:pointer;margin-top:8px">
          Abbrechen
        </button>
      </div>
    </div>
  `;

  // Inline-Styles für Modal (funktioniert ohne externe CSS-Abhängigkeit)
  const style = document.createElement('style');
  style.id = 'pdf-modal-style';
  style.textContent = `
    #pdf-overlay {
      position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:800;
      backdrop-filter:blur(6px);
    }
    #pdf-sheet {
      position:fixed;bottom:0;left:0;right:0;z-index:850;
      background:#111;
      border-radius:22px 22px 0 0;
      border-top:1px solid rgba(255,255,255,.12);
      padding:12px 20px calc(20px + env(safe-area-inset-bottom));
      max-width:540px;margin:0 auto;
      animation:slideUp .25s ease;
    }
    @keyframes slideUp {
      from{transform:translateY(100%);opacity:0}
      to  {transform:translateY(0);opacity:1}
    }
    .sh-handle{
      width:36px;height:4px;border-radius:2px;
      background:rgba(255,255,255,.22);margin:0 auto 14px;
    }
    .sh-title{font-size:17px;font-weight:700;margin-bottom:4px}
    .sh-sub{font-size:13px;color:rgba(255,255,255,.45);margin-bottom:16px}
    .sh-body{}
  `;

  try {
    document.head.appendChild(style);
  } catch(e) { console.warn('[PDF] head.appendChild failed:', e.message); }

  try {
    document.body.appendChild(modal);
  } catch(e) {
    console.error('[PDF] body.appendChild failed:', e.message);
    // Fallback: insert before body end
    document.documentElement.appendChild(modal);
  }

  setTimeout(() => {
    const sb = document.getElementById('pdf-sb');
    if (sb) sb.focus();
    else console.warn('[PDF] pdf-sb input not found after modal insert');
  }, 150);
}

function closePdfSheet() {
  document.getElementById('pdf-modal')?.remove();
  document.getElementById('pdf-modal-style')?.remove();
}

/* ───────────────────────────────────────
   DRUCKAUSLÖSER
─────────────────────────────────────── */
function triggerPdfPrint() {
  const meta = {
    sb:   document.getElementById('pdf-sb')?.value.trim()  || '–',
    proj: document.getElementById('pdf-pj')?.value.trim()  || '–',
    nr:   document.getElementById('pdf-nr')?.value.trim()  || '–',
    date: document.getElementById('pdf-dt')?.value.trim()  || '–',
  };

  closePdfSheet();

  // Aktiven Tab ermitteln
  // Aktiven Tab ermitteln — aus DOM oder URL
  let activeTab = 'flow';
  // Check which tab panel is visible
  ['flow','luft','pipe','unit','hx','wrg','trinkwasser'].forEach(id => {
    const el = document.getElementById('tab-' + id);
    if (el && getComputedStyle(el).display !== 'none') activeTab = id;
    if (el && !el.style.display && id === 'flow') activeTab = 'flow';
  });
  // Fallback: check pill active button
  const pillActive = document.querySelector('.pill-btn.active');
  if (pillActive?.dataset?.tab) activeTab = pillActive.dataset.tab;

  let html = '';
  if      (activeTab === 'flow') html = _buildFlowPage(meta);
  else if (activeTab === 'luft') html = _buildLuftPage(meta);
  else if (activeTab === 'pipe') html = _buildPipePage(meta);
  else if (activeTab === 'hx')   html = _buildHxPage(meta);
  else if (activeTab === 'wrg')  html = _buildWrgPage(meta);
  else if (activeTab === 'trinkwasser') html = _buildTrinkwasserPage(meta);
  else                           html = _buildFlowPage(meta);

  _openPrintWindow(html);
}

/* ───────────────────────────────────────
   PRINT-FENSTER ÖFFNEN
─────────────────────────────────────── */
function _openPrintWindow(bodyHtml) {
  // In-page overlay — works on iOS Safari (no window.open needed)
  const PRINT_ID = 'msr-print-overlay';
  document.getElementById(PRINT_ID)?.remove();

  const overlay = document.createElement('div');
  overlay.id = PRINT_ID;

  const printStyles = _printCSS();

  // Inject print CSS into document head (for window.print())
  const existStyle = document.getElementById('msr-print-css');
  if (existStyle) existStyle.remove();
  const headStyle = document.createElement('style');
  headStyle.id = 'msr-print-css';
  headStyle.textContent = printStyles;
  document.head.appendChild(headStyle);
  overlay._headStyle = headStyle;

  overlay.innerHTML = `
    <div class="msr-pbar">
      <button class="msr-pbtn-close" id="msr-close-pdf">&#10005; Schlie&szlig;en</button>
      <button class="msr-pbtn-print" onclick="window.print()">
        &#128438;&nbsp;Drucken&nbsp;/&nbsp;PDF
      </button>
    </div>
    <div class="msr-pcontent">${bodyHtml}</div>`;

  // Styling
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    #msr-print-overlay {
      position:fixed;inset:0;z-index:9999;
      background:#f4f6fa;overflow-y:auto;
      font-family:Arial,Helvetica,sans-serif;
    }
    .msr-pbar {
      position:sticky;top:0;background:#fff;
      border-bottom:1px solid #dde3ee;
      padding-top:max(env(safe-area-inset-top), 14px);
      padding-bottom:10px;padding-left:16px;padding-right:16px;
      display:flex;gap:8px;align-items:center;
      box-shadow:0 2px 8px rgba(0,0,0,.10);z-index:2;
    }
    .msr-pbtn-print {
      flex:1;background:#1a3a5c;color:#fff;border:none;
      border-radius:8px;padding:10px 18px;
      font-size:14px;font-weight:700;cursor:pointer;font-family:Arial,sans-serif;
    }
    .msr-pbtn-close {
      background:#e8edf5;color:#333;border:none;
      border-radius:8px;padding:10px 14px;
      font-size:14px;font-weight:700;cursor:pointer;font-family:Arial,sans-serif;
    }
    .msr-pcontent {
      padding:16px;max-width:800px;margin:0 auto;background:#fff;
      margin-top:12px;margin-bottom:20px;
      box-shadow:0 2px 12px rgba(0,0,0,.08);border-radius:4px;
    }
    @media print {
      #msr-print-overlay { position:static!important; background:white!important; }
      .msr-pbar { display:none!important; }
      .msr-pcontent { padding:0!important;margin:0!important;box-shadow:none!important; }
      body > *:not(#msr-print-overlay) { display:none!important; }
      ${printStyles}
    }`;
  document.head.appendChild(styleEl);
  overlay._styleEl = styleEl;

  document.body.appendChild(overlay);
  overlay.scrollTop = 0;

  document.getElementById('msr-close-pdf')?.addEventListener('click', () => {
    styleEl.remove();
    overlay._headStyle?.remove();
    document.getElementById(PRINT_ID)?.remove();
  });
}

/* ───────────────────────────────────────
   GEMEINSAMES CSS (Print + Preview)
─────────────────────────────────────── */
function _printCSS() {
  return `
*{box-sizing:border-box;margin:0;padding:0}
html,body{
  width:210mm;background:white;color:#000;
  font-family:Arial,Helvetica,sans-serif;font-size:9pt;
}
@page{
  size:A4 portrait;
  margin:12mm 14mm 12mm 14mm;
}
@media print{
  html,body{width:210mm}
  .no-print{display:none!important}
}

/* ── Header (kompakt) ── */
.ph{
  display:flex;justify-content:space-between;align-items:flex-end;
  border-bottom:2px solid #1a3a5c;padding-bottom:7px;margin-bottom:10px;
}
.ph-l{display:flex;align-items:center}.ph-l h1{font-size:13pt;color:#1a3a5c;font-weight:700;letter-spacing:-.2px}
.ph-l p {font-size:7.5pt;color:#777;margin-top:1px}
.ph-r   {font-size:7.5pt;color:#555;text-align:right;line-height:1.6}
.ph-r strong{color:#1a3a5c;font-size:9pt}

/* ── Projektdaten (2-spaltig) ── */
.meta{
  display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;
  background:#f5f7fa;border:1px solid #e0e6ef;border-radius:6px;
  padding:8px 12px;margin-bottom:10px;font-size:8pt;
}
.meta-k{color:#888;font-weight:700;letter-spacing:.05em;text-transform:uppercase;font-size:7pt}
.meta-v{font-weight:700;color:#1a2a3a;font-size:9pt;margin-top:1px}

/* ── Abschnitt-Titel ── */
.sec{
  font-size:7.5pt;font-weight:700;letter-spacing:.12em;
  text-transform:uppercase;color:#888;
  border-bottom:1px solid #e8edf2;padding-bottom:3px;margin:10px 0 6px;
}

/* ── Tabellen (kompakt) ── */
table{width:100%;border-collapse:collapse;font-size:8pt}
th{
  background:#1a3a5c;color:#fff;font-size:7pt;
  padding:4px 7px;text-align:left;font-weight:700;letter-spacing:.04em
}
td{padding:3px 7px;border-bottom:1px solid #edf0f4;vertical-align:top}
tr:last-child td{border-bottom:none}
tr:nth-child(even) td{background:#f9fafc}
.num{text-align:right;font-family:"Courier New",monospace;font-weight:700}
.badge{
  display:inline-block;font-size:6.5pt;font-weight:700;padding:1px 5px;
  border-radius:3px;vertical-align:middle;margin-left:4px;letter-spacing:.06em
}
.badge-h{background:#fff0e8;color:#c44a00;border:1px solid #f9c4a0}
.badge-k{background:#e5f8ff;color:#007099;border:1px solid #a0ddf5}
.badge-l{background:#f0eeff;color:#5b41cc;border:1px solid #c5b8f8}

/* ── Diagramm-Container ── */
.diag{
  width:100%;border:1px solid #dee4ef;border-radius:6px;
  overflow:hidden;margin:6px 0 10px;background:#f8f9fb;
}
.diag img{width:auto;max-width:100%;max-height:90mm;display:block;margin:0 auto}

/* ── Ergebnis-Grid (Heizung/Kälte) ── */
.res-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
.res-box{
  background:#f5f7fa;border:1px solid #e0e6ef;border-radius:6px;padding:8px 10px
}
.res-box.h{border-left:3px solid #e05a20}
.res-box.k{border-left:3px solid #0094b3}
.res-title{font-size:7pt;font-weight:700;letter-spacing:.10em;text-transform:uppercase;color:#888;margin-bottom:5px}
.res-row{display:flex;justify-content:space-between;font-size:8pt;margin-bottom:2px}
.res-key{color:#555}
.res-val{font-family:"Courier New",monospace;font-weight:700;color:#1a2a3a}

/* ── Formel ── */
.fml{
  text-align:center;font-family:"Courier New",monospace;font-size:7.5pt;
  color:#888;margin:6px 0;letter-spacing:.02em
}
`;
}

/* ───────────────────────────────────────
   HEADER HTML (wiederverwendbar)
─────────────────────────────────────── */
function _header(meta, subtitle) {
  const today = meta.date;
  return `
  <div class="ph">
    <div class="ph-l">
      <img src="data:image/png;base64,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" width="32" height="32"
           style="border-radius:7px;margin-right:10px;vertical-align:middle;flex-shrink:0"/>
      <div>
        <h1>TechCalc <span style="font-weight:400;color:#4fa8ff;font-size:9pt">PRO</span></h1>
        <p>${subtitle}</p>
      </div>
    </div>
    <div class="ph-r">
      <strong>${meta.nr}</strong><br>
      ${today}
    </div>
  </div>
  <div class="meta">
    <div><div class="meta-k">Sachbearbeiter</div><div class="meta-v">${meta.sb}</div></div>
    <div><div class="meta-k">Datum</div><div class="meta-v">${meta.date}</div></div>
    <div><div class="meta-k">Projekt</div><div class="meta-v">${meta.proj}</div></div>
    <div><div class="meta-k">Projektnummer</div><div class="meta-v">${meta.nr}</div></div>
  </div>`;
}

/* ───────────────────────────────────────
   TAB: HEIZUNG / KÄLTE
─────────────────────────────────────── */
function _buildFlowPage(meta) {
  // Daten aus DOM lesen
  const medium   = document.getElementById('medium');
  const medText  = medium?.options[medium.selectedIndex]?.text || 'Wasser';
  const cpVal    = document.getElementById('cp-val')?.textContent  || '–';
  const rhoVal   = document.getElementById('rho-val')?.textContent || '–';
  const frost    = document.getElementById('frost-chip')?.style.display !== 'none'
                   ? document.getElementById('frost-val')?.textContent || '' : '';

  // Heizung-Eingaben
  const hMode  = document.querySelector('.mbtn.active[data-p="h"]')?.dataset?.v || 'ms';
  const hQ     = document.getElementById('h-q')?.value     || '–';
  const hQUnit = document.getElementById('h-q-unit')?.textContent || 'W';
  const hMs    = document.getElementById('h-ms-in')?.value || '–';
  const hDt    = document.getElementById('h-dt')?.value    || '–';

  // Kälte-Eingaben
  const kMode  = document.querySelector('.mbtn.active[data-p="k"]')?.dataset?.v || 'ms';
  const kQ     = document.getElementById('k-q')?.value     || '–';
  const kQUnit = document.getElementById('k-q-unit')?.textContent || 'W';
  const kMs    = document.getElementById('k-ms-in')?.value || '–';
  const kDt    = document.getElementById('k-dt')?.value    || '–';

  // Ergebnis-Werte
  const hV1 = _txt('h-out-v1'); const hU1 = _txt('h-out-u1');
  const hV2 = _txt('h-out-v2'); const hU2 = _txt('h-out-u2');
  const kV1 = _txt('k-out-v1'); const kU1 = _txt('k-out-u1');
  const kV2 = _txt('k-out-v2'); const kU2 = _txt('k-out-u2');

  const modeLabel = { ms:'Massenstrom berechnen', q:'Leistung berechnen', dt:'ΔT berechnen' };

  return `
  ${_header(meta, 'Heizung · Kälte — Berechnung')}

  <div class="sec">Wärmeträger</div>
  <table>
    <tr><th>Medium</th><th>c&#7453; [kJ/(kg·K)]</th><th>ρ [kg/m³]</th><th>Frostschutz</th></tr>
    <tr>
      <td>${medText}</td>
      <td class="num">${cpVal}</td>
      <td class="num">${rhoVal}</td>
      <td>${frost || '–'}</td>
    </tr>
  </table>

  <div class="sec">Eingaben</div>
  <table>
    <thead><tr><th>Größe</th><th>Heizung</th><th>Kälte</th></tr></thead>
    <tbody>
      <tr><td>Modus</td>
        <td>${modeLabel[hMode] || hMode}</td>
        <td>${modeLabel[kMode] || kMode}</td></tr>
      <tr><td>Leistung Q</td>
        <td class="num">${hMode !== 'ms' ? _pdfFmt(hQ) + ' ' + hQUnit : '–'}</td>
        <td class="num">${kMode !== 'ms' ? _pdfFmt(kQ) + ' ' + kQUnit : '–'}</td></tr>
      <tr><td>Massenstrom ṁ</td>
        <td class="num">${hMode !== 'q'  ? _pdfFmt(hMs) + ' kg/h' : '–'}</td>
        <td class="num">${kMode !== 'q'  ? _pdfFmt(kMs) + ' kg/h' : '–'}</td></tr>
      <tr><td>Temperaturdifferenz ΔT</td>
        <td class="num">${hMode !== 'dt' ? _pdfFmt(hDt) + ' K' : '–'}</td>
        <td class="num">${kMode !== 'dt' ? _pdfFmt(kDt) + ' K' : '–'}</td></tr>
    </tbody>
  </table>

  <div class="sec">Ergebnisse</div>
  <div class="res-grid">
    <div class="res-box h">
      <div class="res-title">&#9632; Heizung</div>
      <div class="res-row"><span class="res-key">${hU1}</span><span class="res-val">${hV1} ${hU1}</span></div>
      <div class="res-row"><span class="res-key">${hU2}</span><span class="res-val">${hV2} ${hU2}</span></div>
    </div>
    <div class="res-box k">
      <div class="res-title">&#9632; Kälte</div>
      <div class="res-row"><span class="res-key">${kU1}</span><span class="res-val">${kV1} ${kU1}</span></div>
      <div class="res-row"><span class="res-key">${kU2}</span><span class="res-val">${kV2} ${kU2}</span></div>
    </div>
  </div>

  <div class="fml">
    ṁ = Q / (c&#7453; × ΔT) &nbsp;·&nbsp; Q = ṁ × c&#7453; × ΔT &nbsp;·&nbsp; ΔT = Q / (ṁ × c&#7453;)
  </div>

  ${_pipeSection()}
  `;
}

/* Rohrtabelle aus dem DOM der Heizung/Kälte-Seite */
function _pipeSection() {
  const piH = document.getElementById('pi-h');
  const piK = document.getElementById('pi-k');
  const hasH = piH && piH.style.display !== 'none';
  const hasK = piK && piK.style.display !== 'none';
  if (!hasH && !hasK) return '';

  let rows = '';
  if (hasH) {
    const vol = document.getElementById('pi-h-vol')?.textContent || '';
    rows += `<tr><td colspan="5" style="background:#fff0e8;font-weight:700;font-size:7.5pt;color:#c44000">
      ▲ Heizung ${vol}</td></tr>`;
    rows += _pipeRows('pi-h-pair', 'h');
  }
  if (hasK) {
    const vol = document.getElementById('pi-k-vol')?.textContent || '';
    rows += `<tr><td colspan="5" style="background:#e5f8ff;font-weight:700;font-size:7.5pt;color:#006a88">
      ▼ Kälte ${vol}</td></tr>`;
    rows += _pipeRows('pi-k-pair', 'k');
  }

  return `
  <div class="sec">Rohrdimensionierungsempfehlung (max. 100 Pa/m)</div>
  <table>
    <thead><tr>
      <th>Norm</th><th>DN</th><th>d&#7522; [mm]</th>
      <th>Δp/m [Pa/m]</th><th>v [m/s]</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="font-size:7pt;color:#aaa;margin-top:4px">
    Darcy-Weisbach · Colebrook-White · Wasser 60 °C · ε Stahl 0,046 mm · ε Mapress 0,015 mm
  </p>`;
}

function _pipeRows(containerId, type) {
  const el = document.getElementById(containerId);
  if (!el) return '';
  const cards = el.querySelectorAll('.pm');
  let rows = '';
  cards.forEach(c => {
    if (c.classList.contains('na')) return;
    const norm = c.querySelector('.pm-std')?.textContent.replace('★', '').trim() || '–';
    const dn   = c.querySelector('.pm-dn')?.textContent.trim()  || '–';
    const dim  = c.querySelector('.pm-dim')?.textContent.replace(/\s+/g,' ').trim() || '–';
    const dpEl = c.querySelector('.pm-r .pm-v');
    const dp   = dpEl?.firstChild?.textContent.trim() || '–';
    const vEls = c.querySelectorAll('.pm-r');
    const v    = vEls[1]?.querySelector('.pm-v')?.textContent.trim() || '–';
    const best = c.classList.contains('best') || c.classList.contains('best-h') || c.classList.contains('best-k');
    const cls  = type === 'h' ? 'badge-h' : 'badge-k';
    rows += `<tr>
      <td>${norm}${best ? `<span class="badge ${cls}">★ empf.</span>` : ''}</td>
      <td class="num">${dn}</td>
      <td class="num">${dim}</td>
      <td class="num">${dp}</td>
      <td class="num">${v}</td>
    </tr>`;
  });
  return rows;
}

/* ───────────────────────────────────────
   TAB: LÜFTUNG
─────────────────────────────────────── */
function _buildLuftPage(meta) {
  const hk     = document.getElementById('luft-btn-h')?.classList.contains('on-h') ? 'h' : 'k';
  const hkLbl  = hk === 'h' ? 'Heizleistung' : 'Kühlleistung';
  const tzlH   = document.getElementById('luft-tzl-h')?.value || '–';
  const tzlK   = document.getElementById('luft-tzl-k')?.value || '–';
  const trH    = document.getElementById('luft-tr-h')?.value  || '20';
  const trK    = document.getElementById('luft-tr-k')?.value  || '26';
  const vOut   = _txt('luft-v-out');
  const dtOut  = _txt('luft-dt-out');
  const ms     = _txt('luft-ms');
  const kwOut  = _txt('luft-kw');
  const rho    = document.getElementById('luft-rho-display')?.textContent || '–';
  const fac    = document.getElementById('luft-factor-display')?.textContent || '–';
  const mainVal = document.getElementById('luft-main-val')?.textContent || '–';
  const mainLbl = document.getElementById('luft-main-lbl')?.textContent || '–';

  return `
  ${_header(meta, `Lüftung — ${hkLbl}`)}

  <div class="sec">Temperaturen</div>
  <table>
    <thead><tr><th></th><th>Zuluft t&#x2c6;&#x1d61;&#x1d38; [°C]</th><th>Raum t&#x1d63; [°C]</th><th>Δt [K]</th></tr></thead>
    <tbody>
      <tr>
        <td><span style="color:#c44000;font-weight:700">▲ Heizen</span></td>
        <td class="num">${_pdfFmt(tzlH)}</td>
        <td class="num">${_pdfFmt(trH)}</td>
        <td class="num">${_pdfFmtDiff(tzlH, trH)}</td>
      </tr>
      <tr>
        <td><span style="color:#006a88;font-weight:700">▼ Kühlen</span></td>
        <td class="num">${_pdfFmt(tzlK)}</td>
        <td class="num">${_pdfFmt(trK)}</td>
        <td class="num">${_pdfFmtDiff(trK, tzlK)}</td>
      </tr>
    </tbody>
  </table>

  <div class="sec">Luftkennwerte</div>
  <table>
    <tr><td>Luftdichte ρ&#x1d38; bei Zulufttemperatur</td><td class="num">${rho}</td></tr>
    <tr><td>c&#7453; · ρ / 3600</td><td class="num">${fac}</td></tr>
    <tr><td>c&#7453; Luft</td><td class="num">1,005 J/(kg·K)</td></tr>
  </table>

  <div class="sec">Ergebnis — ${hkLbl}</div>
  <div class="res-grid">
    <div class="res-box ${hk}">
      <div class="res-title">${mainLbl}</div>
      <div class="res-row"><span class="res-key">Wert</span>
        <span class="res-val">${mainVal}</span></div>
      <div class="res-row"><span class="res-key">kW</span>
        <span class="res-val">${kwOut} kW</span></div>
    </div>
    <div class="res-box ${hk}">
      <div class="res-title">Weitere Größen</div>
      <div class="res-row"><span class="res-key">V̇ [m³/h]</span>
        <span class="res-val">${vOut}</span></div>
      <div class="res-row"><span class="res-key">Δt [K]</span>
        <span class="res-val">${dtOut}</span></div>
      <div class="res-row"><span class="res-key">ṁ [kg/h]</span>
        <span class="res-val">${ms}</span></div>
    </div>
  </div>

  <div class="fml">
    Q = V̇ × ρ&#x1d38;(t&#x2c6;&#x1d61;&#x1d38;) × c&#7453; × Δt &nbsp;·&nbsp;
    ρ&#x1d38;(t) = 353,05 / (t + 273,15) kg/m³
  </div>`;
}

/* ───────────────────────────────────────
   TAB: ROHRDIMENSIONIERUNG
─────────────────────────────────────── */
function _buildPipePage(meta) {
  const vol  = document.getElementById('p-vol')?.value || '–';
  const dp   = document.getElementById('p-dp')?.value  || '100';
  const el   = document.getElementById('pipe-results');

  let rows = '';
  el?.querySelectorAll('.pipe-pair').forEach(pair => {
    const dn   = pair.previousElementSibling?.textContent.trim() || '';
    pair.querySelectorAll('.pm').forEach(c => {
      if (c.classList.contains('na')) return;
      const norm = c.querySelector('.pm-std')?.textContent.replace('★','').trim() || '–';
      const diDim = c.querySelector('.pm-dim')?.textContent.replace(/\s+/g,' ').trim() || '–';
      const dpEl  = c.querySelector('.pm-r .pm-v');
      const dpTxt = dpEl?.firstChild?.textContent.trim() || '–';
      const vTxt  = c.querySelectorAll('.pm-r')[1]?.querySelector('.pm-v')?.textContent.trim() || '–';
      const best  = c.classList.contains('best');
      rows += `<tr>
        <td>${dn}${best ? '<span class="badge" style="background:#e8f0fe;color:#1a3a8c;border:1px solid #aac0f5">★ empf.</span>' : ''}</td>
        <td>${norm}</td>
        <td class="num">${diDim}</td>
        <td class="num">${dpTxt}</td>
        <td class="num">${vTxt}</td>
      </tr>`;
    });
  });

  return `
  ${_header(meta, 'Rohrdimensionierung')}

  <div class="sec">Parameter</div>
  <table>
    <tr><td>Volumenstrom V̇</td><td class="num">${_pdfFmt(vol)} m³/h</td></tr>
    <tr><td>Max. Druckverlust</td><td class="num">${_pdfFmt(dp)} Pa/m</td></tr>
  </table>

  <div class="sec">Rohre — Stahl &amp; Mapress Edelstahl</div>
  <table>
    <thead><tr>
      <th>DN</th><th>Norm</th><th>Abmessung</th>
      <th>Δp/m [Pa/m]</th><th>v [m/s]</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:#aaa">Keine Daten</td></tr>'}</tbody>
  </table>
  <p style="font-size:7pt;color:#aaa;margin-top:4px">
    Stahl ≤ DN50: DIN EN 10255 Reihe M · ≥ DN65: DIN EN 10220 ·
    Mapress Edelstahl 1.4401: DIN EN 10312 · max. DN 100 ·
    Darcy-Weisbach · Colebrook-White
  </p>`;
}


/* ───────────────────────────────────────
   TAB: WRG / MISCHLUFT
─────────────────────────────────────── */
function _buildWrgPage(meta) {
  // WRG Eingaben lesen
  const T_ab  = document.getElementById('wrg-ab-t')?.value || '–';
  const ph_ab = document.getElementById('wrg-ab-phi')?.value || '–';
  const T_au  = document.getElementById('wrg-au-t')?.value || '–';
  const ph_au = document.getElementById('wrg-au-phi')?.value || '–';
  const eta   = document.getElementById('wrg-eta')?.value || '–';

  // WRG Ergebnis
  const wrgResult = document.getElementById('wrg-result')?.innerText || '–';

  // Mischluft Eingaben
  const T1   = document.getElementById('mix-ls1-t')?.value || '–';
  const ph1  = document.getElementById('mix-ls1-phi')?.value || '–';
  const vol1 = document.getElementById('mix-ls1-vol')?.value || '–';
  const T2   = document.getElementById('mix-ls2-t')?.value || '–';
  const ph2  = document.getElementById('mix-ls2-phi')?.value || '–';
  const vol2 = document.getElementById('mix-ls2-vol')?.value || '–';

  // Mischluft Ergebnis
  const mixResult = document.getElementById('mix-result')?.innerText || '–';

  return `
  ${_header(meta, 'WRG & Mischluft')}

  <div class="sec">Wärmerückgewinnung (WRG) — Eingaben</div>
  <table>
    <thead><tr><th>Größe</th><th>Abluft (LS1)</th><th>Außenluft (LS2)</th></tr></thead>
    <tbody>
      <tr><td>Temperatur T</td><td class="num">${_pdfFmt(T_ab)} °C</td><td class="num">${_pdfFmt(T_au)} °C</td></tr>
      <tr><td>Rel. Feuchte φ</td><td class="num">${_pdfFmt(ph_ab)} %</td><td class="num">${_pdfFmt(ph_au)} %</td></tr>
      <tr><td>Temperaturwirkungsgrad η</td><td colspan="2" class="num">${_pdfFmt(eta)} %</td></tr>
    </tbody>
  </table>

  <div class="sec">WRG — Ergebnis</div>
  <p style="font-size:8pt;color:#444;line-height:1.6">${wrgResult}</p>

  <div class="sec" style="margin-top:12px">Luftmischung (Mischluft) — Eingaben</div>
  <table>
    <thead><tr><th>Größe</th><th>Luftstrom 1 (LS1)</th><th>Luftstrom 2 (LS2)</th></tr></thead>
    <tbody>
      <tr><td>Temperatur T</td><td class="num">${_pdfFmt(T1)} °C</td><td class="num">${_pdfFmt(T2)} °C</td></tr>
      <tr><td>Rel. Feuchte φ</td><td class="num">${_pdfFmt(ph1)} %</td><td class="num">${_pdfFmt(ph2)} %</td></tr>
      <tr><td>Volumenstrom V̇</td><td class="num">${_pdfFmt(vol1)} m³/h</td><td class="num">${_pdfFmt(vol2)} m³/h</td></tr>
    </tbody>
  </table>

  <div class="sec">Mischluft — Ergebnis</div>
  <p style="font-size:8pt;color:#444;line-height:1.6">${mixResult}</p>
  <p style="font-size:7pt;color:#aaa;margin-top:4px">
    Plattenwärmetauscher (sensibel) · massengewichtete Mischung
  </p>`;
}

/* ───────────────────────────────────────
   TAB: H,X-DIAGRAMM
─────────────────────────────────────── */
function _buildHxPage(meta) {
  // Capture existing canvas AS-IS (includes process lines already drawn)
  // Do NOT re-render — that would erase the process visualization
  const srcCanvas = document.getElementById('hxCanvas');
  let imgSrc = null;
  if (srcCanvas) {
    try {
      // Scale up by drawing current canvas content into a larger offscreen canvas
      const dpr = window.devicePixelRatio || 1;
      const srcW = srcCanvas.width  / dpr;
      const srcH = srcCanvas.height / dpr;
      // Create hi-res offscreen canvas
      const offscreen = document.createElement('canvas');
      if (!srcW || !srcH) { imgSrc = null; throw new Error('canvas not ready'); }
      const scale = Math.max(2, Math.min(4, 900 / srcW));
      offscreen.width  = Math.round(srcW * scale);
      offscreen.height = Math.round(srcH * scale);
      const octx = offscreen.getContext('2d');
      octx.imageSmoothingEnabled = true;
      octx.imageSmoothingQuality = 'high';
      // Draw current canvas content scaled up
      octx.drawImage(srcCanvas, 0, 0, offscreen.width, offscreen.height);
      imgSrc = offscreen.toDataURL('image/png');
    } catch(e) {
      imgSrc = srcCanvas.toDataURL('image/png');
    }
  }

  // Ausgangszustand
  const T    = _txt('state-temp');
  const phi  = _txt('state-phi');
  const x    = _txt('state-x');
  const h    = _txt('state-h');
  const tdew = _txt('state-tdew');

  // Zielzustand
  const T2val   = document.getElementById('hx-target-temp')?.value?.trim() || '';
  const phi2val = document.getElementById('hx-target-rh')?.value?.trim()   || '';
  const procEl  = document.getElementById('hx-process');
  const procLabel = procEl?.options[procEl.selectedIndex]?.text || '–';

  // Prozessergebnis
  const resultEl  = document.getElementById('hx-result');
  const resultTxt = resultEl?.innerText?.trim()?.replace(/\n\s*\n/g, '\n') || '';

  // Zielzustand berechnen (wenn Werte vorhanden)
  let targetRows = '';
  const T2n = parseFloat(T2val), phi2n = parseFloat(phi2val);
  if (!isNaN(T2n)) {
    let x2row = '', h2row = '';
    if (!isNaN(phi2n) && phi2n > 0 && phi2n <= 100) {
      const pws2 = 6.112 * Math.exp(17.62 * T2n / (243.12 + T2n));
      const pw2  = phi2n / 100 * pws2;
      const x2n  = +(1000 * 0.622 * pw2 / (1013.25 - pw2)).toFixed(2);
      const h2n  = +(1.006 * T2n + x2n / 1000 * (2501 + 1.86 * T2n)).toFixed(1);
      x2row = `<tr><td>Feuchtegehalt x</td><td>x₂</td><td class="num">${x2n} g/kg</td></tr>`;
      h2row = `<tr><td>Enthalpie</td><td>h₂</td><td class="num">${h2n} kJ/kg</td></tr>`;
    }
    targetRows = `
  <div class="sec">2. Zielzustand &amp; Prozess</div>
  <table>
    <thead><tr><th>Größe</th><th>Symbol</th><th class="num">Wert</th></tr></thead>
    <tbody>
      <tr><td>Prozessart</td><td>–</td><td class="num">${procLabel}</td></tr>
      <tr><td>Zieltemperatur</td><td>T₂</td><td class="num">${T2val} °C</td></tr>
      ${phi2val ? `<tr><td>Zielfeuchte</td><td>φ₂</td><td class="num">${phi2val} %</td></tr>` : ''}
      ${x2row}${h2row}
    </tbody>
  </table>`;
  }

  // Prozessbilanz
  const bilanzBlock = resultTxt && resultTxt !== 'Noch keine Berechnung durchgeführt'
    ? `<div class="sec">3. Prozessbilanz</div>
       <div style="font-size:8pt;color:#2a3a4a;line-height:1.7;
                   background:#f5f7fa;border:1px solid #e0e6ef;
                   border-radius:5px;padding:8px 10px;
                   white-space:pre-line">${resultTxt}</div>`
    : '';

  const imgBlock = imgSrc
    ? `<div class="diag"><img src="${imgSrc}" alt="h,x-Diagramm"
         style="width:100%;height:auto;display:block;margin:0 auto;max-height:130mm;object-fit:contain"/></div>`
    : `<div class="diag" style="height:50mm;display:flex;align-items:center;
         justify-content:center;color:#bbb;font-size:9pt">
         Kein Diagramm — Zustand setzen und erneut exportieren</div>`;

  return `
  ${_header(meta, 'h,x-Diagramm nach Mollier')}

  ${imgBlock}

  <div class="sec" style="margin-top:8px">1. Ausgangszustand</div>
  <table>
    <thead><tr><th>Größe</th><th>Symbol</th><th class="num">Wert</th></tr></thead>
    <tbody>
      <tr><td>Temperatur</td>         <td>T</td>  <td class="num">${T} °C</td></tr>
      <tr><td>Relative Feuchte</td>   <td>φ</td>  <td class="num">${phi} %</td></tr>
      <tr><td>Feuchtegehalt</td>      <td>x</td>  <td class="num">${x} g/kg</td></tr>
      <tr><td>Enthalpie</td>          <td>h</td>  <td class="num">${h} kJ/kg</td></tr>
      <tr><td>Taupunkttemperatur</td> <td>Td</td> <td class="num">${tdew} °C</td></tr>
    </tbody>
  </table>

  ${targetRows}
  ${bilanzBlock}

  <p style="font-size:7pt;color:#aaa;margin-top:8px">
    Luftdruck 1013,25 hPa · Magnus-Formel · h = 1,006·t + x·(2501 + 1,86·t) kJ/kg
  </p>`;
}



/* ───────────────────────────────────────
   TAB: TRINKWASSER
─────────────────────────────────────── */
function _buildTrinkwasserPage(meta) {
  const r = window.TW_LAST || {};
  const neBlocks = (r.neSummary || []).map(ne => {
    const rows = (ne.rows || []).map(x => `<tr><td>${x.label}</td><td class="num">${x.n}</td><td class="num">${x.vr.toFixed(2)} l/s</td><td class="num">${x.sum.toFixed(2)} l/s</td></tr>`).join('');
    const mode = ne.mode === 'top2' ? '2 größte Entnahmen' : `GL ${_twPdfNum(ne.gl)}`;
    return `<tr><td colspan="4" style="background:#f0f4fa;font-weight:700;color:#1a3a5c">NE ${ne.index}: ${ne.title} · ${mode} · ΣVR ${_twPdfNum(ne.raw)} l/s · VS,NE ${_twPdfNum(ne.peak)} l/s</td></tr>${rows}`;
  }).join('');
  const freeRows = (r.freeRows || []).map(x => `<tr><td>${x.label}</td><td class="num">${x.n}</td><td class="num">${x.vr.toFixed(2)} l/s</td><td class="num">${x.sum.toFixed(2)} l/s</td></tr>`).join('');
  const ww = r.wwMode === 'dezentral' ? 'dezentral / Durchlauferhitzer' : 'zentral';
  const hints = r.wwMode === 'dezentral'
    ? 'Dezentrale Warmwasserbereitung: DLE-Leistung, Elektroanschluss und Mindestfließdruck separat prüfen. Probeentnahmestellen und Spüleinrichtungen objektspezifisch berücksichtigen.'
    : 'Zentrale Warmwasserbereitung: 3-Liter-Regel, Zirkulation/Begleitheizung, Probeentnahmestellen und Spüleinrichtungen objektspezifisch prüfen.';

  return `
  ${_header(meta, 'Trinkwasserberechnung')}

  <div class="sec">Basisdaten</div>
  <table>
    <tr><td>Gebäudetyp</td><td class="num">${r.building || '–'}</td><td>Warmwasserbereitung</td><td class="num">${ww}</td></tr>
    <tr><td>PWH-Leitungsvolumen</td><td class="num">${r.lineVol != null ? r.lineVol + ' l' : '–'}</td><td>Zirkulation</td><td class="num" style="font-size:7pt;line-height:1.2">${r.circ || '–'}</td></tr>
  </table>

  <div class="sec">Nutzungseinheiten</div>
  <table style="font-size:7.1pt">
    <thead><tr><th>Entnahmestelle</th><th>Anzahl</th><th>V<sub>R</sub></th><th>Summe</th></tr></thead>
    <tbody>${neBlocks || '<tr><td colspan="4" style="text-align:center;color:#aaa">Keine Nutzungseinheiten eingetragen</td></tr>'}</tbody>
  </table>

  <div class="sec">Frei im Gebäude verteilte Entnahmestellen</div>
  <table style="font-size:7.1pt">
    <thead><tr><th>Entnahmestelle</th><th>Anzahl</th><th>V<sub>R</sub></th><th>Summe</th></tr></thead>
    <tbody>${freeRows || '<tr><td colspan="4" style="text-align:center;color:#aaa">Keine freien Entnahmestellen eingetragen</td></tr>'}</tbody>
  </table>

  <div class="sec">Ergebnisse</div>
  <table>
    <tbody>
      <tr><td>ΣV<sub>R</sub> kalt</td><td class="num">${_twPdfNum(r.cold)} l/s</td><td>V<sub>S</sub> Gebäude</td><td class="num">${_twPdfNum(r.formulaPeak)} l/s</td></tr>
      <tr><td>ΣV<sub>R</sub> warm</td><td class="num">${_twPdfNum(r.warm)} l/s</td><td>V<sub>S</sub> NE-Ansatz</td><td class="num">${r.neSummary?.length ? _twPdfNum(r.neBasedPeak) + ' l/s' : '–'}</td></tr>
      <tr><td>ΣV<sub>R</sub> gesamt</td><td class="num">${_twPdfNum(r.total)} l/s</td><td>V<sub>S</sub> maßgebend</td><td class="num">${_twPdfNum(r.peak)} l/s / ${_twPdfNum(r.peakM3h)} m³/h</td></tr>
      <tr><td>Hauptleitung</td><td class="num">${r.dn || '–'}</td><td>Hauswasserzähler</td><td class="num">${r.meter || '–'}</td></tr>
    </tbody>
  </table>

  <div class="sec">Hinweise</div>
  <p style="font-size:7.5pt;color:#444;line-height:1.35;background:#f5f7fa;border:1px solid #e0e6ef;border-radius:5px;padding:6px 8px">${hints}</p>
  <p style="font-size:6.8pt;color:#aaa;margin-top:4px">DIN 1988-300 orientierte Schnellberechnung. Keine vollständige Rohrnetz- oder Druckverlustberechnung.</p>`;
}

function _twPdfNum(v) {
  return (v == null || isNaN(v)) ? '–' : Number(v).toFixed(2).replace('.', ',');
}

/* ───────────────────────────────────────
   HILFSFUNKTIONEN
─────────────────────────────────────── */
/** Text aus DOM-Element, ohne Kind-Spans */
function _txt(id) {
  const el = document.getElementById(id);
  if (!el) return '–';
  const node = el.firstChild;
  return (node?.nodeType === 3 ? node.textContent : el.textContent).trim() || '–';
}

/** Zahl formatieren oder '–' zurückgeben */
function _pdfFmt(v) {
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? (v || '–') : v;
}

/** Temperaturdifferenz berechnen */
function _pdfFmtDiff(a, b) {
  const na = parseFloat(String(a).replace(',', '.'));
  const nb = parseFloat(String(b).replace(',', '.'));
  if (isNaN(na) || isNaN(nb)) return '–';
  return (na - nb).toFixed(1) + ' K';
}
