import { fmt } from '../../utils/calculations.js';

export function modeLabel(mode){
  if(mode === 'defrost') return 'Wärmepumpe / Abtauung';
  if(mode === 'reserve') return 'Wasservorlage';
  if(mode === 'compare') return 'Vergleich / maßgebend';
  return 'Mindestlaufzeit';
}

export function mediumLabel(s){
  if(s.mediumMode === 'water') return 'Wasser';
  const name = s.glycolType === 'propylene' ? 'Propylenglykol' : 'Ethylenglykol';
  return `${name} ${s.glycolConcentration} %`;
}

function valueOrDash(value, digits = 1){
  return Number.isFinite(Number(value)) && Number(value) > 0 ? fmt(value, digits) : '—';
}

export function buildBufferStorageResultModel(s, r, accent = 'cyan'){
  const warnings = Array.isArray(r?.warnings) ? r.warnings : [];
  const primaryValue = Number(r?.decisiveVolume) > 0 ? fmt(r.decisiveVolume, 1) : '—';
  const primaryUnit = Number(r?.decisiveVolume) > 0 ? 'Liter' : '';

  return {
    primary: {
      title: 'Ergebnis Pufferspeicher',
      primary: {
        label: 'Erforderliches Pufferspeichervolumen',
        value: primaryValue,
        unit: primaryUnit
      },
      rows: [
        { label: 'Nächstes Normvolumen', value: Number(r?.nextStandardVolume) > 0 ? fmt(r.nextStandardVolume, 0) : '—', unit: Number(r?.nextStandardVolume) > 0 ? 'Liter' : '' },
        { label: 'Berechnungsart', value: modeLabel(s.calculationMode) },
        { label: 'Medium / Faktor', value: `${mediumLabel(s)} / ${fmt(r?.factor || 0, 2)}` },
        { label: 'minimaler Systeminhalt', value: fmt(r?.decisiveSystemVolume || 0, 1), unit: 'Liter' }
      ],
      accent
    },
    groups: [
      {
        title: 'Zwischenergebnisse',
        rows: [
          { label: 'Leistungsanteil Mindestlaufzeit', value: fmt(r?.runtimePower || 0, 2), unit: 'kW' },
          { label: 'Systeminhalt Mindestlaufzeit', value: fmt(r?.runtimeSystemVolume || 0, 1), unit: 'Liter' },
          { label: 'Puffervolumen Mindestlaufzeit', value: fmt(r?.runtimeBufferVolume || 0, 1), unit: 'Liter' },
          { label: 'Leistungsbilanz Abtauung', value: fmt(r?.defrostPower || 0, 2), unit: 'kW' },
          { label: 'Systeminhalt Abtauung', value: fmt(r?.defrostSystemVolume || 0, 1), unit: 'Liter' },
          { label: 'Puffervolumen Abtauung', value: fmt(r?.defrostBufferVolume || 0, 1), unit: 'Liter' },
          { label: 'Wasservorlage', value: fmt(r?.reserveVolume || 0, 1), unit: 'Liter' },
          { label: 'abgezogener Systeminhalt', value: fmt(r?.existingSystemVolume || 0, 1), unit: 'Liter' }
        ],
        accent
      },
      {
        title: 'Formeln',
        html: [
          '<div class="formula tc-formula ph-formula">V = ((QMax × Teillast − QLast) × Faktor × TLaufzeit) / ΔTHydraulik</div>',
          '<div class="formula tc-formula ph-formula">VAbtau = ((QVerbraucher + QKälte − QHeiz) × Faktor × TMaxAbtauung) / ΔTHydraulik</div>',
          '<div class="formula tc-formula ph-formula">VWasservorlage = V̇Verbraucher × tÜberbrückung × 1000 / 60</div>'
        ].join(''),
        accent
      }
    ],
    notices: warnings.length ? [{ title: 'Plausibilität', messages: warnings, accent, prefix: 'Hinweis' }] : [{ title: 'Plausibilität', messages: ['Keine Plausibilitätswarnungen.'], accent, prefix: 'Status' }]
  };
}

export default buildBufferStorageResultModel;
