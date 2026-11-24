import config from './config.js';
import { card, renderModuleShell, stack } from '../../core/ui/renderer.js';
import { calculate } from './logic.js';
import { createPressureHoldingViewModel } from './viewModel.js';
import { field, selectField, segmented, grid } from '../../core/ui/renderer.js';
import { formatNumber, parseNumber } from '../../core/engineering/numberService.js';

export function view(s){
  const r = calculate(s);
  const vm = createPressureHoldingViewModel(s, r);
  const inputColumn = stack([
    card('Berechnungsart', `<div data-ph-dynamic="basis">${vm.basisHtml}</div>`, 'purple'),
    card(vm.holdingOptionsTitle, `<div data-ph-dynamic="holding-options">${vm.holdingOptionsHtml}</div>`, 'purple'),
    card('Anlagenvolumen', `<div data-ph-dynamic="volume-fields">${vm.volumeFieldsHtml}</div>`, 'purple'),
    card('Temperaturen / Stoffwerte', `<div data-ph-dynamic="temperature-fields">${vm.temperatureFieldsHtml}</div>`, 'purple'),
    card('Druckdaten', `<div data-ph-dynamic="pressure-fields">${vm.pressureFieldsHtml}</div>`, 'purple'),
    card('Zubehör', `<div data-ph-dynamic="accessories">${renderAccessoriesFields(s)}</div>`, 'purple'),
    `<div class="tc-module-section" data-ph-dynamic="saved-records">${vm.savedRecordsHtml}</div>`
  ].join(''));

  return renderModuleShell(config, `<div class="tc-module-layout tc-module-layout--2"><div class="tc-module-column">${inputColumn}</div><div class="tc-module-column"><div class="tc-module-section" data-ph-dynamic="result">${vm.resultHtml}</div></div></div>`);
}

const opts = (items) => items.map(([value,label]) => ({ value, label }));
function fmtInput(value, digits = 2) {
  if (value === '' || value === null || value === undefined) return '';
  const parsed = parseNumber(value, { fallback: 0 });
  if (!parsed) return String(value);
  return formatNumber(parsed, { fallback: String(value), maximumFractionDigits: digits });
}

function renderAccessoriesFields(s) {
  // Entgasung
  const degasationFields = [
    segmented('useServitec', opts([['true','Ja'],['false','Nein']]), s.useServitec || 'true', { accent:'blue', label:'Servitec verwenden' }),
    s.useServitec === 'true' ? selectField({ 
      id:'servitecType', 
      label:'Servitec-Typ', 
      value:s.servitecType || 'auto',
      options:opts([
        ['auto','Automatik'],
        ['mini','Servitec Mini'],
        ['s','Servitec S'],
        ['35','Servitec 35'],
        ['60','Servitec 60'],
        ['75','Servitec 75'],
        ['95','Servitec 95'],
        ['120t','Servitec 120 T']
      ])
    }) : ''
  ].filter(Boolean);

  // Nachspeisung
  const feedFields = [
    segmented('feedType', opts([['manual','Manuell'],['auto','Automatisch']]), s.feedType || 'manual', { accent:'blue', label:'Nachspeisung' }),
    field({ id:'feedPressureBar', label:'Fließdruck vor Nachspeisung', value:fmtInput(s.feedPressureBar,2), unit:'bar' }),
    selectField({ 
      id:'systemSeparation', 
      label:'Systemtrennung', 
      value:s.systemSeparation || 'systemSeparator',
      options:opts([
        ['systemSeparator','DVGW-geprüfter Systemtrenner'],
        ['networkSeparator','Netztrennbehälter']
      ])
    }),
    field({ id:'feedLineLengthM', label:'Länge Nachspeiseleitung', value:fmtInput(s.feedLineLengthM,2), unit:'m' })
  ];

  // Wasseraufbereitung
  const waterTreatmentFields = [
    selectField({ 
      id:'waterTreatmentMethod', 
      label:'Verfahren', 
      value:s.waterTreatmentMethod || 'softening',
      options:opts([
        ['softening','Enthärtung'],
        ['desalination','Entsalzung']
      ])
    }),
    field({ id:'regionalWaterHardness', label:'regionale Gesamtwasserhärte GHst', value:fmtInput(s.regionalWaterHardness,1), unit:'°dH' })
  ];

  // Sicherheitsventil
  const safetyValveFields = [
    selectField({ 
      id:'safetyValveConnection', 
      label:'Sicherheitsventil-Anschluss', 
      value:s.safetyValveConnection || '',
      options:opts([
        ['05','G ½"'],
        ['075','G ¾"'],
        ['1','G 1"'],
        ['125','G 1¼"'],
        ['15','G 1½"'],
        ['2','G 2"']
      ])
    })
  ];

  return stack([
    `<h4>Entgasung</h4>${grid(degasationFields.join(''), 2)}`,
    `<h4>Nachspeisung</h4>${grid(feedFields.join(''), 2)}`,
    `<h4>Wasseraufbereitung</h4>${grid(waterTreatmentFields.join(''), 2)}`,
    `<h4>Sicherheitsventil</h4>${grid(safetyValveFields.join(''), 2)}`
  ].join(''));
}

export { renderAccessoriesFields };
export default view;
