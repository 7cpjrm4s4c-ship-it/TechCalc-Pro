import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requiredFiles = [
  'js/framework/index.js',
  'js/framework/dataCatalog.js',
  'docs/contracts/framework-kernel-contract.md',
  'docs/architecture/ADR-0020-internal-neutral-framework.md'
];

const requiredFrameworkExports = [
  '../core/moduleDefinition.js',
  '../core/moduleContract.js',
  '../core/registry.js',
  '../core/moduleRuntime.js',
  '../core/formSchema.js',
  '../core/schemaRenderer.js',
  '../core/resultRenderer.js',
  '../core/numberService.js',
  '../core/savedRecords.js',
  '../core/pdfExport.js',
  '../platform/moduleRuntime/index.js',
  './dataCatalog.js'
];

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

for (const relativePath of requiredFiles) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    throw new Error(`Missing framework kernel file: ${relativePath}`);
  }
}

const frameworkIndex = readProjectFile('js/framework/index.js');
for (const expectedExport of requiredFrameworkExports) {
  if (!frameworkIndex.includes(expectedExport)) {
    throw new Error(`Framework kernel entry point does not export ${expectedExport}`);
  }
}

if (frameworkIndex.includes('../modules/')) {
  throw new Error('Framework kernel entry point must not import modules');
}

const dataCatalog = readProjectFile('js/framework/dataCatalog.js');
for (const expectedToken of [
  'defineDataCatalogEntry',
  'createDataCatalog',
  'frameworkDataCatalog',
  'rainwater.areaTypes',
  'pipes.systems',
  'refrigerants.items'
]) {
  if (!dataCatalog.includes(expectedToken)) {
    throw new Error(`Data catalog contract is missing ${expectedToken}`);
  }
}

const contract = readProjectFile('docs/contracts/framework-kernel-contract.md');
for (const expectedSection of ['Public entry point', 'Data catalog contract', 'Module responsibility']) {
  if (!contract.includes(expectedSection)) {
    throw new Error(`Framework kernel contract is missing section: ${expectedSection}`);
  }
}

console.log('Framework kernel audit passed.');
