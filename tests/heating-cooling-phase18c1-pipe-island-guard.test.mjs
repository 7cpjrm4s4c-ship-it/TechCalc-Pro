import assert from 'node:assert/strict';
import { createHeatingCoolingDynamicRenderer } from '../js/platform/dynamicRenderer/index.js';

function makeElement(name) {
  return {
    name,
    innerHTML: '',
    value: '',
    dataset: {},
    classList: { add(){}, remove(){}, toggle(){} },
    setAttribute(){},
    closest(selector) {
      if (selector.includes('#primaryNav') || selector.includes('.module-nav') || selector.includes('#overflowMenu')) return null;
      if (selector.includes('.card')) return { classList: this.classList, querySelector: () => null };
      return null;
    },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
}

const nav = makeElement('nav');
nav.innerHTML = '<button>Heizung</button>';

const pipeIsland = makeElement('pipe-recommendation');
pipeIsland.innerHTML = '<div>old pipe</div>';
const mediumIsland = makeElement('medium-stats');
mediumIsland.innerHTML = '<div>old medium</div>';
const resultIsland = makeElement('result');
resultIsland.innerHTML = '<div>old result</div>';
const pipeSelect = makeElement('pipe-select');
pipeSelect.value = 'steel';

const root = {
  __tcHeatingCoolingDynamic: {
    mode: 'heating',
    prefix: 'heating',
    calcTarget: 'power',
    massFlowUnit: 'kg/h',
    mediumId: 'water',
    pipeSystemId: 'steel'
  },
  querySelector(selector) {
    if (selector === '[data-hc-dynamic="pipe-recommendation"]') return pipeIsland;
    if (selector === '[data-hc-dynamic="medium-stats"]') return mediumIsland;
    if (selector === '[data-hc-dynamic="result"]') return resultIsland;
    if (selector === '[data-field="pipeSystemId"]') return pipeSelect;
    return null;
  },
  querySelectorAll() { return []; }
};

const renderer = createHeatingCoolingDynamicRenderer({
  calculate: active => ({ active, pipe: { dn: 20 } }),
  activeCalculationState: s => ({ calcTarget: 'power', massFlowUnit: 'kg/h', powerW: '', massFlowKgh: '', deltaT: '10' }),
  prefixFor: () => 'heating',
  key: (_s, name) => `heating${name}`,
  activeValue: () => '',
  activeMassFlowUnit: () => 'kg/h',
  formatMassFlowInput: () => '',
  fmtInput: value => String(value ?? ''),
  renderResult: () => '<div>new result</div>',
  renderFormula: () => '<div>new formula</div>',
  renderMediumStats: () => '<div>new medium</div>',
  renderModeSegment: () => '<div>mode</div>',
  renderTargetSegment: () => '<div>target</div>',
  renderInputFields: () => '<div>inputs</div>',
  renderPipeRecommendation: (_s, r) => `<div>new pipe ${r.pipe.dn}</div>`,
  lineSectionController: { updateControls(){ throw new Error('line controls must not update on pipe-only changes'); }, renderRows(){ return ''; } }
});

renderer.update(root, { mode: 'heating', mediumId: 'water', pipeSystemId: 'copper' }, { action: 'field:change', changed: ['pipeSystemId'] });

assert.equal(nav.innerHTML, '<button>Heizung</button>', 'global navigation must not be touched by pipeSystemId changes');
assert.equal(pipeIsland.innerHTML, '<div>new pipe 20</div>', 'pipe recommendation island should update');
assert.equal(mediumIsland.innerHTML, '<div>old medium</div>', 'medium island should not update on pipe-only changes');
assert.equal(resultIsland.innerHTML, '<div>old result</div>', 'result island should not update on pipe-only changes');
assert.equal(pipeSelect.value, 'copper', 'pipe select value should stay in sync');
console.log('heating-cooling phase18c1 pipe island guard passed');
