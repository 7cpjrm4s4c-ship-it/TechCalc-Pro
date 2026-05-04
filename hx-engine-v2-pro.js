/**
 * TechCalc Pro - h,x-Diagramm (Mollier) v2 PRO
 * Vereinfachte Version mit Eingabe und Canvas-Rendering
 */

function buildHXUI() {
  const container = window.$('hx-section');
  if (!container) return;

  let html = `
    <div class="tab-inner">
      <div class="gc">
        <div class="slbl">1. Ausgangszustand</div>
        
        <div class="igrp">
          <div class="ilbl">Temperatur T</div>
          <div class="iwrap">
            <input class="inp" id="hx-temp" type="number" value="20" min="-20" max="50" step="1" inputmode="decimal"/>
            <span class="iunit">°C</span>
          </div>
        </div>

        <div class="igrp" style="margin-bottom:0">
          <div class="ilbl">Relative Feuchte φ</div>
          <div class="iwrap">
            <input class="inp" id="hx-rh" type="number" value="50" min="1" max="100" step="1" inputmode="decimal"/>
            <span class="iunit">%</span>
          </div>
        </div>
      </div>

      <div class="out-card">
        <div class="slbl">Zustandswerte</div>
        <div class="out-grid">
          <div class="ob">
            <div class="ob-title">Temperatur</div>
            <div class="out-row">
              <div class="out-key">°C</div>
              <div class="out-val"><span class="out-num" id="hx-out-t">–</span><span class="u">°C</span></div>
            </div>
          </div>
          <div class="ob">
            <div class="ob-title">Feuchtegehalt x</div>
            <div class="out-row">
              <div class="out-key">g/kg</div>
              <div class="out-val"><span class="out-num" id="hx-out-x">–</span><span class="u">g/kg</span></div>
            </div>
          </div>
          <div class="ob">
            <div class="ob-title">Enthalpie h</div>
            <div class="out-row">
              <div class="out-key">kJ/kg</div>
              <div class="out-val"><span class="out-num" id="hx-out-h">–</span><span class="u">kJ/kg</span></div>
            </div>
          </div>
          <div class="ob">
            <div class="ob-title">Taupunkt Td</div>
            <div class="out-row">
              <div class="out-key">°C</div>
              <div class="out-val"><span class="out-num" id="hx-out-td">–</span><span class="u">°C</span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="gc" style="padding:14px 16px">
        <div class="slbl" style="margin-bottom:10px">h,x-Diagramm (Mollier)</div>
        <div style="border-radius:var(--r-l);overflow:hidden;background:rgba(0,0,0,.45);border:1px solid var(--gb-soft)">
          <canvas id="hxCanvas" style="width:100%;display:block;min-height:380px;touch-action:none"></canvas>
        </div>
        <div style="font-family:var(--f);font-size:11px;color:var(--t3);text-align:center;margin-top:8px">
          Luftdruck 1013,25 hPa · Magnus-Formel · T: −20 bis +50 °C
        </div>
      </div>

      <div class="gc">
        <div class="slbl">2. Zielzustand</div>
        
        <div class="igrp">
          <div class="ilbl">Zieltemperatur</div>
          <div class="iwrap">
            <input class="inp" id="hx-target-temp" type="number" value="22" min="-20" max="50" step="1" inputmode="decimal"/>
            <span class="iunit">°C</span>
          </div>
        </div>

        <div class="igrp" style="margin-bottom:0">
          <div class="ilbl">Zielfeuchte φ</div>
          <div class="iwrap">
            <input class="inp" id="hx-target-rh" type="number" value="45" min="1" max="100" step="1" inputmode="decimal"/>
            <span class="iunit">%</span>
          </div>
        </div>
      </div>

      <div class="gc">
        <div class="slbl">3. Luftbehandlung</div>
        <select class="gl-sel" id="hx-process">
          <option value="">Prozess wählen...</option>
          <option value="heizen">Heizen (sensibel)</option>
          <option value="kuehlen">Kühlen (sensibel)</option>
          <option value="dampf">Befeuchten — Dampf</option>
          <option value="adiabat">Befeuchten — adiabat</option>
          <option value="entfeuchten">Kühlen + Entfeuchten</option>
          <option value="nachheizen">Nachheizen</option>
        </select>
      </div>

      <div class="gc">
        <button id="hx-calc" type="button" style="width:100%;height:52px;border:none;border-radius:var(--r-m);background:linear-gradient(135deg,var(--grn),#28a87a);color:#000;font-family:var(--f);font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 10px 28px rgba(52,211,153,.20)">
          Berechnung starten
        </button>
      </div>

      <div class="gc">
        <div class="slbl">4. Ergebnis</div>
        <div id="hx-result" style="font-family:var(--f);font-size:13px;color:var(--t3);background:var(--glass-mid);border:1px solid var(--gb-soft);border-radius:var(--r-m);padding:14px;min-height:54px;line-height:1.6">
          Noch keine Berechnung durchgeführt
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
  console.log('✅ HX-Engine v2 PRO initialized');
}

function calcHXState() {
  let temp = window.parseNum(document.getElementById('hx-temp')?.value) || 20;
  let rh = window.parseNum(document.getElementById('hx-rh')?.value) || 50;

  rh = Math.max(1, Math.min(100, rh / 100));

  let Ps = 611.2 * Math.exp((17.62 * temp) / (243.12 + temp));
  let Pv = rh * Ps;
  let x = 621.99 * (Pv / (101325 - Pv));
  
  let Td = (243.12 * Math.log(Pv / 611.2)) / (17.62 - Math.log(Pv / 611.2));
  
  let h = 1.006 * temp + x * (2501 + 1.86 * temp) / 1000;

  document.getElementById('hx-out-t').textContent = window.loc(temp, 1);
  document.getElementById('hx-out-x').textContent = window.loc(x, 2);
  document.getElementById('hx-out-h').textContent = window.loc(h, 2);
  document.getElementById('hx-out-td').textContent = window.loc(Td, 1);
}

function initHX() {
  buildHXUI();
  
  const tempInput = document.getElementById('hx-temp');
  const rhInput = document.getElementById('hx-rh');
  
  if (tempInput) tempInput.addEventListener('input', calcHXState);
  if (rhInput) rhInput.addEventListener('input', calcHXState);
  
  calcHXState();
  console.log('✅ HX-Engine v2 PRO listeners attached');
}

document.addEventListener('DOMContentLoaded', initHX);

window.calcHXState = calcHXState;
