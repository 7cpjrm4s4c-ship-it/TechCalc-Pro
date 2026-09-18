import { card, field, stack, grid, signedTempField } from '../../core/renderer.js';
import { formatNumber, parseNumber } from '../../core/numberService.js';
import { renderProcessSelection, HX_DYNAMIC } from './renderPipeline.js';

const fmtInput = (value, digits = 2) => {
  if (value === '' || value === null || value === undefined) return '';
  const n = parseNumber(value, { fallback: 0 });
  if (!n) return String(value);
  return formatNumber(n, { maximumFractionDigits: digits });
};

export function renderHxInputCard(vm = {}) {
  const s = vm?.state || vm || {};
  return card('Luftzustand erfassen', stack([
    card('Ausgangszustand', grid([
      field({ id: 'airVolumeM3h', label: 'Luftmenge', unit: 'm³/h', value: fmtInput(s.airVolumeM3h, 2) }),
      signedTempField('tempC', 'Trockenkugeltemperatur θt', fmtInput(s.tempC, 2), 'data-hx-sign'),
      field({ id: 'rhPercent', label: 'Relative Feuchte φ', unit: '%', value: fmtInput(s.rhPercent, 2) })
    ].join(''), 2), 'cyan', { compact: true }),
    card('Zielzustand', grid([
      signedTempField('targetTempC', 'Zieltemperatur θt', fmtInput(s.targetTempC, 2), 'data-hx-sign'),
      field({ id: 'targetRhPercent', label: 'Relative Zielfeuchte φ', unit: '%', value: fmtInput(s.targetRhPercent, 2) })
    ].join(''), 2), 'cyan', { compact: true }),
    card('Systemtemperaturen', stack([
      grid([
        signedTempField('heatingSupplyTempC', 'Heizung Vorlauf', fmtInput(s.heatingSupplyTempC, 2), 'data-hx-sign'),
        signedTempField('heatingReturnTempC', 'Heizung Rücklauf', fmtInput(s.heatingReturnTempC, 2), 'data-hx-sign')
      ].join(''), 2),
      grid([
        signedTempField('coolingSupplyTempC', 'Kühlung Vorlauf', fmtInput(s.coolingSupplyTempC, 2), 'data-hx-sign'),
        signedTempField('coolingReturnTempC', 'Kühlung Rücklauf', fmtInput(s.coolingReturnTempC, 2), 'data-hx-sign')
      ].join(''), 2)
    ].join('')), 'cyan', { compact: true }),
    `<div data-hx-dynamic="${HX_DYNAMIC.process}">${renderProcessSelection(vm)}</div>`,
    '<div class="tc-actions"><button type="button" class="tc-action" data-platform-focus data-tc-action="hx:clear" data-hx-clear>Diagramm leeren</button></div>'
  ].join('')), 'cyan');
}

export default renderHxInputCard;
