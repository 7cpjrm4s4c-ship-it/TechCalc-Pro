import React, { useState, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════
// DESIGN TOKENS & STYLES (embedded)
// ═══════════════════════════════════════════════════════════

const styles = `
:root {
  --color-bg-primary: #000000;
  --color-bg-secondary: #0a0a0a;
  --color-bg-tertiary: #141414;
  --color-glass-low: rgba(255, 255, 255, 0.04);
  --color-glass-mid: rgba(255, 255, 255, 0.08);
  --color-glass-high: rgba(255, 255, 255, 0.12);
  --color-heat: #ff6b35;
  --color-cold: #00c4e8;
  --color-air: #a78bfa;
  --color-ok: #34d399;
  --color-warn: #fbbf24;
  --color-danger: #ff453a;
  --color-text-primary: rgba(255, 255, 255, 0.95);
  --color-text-secondary: rgba(255, 255, 255, 0.65);
  --color-text-tertiary: rgba(255, 255, 255, 0.40);
  --color-text-disabled: rgba(255, 255, 255, 0.20);
  --color-border-soft: rgba(255, 255, 255, 0.06);
  --color-border-mid: rgba(255, 255, 255, 0.12);
  --color-border-strong: rgba(255, 255, 255, 0.20);
  
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  --gap-sm: 8px;
  --gap-md: 12px;
  --gap-lg: 16px;
  
  --pad-sm: 12px;
  --pad-md: 16px;
  --pad-lg: 20px;
  
  --font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-family-mono: 'SF Mono', Monaco, 'Roboto Mono', monospace;
  
  --text-xs: 11px;
  --text-sm: 13px;
  --text-base: 15px;
  --text-lg: 17px;
  --text-xl: 20px;
  --text-2xl: 24px;
  
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.10);
  
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

:root[data-theme="light"] {
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9f9f9;
  --color-text-primary: rgba(0, 0, 0, 0.95);
  --color-text-secondary: rgba(0, 0, 0, 0.65);
  --color-text-tertiary: rgba(0, 0, 0, 0.40);
  --color-border-soft: rgba(0, 0, 0, 0.06);
  --color-border-mid: rgba(0, 0, 0, 0.12);
}

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

body {
  min-height: 100dvh;
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family: var(--font-family-base);
  font-size: var(--text-base);
  line-height: 1.5;
  transition: background-color var(--transition-base);
}

#root {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.layout-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.layout-header {
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-border-soft);
  background-color: var(--color-bg-secondary);
  padding: var(--pad-md) var(--pad-lg);
}

.layout-nav {
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-border-soft);
  background-color: var(--color-bg-secondary);
  overflow-x: auto;
}

.layout-content {
  flex: 1;
  overflow-y: auto;
  background-color: var(--color-bg-primary);
  padding: var(--pad-lg);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--gap-lg);
}

@media (max-width: 767px) {
  .container {
    grid-template-columns: repeat(12, 1fr);
    gap: var(--gap-md);
  }
  .col-12 { grid-column: span 12; }
  .col-6 { grid-column: span 6; }
  .col-4 { grid-column: span 4; }
}

@media (min-width: 768px) {
  .col-tablet-6 { grid-column: span 6; }
  .col-tablet-8 { grid-column: span 8; }
}

@media (min-width: 1024px) {
  .col-desktop-6 { grid-column: span 6; }
  .col-desktop-7 { grid-column: span 7; }
  .col-desktop-8 { grid-column: span 8; }
}

.flex { display: flex; }
.flex-col { display: flex; flex-direction: column; }
.flex-between { display: flex; align-items: center; justify-content: space-between; }
.flex-center { display: flex; align-items: center; justify-content: center; }
.gap-sm { gap: var(--gap-sm); }
.gap-md { gap: var(--gap-md); }
.gap-lg { gap: var(--gap-lg); }
.items-center { align-items: center; }

.card {
  background: radial-gradient(circle at top left, rgba(30, 60, 120, 0.12), var(--color-glass-mid));
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-xl);
  padding: var(--pad-lg);
  backdrop-filter: blur(10px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), var(--shadow-md);
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
}

.card:hover {
  border-color: var(--color-border-mid);
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.08), var(--shadow-md);
}

.card-title {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-lg) 0;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: var(--gap-lg);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
}

.input-label {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.input,
.select {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--color-border-mid);
  border-radius: var(--radius-md);
  background-color: var(--color-glass-low);
  color: var(--color-text-primary);
  font-family: var(--font-family-base);
  font-size: var(--text-base);
  transition: background-color var(--transition-base), border-color var(--transition-base);
}

.input::placeholder { color: var(--color-text-tertiary); }

.input:hover,
.select:hover {
  border-color: var(--color-border-strong);
  background-color: var(--color-glass-mid);
}

.input:focus,
.select:focus {
  outline: none;
  border-color: #5b52ff;
  background-color: var(--color-glass-high);
  box-shadow: 0 0 0 3px rgba(91, 82, 255, 0.10);
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--gap-sm);
  padding: 10px 16px;
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-family-base);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  cursor: pointer;
  transition: all var(--transition-base);
  user-select: none;
}

.button-primary {
  background: linear-gradient(135deg, #5b52ff, #746cff);
  color: white;
  border: 1px solid transparent;
  box-shadow: 0 8px 16px rgba(91, 82, 255, 0.20);
}

.button-primary:hover {
  box-shadow: 0 12px 24px rgba(91, 82, 255, 0.30);
}

.button-primary:active {
  transform: translateY(1px);
}

.button-secondary {
  background: var(--color-glass-mid);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-mid);
}

.button-secondary:hover {
  background: var(--color-glass-high);
  border-color: var(--color-border-strong);
}

.button-sm { padding: 6px 12px; font-size: var(--text-xs); }
.button-lg { padding: 12px 24px; font-size: var(--text-base); }
.button-full { width: 100%; }
.button:disabled { opacity: 0.5; cursor: not-allowed; }

.result-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--gap-md);
  align-items: center;
  padding: var(--pad-md) 0;
  border-bottom: 1px solid var(--color-border-soft);
}

.result-row:last-child { border-bottom: none; }

.result-label {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.result-value {
  font-family: var(--font-family-mono);
  font-size: var(--text-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  white-space: nowrap;
}

.result-unit {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  margin-left: var(--space-xs);
}

.tabs {
  display: flex;
  gap: var(--gap-sm);
  border-bottom: 1px solid var(--color-border-soft);
  overflow-x: auto;
  padding: 0 var(--pad-lg);
}

.tab {
  padding: var(--pad-md) var(--pad-lg);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  transition: all var(--transition-base);
}

.tab:hover {
  color: var(--color-text-primary);
}

.tab.active {
  color: var(--color-text-primary);
  border-bottom-color: #5b52ff;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  white-space: nowrap;
}

.badge-danger {
  background: rgba(255, 69, 58, 0.15);
  color: var(--color-danger);
}

.badge-success {
  background: rgba(52, 211, 153, 0.15);
  color: var(--color-ok);
}

.badge-warn {
  background: rgba(251, 191, 36, 0.15);
  color: var(--color-warn);
}

.badge-heat {
  background: rgba(255, 107, 53, 0.15);
  color: var(--color-heat);
}

.badge-cold {
  background: rgba(0, 196, 232, 0.15);
  color: var(--color-cold);
}

.alert {
  padding: var(--pad-md);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.alert-error {
  background: rgba(255, 69, 58, 0.10);
  border: 1px solid rgba(255, 69, 58, 0.30);
  color: var(--color-danger);
}

.alert-warn {
  background: rgba(251, 191, 36, 0.10);
  border: 1px solid rgba(251, 191, 36, 0.30);
  color: var(--color-warn);
}

.alert-success {
  background: rgba(52, 211, 153, 0.10);
  border: 1px solid rgba(52, 211, 153, 0.30);
  color: var(--color-ok);
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border-mid);
  border-top-color: #5b52ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 767px) {
  .layout-header { padding: var(--pad-sm) var(--pad-md); }
  .layout-content { padding: var(--pad-md); }
  .card { padding: var(--pad-md); }
}
`;

// ═══════════════════════════════════════════════════════════
// REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════

function NumberInput({ label, value, onChange, unit = '', min = 0, step = 'any', hint = '' }) {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <div style={{ position: 'relative' }}>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          step={step}
          className="input"
          placeholder="0"
        />
        {unit && <span style={{
          position: 'absolute',
          right: 'var(--pad-md)',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--color-text-tertiary)',
          pointerEvents: 'none',
        }}>{unit}</span>}
      </div>
      {hint && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{hint}</div>}
    </div>
  );
}

function SelectInput({ label, value, onChange, options = [] }) {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="select">
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

function Card({ title, children, variant = 'default' }) {
  return (
    <div className="card">
      {title && <h2 className="card-title">{title}</h2>}
      <div className="card-body">{children}</div>
    </div>
  );
}

function ResultRow({ label, value, unit = '', accent = null }) {
  return (
    <div className="result-row">
      <div className="result-label">{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-xs)' }}>
        <span className="result-value" style={accent ? { color: `var(${accent})` } : {}}>
          {typeof value === 'number' ? value.toFixed(2) : value}
        </span>
        {unit && <span className="result-unit">{unit}</span>}
      </div>
    </div>
  );
}

function Button({ children, variant = 'primary', disabled = false, onClick = () => {}, style = {} }) {
  return (
    <button
      className={`button button-${variant} button-full`}
      disabled={disabled}
      onClick={onClick}
      style={style}
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════

const fmt = (v, d = 2) => {
  if (v == null || isNaN(v)) return '–';
  return Number(v).toFixed(d).replace('.', ',');
};

const parse = (v) => {
  if (v == null) return NaN;
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? NaN : n;
};

// ═══════════════════════════════════════════════════════════
// MAG MODULE (Druckhaltung)
// ═══════════════════════════════════════════════════════════

function MagModule() {
  const [VA, setVA] = useState('50');
  const [tMin, setTMin] = useState('10');
  const [tMax, setTMax] = useState('80');
  const [h, setH] = useState('10');
  const [pSV, setPSV] = useState('3');
  const [system, setSystem] = useState('heizung');
  const [medium, setMedium] = useState('water');
  
  const calc = () => {
    const VA_ = parse(VA);
    const tMin_ = parse(tMin);
    const tMax_ = parse(tMax);
    const h_ = parse(h);
    const pSV_ = parse(pSV);
    
    if ([VA_, tMin_, tMax_, h_, pSV_].some(isNaN)) return null;
    
    const pSys = h_ * 0.1 + 0.5;
    const e = Math.max(0, (tMax_ - tMin_) / 3000);
    const VE = VA_ * e;
    const reserve = Math.max(3, VA_ * 0.005);
    const p0 = Math.max(0.8, h_ * 0.1 + 0.3);
    const pe = Math.max(p0 + 0.5, pSV_ - 0.5);
    
    const VNmin = (VE + reserve) * ((pe + 1) / (pe - p0));
    const rec = Math.ceil(VNmin / 25) * 25;
    
    return { VE, reserve, VNmin, rec, p0, pSys, pe };
  };
  
  const result = calc();
  
  return (
    <>
      <div className="col-12 col-tablet-6">
        <Card title="Eingaben — Anlagenparameter">
          <SelectInput label="System" value={system} onChange={setSystem} options={[
            { value: 'heizung', label: 'Heizung' },
            { value: 'solar', label: 'Solar' },
            { value: 'kühlung', label: 'Kühlung' },
          ]} />
          <SelectInput label="Medium" value={medium} onChange={setMedium} options={[
            { value: 'water', label: 'Wasser' },
            { value: 'glycol25', label: 'Glykol 25%' },
            { value: 'glycol35', label: 'Glykol 35%' },
          ]} />
          <NumberInput label="Anlagenvolumen" value={VA} onChange={setVA} unit="l" />
          <NumberInput label="T min" value={tMin} onChange={setTMin} unit="°C" />
          <NumberInput label="T max" value={tMax} onChange={setTMax} unit="°C" />
          <NumberInput label="Geodät. Höhe" value={h} onChange={setH} unit="m" />
          <NumberInput label="Sicherheitsventil" value={pSV} onChange={setPSV} unit="bar" />
        </Card>
      </div>
      
      {result && (
        <div className="col-12 col-tablet-6">
          <Card title="Ergebnisse — Dimensionierung">
            <ResultRow label="Ausdehnungsvolumen" value={result.VE} unit="l" />
            <ResultRow label="Reserve (5%)" value={result.reserve} unit="l" />
            <ResultRow label="MAG-Größe min." value={result.VNmin} unit="l" />
            <ResultRow label="MAG empfohlen" value={result.rec} unit="l" accent="--color-ok" />
            <div style={{ marginTop: 'var(--space-lg)' }} className="alert alert-warn">
              ⚡ Vordruck: {fmt(result.p0, 1)} bar · Systemdruck: {fmt(result.pSys, 1)} bar
            </div>
            <div style={{ marginTop: 'var(--space-md)' }} className="alert alert-error">
              ⚠ Immer nach DIN EN 12828 auslegen. Dies ist ein Quick-Check.
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// VENTILATION MODULE (Lüftung)
// ═══════════════════════════════════════════════════════════

function VentilationModule() {
  const [mode, setMode] = useState('v'); // v, q, dt
  const [V, setV] = useState('500');
  const [Q, setQ] = useState('5000');
  const [tZL, setTZL] = useState('22');
  const [tR, setTR] = useState('20');
  const [hk, setHk] = useState('h'); // h = heating, k = cooling
  
  const calc = () => {
    const V_ = parse(V);
    const Q_ = parse(Q);
    const tZL_ = parse(tZL);
    const tR_ = parse(tR);
    
    const CP_AIR = 1005;
    const rho = 353.05 / ((tZL_ || 20) + 273.15);
    const dt = hk === 'h' ? tZL_ - tR_ : tR_ - tZL_;
    
    if (dt <= 0) return null;
    
    const fac = rho * CP_AIR / 3600;
    let result = {};
    
    if (mode === 'v' && !isNaN(Q_) && Q_ > 0) {
      result = { V: Q_ / (fac * dt), Q: Q_, dt };
    } else if (mode === 'q' && !isNaN(V_) && V_ > 0) {
      result = { V: V_, Q: V_ * fac * dt, dt };
    } else if (mode === 'dt' && !isNaN(V_) && !isNaN(Q_) && V_ > 0) {
      result = { V: V_, Q: Q_, dt: Q_ / (V_ * fac) };
    }
    
    return Object.keys(result).length > 0 ? { ...result, ms: result.V * rho } : null;
  };
  
  const result = calc();
  
  return (
    <>
      <div className="col-12 col-tablet-6">
        <Card title="Modus">
          <div className="tabs" style={{ borderBottom: 'none', padding: 0, marginBottom: 'var(--space-lg)' }}>
            {[
              { id: 'v', label: 'Volumenstrom', icon: '📊' },
              { id: 'q', label: 'Leistung', icon: '⚡' },
              { id: 'dt', label: 'Temperatur', icon: '🌡️' },
            ].map(m => (
              <button
                key={m.id}
                className={`tab ${mode === m.id ? 'active' : ''}`}
                onClick={() => setMode(m.id)}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </Card>
        
        <Card title="Eingaben">
          <div style={{ display: 'flex', gap: 'var(--gap-md)', marginBottom: 'var(--space-lg)' }}>
            <button
              className={`button button-sm ${hk === 'h' ? 'button-primary' : 'button-secondary'}`}
              onClick={() => setHk('h')}
              style={{ flex: 1 }}
            >
              🔥 Heizen
            </button>
            <button
              className={`button button-sm ${hk === 'k' ? 'button-primary' : 'button-secondary'}`}
              onClick={() => setHk('k')}
              style={{ flex: 1 }}
            >
              ❄️ Kühlen
            </button>
          </div>
          
          {mode !== 'v' && <NumberInput label="Volumenstrom" value={V} onChange={setV} unit="m³/h" />}
          {mode !== 'q' && <NumberInput label="Leistung" value={Q} onChange={setQ} unit="W" />}
          
          <NumberInput label={`Zuluft-Temperatur (${hk === 'h' ? 'Heiz' : 'Kühl'})`} value={tZL} onChange={setTZL} unit="°C" />
          <NumberInput label="Raumtemperatur" value={tR} onChange={setTR} unit="°C" />
        </Card>
      </div>
      
      {result && (
        <div className="col-12 col-tablet-6">
          <Card title="Ergebnisse">
            <ResultRow
              label="Volumenstrom"
              value={result.V}
              unit="m³/h"
              accent="--color-ok"
            />
            <ResultRow
              label="Leistung"
              value={result.Q / 1000}
              unit="kW"
              accent={hk === 'h' ? '--color-heat' : '--color-cold'}
            />
            <ResultRow
              label="Temperaturdifferenz"
              value={result.dt}
              unit="K"
            />
            <ResultRow
              label="Massenstrom"
              value={result.ms}
              unit="kg/h"
            />
          </Card>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// MINIMAL PLACEHOLDER MODULES
// ═══════════════════════════════════════════════════════════

function EntwaesserungModule() {
  return (
    <div className="col-12">
      <Card title="Entwässerung">
        <div className="alert alert-warn">
          ℹ️ Entwässerungs-Modul wird portiert. Schema: DU-Berechnung nach DIN EN 12056
        </div>
      </Card>
    </div>
  );
}

function WrgModule() {
  return (
    <div className="col-12">
      <Card title="WRG & Mischluft">
        <div className="alert alert-warn">
          ℹ️ WRG-Modul wird portiert. Plattenwärmetauscher & Luftmischung
        </div>
      </Card>
    </div>
  );
}

function TrinkwasserModule() {
  return (
    <div className="col-12">
      <Card title="Trinkwasser">
        <div className="alert alert-warn">
          ℹ️ Trinkwasser-Modul wird portiert. Bereitschaftsverluste & Volumenstrom
        </div>
      </Card>
    </div>
  );
}

function HeatingCoolingModule() {
  return (
    <div className="col-12">
      <Card title="Heizung & Kühlung">
        <div className="alert alert-warn">
          ℹ️ Heizung/Kühlung-Modul wird portiert. Schema: Q = ṁ × c × ΔT
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════

export default function App() {
  const [activeModule, setActiveModule] = useState('mag');
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('tc-theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('tc-theme', newTheme);
  };

  const modules = [
    { id: 'heating-cooling', label: 'Heizung / Kühlung', icon: '🔥' },
    { id: 'ventilation', label: 'Lüftung', icon: '💨' },
    { id: 'mag', label: 'MAG / Druckhaltung', icon: '⚙️' },
    { id: 'entwaesserung', label: 'Entwässerung', icon: '💧' },
    { id: 'wrg', label: 'WRG / Mischluft', icon: '❄️' },
    { id: 'trinkwasser', label: 'Trinkwasser', icon: '💦' },
  ];

  const renderModule = () => {
    switch (activeModule) {
      case 'heating-cooling':
        return <HeatingCoolingModule />;
      case 'ventilation':
        return <VentilationModule />;
      case 'mag':
        return <MagModule />;
      case 'entwaesserung':
        return <EntwaesserungModule />;
      case 'wrg':
        return <WrgModule />;
      case 'trinkwasser':
        return <TrinkwasserModule />;
      default:
        return <MagModule />;
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="layout-main">
        <header className="layout-header">
          <div className="flex-between" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="flex gap-md items-center">
              <h1 style={{
                margin: 0,
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                background: 'linear-gradient(135deg, #5b52ff, #746cff)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                TechCalc Pro
              </h1>
              <span style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-tertiary)',
                letterSpacing: '0.08em',
              }}>
                v2.0 · HLK-RECHNER
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className="button button-ghost button-sm"
              title="Theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        <nav className="layout-nav">
          <div className="tabs" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {modules.map(m => (
              <button
                key={m.id}
                className={`tab ${activeModule === m.id ? 'active' : ''}`}
                onClick={() => setActiveModule(m.id)}
              >
                <span>{m.icon}</span>
                <span style={{ marginLeft: 'var(--gap-sm)' }}>{m.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="layout-content">
          <div className="container">
            {renderModule()}
          </div>
        </div>
      </div>
    </>
  );
}
