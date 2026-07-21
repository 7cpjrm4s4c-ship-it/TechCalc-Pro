import fs from 'node:fs';
import path from 'node:path';

const modulePath = fileName => path.join('js', 'modules', 'heating-cooling', fileName);
const controller = fs.readFileSync(modulePath('controller.js'), 'utf8');
const view = fs.readFileSync(modulePath('view.js'), 'utf8');
const viewModel = fs.readFileSync(modulePath('viewModel.js'), 'utf8');
const viewModelImport = `import { inputFields } from '${['.', 'viewModel.js'].join('/')}';`;

if (controller.includes("from '../../core/renderer.js'")) {
  throw new Error('controller.js must not import renderer primitives after 18D.2');
}

if (/function\s+(massFlowField|powerField)\b/.test(controller) || /export\s+function\s+inputFields\b/.test(controller)) {
  throw new Error('field composition must live in viewModel.js, not controller.js');
}

if (!view.includes(viewModelImport)) {
  throw new Error('view.js must import inputFields from viewModel.js');
}

for (const symbol of ['massFlowField', 'powerField', 'inputFields']) {
  if (!viewModel.includes(symbol)) throw new Error(`viewModel.js missing ${symbol}`);
}

console.log('heating-cooling phase18d2 viewmodel split regression ok');
