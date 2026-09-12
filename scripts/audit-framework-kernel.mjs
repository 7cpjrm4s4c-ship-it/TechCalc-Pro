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
  'js/core/data/fGasesSystemSnapshot.js',
  'js/core/data/rainwater.js',
  'js/core/data/pipes.js',
  'js/core/data/refrigerants.js',
  'js/core/events/index.js',
  'js/core/hvacAir.js',
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
  './appCore.js', './contracts/index.js', './data/index.js', './events/index.js', './pdf/index.js',
  './runtime/index.js', './state/index.js', './storage/index.js', './styles/index.js', './ui/index.js', './ux/index.js'
];
const forbiddenReferenceModuleImports = ['../../platform/', '../../shared/', '../../utils/'];

const required = (file, specifiers) => ({ file: `js/modules/${file}`, specifiers });
const guard = (id, requiredImports, options = {}) => ({
  id,
  files: moduleFiles(id, options.extraFiles || [], options.excludedFiles || []),
  requiredImports,
  allowedLegacyImports: options.allowedLegacyImports || []
});

const referenceModules = [
  guard('unit-converter', [
    required('unit-converter/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js', '../../core/numberService.js']),
    required('unit-converter/logic.js', ['../../core/data/index.js']),
    required('unit-converter/results.js', ['../../core/data/index.js', '../../core/numberService.js']),
    required('unit-converter/schema.js', ['../../core/formSchema.js']),
    required('unit-converter/view.js', ['../../core/renderer.js']),
    required('unit-converter/viewModel.js', ['../../core/renderer.js', '../../core/resultRenderer.js', '../../core/data/index.js', '../../core/numberService.js'])
  ]),
  guard('pipe-sizing', [
    required('pipe-sizing/controller.js', ['../../core/runtime/index.js', '../../core/numberService.js']),
    required('pipe-sizing/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js', '../../core/numberService.js']),
    required('pipe-sizing/logic.js', ['../../core/data/index.js']),
    required('pipe-sizing/results.js', ['../../core/numberService.js', '../../core/renderer.js']),
    required('pipe-sizing/schema.js', ['../../core/formSchema.js']),
    required('pipe-sizing/view.js', ['../../core/renderer.js']),
    required('pipe-sizing/viewModel.js', ['../../core/renderer.js', '../../core/resultRenderer.js', '../../core/data/index.js'])
  ]),
  guard('pressure-holding', [
    required('pressure-holding/controller.js', ['../../core/runtime/index.js', '../../core/numberService.js']),
    required('pressure-holding/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js', '../../core/numberService.js']),
    required('pressure-holding/results.js', ['../../core/numberService.js']),
    required('pressure-holding/schema.js', ['../../core/formSchema.js']),
    required('pressure-holding/view.js', ['../../core/renderer.js']),
    required('pressure-holding/viewModel.js', ['../../core/renderer.js', '../../core/resultRenderer.js', '../../core/numberService.js'])
  ]),
  guard('heating-cooling', [
    required('heating-cooling/controller.js', ['../../core/numberService.js', '../../core/data/index.js']),
    required('heating-cooling/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js', '../../core/numberService.js']),
    required('heating-cooling/logic.js', ['../../core/data/index.js']),
    required('heating-cooling/results.js', ['../../core/numberService.js']),
    required('heating-cooling/schema.js', ['../../core/formSchema.js', '../../core/data/index.js', '../../core/numberService.js']),
    required('heating-cooling/view.js', ['../../core/data/index.js', '../../core/numberService.js', '../../core/renderer.js', '../../core/resultRenderer.js']),
    required('heating-cooling/viewModel.js', ['../../core/renderer.js', '../../core/numberService.js'])
  ], { extraFiles: ['reportAdapter.js'] }),
  guard('ventilation', [
    required('ventilation/controller.js', ['../../core/runtime/index.js', '../../core/numberService.js', '../../core/renderer.js']),
    required('ventilation/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('ventilation/logic.js', ['../../core/data/index.js']),
    required('ventilation/results.js', ['../../core/numberService.js']),
    required('ventilation/schema.js', ['../../core/formSchema.js']),
    required('ventilation/view.js', ['../../core/renderer.js', '../../core/numberService.js', '../../core/resultRenderer.js']),
    required('ventilation/viewModel.js', ['../../core/numberService.js'])
  ], { extraFiles: ['reportAdapter.js'] }),
  guard('buffer-storage', [
    required('buffer-storage/controller.js', ['../../core/runtime/index.js', '../../core/numberService.js']),
    required('buffer-storage/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('buffer-storage/results.js', ['../../core/numberService.js']),
    required('buffer-storage/schema.js', ['../../core/formSchema.js']),
    required('buffer-storage/view.js', ['../../core/renderer.js', '../../core/runtime/index.js', '../../core/resultRenderer.js']),
    required('buffer-storage/viewModel.js', ['../../core/numberService.js'])
  ]),
  guard('wastewater', [
    required('wastewater/controller.js', ['../../core/numbers.js', '../../core/formActions.js', '../../core/storage/index.js', '../../core/eventPipeline.js', '../../core/scrollManager.js']),
    required('wastewater/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('wastewater/results.js', ['../../core/numberService.js']),
    required('wastewater/schema.js', ['../../core/formSchema.js', '../../core/numberService.js']),
    required('wastewater/view.js', ['../../core/renderer.js', '../../core/resultRenderer.js']),
    required('wastewater/viewModel.js', ['../../core/numberService.js', '../../core/renderer.js'])
  ]),
  guard('rainwater', [
    required('rainwater/controller.js', ['../../core/numbers.js', '../../core/storage/index.js']),
    required('rainwater/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('rainwater/logic.js', ['../../core/numberService.js']),
    required('rainwater/results.js', ['../../core/numberService.js']),
    required('rainwater/schema.js', ['../../core/formSchema.js', '../../core/numberService.js']),
    required('rainwater/tables.js', ['../../core/data/rainwater.js']),
    required('rainwater/view.js', ['../../core/renderer.js']),
    required('rainwater/viewModel.js', ['../../core/formSchema.js', '../../core/resultRenderer.js'])
  ], { extraFiles: ['tables.js'] }),
  guard('flooding-verification', [
    required('flooding-verification/controller.js', ['../../core/numbers.js', '../../core/eventPipeline.js', '../../core/storage/index.js', '../../core/data/rainwater.js']),
    required('flooding-verification/dynamicRenderer.js', ['../../core/domUpdate.js']),
    required('flooding-verification/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('flooding-verification/logic.js', ['../../core/data/rainwater.js']),
    required('flooding-verification/results.js', ['../../core/numberService.js']),
    required('flooding-verification/schema.js', ['../../core/formSchema.js', '../../core/data/rainwater.js']),
    required('flooding-verification/view.js', ['../../core/renderer.js', '../../core/formSchema.js', '../../core/resultRenderer.js'])
  ], { excludedFiles: ['viewModel.js'] }),
  guard('heat-recovery', [
    required('heat-recovery/controller.js', ['../../core/runtime/index.js', '../../core/renderer.js']),
    required('heat-recovery/dynamicRenderer.js', ['../../core/renderer.js']),
    required('heat-recovery/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('heat-recovery/logic.js', ['../../core/hvacAir.js']),
    required('heat-recovery/results.js', ['../../core/numberService.js']),
    required('heat-recovery/schema.js', ['../../core/formSchema.js']),
    required('heat-recovery/view.js', ['../../core/renderer.js', '../../core/resultRenderer.js']),
    required('heat-recovery/viewModel.js', ['../../core/numberService.js'])
  ]),
  guard('mixed-air', [
    required('mixed-air/controller.js', ['../../core/runtime/index.js', '../../core/renderer.js', '../../core/numberService.js']),
    required('mixed-air/dynamicRenderer.js', ['../../core/renderer.js']),
    required('mixed-air/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('mixed-air/logic.js', ['../../core/hvacAir.js']),
    required('mixed-air/results.js', ['../heat-recovery/results.js']),
    required('mixed-air/schema.js', ['../../core/formSchema.js']),
    required('mixed-air/view.js', ['../../core/renderer.js', '../../core/resultRenderer.js']),
    required('mixed-air/viewModel.js', ['../../core/numberService.js', '../heat-recovery/results.js'])
  ]),
  guard('hx-diagram', [
    required('hx-diagram/controller.js', ['../../core/runtime/index.js', '../../core/eventPipeline.js', '../../core/scrollManager.js', '../../core/renderer.js']),
    required('hx-diagram/formRenderer.js', ['../../core/renderer.js', '../../core/numberService.js']),
    required('hx-diagram/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('hx-diagram/logic.js', ['../../core/numberService.js']),
    required('hx-diagram/renderPipeline.js', ['../../core/renderer.js', '../../core/numberService.js', '../../core/focusManager.js']),
    required('hx-diagram/results.js', ['../../core/renderer.js', '../../core/resultRenderer.js', '../../core/numberService.js']),
    required('hx-diagram/schema.js', ['../../core/formSchema.js']),
    required('hx-diagram/view.js', ['../../core/renderer.js'])
  ], { extraFiles: ['diagramRenderer.js', 'formRenderer.js', 'renderPipeline.js'] }),
  guard('f-gases-check', [
    required('f-gases-check/index.js', ['../../core/data/index.js', '../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('f-gases-check/logic.js', ['../../core/data/index.js']),
    required('f-gases-check/reportAdapter.js', ['../../core/data/index.js']),
    required('f-gases-check/results.js', ['../../core/data/index.js']),
    required('f-gases-check/savedRecords.js', ['../../core/data/index.js']),
    required('f-gases-check/schema.js', ['../../core/formSchema.js']),
    required('f-gases-check/view.js', ['../../core/data/index.js', '../../core/renderer.js', '../../core/formSchema.js', '../../core/resultRenderer.js'])
  ], { extraFiles: ['reportAdapter.js', 'savedRecords.js'], excludedFiles: ['controller.js', 'viewModel.js'] }),
  guard('en-378-safety-check', [
    required('en-378-safety-check/chargeLimitCalculation.js', ['../../core/data/index.js']),
    required('en-378-safety-check/importController.js', ['../../core/centralStore.js']),
    required('en-378-safety-check/index.js', ['../../core/data/index.js', '../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('en-378-safety-check/logic.js', ['../../core/data/index.js']),
    required('en-378-safety-check/refrigerantCoverage.js', ['../../core/data/index.js']),
    required('en-378-safety-check/schema.js', ['../../core/formSchema.js']),
    required('en-378-safety-check/state.js', ['../../core/data/index.js'])
  ], { extraFiles: ['alternativeRiskMeasures.js', 'chargeLimitCalculation.js', 'displayLabels.js', 'importController.js', 'installationSafetyRequirements.js', 'plannerGuidance.js', 'refrigerantCoverage.js', 'reportAdapter.js', 'savedRecords.js', 'snapshotImport.js', 'stateConsistency.js'], excludedFiles: ['controller.js', 'view.js', 'viewModel.js'] }),
  guard('drinking-water', [
    required('drinking-water/controller.js', ['../../core/savedRecords.js', '../../core/domUpdate.js', '../../core/scrollManager.js']),
    required('drinking-water/dynamicRenderer.js', ['../../core/scrollManager.js', '../../core/focusManager.js']),
    required('drinking-water/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('drinking-water/logic.js', ['../../core/numbers.js', '../../core/numberService.js']),
    required('drinking-water/results.js', ['../../core/renderer.js', '../../core/resultRenderer.js', '../../core/numbers.js']),
    required('drinking-water/schema.js', ['../../core/formSchema.js']),
    required('drinking-water/view.js', ['../../core/renderer.js', '../../core/numbers.js', '../../core/savedRecords.js']),
    required('drinking-water/viewModel.js', ['../../core/numbers.js'])
  ], { extraFiles: ['dynamicRenderer.js'] })
];

function moduleFiles(moduleId, extraFiles = [], excludedFiles = []) {
  const excluded = new Set(excludedFiles);
  return ['config.js', 'controller.js', 'index.js', 'logic.js', 'results.js', 'schema.js', 'state.js', 'view.js', 'viewModel.js', ...extraFiles]
    .filter(file => !excluded.has(file))
    .map(file => `js/modules/${moduleId}/${file}`);
}
function readProjectFile(relativePath) { return fs.readFileSync(path.join(root, relativePath), 'utf8'); }
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
for (const coreArea of requiredCoreAreas) {
  if (!readProjectFile('js/core/appCore.js').includes(coreArea)) throw new Error(`Core area is not documented in appCore.js: ${coreArea}`);
}
for (const expectedExport of requiredCoreExports) {
  if (!readProjectFile('js/core/index.js').includes(expectedExport)) throw new Error(`Core entry point does not export ${expectedExport}`);
}
if (!readProjectFile('js/framework/index.js').includes('../core/index.js')) throw new Error('Framework entry point must delegate to js/core/index.js');
if (readProjectFile('js/framework/index.js').includes('../modules/')) throw new Error('Framework entry point must not import modules');
for (const expectedToken of ['defineDataCatalogEntry', 'createDataCatalog', 'dataCatalog', 'rainwater.areaTypes', 'pipes.systems', 'refrigerants.items']) {
  if (!readProjectFile('js/data/catalog.js').includes(expectedToken)) throw new Error(`Data catalog contract is missing ${expectedToken}`);
}
if (!readProjectFile('js/core/data/catalog.js').includes('../../data/catalog.js')) throw new Error('Core data catalog must expose the central catalog implementation');
if (!readProjectFile('js/framework/dataCatalog.js').includes('../data/catalog.js')) throw new Error('Framework data catalog must delegate to js/data/catalog.js');
for (const expectedSection of ['Core first', 'Core responsibility paths', 'Module import rule', 'Central data path', 'Reference module guard', 'Module responsibility']) {
  if (!readProjectFile('docs/contracts/framework-kernel-contract.md').includes(expectedSection)) throw new Error(`Framework kernel contract is missing section: ${expectedSection}`);
}

for (const referenceModule of referenceModules) {
  const allowedLegacyImports = new Set(referenceModule.allowedLegacyImports || []);
  for (const relativePath of referenceModule.files) {
    const source = readProjectFile(relativePath);
    for (const specifier of importSpecifiers(source)) {
      if (allowedLegacyImports.has(specifier)) continue;
      for (const forbiddenImport of forbiddenReferenceModuleImports) {
        if (specifier.startsWith(forbiddenImport)) throw new Error(`Reference module ${referenceModule.id} must not import ${specifier} from ${relativePath}`);
      }
    }
  }
  for (const { file, specifiers } of referenceModule.requiredImports) {
    for (const specifier of specifiers) assertFileContains(file, specifier, `Reference module ${referenceModule.id} must use ${specifier} in ${file}`);
  }
}

console.log('Framework kernel audit passed.');
