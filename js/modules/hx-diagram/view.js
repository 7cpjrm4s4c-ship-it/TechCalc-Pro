import config from './config.js';
import { PROCESS_OPTIONS } from './logic.js';
import { createViewModel } from './viewModel.js';
import { renderHxResultModel } from './results.js';
import { hxProcessCard } from './controller.js';
import { chartCard } from './diagramRenderer.js';
import { card, field, renderModuleShell, stack, grid, esc, signedTempField } from '../../core/renderer.js';
import { fmtInput } from '../../utils/calculations.js';
import { parseNumber } from '../../core/numberService.js';

function availableProcesses(s) {
  const t0 = parseNumber(s.tempC, { fallback: 0 });
  const t1 = parseNumber(s.targetTempC, { fallback: 0 });
  if (t0 < t1) return PROCESS_OPTIONS.filter(option => !['cool', 'cool-dehumidify'].includes(option.value));
  if (t0 > t1) return PROCESS_OPTIONS.filter(option => ['cool', 'cool-dehumidify'].includes(option.value));
  return PROCESS_OPTIONS;
}

function processCard(s) {
  const options = availableProcesses(s);
  return card('Luftbehandlung wählen', `<div class="hx-process-grid">
    ${options.map(option => `<button type="button" data-segment="process" data-value="${esc(option.value)}" class="hx-process ${option.value === s.process ? 'is-active' : ''}">${esc(option.label)}</button>`).join('')}
  </div>`, 'cyan', { compact: true });
}

function inputCard(s) {
  return card('Luftzustand erfassen', stack([    card('Ausgangszustand', grid([
      signedTempField('tempC', 'Trockenkugeltemperatur θt', fmtInput(s.tempC, 2), 'data-hx-sign'),
      field({ id: 'rhPercent', label: 'Relative Feuchte φ', unit: '%', value: fmtInput(s.rhPercent, 2) })
    ].join(''), 2), 'cyan', { compact: true }),
    card('Zielzustand', grid([
      signedTempField('targetTempC', 'Zieltemperatur θt', fmtInput(s.targetTempC, 2), 'data-hx-sign'),
      field({ id: 'targetRhPercent', label: 'Relative Zielfeuchte φ', unit: '%', value: fmtInput(s.targetRhPercent, 2) })
    ].join(''), 2), 'cyan', { compact: true }),
    processCard(s),
    `<div class="tc-actions"><button type="button" class="tc-action tc-action--ghost" data-hx-clear>Diagramm leeren</button></div>`
  ].join('')), 'cyan');
}

export function renderView(s) {
  const vm = createViewModel(s);
  const body = `<div class="hx-layout">
    <div class="hx-layout__left">${stack([inputCard(s), renderHxResultModel(vm), hxProcessCard(vm.state)].join(''))}</div>
    <div class="hx-layout__right">${chartCard(vm.activePath, vm.targetReached)}</div>
  </div>`;
  return renderModuleShell(config, `<div class="span-12">${body}</div>`);
}
