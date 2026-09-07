import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requiredFiles = [
  'js/framework/index.js',
  'js/framework/dataCatalog.js',
  'js/data/index.js',
  'js/data/catalog.js',
  'js/data/rainwater.js',
  'js/data/pipes.js',
  'js/data/refrigerants.js',
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
  '../data/index.js'
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

const dataCatalog = readProjectFile('js/data/catalog.js');
for (const expectedToken of [
  'defineDataCatalogEntry',
  'createDataCatalog',
  'dataCatalog',
  'rainwater.areaTypes',
  'pipes.systems',
  'refrigerants.items'
]) {
  if (!dataCatalog.includes(expectedToken)) {
    throw new Error(`Data catalog contract is missing ${expectedToken}`);
  }
}

const frameworkDataCatalog = readProjectFile('js/framework/dataCatalog.js');
if (!frameworkDataCatalog.includes("../data/catalog.js")) {
  throw new Error('Framework data catalog must delegate to js/data/catalog.js');
}

const contract = readProjectFile('docs/contracts/framework-kernel-contract.md');
for (const expectedSection of ['Public framework entry point', 'Central data path', 'Central responsibility paths', 'Module responsibility']) {
  if (!contract.includes(expectedSection)) {
    throw new Error(`Framework kernel contract is missing section: ${expectedSection}`);
  }
}

console.log('Framework kernel audit passed.');
