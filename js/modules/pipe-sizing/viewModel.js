import { field, selectField, stack } from '../../core/renderer.js';
import { renderResultModel } from '../../platform/resultRenderer/index.js';
import { pipeSystems } from '../../utils/pipes.js';
import { buildPipeSizingResultModel } from './results.js';
import { pipeSaveCard } from './controller.js';

export function inputContent(s) {
  return stack([
    selectField({ id: 'systemId', label: 'Rohrsystem', value: s.systemId, options: pipeSystems.map(p => ({ value: p.id, label: p.label })) }),
    field({ id: 'maxPressurePam', label: 'Max. Druckverlust', unit: 'Pa/m', value: s.maxPressurePam }),
    field({
      id: 'flowValue',
      label: 'Massenstrom / Volumenstrom',
      unit: s.flowUnit || 'kg/h',
      unitField: 'flowUnit',
      unitOptions: [
        { value: 'kg/h', label: 'kg/h' },
        { value: 'm³/h', label: 'm³/h' }
      ],
      value: s.flowValue || s.massFlowKgh || s.volumeFlowM3h || ''
    })
  ].join(''));
}

export function savedRecordsContent(s) {
  return pipeSaveCard(s);
}

export function resultContent(s, r) {
  return renderResultModel(buildPipeSizingResultModel(s, r, 'blue'), 'blue');
}

export function createPipeSizingViewModel(s, r) {
  return {
    inputHtml: inputContent(s),
    savedRecordsHtml: savedRecordsContent(s),
    resultHtml: resultContent(s, r)
  };
}
