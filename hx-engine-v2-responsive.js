function calcHXStateResponsive(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let temp = window.parseNum(container.querySelector('#hx-temp')?.value) || 20;
  let rh = window.parseNum(container.querySelector('#hx-rh')?.value) || 50;

  rh = Math.max(1, Math.min(100, rh / 100));

  let Ps = 611.2 * Math.exp((17.62 * temp) / (243.12 + temp));
  let Pv = rh * Ps;
  let x = 621.99 * (Pv / (101325 - Pv));
  
  let Td = (243.12 * Math.log(Pv / 611.2)) / (17.62 - Math.log(Pv / 611.2));
  
  let h = 1.006 * temp + x * (2501 + 1.86 * temp) / 1000;

  container.querySelector('#hx-out-t').textContent = window.loc(temp, 1);
  container.querySelector('#hx-out-x').textContent = window.loc(x, 2);
  container.querySelector('#hx-out-h').textContent = window.loc(h, 2);
  container.querySelector('#hx-out-td').textContent = window.loc(Td, 1);
}

function buildHXDesktopUI() {
  const container = window.$('hx-section');
  if (!container) return;

  let html = `
    <div class="tab-inner">
      <div class="hx-desktop-left">
        <div class="gc">
          <div class="slbl">1. Ausgangszustand</div>
          
          <div class="igrp">
            <div class="ilbl">Temperatur T</div>
            <div class="iwrap">
              <input class="inp hx-input" id="hx-temp" type="number" value="20" min="-20" max="50" step="1" inputmode="decimal"/>
              <span class="iunit">°C</span>
            </div>
          </div>

          <div class="igrp" style="margin-bottom:0">
            <div class="ilbl">Relative Feuchte φ</div>
            <div class="iwrap">
              <input class="inp hx-input" id="hx-rh" type="number" value="50" min="1" max="100" step="1" inputmode="decimal"/>
              <span class="iunit">%</span>
            </div>
          </div>
        </div>

        <div class="gc">
          <div class="slbl">2. Zielzustand</div>
          
          <div class="igrp">
            <div class="ilbl">Zieltemperatur</div>
            <div class="iwrap">
              <input class="inp hx-input" id="hx-target-temp" type="number" value="22" min="-20" max="50" step="1" inputmode="decimal"/>
              <span class="iunit">°C</span>
            </div>
          </div>

          <div class="igrp" style="margin-bottom:0">
            <div class="ilbl">Zielfeuchte φ</div>
            <div class="iwrap">
              <input class="inp hx-input" id="hx-target-rh" type="number" value="45" min="1" max="100" step="1" inputmode="decimal"/>
              <span class="iunit">%</span>
            </div>
          </div>
        </div>

        <div class="gc">
          <div class="slbl">3. Luftbehandlung</div>
          <select class="gl-sel hx-input" id="hx-process">
            <option value="">Prozess wählen...</option>
            <option value="heizen">Heizen (sensibel)</option>
            <option value="kuehlen">Kühlen (sensibel)</option>
            <option value="dampf">Befeuchten — Dampf</option>
            <option value="adiabat">Befeuchten — adiabat</option>
            <option value="entfeuchten">Kühlen + Entfeuchten</option>
            <option value="nachheizen">Nachheizen</option>
          </select>
        </div>
      </div>

      <div class="hx-desktop-right">
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
            <canvas id="hxCanvas" style="width:100%;display:block;min-height:300px;touch-action:none"></canvas>
          </div>
          <div style="font-family:var(--f);font-size:11px;color:var(--t3);text-align:center;margin-top:8px">
            Luftdruck 1013,25 hPa · Magnus-Formel · T: −20 bis +50 °C
          </div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function buildHXMobileUI() {
  const container = window.$('mobile-hx');
  if (!container) return;

  let html = `
    <div class="mobile-module-screen">
      <div class="gc">
        <div class="slbl">1. Ausgangszustand</div>
        
        <div class="igrp">
          <div class="ilbl">Temperatur T</div>
          <div class="iwrap">
            <input class="inp hx-input" id="hx-temp" type="number" value="20" min="-20" max="50" step="1" inputmode="decimal"/>
            <span class="iunit">°C</span>
          </div>
        </div>

        <div class="igrp" style="margin-bottom:0">
          <div class="ilbl">Relative Feuchte φ</div>
          <div class="iwrap">
            <input class="inp hx-input" id="hx-rh" type="number" value="50" min="1" max="100" step="1" inputmode="decimal"/>
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
          <canvas id="hxCanvas-mobile" style="width:100%;display:block;min-height:300px;touch-action:none"></canvas>
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
            <input class="inp hx-input" id="hx-target-temp" type="number" value="22" min="-20" max="50" step="1" inputmode="decimal"/>
            <span class="iunit">°C</span>
          </div>
        </div>

        <div class="igrp" style="margin-bottom:0">
          <div class="ilbl">Zielfeuchte φ</div>
          <div class="iwrap">
            <input class="inp hx-input" id="hx-target-rh" type="number" value="45" min="1" max="100" step="1" inputmode="decimal"/>
            <span class="iunit">%</span>
          </div>
        </div>
      </div>

      <div class="gc">
        <div class="slbl">3. Luftbehandlung</div>
        <select class="gl-sel hx-input" id="hx-process">
          <option value="">Prozess wählen...</option>
          <option value="heizen">Heizen (sensibel)</option>
          <option value="kuehlen">Kühlen (sensibel)</option>
          <option value="dampf">Befeuchten — Dampf</option>
          <option value="adiabat">Befeuchten — adiabat</option>
          <option value="entfeuchten">Kühlen + Entfeuchten</option>
          <option value="nachheizen">Nachheizen</option>
        </select>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function initHX() {
  buildHXDesktopUI();
  let desktop = window.$('hx-section');
  if (desktop) {
    const tempInput = desktop.querySelector('#hx-temp');
    const rhInput = desktop.querySelector('#hx-rh');
    if (tempInput) tempInput.addEventListener('input', () => calcHXStateResponsive('hx-section'));
    if (rhInput) rhInput.addEventListener('input', () => calcHXStateResponsive('hx-section'));
    calcHXStateResponsive('hx-section');
  }

  buildHXMobileUI();
  let mobile = window.$('mobile-hx');
  if (mobile) {
    const tempInput = mobile.querySelector('#hx-temp');
    const rhInput = mobile.querySelector('#hx-rh');
    if (tempInput) tempInput.addEventListener('input', () => calcHXStateResponsive('mobile-hx'));
    if (rhInput) rhInput.addEventListener('input', () => calcHXStateResponsive('mobile-hx'));
    calcHXStateResponsive('mobile-hx');
  }

  console.log('✅ HX-Engine v2 RESPONSIVE initialized');
}

document.addEventListener('DOMContentLoaded', initHX);

window.calcHXStateResponsive = calcHXStateResponsive;
