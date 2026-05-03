
/* ─── ± VORZEICHEN für WRG Außenluft ─── */
function wrgToggleSign(inputId) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  const raw = String(inp.value).replace(',', '.').trim();
  const v = parseFloat(raw);
  if (isNaN(v) || v === 0) {
    if (!raw.startsWith('-')) inp.value = '-';
    inp.focus(); return;
  }
  inp.value = String(-v).replace('.', ',');
  inp.dispatchEvent(new Event('input', { bubbles: true }));
  inp.dispatchEvent(new Event('change', { bubbles: true }));
}

/* ═══════════════════════════════════════════════════════
   wrg-mischluft.js  —  Massenstromrechner PWA
   Wärmerückgewinnung (WRG) & Luftmischung
   Plattenwärmetauscher: nur sensible Wärme (x = const pro Strom)
═══════════════════════════════════════════════════════ */
'use strict';

/* ─── PHYSIK (standalone) ─── */
const _P = 1013.25;
const _pws = T => 6.112 * Math.exp(17.62 * T / (243.12 + T));
const _x   = (T, phi) => {
  if (isNaN(T) || isNaN(phi) || phi <= 0) return 0;
  const pw = phi / 100 * _pws(T);
  return pw >= _P ? 999 : +(1000 * 0.622 * pw / (_P - pw)).toFixed(3);
};
const _h   = (T, x) => +(1.006 * T + x / 1000 * (2501 + 1.86 * T)).toFixed(2);
const _phi = (T, x) => {
  if (isNaN(T) || isNaN(x) || x < 0) return NaN;
  const pw = x / 1000 * _P / (0.622 + x / 1000);
  return +(100 * pw / _pws(T)).toFixed(1);
};
const _rho = T => +(353.05 / (T + 273.15)).toFixed(4);
const _n   = v => {
  if (v === null || v === undefined) return NaN;
  const s = String(v).replace(',', '.').trim();
  if (s === '' || s === '-') return NaN;
  const n = parseFloat(s);
  return isNaN(n) ? NaN : n;
};
const _wrgFmt = (v, d) => isNaN(v) || v == null ? '\u2013' : (+v).toFixed(d);
const _$   = id => document.getElementById(id);

/* ─── ZUSTANDSBOX HTML ─── */
function _stateBox(title, s, color, sub) {
  return `
  <div class="tcp-u-27fb32174c">
    <div class="tcp-u-c801a13623">${title}</div>
    <div class="tcp-u-55884be066">
      <div>
        <div class="tcp-u-2f22bb28f0">T [°C]</div>
        <div class="tcp-u-c311f15cb7">${_wrgFmt(s.T,1)}</div>
      </div>
      <div>
        <div class="tcp-u-2f22bb28f0">φ [%]</div>
        <div class="tcp-u-156342ee7d">${_wrgFmt(s.phi,1)}</div>
      </div>
      <div>
        <div class="tcp-u-2f22bb28f0">x [g/kg]</div>
        <div class="tcp-u-ce8d34db41">${_wrgFmt(s.x,2)}</div>
      </div>
      <div>
        <div class="tcp-u-2f22bb28f0">h [kJ/kg]</div>
        <div class="tcp-u-ce8d34db41">${_wrgFmt(s.h,1)}</div>
      </div>
    </div>
    ${sub ? `<div class="tcp-u-ae5b2fbadb">${sub}</div>` : ''}
  </div>`;
}

/* ══════════════════════════════════════════════════════
   WRG — WÄRMERÜCKGEWINNUNG (Plattenwärmetauscher)
   Physik: η_t = (T_ZL − T_AU) / (T_AB − T_AU)
   T_ZL  = T_AU + η · (T_AB − T_AU)
   T_FL  = T_AB − η · (T_AB − T_AU)   [bei gleichen Massenströmen]
   x_ZL  = x_AU, x_FL = x_AB          [sensibler Tauscher]
══════════════════════════════════════════════════════ */
function calcWRG() {
  const T_ab  = _n(_$('wrg-ab-t')?.value);
  const ph_ab = _n(_$('wrg-ab-phi')?.value);
  const T_au  = _n(_$('wrg-au-t')?.value);
  const ph_au = _n(_$('wrg-au-phi')?.value);
  const eta   = _n(_$('wrg-eta')?.value) / 100;

  const el = _$('wrg-result');
  if (!el) return;

  if ([T_ab, ph_ab, T_au, ph_au, eta].some(isNaN)) {
    el.innerHTML = '<p class="tcp-u-acdb0d58e9">Alle Felder ausfüllen →</p>';
    return;
  }
  if (eta < 0 || eta > 1) {
    el.innerHTML = '<p class="tcp-u-e58db81062">⚠ Wirkungsgrad: 0–100 %</p>';
    return;
  }

  // Quellzustände
  const x_ab = _x(T_ab, ph_ab);
  const h_ab = _h(T_ab, x_ab);
  const x_au = _x(T_au, ph_au);
  const h_au = _h(T_au, x_au);

  // Ergebnisse
  const T_zl  = +(T_au + eta * (T_ab - T_au)).toFixed(1);
  const x_zl  = x_au;
  const T_fl  = +(T_ab - eta * (T_ab - T_au)).toFixed(1);
  const x_fl  = x_ab;

  const s_ab = { T: T_ab, phi: ph_ab, x: x_ab, h: h_ab };
  const s_au = { T: T_au, phi: ph_au, x: x_au, h: h_au };
  const s_zl = { T: T_zl, phi: _phi(T_zl, x_zl), x: x_zl, h: _h(T_zl, x_zl) };
  const phi_fl_raw = _phi(T_fl, x_fl);
  const phi_fl = Math.min(100, phi_fl_raw); // max 100% (Sättigungsgrenze)
  const s_fl = { T: T_fl, phi: phi_fl, x: x_fl, h: _h(T_fl, x_fl) };

  const dQ_zl = +(s_zl.h - s_au.h).toFixed(1);
  const dT_zl = +(T_zl - T_au).toFixed(1);

  // Kondensatprüfung: Fortluft φ > 100% → Kondensatmenge berechnen
  const phi_fl_check = _phi(T_fl, x_ab);
  const kondensiert = phi_fl_check > 100;
  // Kondensat: Differenz zwischen eingehendem x_ab und gesättigtem x_sat(T_fl)
  const x_sat_fl = _x(T_fl, 100);
  const delta_x_kond = kondensiert ? +(x_ab - x_sat_fl).toFixed(2) : 0;
  // Kondensatmasse (bei bekanntem Massenstrom — hier pro kg Luft: g/kg → g/kg·h bei 1 kg/h)
  const kondText = kondensiert
    ? `<div class="tcp-u-ae2b902749">
         <div class="tcp-u-dc1cfcd22e">&#128167; Kondensat (Fortluft)</div>
         <div class="tcp-u-2cdbc20b67">
           Δx = ${_wrgFmt(delta_x_kond, 2)} g/kg
         </div>
         <div class="tcp-u-ba004f58f6">
           Fortluft wird gesättigt (φ=100%) · Restfeuchte kondensiert aus<br>
           Entwässerung im Tauscher erforderlich
         </div>
       </div>`
    : '';

  el.innerHTML = `
    <div class="tcp-u-c04cd4bef5">
      ${_stateBox('LS3 — Zuluft', s_zl, 'var(--heat-t)', 'Außenluft vorgewärmt')}
      ${_stateBox('LS4 — Fortluft', s_fl, 'var(--cold-t)', kondensiert ? '⚠ Kondensation!' : 'Abluft abgekühlt')}
    </div>
    ${kondText}
    <div class="tcp-u-47a9c51eb1">
      <div class="tcp-u-4b7625ce8b">Bilanz WRG</div>
      <div class="tcp-u-1839262f52">
        η<sub>t</sub> = ${_wrgFmt(eta*100,0)} %
        &emsp;ΔT<sub>ZL</sub> = +${_wrgFmt(dT_zl,1)} K
        &emsp;Δh<sub>ZL</sub> = +${_wrgFmt(dQ_zl,1)} kJ/kg
      </div>
      <div class="tcp-u-3cbb0a43f6">
        Plattenwärmetauscher (sensibel) · kein Feuchtigkeitstransfer
      </div>
    </div>`;
}

/* ══════════════════════════════════════════════════════
   MISCHLUFT — Massengewichtete Luftmischung
   x_M = (ṁ₁·x₁ + ṁ₂·x₂) / ṁ_M
   h_M = (ṁ₁·h₁ + ṁ₂·h₂) / ṁ_M
   T_M aus h_M, x_M: h = 1.006·T + x/1000·(2501+1.86·T)
══════════════════════════════════════════════════════ */
function calcMix() {
  const T1   = _n(_$('mix-ls1-t')?.value);
  const ph1  = _n(_$('mix-ls1-phi')?.value);
  const vol1 = _n(_$('mix-ls1-vol')?.value);
  const T2   = _n(_$('mix-ls2-t')?.value);
  const ph2  = _n(_$('mix-ls2-phi')?.value);
  const vol2 = _n(_$('mix-ls2-vol')?.value);

  const el = _$('mix-result');
  if (!el) return;

  if ([T1, ph1, vol1, T2, ph2, vol2].some(isNaN)) {
    el.innerHTML = '<p class="tcp-u-acdb0d58e9">Alle Felder ausfüllen →</p>';
    return;
  }

  const x1 = _x(T1, ph1), h1 = _h(T1, x1);
  const x2 = _x(T2, ph2), h2 = _h(T2, x2);

  // Massenströme für physikalisch korrekte Zustandsmischung
  const rho1 = _rho(T1), rho2 = _rho(T2);
  const m1   = vol1 * rho1;    // kg/h
  const m2   = vol2 * rho2;    // kg/h
  const mM   = m1 + m2;

  // Zustandsgrößen: massengewichtet (physikalisch korrekt)
  const xM = (m1 * x1 + m2 * x2) / mM;
  const hM = (m1 * h1 + m2 * h2) / mM;
  const TM = (hM - xM / 1000 * 2501) / (1.006 + xM / 1000 * 1.86);
  const phM = _phi(TM, xM);

  // Gesamtvolumenstrom: direkte Volumensumme (praxisüblich im HLK-Bereich)
  const volM = vol1 + vol2;
  const rhoM = _rho(TM); // für Anzeige

  const s1 = { T: T1, phi: ph1, x: x1, h: h1 };
  const s2 = { T: T2, phi: ph2, x: x2, h: h2 };
  const sM = { T: +TM.toFixed(1), phi: phM, x: +xM.toFixed(2), h: +hM.toFixed(1) };

  // Anteile nach Volumenstrom
  const a1 = (vol1 / volM * 100).toFixed(0);
  const a2 = (vol2 / volM * 100).toFixed(0);

  el.innerHTML = `
    <div class="tcp-u-4a98b82987">
      <div class="tcp-u-9a95220000">Gesamtvolumenstrom</div>
      <div class="tcp-u-82b9411816">
        ${_wrgFmt(volM,0)}<span class="tcp-u-22509a150a">m³/h</span>
      </div>
      <div class="tcp-u-f9a66af62d">
        ṁ = ${_wrgFmt(mM,0)} kg/h &nbsp;·&nbsp; LS1: ${a1}% &nbsp;/&nbsp; LS2: ${a2}%
      </div>
    </div>
    ${_stateBox('LS3 — Mischluft', sM, 'var(--grn)', '')}
    <div class="tcp-u-d73b77ec36">
      <div class="tcp-u-1e7146e489">Mischungsbilanz</div>
      <div class="tcp-u-88c55e3857">
        ṁ₁ = ${_wrgFmt(m1,0)} kg/h + ṁ₂ = ${_wrgFmt(m2,0)} kg/h = <strong class="tcp-u-a192177ada">${_wrgFmt(mM,0)} kg/h</strong>
      </div>
      <div class="tcp-u-78eb4a057c">
        V̇₁ = ${_wrgFmt(vol1,0)} m³/h + V̇₂ = ${_wrgFmt(vol2,0)} m³/h = <strong class="tcp-u-a192177ada">${_wrgFmt(volM,0)} m³/h</strong>
      </div>
    </div>`;
}

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', () => {
  const wrgIds = ['wrg-ab-t','wrg-ab-phi','wrg-au-t','wrg-au-phi','wrg-eta'];
  const mixIds = ['mix-ls1-t','mix-ls1-phi','mix-ls1-vol','mix-ls2-t','mix-ls2-phi','mix-ls2-vol'];
  wrgIds.forEach(id => {
    _$(id)?.addEventListener('input',  calcWRG);
    _$(id)?.addEventListener('change', calcWRG);
  });
  mixIds.forEach(id => {
    _$(id)?.addEventListener('input',  calcMix);
    _$(id)?.addEventListener('change', calcMix);
  });
  // Initial calc with default values (e.g. eta=70 is pre-filled)
  // Use setTimeout to ensure all other scripts have loaded
  setTimeout(() => { calcWRG(); calcMix(); }, 100);
});
