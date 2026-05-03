/* ═══════════════════════════════════════════════════════
   heating-cooling.js — TechCalc Pro
   RC7: robuste Heizung/Kälte-Bindung ohne Top-Level-Konflikte
   - Mediumwechsel aktualisiert cp / ρ / Frost sofort
   - Heizung/Kälte-Switcher über Inline-Brücke UND Event-Delegation
   - Berechnung startet bei Input/Change/Click zuverlässig
═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const show = (el, visible) => { if (el) el.classList.toggle('hidden', !visible); };
  const num = value => {
    const n = Number(String(value ?? '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };
  const loc = (value, digits) => Number(value || 0).toLocaleString('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });

  const FLUIDS = Object.freeze({
    water: { cp: 4.180, rho: 998,  frost: '',              label: 'Wasser' },
    eg25:  { cp: 3.870, rho: 1032, frost: 'bis −12 °C',    label: 'Ethylenglykol 25 %' },
    eg30:  { cp: 3.740, rho: 1038, frost: 'bis −16 °C',    label: 'Ethylenglykol 30 %' },
    eg35:  { cp: 3.620, rho: 1044, frost: 'bis −21 °C',    label: 'Ethylenglykol 35 %' },
    pg25:  { cp: 3.870, rho: 1024, frost: 'bis −10 °C',    label: 'Propylenglykol 25 %' },
    pg30:  { cp: 3.740, rho: 1030, frost: 'bis −13 °C',    label: 'Propylenglykol 30 %' },
    pg35:  { cp: 3.610, rho: 1037, frost: 'bis −18 °C',    label: 'Propylenglykol 35 %' }

  });

  /* ───────────────────────────────────────
     Lokale Rohrdimensionierung Heizung/Kälte
     Keine Abhängigkeit zum Rohr-Tab / pipe.js.
  ─────────────────────────────────────── */
  const HC_PIPES = [
    [ 15,  16.1, 21.3, 2.60, 'DIN EN 10255',  16.0,  18.0, 1.0],
    [ 20,  21.6, 26.9, 2.65, 'DIN EN 10255',  19.6,  22.0, 1.2],
    [ 25,  27.2, 33.7, 3.25, 'DIN EN 10255',  25.6,  28.0, 1.2],
    [ 32,  35.9, 42.4, 3.25, 'DIN EN 10255',  32.0,  35.0, 1.5],
    [ 40,  41.8, 48.3, 3.25, 'DIN EN 10255',  39.0,  42.0, 1.5],
    [ 50,  53.0, 60.3, 3.65, 'DIN EN 10255',  51.0,  54.0, 1.5],
    [ 65,  69.6, 76.1, 3.25, 'DIN EN 10220',  72.1,  76.1, 2.0],
    [ 80,  82.5, 88.9, 3.20, 'DIN EN 10220',  84.9,  88.9, 2.0],
    [100, 107.1,114.3, 3.60, 'DIN EN 10220', 104.0, 108.0, 2.0],
    [125, 131.7,139.7, 4.00, 'DIN EN 10220',  null,  null, null],
    [150, 155.8,168.3, 4.50, 'DIN EN 10220',  null,  null, null],
    [200, 203.1,219.1, 8.00, 'DIN EN 10220',  null,  null, null],
    [250, 254.5,273.0, 8.80, 'DIN EN 10220',  null,  null, null],
    [300, 303.1,323.9, 9.50, 'DIN EN 10220',  null,  null, null],
  ];
  const HC_PIPE_RHO = 983.2;
  const HC_PIPE_NU  = 0.474e-6;
  const HC_PIPE_ES  = 0.046e-3;
  const HC_PIPE_EM  = 0.015e-3;
  const HC_PIPE_DP0 = 100;
  const HC_MAPRESS_MAX_DN = 100;

  function hcLambdaCW(Re, eps, D) {
    if (Re < 1e-9) return 0;
    if (Re < 2300) return 64 / Re;
    let l = 0.25 / Math.pow(Math.log10(eps / (3.7 * D) + 5.74 / Math.pow(Re, 0.9)), 2);
    for (let i = 0; i < 40; i++) {
      const n = Math.pow(-2 * Math.log10(eps / (3.71 * D) + 2.51 / (Re * Math.sqrt(l))), -2);
      if (Math.abs(n - l) < 1e-11) { l = n; break; }
      l = n;
    }
    return l;
  }

  function hcPdrop(vol, diMm, eps) {
    if (!vol || !diMm) return { dp: 0, v: 0 };
    const D = diMm / 1000;
    const A = Math.PI * D * D / 4;
    const v = (vol / 3600) / A;
    const Re = v * D / HC_PIPE_NU;
    return { dp: hcLambdaCW(Re, eps, D) * HC_PIPE_RHO * v * v / (2 * D), v };
  }

  function hcPipeState(dp, mx) {
    return dp <= mx * 0.75 ? 'ok' : dp <= mx ? 'warn' : 'bad';
  }

  function hcPipePick(vol, mx, system) {
    if (system === 'mapress') {
      const idx = HC_PIPES.findIndex(p => p[5] !== null && hcPdrop(vol, p[5], HC_PIPE_EM).dp <= mx);
      const fallback = HC_PIPES.findIndex(p => p[0] === HC_MAPRESS_MAX_DN);
      return { pipe: HC_PIPES[idx < 0 ? fallback : idx], recommended: idx >= 0, system };
    }
    const idx = HC_PIPES.findIndex(p => hcPdrop(vol, p[1], HC_PIPE_ES).dp <= mx);
    return { pipe: HC_PIPES[idx < 0 ? HC_PIPES.length - 1 : idx], recommended: idx >= 0, system: 'steel' };
  }

  function hcPipeCard(data, vol, mx, variant) {
    const p = data.pipe;
    const isMapress = data.system === 'mapress';
    const di = isMapress ? p[5] : p[1];
    const da = isMapress ? p[6] : p[2];
    const wall = isMapress ? p[7] : p[3];
    const norm = isMapress ? 'Mapress Edelstahl' : p[4];

    if (isMapress && (p[0] > HC_MAPRESS_MAX_DN || di === null)) {
      return `<div class="pipe-card hc-pipe-card pipe-card--${variant} is-unavailable">
        <div class="hc-pipe-head"><span class="hc-pipe-system">Mapress Edelstahl</span></div>
        <div class="hc-pipe-dn">DN ${p[0]}</div>
        <div class="hc-pipe-grid"><div class="hc-pipe-muted">Nicht verfügbar</div><div class="hc-pipe-muted">max. DN ${HC_MAPRESS_MAX_DN}</div></div>
      </div>`;
    }

    const r = hcPdrop(vol, di, isMapress ? HC_PIPE_EM : HC_PIPE_ES);
    const stateName = hcPipeState(r.dp, mx);
    const dpTxt = r.dp < 10 ? r.dp.toFixed(1) : String(Math.round(r.dp));
    const cls = [
      'pipe-card','hc-pipe-card',`pipe-card--${variant}`,`pipe-card--${stateName}`,
      data.recommended ? 'is-recommended' : ''
    ].filter(Boolean).join(' ');
    const star = data.recommended ? '<span class="hc-pipe-star" aria-label="Empfohlen">★</span>' : '';

    return `<div class="${cls}">
      <div class="hc-pipe-head">
        <span class="hc-pipe-system">${norm}</span>
        ${star}
      </div>
      <div class="hc-pipe-dn">DN ${p[0]}</div>
      <div class="hc-pipe-grid">
        <div class="hc-pipe-label">Ø ${da} × ${wall} mm</div>
        <div class="hc-pipe-value">${dpTxt}<span> Pa/m</span></div>
        <div class="hc-pipe-label">dᵢ ${Number(di).toFixed(1)} mm</div>
        <div class="hc-pipe-value">${r.v.toFixed(2)}<span> m/s</span></div>
      </div>
    </div>`;
  }

  function hcPipeMaterialControls(prefix) {
    const cur = state[prefix]?.pipeMaterial || 'all';
    const items = [
      ['all', 'Alle'],
      ['steel', 'DIN EN 10220'],
      ['mapress', 'Mapress Edelstahl']
    ];
    return `<div class="hc-pipe-material" data-pipe-owner="${prefix}">
      ${items.map(([key, label]) => `<button type="button" class="hc-pipe-chip ${cur === key ? 'is-active' : ''}" data-hc-pipe-material="${key}" data-p="${prefix}">${label}</button>`).join('')}
    </div>`;
  }

  function renderHcPipePair(containerId, prefix, vol, mx, variant) {
    const el = $(containerId);
    if (!el) return;
    if (!vol) { el.innerHTML = ''; return; }

    const material = state[prefix]?.pipeMaterial || 'all';
    const cards = [];
    if (material === 'all' || material === 'steel') cards.push(hcPipeCard(hcPipePick(vol, mx, 'steel'), vol, mx, variant));
    if (material === 'all' || material === 'mapress') cards.push(hcPipeCard(hcPipePick(vol, mx, 'mapress'), vol, mx, variant));

    el.classList.toggle('pipe-pair--single', cards.length === 1);
    el.innerHTML = hcPipeMaterialControls(prefix) + `<div class="hc-pipe-card-grid">${cards.join('')}</div>`;
  }

  const state = {
    activePanel: 'h',
    h: { mode: 'ms', qUnit: 'W', pipeMaterial: 'all' },
    k: { mode: 'ms', qUnit: 'W', pipeMaterial: 'all' }
  };

  function fluid() {
    return FLUIDS[$('medium')?.value] || FLUIDS.water;
  }

  function syncFluidChips() {
    const f = fluid();
    const cp = $('cp-val');
    const rho = $('rho-val');
    const frostChip = $('frost-chip');
    const frostVal = $('frost-val');

    if (cp) cp.textContent = f.cp.toFixed(3);
    if (rho) rho.textContent = String(f.rho);
    if (frostChip) frostChip.classList.toggle('hidden', !f.frost);
    if (frostVal) frostVal.textContent = f.frost || '';
  }

  function updateLayout(prefix) {
    const mode = state[prefix]?.mode || 'ms';
    show($(prefix + '-ig-q'),  mode !== 'q');
    show($(prefix + '-ig-ms'), mode !== 'ms');
    show($(prefix + '-ig-dt'), mode !== 'dt');

    const label = $(prefix + '-dt-lbl');
    if (label) {
      const loadWord = prefix === 'h' ? 'Heizlast' : 'Kühllast';
      label.textContent = mode === 'ms'
        ? `ΔT — ${loadWord} [K]`
        : mode === 'q'
          ? 'ΔT — Massenstrom [K]'
          : 'ΔT [K]';
    }
  }

  function setQUnit(prefix, unit) {
    if (!state[prefix]) return;
    const normalized = unit === 'kW' ? 'kW' : 'W';
    state[prefix].qUnit = normalized;

    const input = $(prefix + '-q');
    const unitSpan = $(prefix + '-q-unit');
    const wBtn = $(prefix + '-wu');
    const kwBtn = $(prefix + '-kwu');

    if (input) {
      input.step = normalized === 'kW' ? '0.1' : '100';
      input.placeholder = normalized === 'kW' ? '0.00' : '0';
    }
    if (unitSpan) unitSpan.textContent = normalized;
    wBtn?.classList.toggle('active', normalized === 'W');
    kwBtn?.classList.toggle('active', normalized === 'kW');

    calcAll();
  }

  function setMode(prefix, mode) {
    if (!state[prefix] || !['ms', 'q', 'dt'].includes(mode)) return;
    state[prefix].mode = mode;
    document.querySelectorAll(`.mbtn[data-p="${prefix}"]`).forEach(btn => {
      btn.classList.toggle('active', btn.dataset.v === mode);
    });
    updateLayout(prefix);
    calcAll();
  }

  function flowSwitch(panel) {
    const active = panel === 'k' ? 'k' : 'h';
    state.activePanel = active;

    show($('flow-panel-h'), active === 'h');
    show($('flow-panel-k'), active === 'k');

    const hBtn = $('flow-btn-h');
    const kBtn = $('flow-btn-k');
    if (hBtn) {
      hBtn.classList.toggle('on-h', active === 'h');
      hBtn.classList.toggle('active', active === 'h');
      hBtn.setAttribute('aria-pressed', String(active === 'h'));
    }
    if (kBtn) {
      kBtn.classList.toggle('on-k', active === 'k');
      kBtn.classList.toggle('active', active === 'k');
      kBtn.setAttribute('aria-pressed', String(active === 'k'));
    }

    calcAll();
  }

  function panelResult(prefix) {
    const f = fluid();
    const cp = f.cp * 1000; // J/(kg·K)
    const rho = f.rho;
    const mode = state[prefix].mode;

    const qRaw = num($(prefix + '-q')?.value);
    const q = state[prefix].qUnit === 'kW' ? qRaw * 1000 : qRaw;
    const mhInput = num($(prefix + '-ms-in')?.value);
    const msInput = mhInput / 3600;
    const dtInput = num($(prefix + '-dt')?.value);

    let ms = 0;
    let qOut = 0;
    let dt = 0;
    let ok = false;

    if (mode === 'ms' && q > 0 && dtInput > 0) {
      ms = q / (cp * dtInput);
      qOut = q;
      dt = dtInput;
      ok = true;
    } else if (mode === 'q' && msInput > 0 && dtInput > 0) {
      ms = msInput;
      qOut = msInput * cp * dtInput;
      dt = dtInput;
      ok = true;
    } else if (mode === 'dt' && q > 0 && msInput > 0) {
      ms = msInput;
      qOut = q;
      dt = q / (msInput * cp);
      ok = true;
    }

    const mh = ms * 3600;
    return { ok, ms, mh, m3h: rho > 0 ? mh / rho : 0, q: qOut, dt };
  }

  function setOut(id, on, value) {
    const el = $(id);
    if (!el) return;
    let text = el.firstChild;
    if (!text || text.nodeType !== Node.TEXT_NODE) {
      text = document.createTextNode('');
      el.insertBefore(text, el.firstChild || null);
    }
    text.textContent = on ? value : '–';
    el.classList.toggle('has', !!on);
  }

  function setOutWithUnit(valueId, unitId, on, valueText, unitText) {
    setOut(valueId, on, valueText);
    const unit = $(unitId);
    if (unit) unit.textContent = unitText;
  }

  function setText(id, value) { const el = $(id); if (el) el.textContent = value; }

  function setMainValue(prefix, on, value, unit) {
    const el = $(prefix + '-main-val');
    if (!el) return;
    el.innerHTML = (on ? value : '–') + '<span id="' + prefix + '-main-unit"> ' + unit + '</span>';
    el.classList.toggle('has', !!on);
  }

  function renderLuftStyleResult(prefix, result) {
    const mode = state[prefix].mode;
    const qKw = result.ok ? result.q / 1000 : 0;
    setText(prefix + '-metric-kw', result.ok ? loc(qKw, 2) : '–');
    setText(prefix + '-metric-v', result.ok ? loc(result.m3h, 1) : '–');
    setText(prefix + '-metric-dt', result.ok ? loc(result.dt, 2) : '–');
    setText(prefix + '-metric-mh', result.ok ? loc(result.mh, 1) : '–');

    if (mode === 'ms') {
      setText(prefix + '-main-lbl', 'Volumenstrom V̇');
      setMainValue(prefix, result.ok, loc(result.m3h, 1), 'm³/h');
      setText(prefix + '-main-sub', result.ok ? loc(result.mh, 1) + ' kg/h' : '');
      return;
    }
    if (mode === 'q') {
      const unit = state[prefix].qUnit;
      const shownQ = unit === 'kW' ? result.q / 1000 : result.q;
      setText(prefix + '-main-lbl', 'Leistung Q');
      setMainValue(prefix, result.ok, loc(shownQ, unit === 'kW' ? 2 : 0), unit);
      setText(prefix + '-main-sub', result.ok ? loc(result.m3h, 1) + ' m³/h · ' + loc(result.mh, 1) + ' kg/h' : '');
      return;
    }
    setText(prefix + '-main-lbl', 'Temperaturdifferenz Δt');
    setMainValue(prefix, result.ok, loc(result.dt, 2), 'K');
    setText(prefix + '-main-sub', result.ok ? loc(qKw, 2) + ' kW · ' + loc(result.mh, 1) + ' kg/h' : '');
  }

  function renderResult(prefix, result) {
    const mode = state[prefix].mode;
    const key1 = $(prefix + '-out-key1');
    const key2 = $(prefix + '-out-key2');

    if (mode === 'ms') {
      if (key1) key1.textContent = 'kg/h';
      if (key2) key2.textContent = 'm³/h';
      setOutWithUnit(prefix + '-out-v1', prefix + '-out-u1', result.ok, loc(result.mh, 1), 'kg/h');
      setOutWithUnit(prefix + '-out-v2', prefix + '-out-u2', result.ok, loc(result.m3h, 1), 'm³/h');
      renderLuftStyleResult(prefix, result);
      return;
    }

    if (mode === 'q') {
      const unit = state[prefix].qUnit;
      const shownQ = unit === 'kW' ? result.q / 1000 : result.q;
      if (key1) key1.textContent = unit;
      if (key2) key2.textContent = 'kg/h';
      setOutWithUnit(prefix + '-out-v1', prefix + '-out-u1', result.ok, loc(shownQ, unit === 'kW' ? 2 : 0), unit);
      setOutWithUnit(prefix + '-out-v2', prefix + '-out-u2', result.ok, loc(result.mh, 1), 'kg/h');
      renderLuftStyleResult(prefix, result);
      return;
    }

    if (key1) key1.textContent = 'ΔT';
    if (key2) key2.textContent = 'kg/h';
    setOutWithUnit(prefix + '-out-v1', prefix + '-out-u1', result.ok, loc(result.dt, 2), 'K');
    setOutWithUnit(prefix + '-out-v2', prefix + '-out-u2', result.ok, loc(result.mh, 1), 'kg/h');
    renderLuftStyleResult(prefix, result);
  }

  function calcAll() {
    syncFluidChips();

    const h = panelResult('h');
    const k = panelResult('k');
    renderResult('h', h);
    renderResult('k', k);

    const title = $('out-card-slbl');
    if (title) {
      const same = state.h.mode === state.k.mode;
      title.textContent = same
        ? ({ ms: 'Ergebnis — Massenstrom', q: 'Ergebnis — Leistung', dt: 'Ergebnis — ΔT' }[state.h.mode] || 'Ergebnis')
        : 'Ergebnis';
    }

    const any = h.ok || k.ok;
    show($('pi-card'), any);
    show($('pi-placeholder'), !any);

    const dp0 = HC_PIPE_DP0;
    if (h.ok) {
      show($('pi-h'), true);
      const vol = $('pi-h-vol');
      if (vol) vol.textContent = `(${loc(h.m3h, 3)} m³/h)`;
      renderHcPipePair('pi-h-pair', 'h', h.m3h, dp0, 'heat');
    } else {
      show($('pi-h'), false);
    }

    if (k.ok) {
      show($('pi-k'), true);
      const vol = $('pi-k-vol');
      if (vol) vol.textContent = `(${loc(k.m3h, 3)} m³/h)`;
      renderHcPipePair('pi-k-pair', 'k', k.m3h, dp0, 'cool');
    } else {
      show($('pi-k'), false);
    }

    window.TCP_HC_LAST = { fluid: fluid(), h, k, state: JSON.parse(JSON.stringify(state)) };
  }

  function handleClick(ev) {
    const btn = ev.target?.closest?.('button');
    if (!btn) return;

    if (btn.dataset.hcPipeMaterial && btn.dataset.p) {
      ev.preventDefault();
      const p = btn.dataset.p;
      if (state[p]) {
        state[p].pipeMaterial = btn.dataset.hcPipeMaterial;
        calcAll();
      }
      return;
    }

    if (btn.id === 'flow-btn-h') { ev.preventDefault(); flowSwitch('h'); return; }
    if (btn.id === 'flow-btn-k') { ev.preventDefault(); flowSwitch('k'); return; }

    if (btn.classList.contains('mbtn') && btn.dataset.p && btn.dataset.v) {
      ev.preventDefault();
      setMode(btn.dataset.p, btn.dataset.v);
      return;
    }

    if (btn.id === 'h-wu') { ev.preventDefault(); setQUnit('h', 'W'); return; }
    if (btn.id === 'h-kwu') { ev.preventDefault(); setQUnit('h', 'kW'); return; }
    if (btn.id === 'k-wu') { ev.preventDefault(); setQUnit('k', 'W'); return; }
    if (btn.id === 'k-kwu') { ev.preventDefault(); setQUnit('k', 'kW'); }
  }

  function handleInput(ev) {
    const id = ev.target?.id || '';
    if (id === 'medium' || /^(h|k)-(q|ms-in|dt)$/.test(id)) calcAll();
  }

  function initHeatingCooling() {
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('input', handleInput, true);
    document.removeEventListener('change', handleInput, true);

    document.addEventListener('click', handleClick, true);
    document.addEventListener('input', handleInput, true);
    document.addEventListener('change', handleInput, true);

    updateLayout('h');
    updateLayout('k');
    setQUnit('h', state.h.qUnit);
    setQUnit('k', state.k.qUnit);
    flowSwitch(state.activePanel);
    calcAll();
  }

  window.TCP_HC = { state, fluid, calcAll, flowSwitch, setQUnit, setMode, init: initHeatingCooling, renderHcPipePair };
  window.calcAll = calcAll;
  window.flowSwitch = flowSwitch;
  window.setQUnit = setQUnit;
  window.initHeatingCooling = initHeatingCooling;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeatingCooling, { once: true });
  } else {
    initHeatingCooling();
  }
})();
