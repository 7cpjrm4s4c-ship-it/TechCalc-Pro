/**
 * TechCalc Pro - Trinkwasser v2 PRO
 */

function calcTWPro(container) {
  if (!container) return;

  let coldSum = 0;
  let warmSum = 0;
  const neItems = document.querySelectorAll('.tw-ne-item');

  neItems.forEach(item => {
    const inputs = item.querySelectorAll('input[type="number"]');
    if (inputs.length >= 2) {
      coldSum += window.parseNum(inputs[0]?.value) || 0;
      warmSum += window.parseNum(inputs[1]?.value) || 0;
    }
  });

  let totalSum = coldSum + warmSum;
  let peakFlow = totalSum * 1.3;

  let result = document.getElementById('tw-result');
  if (result) {
    result.innerHTML = `
      <div class="out-grid">
        <div class="ob">
          <div class="ob-title">Summendurchfluss kalt</div>
          <div class="out-row">
            <div class="out-key">l/min</div>
            <div class="out-val"><span class="out-num">${window.loc(coldSum, 1)}</span><span class="u">l/min</span></div>
          </div>
        </div>
        <div class="ob">
          <div class="ob-title">Summendurchfluss warm</div>
          <div class="out-row">
            <div class="out-key">l/min</div>
            <div class="out-val"><span class="out-num">${window.loc(warmSum, 1)}</span><span class="u">l/min</span></div>
          </div>
        </div>
        <div class="ob">
          <div class="ob-title">Summendurchfluss gesamt</div>
          <div class="out-row">
            <div class="out-key">l/min</div>
            <div class="out-val"><span class="out-num">${window.loc(totalSum, 1)}</span><span class="u">l/min</span></div>
          </div>
        </div>
        <div class="ob">
          <div class="ob-title">Spitzendurchfluss</div>
          <div class="out-row">
            <div class="out-key">l/min</div>
            <div class="out-val"><span class="out-num">${window.loc(peakFlow, 1)}</span><span class="u">l/min</span></div>
          </div>
        </div>
      </div>
    `;
  }
}

function buildTWUI() {
  const container = window.$('tw-section');
  if (!container) return;

  let html = `
    <div class="tab-inner">
      <div class="tw-desktop-left">
        <div class="gc">
          <div class="slbl">Trinkwasser — Basisdaten</div>
          
          <div class="igrp">
            <div class="ilbl">Gebäudetyp / Nutzungsart</div>
            <select class="gl-sel" id="tw-building">
              <option value="wohn">Wohngebäude</option>
              <option value="hotel">Hotel / Beherbergung</option>
              <option value="verw">Verwaltung / Büro</option>
              <option value="schule">Schule / Sportstätte</option>
              <option value="pflege">Pflege / Krankenhaus</option>
            </select>
          </div>

          <div class="igrp" style="margin-bottom:0">
            <div class="ilbl">Warmwasserbereitung</div>
            <select class="gl-sel" id="tw-ww-mode">
              <option value="zentral">zentral</option>
              <option value="dezentral">dezentral / Durchlauferhitzer</option>
            </select>
          </div>
        </div>

        <div class="gc">
          <div class="slbl">Nutzungseinheiten</div>
          <div id="tw-ne-list">
            <div class="tw-ne-item" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;align-items:end;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--gb-soft)">
              <div style="font-size:12px;color:var(--t3)">Bad</div>
              <div class="iwrap" style="margin:0">
                <input class="inp-sm" type="number" value="1.5" min="0" step="0.5" inputmode="decimal" placeholder="kalt"/>
              </div>
              <div class="iwrap" style="margin:0">
                <input class="inp-sm" type="number" value="2.0" min="0" step="0.5" inputmode="decimal" placeholder="warm"/>
              </div>
            </div>
            <div class="tw-ne-item" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;align-items:end;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--gb-soft)">
              <div style="font-size:12px;color:var(--t3)">Küche</div>
              <div class="iwrap" style="margin:0">
                <input class="inp-sm" type="number" value="0.5" min="0" step="0.5" inputmode="decimal" placeholder="kalt"/>
              </div>
              <div class="iwrap" style="margin:0">
                <input class="inp-sm" type="number" value="1.2" min="0" step="0.5" inputmode="decimal" placeholder="warm"/>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="tw-desktop-right">
        <div class="out-card">
          <div class="slbl">Ergebnis — Trinkwasser</div>
          <div id="tw-result">
            <p style="color:var(--t3);font-size:12px;text-align:center;padding:12px 0">Nutzungseinheiten eingeben →</p>
          </div>
        </div>

        <div class="fml">
          V<sub>S</sub> = a · (ΣV<sub>R</sub>)<sup>b</sup> − c &ensp;·&ensp; DIN 1988-300 orientierte Schnellberechnung
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
  console.log('✅ Trinkwasser v2 PRO initialized');
}

function initTW() {
  buildTWUI();
  const inputs = document.querySelectorAll('#tw-section input[type="number"]');
  inputs.forEach(input => {
    input.addEventListener('input', calcTWPro);
    input.addEventListener('change', calcTWPro);
  });

  calcTWPro();
}

document.addEventListener('DOMContentLoaded', initTW);

window.calcTWPro = calcTWPro;
