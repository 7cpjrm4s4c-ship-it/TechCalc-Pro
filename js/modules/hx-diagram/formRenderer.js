import { card, field, stack, grid, signedTempField } from '../../core/renderer.js';
import { fmtInput } from '../../utils/calculations.js';
import { renderProcessSelection, HX_DYNAMIC } from './renderPipeline.js';

export function renderHxInputCard(vm = {}) {
  const s = vm?.state || vm || {};
  return card('Luftzustand erfassen', stack([
    card('Ausgangszustand', grid([
      signedTempField('tempC', 'Trockenkugeltemperatur θt', fmtInput(s.tempC, 2), 'data-hx-sign'),
      field({ id: 'rhPercent', label: 'Relative Feuchte φ', unit: '%', value: fmtInput(s.rhPercent, 2) })
    ].join(''), 2), 'cyan', { compact: true }),
    card('Zielzustand', grid([
      signedTempField('targetTempC', 'Zieltemperatur θt', fmtInput(s.targetTempC, 2), 'data-hx-sign'),
      field({ id: 'targetRhPercent', label: 'Relative Zielfeuchte φ', unit: '%', value: fmtInput(s.targetRhPercent, 2) })
    ].join(''), 2), 'cyan', { compact: true }),
    `<div data-hx-dynamic="${HX_DYNAMIC.process}">${renderProcessSelection(vm)}</div>`,
    '<div class="tc-actions"><button type="button" class="tc-action tc-action--ghost" data-platform-focus data-tc-action="hx:clear" data-hx-clear>Diagramm leeren</button></div>'
  ].join('')), 'cyan');
}

export default renderHxInputCard;
