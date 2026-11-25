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
  // Switches: Servitec, Nachspeisung, Wasseraufbereitung (in derselben Zeile mit gleicher Höhe)
  const switchFields = [
    segmented('useServitec', opts([['true','Ja'],['false','Nein']]), s.useServitec || 'true', { accent:'blue', label:'Servitec verwenden' }),
    segmented('feedType', opts([['manual','Manuell'],['auto','Automatisch']]), s.feedType || 'manual', { accent:'blue', label:'Nachspeisung' }),
    selectField({ 
      id:'waterTreatmentMethod', 
      label:'Wasseraufbereitung', 
      value:s.waterTreatmentMethod || 'softening',
      options:opts([
        ['softening','Enthärtung'],
        ['desalination','Entsalzung']
      ])
    })
  ];

  // Nachspeisung Eingabefelder
  const feedInputFields = [
    field({ id:'feedPressureBar', label:'Fließdruck vor Nachspeisung', value:fmtInput(s.feedPressureBar,2), unit:'bar' }),
    field({ id:'feedLineLengthM', label:'Länge Nachspeiseleitung', value:fmtInput(s.feedLineLengthM,2), unit:'m' }),
    selectField({ 
      id:'systemSeparation', 
      label:'Systemtrennung', 
      value:s.systemSeparation || 'systemSeparator',
      options:opts([
        ['systemSeparator','DVGW-geprüfter Systemtrenner'],
        ['networkSeparator','Netztrennbehälter']
      ])
    })
  ];

  // Wasseraufbereitung Eingabefelder
  const waterTreatmentInputFields = [
    field({ id:'regionalWaterHardness', label:'regionale Gesamtwasserhärte GHst', value:fmtInput(s.regionalWaterHardness,1), unit:'°dH' })
  ];

  return stack([
    `<h4>Zubehör</h4>`,
    grid(switchFields.join(''), 3),
    `<h4>Nachspeisung Details</h4>${grid(feedInputFields.join(''), 2)}`,
    `<h4>Wasseraufbereitung Details</h4>${grid(waterTreatmentInputFields.join(''), 2)}`
  ].join(''));
}

export { renderAccessoriesFields };
export default view;
