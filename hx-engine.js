/* ═══════════════════════════════════════════════════════
   hx-engine.js  v5.0  —  Massenstromrechner PWA
   Echtes Mollier h,x-Diagramm

   KOORDINATENSYSTEM (wie Original):
   · Y-Achse vertikal:   T [°C] — Trockenkugeltemperatur
   · X-Achse horizontal: x [g/kg] — Feuchtegehalt
   · Isotherme:          horizontale Linien (T = const)
   · φ-Kurven:           Kurven von unten-links nach oben-rechts
   · Isenthalpen:        Diagonalen von oben-links nach unten-rechts
   · Sättigungskurve:    rechte/obere Grenze (φ=100%)
═══════════════════════════════════════════════════════ */
'use strict';

/* ─── PHYSIK ─── */
const P_ATM = 1013.25; // hPa

function pws(T) { return 6.112 * Math.exp(17.62 * T / (243.12 + T)); }

function calcX(T, phi) {
  if (isNaN(T) || isNaN(phi) || phi <= 0) return 0;
  const pw = phi / 100 * pws(T);
  if (pw >= P_ATM) return 999;
  return +(1000 * 0.622 * pw / (P_ATM - pw)).toFixed(3);
}

function calcH(T, x) { return 1.006 * T + (x / 1000) * (2501 + 1.86 * T); }

function calcPhi(T, x) {
  if (isNaN(T) || isNaN(x) || x < 0) return NaN;
  const pw = (x / 1000) * P_ATM / (0.622 + x / 1000);
  return +(100 * pw / pws(T)).toFixed(1);
}

function calcTdew(x) {
  if (isNaN(x) || x <= 0) return NaN;
  const pw = (x / 1000) * P_ATM / (0.622 + x / 1000);
  const lp = Math.log(pw / 6.112);
  return +(243.12 * lp / (17.62 - lp)).toFixed(1);
}

function calcTwet(T, x) {
  if (isNaN(T) || isNaN(x)) return NaN;
  let tw = T - Math.max(0, T - (calcTdew(x) || T)) * 0.4;
  for (let i = 0; i < 40; i++) {
    const tn = T - (calcX(tw, 100) - x) * (2501 + 1.86 * tw) / (1.006 + 1.805 * x / 1000);
    if (Math.abs(tn - tw) < 0.001) { tw = tn; break; }
    tw = tn;
  }
  return +tw.toFixed(1);
}

function numHx(v) {
  if (v == null || String(v).trim() === '') return NaN;
  return parseFloat(String(v).replace(/[−–—]/g, '-').replace(',', '.').trim());
}

/* ─── KONFIGURATION ─── */
const CFG = {
  // Achsenbereiche
  xMin: 0,  xMax: 30,    // g/kg — Feuchtegehalt (X-Achse)
  tMin: -20, tMax: 50,   // °C   — Temperatur     (Y-Achse)
  // Paddings
  pad: { top: 18, right: 58, bottom: 40, left: 46 },
  // Kurven
  phis:   [10, 20, 30, 40, 50, 60, 70, 80, 90],
  isoT:   [-20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
  isoH:   [-20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  // Achsen-Ticks
  xTicks: [0, 5, 10, 15, 20, 25, 30],
  tTicks: [-20, -10, 0, 10, 20, 30, 40, 50],
};

/* ─── KOORDINATEN-TRANSFORMATION ─── */
// Physikalisch (x [g/kg], T [°C]) → Canvas-Pixel
function toCanvas(x, T, W, H) {
  const { pad: p, xMin, xMax, tMin, tMax } = CFG;
  const cw = W - p.left - p.right;
  const ch = H - p.top  - p.bottom;
  return {
    px: p.left + (x - xMin) / (xMax - xMin) * cw,
    py: p.top  + ch - (T - tMin) / (tMax - tMin) * ch,
  };
}

// Canvas-Pixel → physikalisch (x, T)
function fromCanvas(px, py, W, H) {
  const { pad: p, xMin, xMax, tMin, tMax } = CFG;
  const cw = W - p.left - p.right;
  const ch = H - p.top  - p.bottom;
  return {
    x: Math.max(0, (px - p.left) / cw * (xMax - xMin) + xMin),
    T: tMax - (py - p.top) / ch * (tMax - tMin),
  };
}

/* ─── GLOBALER ZUSTAND ─── */
let _state = null;
window._hxState = null;

/* ─── HAUPT-DRAW ─── */
function drawHxChart(state) {
  const canvas = document.getElementById('hxCanvas');
  if (!canvas) return;

  const dpr  = window.devicePixelRatio || 1;
  const rect  = canvas.getBoundingClientRect();
  const W = Math.round(rect.width)  || 340;
  const H = Math.round(rect.height) || 400;
  if (W < 10 || H < 10) return;

  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Hintergrund
  ctx.fillStyle = '#040810';
  ctx.fillRect(0, 0, W, H);

  // Zeichenreihenfolge (wie im Original Mollier)
  _drawHContours(ctx, W, H);  // Isenthalpen (hinterste Ebene)
  _drawPhiCurves(ctx, W, H);  // φ-Kurven
  _drawSaturation(ctx, W, H); // Sättigungskurve φ=100%
  _drawIsotherms(ctx, W, H);  // Isotherme (horizontale Linien)
  _drawAxes(ctx, W, H);       // Achsen + Labels
  if (state) _drawStatePoint(ctx, W, H, state);
}

/* ─── ISENTHALPEN (h = const) — diagonale Linien oben-links → unten-rechts ─── */
function _drawHContours(ctx, W, H) {
  CFG.isoH.forEach(h => {
    ctx.save();
    ctx.strokeStyle = h === 0
      ? 'rgba(255,255,255,0.18)'
      : 'rgba(255,255,255,0.07)';
    ctx.lineWidth = h === 0 ? 1.0 : 0.6;
    ctx.beginPath();
    let first = true;
    for (let T = CFG.tMin - 2; T <= CFG.tMax + 2; T += 0.5) {
      // x aus h = 1.006*T + x/1000*(2501+1.86*T)
      const xVal = (h - 1.006 * T) * 1000 / (2501 + 1.86 * T);
      if (xVal < -0.5 || xVal > CFG.xMax + 0.5) { first = true; continue; }
      // Nur im ungesättigten Bereich
      const xSat = calcX(T, 100);
      if (xVal > xSat + 0.3) { first = true; continue; }
      const x  = Math.max(0, Math.min(xVal, CFG.xMax));
      const Tc = Math.max(CFG.tMin, Math.min(T, CFG.tMax));
      const { px, py } = toCanvas(x, Tc, W, H);
      first ? (ctx.moveTo(px, py), first = false) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();

    // h-Linien Labels werden rechts außerhalb der Plot-Fläche (Randbereich) gezeichnet
    // damit kein Overlap mit T-Achse oder φ-Labels
    const T_r = (h - CFG.xMax / 1000 * 2501) / (1.006 + CFG.xMax / 1000 * 1.86);
    if (T_r >= CFG.tMin + 1 && T_r <= CFG.tMax - 1) {
      const { px, py } = toCanvas(CFG.xMax, T_r, W, H);
      const { pad: p3 } = CFG;
      // Nur im rechten Padding-Bereich zeichnen (außerhalb Plot-Box)
      ctx.save();
      ctx.fillStyle = h === 0 ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.22)';
      ctx.font = '9px Arial,sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(h + ' kJ', px + 4, py + 3);
      ctx.restore();
    }
  });
}

/* ─── φ-KURVEN (von unten-links nach oben-rechts) ─── */
function _drawPhiCurves(ctx, W, H) {
  CFG.phis.forEach(phi => {
    const acc = phi === 50;
    ctx.save();
    ctx.strokeStyle = acc ? 'rgba(90,160,255,0.42)' : 'rgba(80,130,255,0.18)';
    ctx.lineWidth = acc ? 1.4 : 0.8;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    let first = true;
    for (let T = CFG.tMin; T <= CFG.tMax; T += 0.25) {
      const x = calcX(T, phi);
      if (x < -0.2 || x > CFG.xMax + 0.2) { first = true; continue; }
      const { px, py } = toCanvas(Math.min(x, CFG.xMax), T, W, H);
      first ? (ctx.moveTo(px, py), first = false) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* Label: jede φ-Kurve bekommt ein Label an der Stelle wo x = xMax
       Das erzeugt die charakteristisch geschwungene Anordnung rechts,
       wie im Original-Mollier — höhere φ weiter oben, niedrigere weiter unten */
    // Finde T wo x ≈ xMax * 0.92 (kurz vor rechtem Rand)
    let Tlbl = NaN;
    const xTarget = CFG.xMax * 0.91;
    for (let T = CFG.tMax; T >= CFG.tMin; T -= 0.5) {
      if (calcX(T, phi) >= xTarget) { Tlbl = T; break; }
    }
    // Fallback: höchste T wo Kurve noch im Bereich ist
    if (isNaN(Tlbl)) {
      for (let T = CFG.tMax; T >= CFG.tMin; T -= 0.5) {
        const x = calcX(T, phi);
        if (x >= 0.3 && x <= CFG.xMax + 0.3) { Tlbl = T; break; }
      }
    }
    /* φ-Labels: alle 9 Linien (10–90%) sicher im Diagramm
       Arc von T=44°C bei 10% bis T=28°C bei 90%
       Platzierung direkt auf der φ-Kurve an der gewählten T-Referenz */
    {
      const t   = (phi - 10) / 80;         // 0..1
      const Tref = 44 - t * 16;            // 44°C→28°C
      const xlbl = calcX(Tref, phi);
      const { pad: p2 } = CFG;
      // Sicherstellen dass Label im Plot-Bereich liegt
      if (xlbl >= 0.2 && xlbl <= CFG.xMax - 0.5) {
        const { px, py } = toCanvas(xlbl, Tref, W, H);
        if (px > p2.left + 4 && px < W - p2.right - 4 &&
            py > p2.top + 4  && py < H - p2.bottom - 10) {
          ctx.save();
          ctx.font = (acc ? 'bold ' : '') + '9px Arial,sans-serif';
          ctx.textAlign = 'left';
          const lbl = phi + '%';
          const tw  = ctx.measureText(lbl).width;
          ctx.fillStyle = 'rgba(4,8,16,0.78)';
          ctx.fillRect(px + 2, py - 9, tw + 4, 12);
          ctx.fillStyle = acc ? 'rgba(90,160,255,0.92)' : 'rgba(80,130,255,0.62)';
          ctx.fillText(lbl, px + 3, py);
          ctx.restore();
        }
      }
    }
  });
}

/* ─── SÄTTIGUNGSKURVE φ = 100% ─── */
function _drawSaturation(ctx, W, H) {
  ctx.save();
  ctx.strokeStyle = '#5ab0ff';
  ctx.lineWidth = 2.2;
  ctx.shadowColor = 'rgba(90,176,255,0.40)';
  ctx.shadowBlur  = 6;
  ctx.beginPath();
  let first = true;
  for (let T = CFG.tMin; T <= CFG.tMax; T += 0.3) {
    const x = calcX(T, 100);
    if (x > CFG.xMax + 0.3) break;
    const { px, py } = toCanvas(Math.min(x, CFG.xMax), T, W, H);
    first ? (ctx.moveTo(px, py), first = false) : ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();

  // Label an der Kurve
  const Tl = 12, xl = calcX(Tl, 100);
  if (xl <= CFG.xMax - 2) {
    const { px, py } = toCanvas(xl, Tl, W, H);
    ctx.save();
    ctx.fillStyle = 'rgba(90,176,255,0.85)';
    ctx.font = 'bold 10px Arial,sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('\u03c6\u202f=\u202f100\u202f%', px + 5, py - 5);
    ctx.restore();
  }
}

/* ─── ISOTHERME (horizontal, T = const) ─── */
function _drawIsotherms(ctx, W, H) {
  CFG.isoT.forEach(T => {
    const xSat = calcX(T, 100);
    const xEnd = Math.min(xSat, CFG.xMax);
    if (xEnd < 0) return;

    const p0 = toCanvas(0,    T, W, H);
    const p1 = toCanvas(xEnd, T, W, H);

    const isKey = T % 10 === 0;
    ctx.save();
    ctx.strokeStyle = isKey
      ? 'rgba(255,255,255,0.38)'
      : 'rgba(255,255,255,0.16)';
    ctx.lineWidth = isKey ? 1.1 : 0.7;
    ctx.beginPath();
    ctx.moveTo(p0.px, p0.py);
    ctx.lineTo(p1.px, p1.py);
    ctx.stroke();
    ctx.restore();

    // Label links am Rand (NUR für 10er-Schritte oder T=0)
    if (isKey || T === 0) {
      ctx.save();
      ctx.font = (isKey ? 'bold ' : '') + '10px Arial,sans-serif';
      ctx.textAlign = 'right';
      ctx.fillStyle = isKey
        ? 'rgba(255,255,255,0.70)'
        : 'rgba(255,255,255,0.45)';
      ctx.fillText(T + '\u00b0', p0.px - 3, p0.py + 3);
      ctx.restore();
    }
  });
}

/* ─── ACHSEN + BESCHRIFTUNG ─── */
function _drawAxes(ctx, W, H) {
  const { pad: p, xMin, xMax, tMin, tMax } = CFG;
  const cw = W - p.left - p.right;
  const ch = H - p.top  - p.bottom;

  // Achsenlinien
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.32)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(p.left, p.top);
  ctx.lineTo(p.left, p.top + ch);
  ctx.lineTo(p.left + cw, p.top + ch);
  ctx.stroke();
  ctx.restore();

  // Y-Achse: Temperatur-Ticks
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.font = '10px Arial,sans-serif';
  ctx.textAlign = 'right';
  CFG.tTicks.forEach(T => {
    const { py } = toCanvas(0, T, W, H);
    ctx.fillText(T, p.left - 4, py + 3);
    // Tick-Strich
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.20)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(p.left, py);
    ctx.lineTo(p.left + cw, py);
    ctx.stroke();
    ctx.restore();
  });
  // Y-Achsen-Titel
  ctx.save();
  ctx.translate(12, p.top + ch / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.62)';
  ctx.font = 'bold 11px Arial,sans-serif';
  ctx.fillText('T  [\u00b0C]', 0, 0);
  ctx.restore();
  ctx.restore();

  // X-Achse: Feuchtegehalt-Ticks
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.font = '10px Arial,sans-serif';
  ctx.textAlign = 'center';
  CFG.xTicks.forEach(x => {
    const { px } = toCanvas(x, tMin, W, H);
    ctx.fillText(x, px, p.top + ch + 13);
  });
  ctx.fillStyle = 'rgba(255,255,255,0.62)';
  ctx.font = 'bold 11px Arial,sans-serif';
  ctx.fillText('x  [g/kg]', p.left + cw / 2, p.top + ch + 30);
  ctx.restore();
}

/* ─── ZUSTANDSPUNKT ─── */
function _drawStatePoint(ctx, W, H, state) {
  if (!state || isNaN(state.T) || isNaN(state.x)) return;
  if (state.T < CFG.tMin || state.T > CFG.tMax) return;
  if (state.x < 0 || state.x > CFG.xMax) return;

  // Sättigungscheck
  const xSat = calcX(state.T, 100);
  if (state.x > xSat + 0.1) return;

  const { pad: p } = CFG;
  const cw = W - p.left - p.right;
  const ch = H - p.top  - p.bottom;
  const { px, py } = toCanvas(state.x, state.T, W, H);

  // Fadenkreuz
  ctx.save();
  ctx.strokeStyle = 'rgba(109,99,255,0.30)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath(); ctx.moveTo(p.left, py); ctx.lineTo(p.left + cw, py); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px, p.top);  ctx.lineTo(px, p.top + ch); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Punkt + Glühen
  ctx.save();
  ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#6d63ff'; ctx.shadowColor = '#6d63ff'; ctx.shadowBlur = 18;
  ctx.fill(); ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(109,99,255,0.48)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();

  // Kein Tooltip-Text im Diagramm — Werte im Ergebnis-Panel
}

/* ─── HOVER-TOOLTIP ─── */
function _setupInteraction(canvas) {
  // Interaction: only mouseleave to redraw, no hover tooltip (Bug 3)
  // Bug 3: Hover tooltip removed — point only shown after state is set
  canvas.addEventListener('mouseleave', () => drawHxChart(_state));
}

/* _drawHover removed — no hover tooltip */

/* ─── HILFSFUNKTIONEN ─── */
/* _rr() removed — no longer used after tooltip removal */

/* ─── ± VORZEICHEN TOGGLE (unified — used by hx-engine + wrg-mischluft) ──
   Global so it's accessible from both modules and inline onclick handlers */
function toggleTempSign(inputId) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  const raw = String(inp.value).replace(',', '.').trim();
  const v   = parseFloat(raw);
  if (isNaN(v) || v === 0) {
    if (!raw.startsWith('-')) inp.value = '-';
    inp.focus(); return;
  }
  inp.value = String(-v).replace('.', ',');
  inp.dispatchEvent(new Event('input',  { bubbles: true }));
  inp.dispatchEvent(new Event('change', { bubbles: true }));
}
// Alias for WRG module — both point to same function
const wrgToggleSign = toggleTempSign;

/* ─── ZUSTAND SETZEN ─── */
function setHxState() {
  const T   = numHx(document.getElementById('hx-temp')?.value);
  const phi = numHx(document.getElementById('hx-rh')?.value);
  const xIn = numHx(document.getElementById('hx-x')?.value);
  const modeRH = document.getElementById('mode-rh')?.classList.contains('active');

  if (isNaN(T)) { _showHxError('Bitte Temperatur eingeben.'); return; }
  if (T < -30 || T > 60) { _showHxError('T: -30 bis +60 \u00b0C'); return; }

  let state;
  if (modeRH) {
    if (isNaN(phi) || phi <= 0 || phi > 100) { return; } // Kein Fehler — einfach nicht berechnen
    const x = calcX(T, phi);
    state = { T, phi, x, h: calcH(T, x), tdew: calcTdew(x), twet: calcTwet(T, x) };
  } else {
    if (isNaN(xIn) || xIn < 0) { _showHxError('x \u2265 0 g/kg'); return; }
    const ph = calcPhi(T, xIn);
    state = { T, phi: ph, x: xIn, h: calcH(T, xIn), tdew: calcTdew(xIn), twet: calcTwet(T, xIn) };
  }

  _state = state; window._hxState = state;
  _renderState(state);
}

function _renderState(state) {
  const fmt = (v, d) => (isNaN(v) || v == null) ? '--' : (+v).toFixed(d);
  const se  = id => document.getElementById(id);

  // Hauptwert: Temperatur
  const mv = se('state-temp');
  if (mv) {
    mv.textContent = fmt(state.T, 1);
    mv.style.color = state.T < 0 ? 'var(--cold-t)' : 'var(--heat-t)';
  }
  // Sekundärwerte
  const vals = [
    ['state-phi',  fmt(state.phi,  1)],
    ['state-x',    fmt(state.x,    2)],
    ['state-h',    fmt(state.h,    1)],
    ['state-tdew', fmt(state.tdew, 1)],
  ];
  vals.forEach(([id, val]) => { const e = se(id); if (e) e.textContent = val; });

  drawHxChart(state);
}

function _showHxError(msg) {
  const el = document.getElementById('hx-state-result');
  if (!el) return;
  const prev = el.innerHTML;
  el.innerHTML = `<span style="color:rgba(255,100,80,.9);font-size:13px">\u26a0 ${msg}</span>`;
  setTimeout(() => { el.innerHTML = prev; }, 2200);
}

/* ─── BERECHNUNG PROZESS ─── */
/* ═══════════════════════════════════════════════════════
   PROZESSBERECHNUNG — physikalisch korrekte Prozessketten
   Koordinatensystem (T,x): Erwärmen = vertikal, Befeuchten = horizontal,
   Adiabat = diagonal entlang Isenthalpe (h=const)
═══════════════════════════════════════════════════════ */

/* ─ Hilfs-Zustandspunkt ─ */
function _mkState(T, x) {
  const ph = calcPhi(T, x);
  return { T, x: +x.toFixed(3), phi: +ph.toFixed(1), h: +calcH(T, x).toFixed(2), tdew: calcTdew(x) };
}

/* ─ 1. Erwärmen / Kühlen sensibel (x = const) ─ */
function _procHeat(s1, T2) {
  const s2 = _mkState(T2, s1.x);
  const col = T2 > s1.T ? '#ff9c3a' : '#4fa8ff';
  return [{ from: s1, to: s2, name: T2 > s1.T ? 'Erwärmen' : 'Kühlen', color: col }];
}

/* ─ 2. Kühlen mit Kondensation ─ */
function _procCoolDehumid(s1, T2) {
  const Td = calcTdew(s1.x) || s1.T;
  if (T2 >= Td - 0.05) return _procHeat(s1, T2); // kein Tau
  // Kühlen bis Taupunkt
  const sDew = _mkState(Td, s1.x);
  // Weiter kühlen entlang φ=100% (x nimmt ab durch Kondensation)
  const x2  = calcX(T2, 100);
  const s2  = _mkState(T2, x2);
  return [
    { from: s1,   to: sDew, name: 'Kühlen bis Taupunkt', color: '#4fa8ff' },
    { from: sDew, to: s2,   name: 'Kühlen + Kondensation (φ=100%)', color: '#00c4e8' },
  ];
}

/* ─ 3. Dampfbefeuchtung: Vorwärmen → Dampf bei T2 (x↑, T≈const) ─ */
function _procSteam(s1, T2, x2) {
  if (isNaN(x2) || x2 <= s1.x) {
    return _procHeat(s1, T2);
  }
  // Schritt 1: Vorwärmen T1→T2 bei x=x1
  const sPre = _mkState(T2, s1.x);
  // Schritt 2: Dampfbefeuchtung bei T2 von x1→x2
  // Dampf bei ~100°C: h_steam ≈ 2676 kJ/kg
  // Temperaturänderung: ΔT = Δx * h_steam / (cp * (1 + x_avg/1000)) / 1000 ≈ gering
  const H_STEAM = 2676; // kJ/kg Dampfenthalpie
  const dx     = x2 - s1.x;           // g/kg
  const dT_steam = dx * H_STEAM / (1000 * (1.006 + s1.x / 1000 * 1.86) * 1000);
  const T2end  = T2 + dT_steam;        // leichte Erwärmung durch Dampf
  const s2     = _mkState(T2end, x2);
  return [
    { from: s1,  to: sPre, name: 'Vorwärmen', color: '#ff9c3a' },
    { from: sPre, to: s2,  name: 'Dampfbefeuchtung (x↑, T≈const)', color: '#a78bfa' },
  ];
}

/* ─ 4. Adiabate Befeuchtung: Vorwärmen → Adiabat bis φ=100% → Nachheizen ─
   Physik:
   · Adiabat = entlang h=const (Isenthalpe), x↑ T↓
   · Endpunkt Adiabat: φ=100% bei Feuchtkugeltemperatur Twet, x=xSat(Twet)
   · Twet hängt von h ab: Twet so dass xSat(Twet)=x_target
   · Vorwärmtemperatur: h(T_pre, x1) = h(Twet, xSat(Twet))
─────────────────────────────────────────────────────── */
function _procAdiabat(s1, T2, x2) {
  if (isNaN(x2) || x2 <= s1.x) return _procHeat(s1, T2);

  // Twet (Taupunkt von x2 = Feuchtkugeltemperatur bei φ=100%, x=x2)
  const Twet = calcTdew(x2);
  const xWet = calcX(Twet, 100);      // ≈ x2
  const hWet = calcH(Twet, xWet);     // Enthalpie am Sättigungspunkt

  // Vorwärmtemperatur: h(T_pre, x1) = hWet  (adiabat = h=const)
  // hWet = 1.006*T_pre + x1/1000*(2501+1.86*T_pre)
  // hWet = T_pre*(1.006 + x1*1.86/1000) + x1*2501/1000
  const x1    = s1.x;
  const T_pre = (hWet - x1 * 2501 / 1000) / (1.006 + x1 * 1.86 / 1000);

  // Sanity: T_pre muss > s1.T und > Twet
  if (T_pre <= s1.T + 0.1) {
    // Keine Vorwärmung nötig — direkte Adiabat möglich
    const sSat = _mkState(Twet, xWet);
    const s2   = _mkState(T2, xWet);
    return [
      { from: s1,  to: sSat, name: 'Adiabate Befeuchtung (h=const)', color: '#34d399' },
      { from: sSat, to: s2,  name: 'Nachheizen', color: '#ff9c3a' },
    ];
  }

  const sPre = _mkState(T_pre, x1);   // Zustand nach Vorwärmen
  const sSat = _mkState(Twet, xWet);  // Zustand nach Adiabat (φ=100%)
  const s2   = _mkState(T2, xWet);    // Endzustand nach Nachheizen

  return [
    { from: s1,  to: sPre, name: 'Vorwärmen', color: '#ff9c3a' },
    { from: sPre, to: sSat, name: 'Adiabate Befeuchtung (h=const, φ→100%)', color: '#34d399' },
    { from: sSat, to: s2,  name: 'Nachheizen', color: '#ff6b35' },
  ];
}

/* ─ 5. Entfeuchten — physikalisch korrekte Prozesskette:
   1. Kühlen sensibel bis Taupunkt von s1  (x=const, T↓)
   2. Kühlen entlang Sättigungslinie φ=100% bis T_kühl < T2
      → x nimmt durch Kondensation ab bis x=x2
   3. Nachheizen sensibel von T_kühl auf T2  (x=const=x2)
─ */
function _procDehumid(s1, T2, x2) {
  if (isNaN(x2) || x2 >= s1.x) x2 = calcX(T2, 55);
  // Schritt 1: sensibel kühlen bis Taupunkt von Ausgangszustand
  const Td1   = calcTdew(s1.x) || (s1.T - 3);
  const sDew1 = _mkState(Td1, s1.x);
  // Schritt 2: entlang φ=100% kühlen bis T_kühl (= Taupunkt von Ziel-x)
  const T_cool = calcTdew(x2) || (T2 - 3);
  const sSat   = _mkState(T_cool, calcX(T_cool, 100));
  // Schritt 3: Nachheizen
  const s2 = _mkState(T2, x2);
  return [
    { from: s1,    to: sDew1, name: 'Kühlen bis Taupunkt (x const)', color: '#4fa8ff', sat: false },
    { from: sDew1, to: sSat,  name: 'Kühlen entlang φ = 100 % (Kondensation)', color: '#00c4e8', sat: true },
    { from: sSat,  to: s2,    name: 'Nachheizen (x const)', color: '#ff9c3a', sat: false },
  ];
}

/* ─ 6. Wärmerückgewinnung (WRG): Vorwärmen mit Abluft ─ */
function _procWRG(s1, T2, x2) {
  // WRG erwärmt ohne Feuchtigkeitsänderung (Plattenwärmetauscher)
  const steps = [];
  if (T2 > s1.T) steps.push(..._procHeat(s1, T2));
  // Falls noch Befeuchtung nötig
  if (!isNaN(x2) && x2 > (steps[steps.length-1]?.to.x || s1.x) + 0.05) {
    const last = steps[steps.length-1]?.to || s1;
    steps[steps.length-1] && (steps[steps.length-1].name = 'WRG Vorwärmen (Plattentauscher)');
    steps.push({ from: last, to: _mkState(T2, x2), name: 'Nachbefeuchten', color: '#a78bfa' });
  }
  return steps.length ? steps : _procHeat(s1, T2);
}

/* ─ 7. Mischluft: lineare Mischung ─ */
function _procMix(s1, T2, x2) {
  // Mischungsgerade: lineare Verbindung zweier Zustände
  const s2 = _mkState(T2, isNaN(x2) ? s1.x : x2);
  return [{ from: s1, to: s2, name: 'Mischluft (lineare Mischung)', color: '#ffd60a' }];
}

/* ─ HAUPTFUNKTION ─ */
function calcHxProcess() {
  if (!_state) { _showHxError('Zuerst Ausgangszustand setzen'); return; }

  const T2   = numHx(document.getElementById('hx-target-temp')?.value);
  const phi2 = numHx(document.getElementById('hx-target-rh')?.value);
  const proc = document.getElementById('hx-process')?.value;
  const res  = document.getElementById('hx-result');
  if (!res) return;

  if (!proc) {
    res.innerHTML = '<span style="color:var(--t3)">Prozessart wählen (Schritt 3).</span>';
    return;
  }
  if (isNaN(T2)) {
    res.innerHTML = '<span style="color:var(--t3)">Zieltemperatur eingeben.</span>';
    return;
  }

  const s1 = _state;
  const x2 = !isNaN(phi2) ? calcX(T2, phi2) : NaN;

  let steps;
  switch (proc) {
    case 'heizen':      steps = _procHeat(s1, T2);                    break;
    case 'kuehlen':     steps = _procCoolDehumid(s1, T2);             break;
    case 'dampf':       steps = _procSteam(s1, T2, x2);               break;
    case 'adiabat':     steps = _procAdiabat(s1, T2, x2);             break;
    case 'entfeuchten': steps = _procDehumid(s1, T2, x2);             break;
    case 'wrg':         steps = _procWRG(s1, T2, x2);                 break;
    case 'mischluft':   steps = _procMix(s1, T2, x2);                 break;
    case 'nachheizen':  steps = _procHeat(s1, T2);
      if (steps[0]) steps[0].name = 'Nachheizen';                     break;
    default:            steps = _procHeat(s1, T2);
  }

  _renderProcessSteps(steps, res);
  _drawProcessOnChart(steps);
}

/* ─ PROZESSSCHRITTE ANZEIGEN ─ */
function _renderProcessSteps(steps, el) {
  if (!steps || !steps.length) return;
  const s0   = steps[0].from;
  const sEnd = steps[steps.length - 1].to;
  const sign = v => v >= 0 ? '+' : '';
  const fmt  = (v, d) => isNaN(v) ? '--' : (sign(v) + (+v).toFixed(d));

  let html = '<div style="font-family:var(--f);font-size:12px">';

  // Schritte
  steps.forEach((step, i) => {
    const dT = step.to.T - step.from.T;
    const dx = step.to.x - step.from.x;
    const dh = step.to.h - step.from.h;
    html += `
      <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:7px;
                  padding:8px 10px;background:rgba(255,255,255,.04);
                  border-radius:10px;border-left:3px solid ${step.color}">
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:12px;color:var(--t1);margin-bottom:3px">
            ${i + 1}.&nbsp;${step.name}
          </div>
          <div style="font-family:var(--fm);font-size:11px;color:var(--t3);line-height:1.7">
            ΔT ${fmt(dT,1)} K&emsp;
            Δx ${fmt(dx,2)} g/kg&emsp;
            Δh ${fmt(dh,1)} kJ/kg
          </div>
          <div style="font-size:10px;color:var(--t3);margin-top:2px">
            ${step.from.T.toFixed(1)}°C / ${step.from.phi.toFixed(0)}% / ${step.from.x.toFixed(2)} g/kg
            →
            ${step.to.T.toFixed(1)}°C / ${step.to.phi.toFixed(0)}% / ${step.to.x.toFixed(2)} g/kg
          </div>
        </div>
      </div>`;
  });

  // Gesamtbilanz
  const dT_tot = sEnd.T - s0.T;
  const dx_tot = sEnd.x - s0.x;
  const dh_tot = sEnd.h - s0.h;
  html += `
    <div style="margin-top:6px;padding:8px 10px;background:rgba(79,168,255,.08);
                border:1px solid rgba(79,168,255,.20);border-radius:10px">
      <div style="font-size:11px;font-weight:700;color:var(--blue);margin-bottom:3px">Gesamtbilanz</div>
      <div style="font-family:var(--fm);font-size:11px;color:var(--t2);line-height:1.7">
        ΔT ${fmt(dT_tot,1)} K&emsp;
        Δx ${fmt(dx_tot,2)} g/kg&emsp;
        Δh ${fmt(dh_tot,1)} kJ/kg
      </div>
      <div style="font-size:10px;color:var(--t3);margin-top:2px">
        Endzustand: ${sEnd.T.toFixed(1)}°C • φ ${sEnd.phi.toFixed(0)}% • x ${sEnd.x.toFixed(2)} g/kg
      </div>
    </div>`;

  html += '</div>';
  el.innerHTML = html;
}

/* ─ PROZESSLINIE IM DIAGRAMM ─ */
function _drawProcessOnChart(steps) {
  if (!steps || !steps.length) return;
  const canvas = document.getElementById('hxCanvas');
  if (!canvas) return;

  // Redraw base chart first
  drawHxChart(_state);

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W   = parseInt(canvas.style.width)  || canvas.width  / dpr;
  const H   = parseInt(canvas.style.height) || canvas.height / dpr;

  steps.forEach((step, idx) => {
    const p1 = toCanvas(step.from.x, step.from.T, W, H);
    const p2 = toCanvas(step.to.x,   step.to.T,   W, H);

    ctx.save();
    ctx.strokeStyle = step.color;
    ctx.lineWidth   = 2.2;
    ctx.setLineDash([5, 4]);
    ctx.shadowColor = step.color;
    ctx.shadowBlur  = 4;

    // Sättigungslinie-Schritt: entlang φ=100% zeichnen
    if (step.sat) {
      ctx.beginPath();
      let satFirst = true;
      const T_start = step.from.T, T_end = step.to.T;
      const step_dir = T_end < T_start ? -0.2 : 0.2;
      for (let T = T_start; (step_dir < 0 ? T >= T_end : T <= T_end); T += step_dir) {
        const xs = calcX(T, 100);
        const { px: spx, py: spy } = toCanvas(xs, T, W, H);
        satFirst ? (ctx.moveTo(spx, spy), satFirst = false) : ctx.lineTo(spx, spy);
      }
      ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(p1.px, p1.py); ctx.lineTo(p2.px, p2.py); ctx.stroke();
    }
    ctx.setLineDash([]);

    // Pfeilspitze am Ende
    const angle = Math.atan2(p2.py - p1.py, p2.px - p1.px);
    const aLen  = 8;
    ctx.beginPath();
    ctx.moveTo(p2.px, p2.py);
    ctx.lineTo(p2.px - aLen * Math.cos(angle - 0.4), p2.py - aLen * Math.sin(angle - 0.4));
    ctx.lineTo(p2.px - aLen * Math.cos(angle + 0.4), p2.py - aLen * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fillStyle = step.color; ctx.shadowBlur = 0;
    ctx.fill();
    ctx.restore();

    // Zwischenpunkt (außer Startpunkt)
    if (idx > 0) {
      ctx.save();
      ctx.beginPath(); ctx.arc(p1.px, p1.py, 4, 0, Math.PI * 2);
      ctx.fillStyle = step.color; ctx.shadowColor = step.color; ctx.shadowBlur = 8;
      ctx.fill(); ctx.restore();
    }
    // Endpunkt letzter Schritt
    if (idx === steps.length - 1) {
      ctx.save();
      ctx.beginPath(); ctx.arc(p2.px, p2.py, 5, 0, Math.PI * 2);
      ctx.fillStyle = step.color; ctx.shadowColor = step.color; ctx.shadowBlur = 14;
      ctx.fill(); ctx.restore();
    }
  });
}


/* ─── PDF EXPORT WRAPPER ─── */
function hxOpenPdf() {
  if (typeof openPdfSheet === 'function') {
    openPdfSheet();
  } else {
    // pdf-export.js noch nicht geladen — kurz warten
    setTimeout(() => {
      if (typeof openPdfSheet === 'function') openPdfSheet();
    }, 200);
  }
}

/* ─── MODUS φ ↔ x ─── */
function _hxModeSwitch(mode) {
  const isRH = mode === 'rh';
  document.getElementById('mode-rh')?.classList.toggle('active',  isRH);
  document.getElementById('mode-x') ?.classList.toggle('active', !isRH);
  const wr = document.getElementById('wrap-rh');
  const wx = document.getElementById('wrap-x');
  if (wr) wr.style.display = isRH ? '' : 'none';
  if (wx) wx.style.display = isRH ? 'none' : '';
}

/* ─── INIT ─── */
/* ─── PROZESSFILTER — nur sinnvolle Prozesse anzeigen ─── */
function _filterProcessOptions() {
  if (!_state) return;
  const T2   = numHx(document.getElementById('hx-target-temp')?.value);
  const phi2 = numHx(document.getElementById('hx-target-rh')?.value);
  const sel  = document.getElementById('hx-process');
  if (!sel || isNaN(T2)) return;

  const s1 = _state;
  const x2 = !isNaN(phi2) ? calcX(T2, phi2) : NaN;
  const needHeat    = T2 > s1.T + 0.3;   // Ziel wärmer → Heizen nötig
  const needCool    = T2 < s1.T - 0.3;   // Ziel kälter → Kühlen nötig
  const needHumid   = !isNaN(x2) && x2 > s1.x + 0.1;
  const needDehumid = !isNaN(x2) && x2 < s1.x - 0.1;
  const neutral     = !needHumid && !needDehumid;

  // Bug 4 fix: show only physically sensible processes
  const show = {
    'heizen':      needHeat  && (neutral || needHumid),  // nur wenn Ziel wärmer
    'kuehlen':     needCool  && (neutral || needDehumid), // nur wenn Ziel kälter
    'dampf':       needHumid  && (needHeat || !needCool), // Befeuchten+Erwärmen
    'adiabat':     needHumid  && (needHeat || !needCool), // adiabat = Vorwärmen nötig
    'entfeuchten': needDehumid || needCool,               // Entfeuchten = Kühlen
    'nachheizen':  needHeat,
  };

  let anyVisible = false;
  // iOS Safari doesn't support option.hidden — use disabled + style instead
  let currentVal = sel.value;
  Array.from(sel.options).forEach(opt => {
    if (!opt.value) return;
    const visible = show.hasOwnProperty(opt.value) ? show[opt.value] : true;
    opt.disabled = !visible;
    opt.style.display = visible ? '' : 'none'; // Chrome/Firefox
    opt.style.color = visible ? '' : 'transparent'; // iOS fallback
    if (visible) anyVisible = true;
  });
  // Reset if selected option is now hidden
  const curOpt = sel.options[sel.selectedIndex];
  if (curOpt && curOpt.disabled) sel.value = '';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('mode-rh') ?.addEventListener('click', () => _hxModeSwitch('rh'));
  document.getElementById('mode-x')  ?.addEventListener('click', () => _hxModeSwitch('x'));
  document.getElementById('hx-calc') ?.addEventListener('click', calcHxProcess);

  // Bug 2: Zustand automatisch setzen bei Eingabe (debounced)
  let _debTimer;
  function _autoState() {
    clearTimeout(_debTimer);
    _debTimer = setTimeout(() => { setHxState(); _filterProcessOptions(); }, 450);
  }

  ['hx-temp','hx-rh','hx-x'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', _autoState);
    el.addEventListener('keydown', e => { if (e.key === 'Enter') { clearTimeout(_debTimer); setHxState(); } });
  });

  // Prozessfilter bei Zieländerung aktualisieren
  ['hx-target-temp','hx-target-rh'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', _filterProcessOptions);
  });

  const canvas = document.getElementById('hxCanvas');
  if (canvas) _setupInteraction(canvas);

  _hxModeSwitch('rh');
  setTimeout(() => drawHxChart(null), 80);

  let _rt;
  window.addEventListener('resize', () => {
    clearTimeout(_rt);
    _rt = setTimeout(() => drawHxChart(_state), 120);
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.tab === 'hx') setTimeout(() => drawHxChart(_state), 80);
    });
  });
});
