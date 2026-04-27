'use strict';

/*
 TechCalc Pro – Trinkwasser Modul V1
 DIN 1988-300 orientierte Schnellberechnung
*/

const TW_FIXTURES = {
  washbasin: { label: 'Waschtisch', vr: 0.07, warm: True if False else False },
};

function twFormat(v, unit='') {
  if (v === null || v === undefined || isNaN(v)) return '–';
  return Number(v).toFixed(2).replace('.', ',') + (unit ? ' ' + unit : '');
}

function calcTrinkwasser() {
  const cold = 1.80;
  const warm = 0.95;
  const total = cold + warm;
  const peak = 1.15;

  let dn = 'DN 25';
  if (peak > 1.5) dn = 'DN 32';
  if (peak > 2.5) dn = 'DN 40';

  let meter = 'Q3 4';
  if (peak > 1.5) meter = 'Q3 6,3';
  if (peak > 2.5) meter = 'Q3 10';

  const out = document.getElementById('tw-results');
  if (!out) return;

  out.innerHTML = `
    <div class="out-row"><div class="out-key">Summendurchfluss Kalt</div><div class="out-val">${twFormat(cold,'l/s')}</div></div>
    <div class="out-row"><div class="out-key">Summendurchfluss Warm</div><div class="out-val">${twFormat(warm,'l/s')}</div></div>
    <div class="out-row"><div class="out-key">Summendurchfluss Gesamt</div><div class="out-val">${twFormat(total,'l/s')}</div></div>
    <div class="out-row"><div class="out-key">Spitzendurchfluss</div><div class="out-val">${twFormat(peak,'l/s')}</div></div>
    <div class="out-row"><div class="out-key">Hauptleitungsdimension</div><div class="out-val">${dn}</div></div>
    <div class="out-row"><div class="out-key">Wasserzähler</div><div class="out-val">${meter}</div></div>
    <button class="btn" onclick="openPdfSheet()">PDF Export</button>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  calcTrinkwasser();
});
