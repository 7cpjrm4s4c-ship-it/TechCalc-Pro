/**
 * TechCalc Pro - MAG / Druckhaltung v2 PRO
 */

function calcMAGPro(container) {
  if (!container) return;
  const volume = window.parseNum(document.getElementById('mag-volume')?.value) || 0;
  const tmin = window.parseNum(document.getElementById('mag-tmin')?.value) || 10;
  const tmax = window.parseNum(document.getElementById('mag-tmax')?.value) || 70;
  const h = window.parseNum(document.getElementById('mag-height')?.value) || 0;
  const sv = window.parseNum(document.getElementById('mag-sv')?.value) || 3;

  if (volume <= 0) return;

  let Ve = volume * (tmax - tmin) * 0.0003;
  let psys = h * 0.1 + 1;
  let p0 = psys - 0.5;
  let pe = sv - 0.5;
  let Vn = (Ve + (volume * 0.03)) * (pe + 1) / (pe - p0);

  let result = document.getElementById('mag-result');
  if (result) {
    result.innerHTML = `
      <div class="out-grid">
        <div class="ob">
          <div class="ob-title">Ausdehnungsvolumen</div>
          <div class="out-row">
            <div class="out-key">l</div>
            <div class="out-val"><span class="out-num">${window.loc(Ve, 1)}</span><span class="u">l</span></div>
          </div>
        </div>
        <div class="ob">
          <div class="ob-title">Mindest-MAG Volumen</div>
          <div class="out-row">
            <div class="out-key">l</div>
            <div class="out-val"><span class="out-num">${window.loc(Vn, 1)}</span><span class="u">l</span></div>
          </div>
        </div>
        <div class="ob">
          <div class="ob-title">Vordruck</div>
          <div class="out-row">
            <div class="out-key">bar</div>
            <div class="out-val"><span class="out-num">${window.loc(p0, 2)}</span><span class="u">bar</span></div>
          </div>
        </div>
      </div>
    `;
  }
}

function buildMAGUI() {
  const container = window.$('mag-section');
  if (!container) return;

  let html = `
    <div class="tab-inner">
      <div class="mag-desktop-left">
        <div class="gc">
          <div class="slbl">MAG / Druckhaltung</div>
          
          <div class="igrp">
            <div class="ilbl">Anlagenvolumen</div>
            <div class="iwrap">
              <input class="inp" id="mag-volume" type="number" min="0" step="10" placeholder="z.B. 850" inputmode="decimal"/>
              <span class="iunit">l</span>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--gap-s)">
            <div class="igrp">
              <div class="ilbl">Min. Temperatur</div>
              <div class="iwrap">
                <input class="inp-sm" id="mag-tmin" type="number" step="1" value="10" inputmode="decimal"/>
                <span class="iunit">°C</span>
              </div>
            </div>
            <div class="igrp">
              <div class="ilbl">Max. Temperatur</div>
              <div class="iwrap">
                <input class="inp-sm" id="mag-tmax" type="number" step="1" value="70" inputmode="decimal"/>
                <span class="iunit">°C</span>
              </div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--gap-s)">
            <div class="igrp">
              <div class="ilbl">Statische Höhe</div>
              <div class="iwrap">
                <input class="inp-sm" id="mag-height" type="number" min="0" step="0.5" placeholder="12" inputmode="decimal"/>
                <span class="iunit">m</span>
              </div>
            </div>
            <div class="igrp">
              <div class="ilbl">Sicherheitsventil</div>
              <div class="iwrap">
                <input class="inp-sm" id="mag-sv" type="number" min="1" step="0.5" value="3" inputmode="decimal"/>
                <span class="iunit">bar</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mag-desktop-right">
        <div class="out-card">
          <div class="slbl">Ergebnis — MAG / Druckhaltung</div>
          <div id="mag-result">
            <p style="color:var(--t3);font-size:12px;text-align:center;padding:12px 0">Anlagenvolumen eingeben →</p>
          </div>
        </div>

        <div class="fml">
          V<sub>e</sub> = V<sub>A</sub> · e &ensp;·&ensp; V<sub>N</sub> = (V<sub>e</sub> + V<sub>WV</sub>) · (p<sub>e</sub> + 1) / (p<sub>e</sub> − p<sub>0</sub>)
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
  console.log('✅ MAG v2 PRO initialized');
}

function initMAG() {
  buildMAGUI();
  const inputs = document.querySelectorAll('#mag-volume, #mag-tmin, #mag-tmax, #mag-height, #mag-sv');
  inputs.forEach(input => {
    input.addEventListener('input', calcMAGPro);
    input.addEventListener('change', calcMAGPro);
  });

  calcMAGPro();
}

document.addEventListener('DOMContentLoaded', initMAG);

window.calcMAGPro = calcMAGPro;
