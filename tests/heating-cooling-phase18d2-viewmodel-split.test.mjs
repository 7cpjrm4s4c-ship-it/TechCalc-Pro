import fs from 'node:fs';

const controller = fs.readFileSync('js/modules/heating-cooling/controller.js', 'utf8');
const view = fs.readFileSync('js/modules/heating-cooling/view.js', 'utf8');
const viewModel = fs.readFileSync('js/modules/heating-cooling/viewModel.js', 'utf8');

if (controller.includes("from '../../core/renderer.js'")) {
  throw new Error('controller.js must not import renderer primitives after 18D.2');
}

if (/function\s+(massFlowField|powerField)\b/.test(controller) || /export\s+function\s+inputFields\b/.test(controller)) {
  throw new Error('field composition must live in viewModel.js, not controller.js');
}

if (!view.includes("import { inputFields } from './viewModel.js';")) {
  throw new Error('view.js must import inputFields from viewModel.js');
}

for (const symbol of ['massFlowField', 'powerField', 'inputFields']) {
  if (!viewModel.includes(symbol)) throw new Error(`viewModel.js missing ${symbol}`);
}

console.log('heating-cooling phase18d2 viewmodel split regression ok');
