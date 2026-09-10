import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const requiredFiles = [
  'js/core/index.js',
  'js/core/appCore.js',
  'js/core/contracts/index.js',
  'js/core/data/index.js',
  'js/core/data/catalog.js',
  'js/core/data/rainwater.js',
  'js/core/data/pipes.js',
  'js/core/data/refrigerants.js',
  'js/core/events/index.js',
  'js/core/pdf/index.js',
  'js/core/runtime/index.js',
  'js/core/state/index.js',
  'js/core/storage/index.js',
  'js/core/styles/index.js',
  'js/core/ui/index.js',
  'js/core/ux/index.js',
  'js/framework/index.js',
  'js/framework/dataCatalog.js',
  'js/data/index.js',
  'js/data/catalog.js',
  'docs/contracts/framework-kernel-contract.md',
  'docs/architecture/ADR-0020-internal-neutral-framework.md'
];

const requiredCoreAreas = ['contracts', 'data', 'events', 'pdf', 'runtime', 'state', 'storage', 'styles', 'ui', 'ux'];
const requiredCoreExports = [
  './appCore.js',
  './contracts/index.js',
  './data/index.js',
  './events/index.js',
  './pdf/index.js',
  './runtime/index.js',
  './state/index.js',
  './storage/index.js',
  './styles/index.js',
  './ui/index.js',
  './ux/index.js'
];

const forbiddenReferenceModuleImports = ['../../platform/', '../../shared/', '../../utils/'];

const referenceModules = [
  moduleGuard('unit-converter', [], [], [
    required('unit-converter/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js', '../../core/numberService.js']),
    required('unit-converter/logic.js', ['../../core/data/index.js']),
    required('unit-converter/results.js', ['../../core/data/index.js', '../../core/numberService.js']),
    required('unit-converter/schema.js', ['../../core/formSchema.js']),
    required('unit-converter/view.js', ['../../core/renderer.js']),
    required('unit-converter/viewModel.js', ['../../core/renderer.js', '../../core/resultRenderer.js', '../../core/data/index.js', '../../core/numberService.js'])
  ]),
  moduleGuard('pipe-sizing', [], [], [
    required('pipe-sizing/controller.js', ['../../core/runtime/index.js', '../../core/numberService.js']),
    required('pipe-sizing/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js', '../../core/numberService.js']),
    required('pipe-sizing/logic.js', ['../../core/data/index.js']),
    required('pipe-sizing/results.js', ['../../core/numberService.js', '../../core/renderer.js']),
    required('pipe-sizing/schema.js', ['../../core/formSchema.js']),
    required('pipe-sizing/view.js', ['../../core/renderer.js']),
    required('pipe-sizing/viewModel.js', ['../../core/renderer.js', '../../core/resultRenderer.js', '../../core/data/index.js'])
  ]),
  moduleGuard('pressure-holding', [], [], [
    required('pressure-holding/controller.js', ['../../core/runtime/index.js', '../../core/numberService.js']),
    required('pressure-holding/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js', '../../core/numberService.js']),
    required('pressure-holding/results.js', ['../../core/numberService.js']),
    required('pressure-holding/schema.js', ['../../core/formSchema.js']),
    required('pressure-holding/view.js', ['../../core/renderer.js']),
    required('pressure-holding/viewModel.js', ['../../core/renderer.js', '../../core/resultRenderer.js', '../../core/numberService.js'])
  ]),
  moduleGuard('heating-cooling', ['reportAdapter.js'], [], [
    required('heating-cooling/controller.js', ['../../core/numberService.js', '../../core/data/index.js']),
    required('heating-cooling/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js', '../../core/numberService.js']),
    required('heating-cooling/logic.js', ['../../core/data/index.js']),
    required('heating-cooling/results.js', ['../../core/numberService.js']),
    required('heating-cooling/schema.js', ['../../core/formSchema.js', '../../core/data/index.js', '../../core/numberService.js']),
    required('heating-cooling/view.js', ['../../core/data/index.js', '../../core/numberService.js', '../../core/renderer.js', '../../core/resultRenderer.js']),
    required('heating-cooling/viewModel.js', ['../../core/renderer.js', '../../core/numberService.js'])
  ]),
  moduleGuard('ventilation', ['reportAdapter.js'], [], [
    required('ventilation/controller.js', ['../../core/runtime/index.js', '../../core/numberService.js', '../../core/renderer.js']),
    required('ventilation/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('ventilation/logic.js', ['../../core/data/index.js']),
    required('ventilation/results.js', ['../../core/numberService.js']),
    required('ventilation/schema.js', ['../../core/formSchema.js']),
    required('ventilation/view.js', ['../../core/renderer.js', '../../core/numberService.js', '../../core/resultRenderer.js']),
    required('ventilation/viewModel.js', ['../../core/numberService.js'])
  ]),
  moduleGuard('buffer-storage', [], [], [
    required('buffer-storage/controller.js', ['../../core/runtime/index.js', '../../core/numberService.js']),
    required('buffer-storage/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('buffer-storage/results.js', ['../../core/numberService.js']),
    required('buffer-storage/schema.js', ['../../core/formSchema.js']),
    required('buffer-storage/view.js', ['../../core/renderer.js', '../../core/runtime/index.js', '../../core/resultRenderer.js']),
    required('buffer-storage/viewModel.js', ['../../core/numberService.js'])
  ]),
  moduleGuard('wastewater', [], [], [
    required('wastewater/controller.js', ['../../core/numbers.js', '../../core/formActions.js', '../../core/storage/index.js', '../../core/eventPipeline.js', '../../core/scrollManager.js']),
    required('wastewater/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('wastewater/results.js', ['../../core/numberService.js']),
    required('wastewater/schema.js', ['../../core/formSchema.js', '../../core/numberService.js']),
    required('wastewater/view.js', ['../../core/renderer.js', '../../core/resultRenderer.js']),
    required('wastewater/viewModel.js', ['../../core/numberService.js', '../../core/renderer.js'])
  ]),
  moduleGuard('rainwater', [], [], [
    required('rainwater/controller.js', ['../../core/numbers.js', '../../core/storage/index.js']),
    required('rainwater/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('rainwater/logic.js', ['../../core/numberService.js']),
    required('rainwater/results.js', ['../../core/numberService.js']),
    required('rainwater/schema.js', ['../../core/formSchema.js', '../../core/numberService.js']),
    required('rainwater/view.js', ['../../core/renderer.js']),
    required('rainwater/viewModel.js', ['../../core/formSchema.js', '../../core/resultRenderer.js'])
  ]),
  moduleGuard('flooding-verification', [], ['viewModel.js'], [
    required('flooding-verification/controller.js', ['../../core/numbers.js', '../../core/eventPipeline.js', '../../core/storage/index.js']),
    required('flooding-verification/dynamicRenderer.js', ['../../core/domUpdate.js']),
    required('flooding-verification/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('flooding-verification/results.js', ['../../core/numberService.js']),
    required('flooding-verification/schema.js', ['../../core/formSchema.js']),
    required('flooding-verification/view.js', ['../../core/renderer.js', '../../core/formSchema.js', '../../core/resultRenderer.js'])
  ], ['../../shared/rainwaterDomainTables.js', '../../shared/rainwaterSurfaceSnapshot.js']),
  moduleGuard('heat-recovery', [], [], [
    required('heat-recovery/controller.js', ['../../core/runtime/index.js', '../../core/renderer.js']),
    required('heat-recovery/dynamicRenderer.js', ['../../core/renderer.js']),
    required('heat-recovery/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('heat-recovery/logic.js', ['../../core/data/index.js', '../../core/numberService.js']),
    required('heat-recovery/results.js', ['../../core/numberService.js']),
    required('heat-recovery/schema.js', ['../../core/formSchema.js']),
    required('heat-recovery/view.js', ['../../core/renderer.js', '../../core/resultRenderer.js']),
    required('heat-recovery/viewModel.js', ['../../core/numberService.js'])
  ])
];

function moduleGuard(id, extraFiles = [], excludedFiles = [], requiredImports = [], allowedLegacyImports = []) {
  return { id, files: moduleFiles(id, extraFiles, excludedFiles), requiredImports, allowedLegacyImports };
}

function moduleFiles(moduleId, extraFiles = [], excludedFiles = []) {
  const excluded = new Set(excludedFiles);
  return ['config.js', 'controller.js', 'index.js', 'logic.js', 'results.js', 'schema.js', 'state.js', 'view.js', 'viewModel.js', ...extraFiles]
    .filter(file => !excluded.has(file))
    .map(file => `js/modules/${moduleId}/${file}`);
}

function required(file, specifiers) {
  return { file: `js/modules/${file}`, specifiers };
}

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertFileContains(relativePath, expectedToken, message) {
  const source = readProjectFile(relativePath);
  if (!source.includes(expectedToken)) throw new Error(message || `${relativePath} is missing ${expectedToken}`);
}

function importSpecifiers(source) {
  const specifiers = [];
  const importOrExportFrom = /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  while ((match = importOrExportFrom.exec(source))) specifiers.push(match[1]);
  return specifiers;
}

for (const relativePath of requiredFiles) {
  if (!fs.existsSync(path.join(root, relativePath))) throw new Error(`Missing framework kernel file: ${relativePath}`);
}

const appCore = readProjectFile('js/core/appCore.js');
for (const coreArea of requiredCoreAreas) {
  if (!appCore.includes(coreArea)) throw new Error(`Core area is not documented in appCore.js: ${coreArea}`);
}

const coreIndex = readProjectFile('js/core/index.js');
for (const expectedExport of requiredCoreExports) {
  if (!coreIndex.includes(expectedExport)) throw new Error(`Core entry point does not export ${expectedExport}`);
}

const frameworkIndex = readProjectFile('js/framework/index.js');
if (!frameworkIndex.includes('../core/index.js')) throw new Error('Framework entry point must delegate to js/core/index.js');
if (frameworkIndex.includes('../modules/')) throw new Error('Framework entry point must not import modules');

const dataCatalog = readProjectFile('js/data/catalog.js');
for (const expectedToken of ['defineDataCatalogEntry', 'createDataCatalog', 'dataCatalog', 'rainwater.areaTypes', 'pipes.systems', 'refrigerants.items']) {
  if (!dataCatalog.includes(expectedToken)) throw new Error(`Data catalog contract is missing ${expectedToken}`);
}

const coreDataCatalog = readProjectFile('js/core/data/catalog.js');
if (!coreDataCatalog.includes('../../data/catalog.js')) throw new Error('Core data catalog must expose the central catalog implementation');

const frameworkDataCatalog = readProjectFile('js/framework/dataCatalog.js');
if (!frameworkDataCatalog.includes('../data/catalog.js')) throw new Error('Framework data catalog must delegate to js/data/catalog.js');

const contract = readProjectFile('docs/contracts/framework-kernel-contract.md');
for (const expectedSection of ['Core first', 'Core responsibility paths', 'Module import rule', 'Central data path', 'Reference module guard', 'Module responsibility']) {
  if (!contract.includes(expectedSection)) throw new Error(`Framework kernel contract is missing section: ${expectedSection}`);
}

for (const referenceModule of referenceModules) {
  const allowedLegacyImports = new Set(referenceModule.allowedLegacyImports || []);
  for (const relativePath of referenceModule.files) {
    const source = readProjectFile(relativePath);
    for (const specifier of importSpecifiers(source)) {
      if (allowedLegacyImports.has(specifier)) continue;
      for (const forbiddenImport of forbiddenReferenceModuleImports) {
        if (specifier.startsWith(forbiddenImport)) {
          throw new Error(`Reference module ${referenceModule.id} must not import ${specifier} from ${relativePath}`);
        }
      }
    }
  }
  for (const { file, specifiers } of referenceModule.requiredImports) {
    for (const specifier of specifiers) {
      assertFileContains(file, specifier, `Reference module ${referenceModule.id} must use ${specifier} in ${file}`);
    }
  }
}

assertFileContains(
  'js/modules/rainwater/tables.js',
  '../../shared/rainwaterDomainTables.js',
  'Rainwater tables must keep the Flooding-conformance shared domain table source until that contract is migrated.'
);

assertFileContains(
  'js/modules/flooding-verification/controller.js',
  '../../shared/rainwaterSurfaceSnapshot.js',
  'Flooding verification must keep the Rainwater surface snapshot bridge until that contract is migrated.'
);

console.log('Framework kernel audit passed.');
