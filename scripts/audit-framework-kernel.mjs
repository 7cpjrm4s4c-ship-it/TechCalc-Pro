import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectRuntimeLayout } from './runtime-layout.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtimeLayout = detectRuntimeLayout(root);
const coreFile = relativePath => `${runtimeLayout.coreDir}/${relativePath}`;
const moduleFile = relativePath => `${runtimeLayout.modulesDir}/${relativePath}`;
const requiredFiles = [
  coreFile('index.js'),
  coreFile('appCore.js'),
  coreFile('contracts/index.js'),
  coreFile('contracts/moduleContract.js'),
  coreFile('contracts/moduleDefinition.js'),
  coreFile('contracts/moduleLayoutContract.js'),
  coreFile('contracts/platformPolicy.js'),
  coreFile('data/index.js'),
  coreFile('data/catalog.js'),
  coreFile('data/fGasesSystemSnapshot.js'),
  coreFile('data/rainwater.js'),
  coreFile('data/pipes.js'),
  coreFile('data/refrigerants.js'),
  coreFile('diagnostics/index.js'),
  coreFile('diagnostics/appHealth.js'),
  coreFile('diagnostics/performanceBudget.js'),
  coreFile('events/index.js'),
  coreFile('events/eventDelegation.js'),
  coreFile('events/eventManager.js'),
  coreFile('events/eventPipeline.js'),
  coreFile('engineering/hvacAir.js'),
  coreFile('engineering/hvacAirResults.js'),
  coreFile('pdf/index.js'),
  coreFile('runtime/index.js'),
  coreFile('state/index.js'),
  coreFile('storage/index.js'),
  coreFile('styles/index.js'),
  coreFile('ui/index.js'),
  coreFile('ux/index.js'),
  'docs/contracts/framework-kernel-contract.md',
  'docs/architecture/ADR-0020-internal-neutral-framework.md',
  'docs/architecture/ADR-0021-root-runtime-layout.md'
];
const forbiddenReferenceModuleImports = ['../../platform/', '../../shared/', '../../utils/'];
const requiredCoreAreas = ['contracts', 'data', 'diagnostics', 'events', 'pdf', 'runtime', 'state', 'storage', 'styles', 'ui', 'ux'];
const requiredCoreExports = ['./appCore.js', './contracts/index.js', './data/index.js', './diagnostics/index.js', './events/index.js', './pdf/index.js', './runtime/index.js', './state/index.js', './storage/index.js', './styles/index.js', './ui/index.js', './ux/index.js'];
const required = (file, specifiers) => ({ file: moduleFile(file), specifiers });
const moduleFiles = (moduleId, extraFiles = [], excludedFiles = []) => {
  const excluded = new Set(excludedFiles);
  return ['config.js', 'controller.js', 'index.js', 'logic.js', 'results.js', 'schema.js', 'state.js', 'view.js', 'viewModel.js', ...extraFiles]
    .filter(file => !excluded.has(file))
    .map(file => moduleFile(`${moduleId}/${file}`));
};
const guard = (id, requiredImports, options = {}) => ({
  id,
  files: moduleFiles(id, options.extraFiles || [], options.excludedFiles || []),
  requiredImports,
  allowedLegacyImports: options.allowedLegacyImports || []
});
const referenceModules = [
  guard('unit-converter', [
    required('unit-converter/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js', '../../core/engineering/numberService.js']),
    required('unit-converter/logic.js', ['../../core/data/index.js']),
    required('unit-converter/results.js', ['../../core/data/index.js', '../../core/engineering/numberService.js']),
    required('unit-converter/schema.js', ['../../core/formSchema.js']),
    required('unit-converter/view.js', ['../../core/renderer.js']),
    required('unit-converter/viewModel.js', ['../../core/renderer.js', '../../core/resultRenderer.js', '../../core/data/index.js', '../../core/engineering/numberService.js'])
  ]),
  guard('pipe-sizing', [
    required('pipe-sizing/controller.js', ['../../core/runtime/index.js', '../../core/engineering/numberService.js']),
    required('pipe-sizing/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js', '../../core/engineering/numberService.js']),
    required('pipe-sizing/logic.js', ['../../core/data/index.js']),
    required('pipe-sizing/results.js', ['../../core/engineering/numberService.js', '../../core/renderer.js']),
    required('pipe-sizing/schema.js', ['../../core/formSchema.js']),
    required('pipe-sizing/view.js', ['../../core/renderer.js']),
    required('pipe-sizing/viewModel.js', ['../../core/renderer.js', '../../core/resultRenderer.js', '../../core/data/index.js'])
  ]),
  guard('pressure-holding', [
    required('pressure-holding/controller.js', ['../../core/runtime/index.js', '../../core/engineering/numberService.js']),
    required('pressure-holding/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js', '../../core/engineering/numberService.js']),
    required('pressure-holding/results.js', ['../../core/engineering/numberService.js']),
    required('pressure-holding/schema.js', ['../../core/formSchema.js']),
    required('pressure-holding/view.js', ['../../core/renderer.js']),
    required('pressure-holding/viewModel.js', ['../../core/renderer.js', '../../core/resultRenderer.js', '../../core/engineering/numberService.js'])
  ]),
  guard('heating-cooling', [
    required('heating-cooling/controller.js', ['../../core/engineering/numberService.js', '../../core/data/index.js']),
    required('heating-cooling/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js', '../../core/engineering/numberService.js']),
    required('heating-cooling/logic.js', ['../../core/data/index.js']),
    required('heating-cooling/results.js', ['../../core/engineering/numberService.js']),
    required('heating-cooling/schema.js', ['../../core/formSchema.js', '../../core/data/index.js', '../../core/engineering/numberService.js']),
    required('heating-cooling/view.js', ['../../core/data/index.js', '../../core/engineering/numberService.js', '../../core/renderer.js', '../../core/resultRenderer.js']),
    required('heating-cooling/viewModel.js', ['../../core/renderer.js', '../../core/engineering/numberService.js'])
  ], { extraFiles: ['reportAdapter.js'] }),
  guard('ventilation', [
    required('ventilation/controller.js', ['../../core/runtime/index.js', '../../core/engineering/numberService.js', '../../core/renderer.js']),
    required('ventilation/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('ventilation/logic.js', ['../../core/data/index.js']),
    required('ventilation/results.js', ['../../core/engineering/numberService.js']),
    required('ventilation/schema.js', ['../../core/formSchema.js']),
    required('ventilation/view.js', ['../../core/renderer.js', '../../core/engineering/numberService.js', '../../core/resultRenderer.js']),
    required('ventilation/viewModel.js', ['../../core/engineering/numberService.js'])
  ], { extraFiles: ['reportAdapter.js'] }),
  guard('buffer-storage', [
    required('buffer-storage/controller.js', ['../../core/runtime/index.js', '../../core/engineering/numberService.js']),
    required('buffer-storage/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('buffer-storage/results.js', ['../../core/engineering/numberService.js']),
    required('buffer-storage/schema.js', ['../../core/formSchema.js']),
    required('buffer-storage/view.js', ['../../core/renderer.js', '../../core/runtime/index.js', '../../core/resultRenderer.js']),
    required('buffer-storage/viewModel.js', ['../../core/engineering/numberService.js'])
  ]),
  guard('wastewater', [
    required('wastewater/controller.js', ['../../core/engineering/numbers.js', '../../core/ui/formActions.js', '../../core/storage/index.js', '../../core/events/index.js', '../../core/ux/scrollManager.js']),
    required('wastewater/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('wastewater/results.js', ['../../core/engineering/numberService.js']),
    required('wastewater/schema.js', ['../../core/formSchema.js', '../../core/engineering/numberService.js']),
    required('wastewater/view.js', ['../../core/renderer.js', '../../core/resultRenderer.js']),
    required('wastewater/viewModel.js', ['../../core/engineering/numberService.js', '../../core/renderer.js'])
  ]),
  guard('rainwater', [
    required('rainwater/controller.js', ['../../core/engineering/numbers.js', '../../core/storage/index.js']),
    required('rainwater/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('rainwater/logic.js', ['../../core/engineering/numberService.js']),
    required('rainwater/results.js', ['../../core/engineering/numberService.js']),
    required('rainwater/schema.js', ['../../core/formSchema.js', '../../core/engineering/numberService.js']),
    required('rainwater/tables.js', ['../../core/data/rainwater.js']),
    required('rainwater/view.js', ['../../core/renderer.js']),
    required('rainwater/viewModel.js', ['../../core/formSchema.js', '../../core/resultRenderer.js'])
  ], { extraFiles: ['tables.js'] }),
  guard('flooding-verification', [
    required('flooding-verification/controller.js', ['../../core/engineering/numbers.js', '../../core/events/index.js', '../../core/storage/index.js', '../../core/data/rainwater.js']),
    required('flooding-verification/dynamicRenderer.js', ['../../core/domUpdate.js']),
    required('flooding-verification/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('flooding-verification/logic.js', ['../../core/data/rainwater.js']),
    required('flooding-verification/results.js', ['../../core/engineering/numberService.js']),
    required('flooding-verification/schema.js', ['../../core/formSchema.js', '../../core/data/rainwater.js']),
    required('flooding-verification/view.js', ['../../core/renderer.js', '../../core/formSchema.js', '../../core/resultRenderer.js'])
  ], { excludedFiles: ['viewModel.js'] }),
  guard('heat-recovery', [
    required('heat-recovery/controller.js', ['../../core/runtime/index.js', '../../core/renderer.js']),
    required('heat-recovery/dynamicRenderer.js', ['../../core/renderer.js']),
    required('heat-recovery/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('heat-recovery/logic.js', ['../../core/engineering/hvacAir.js']),
    required('heat-recovery/results.js', ['../../core/engineering/hvacAirResults.js']),
    required('heat-recovery/schema.js', ['../../core/formSchema.js']),
    required('heat-recovery/view.js', ['../../core/renderer.js', '../../core/resultRenderer.js']),
    required('heat-recovery/viewModel.js', ['../../core/engineering/numberService.js'])
  ]),
  guard('mixed-air', [
    required('mixed-air/controller.js', ['../../core/runtime/index.js', '../../core/renderer.js', '../../core/engineering/numberService.js']),
    required('mixed-air/dynamicRenderer.js', ['../../core/renderer.js']),
    required('mixed-air/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('mixed-air/logic.js', ['../../core/engineering/hvacAir.js']),
    required('mixed-air/results.js', ['../../core/engineering/hvacAirResults.js']),
    required('mixed-air/schema.js', ['../../core/formSchema.js']),
    required('mixed-air/view.js', ['../../core/renderer.js', '../../core/resultRenderer.js']),
    required('mixed-air/viewModel.js', ['../../core/engineering/numberService.js', './results.js'])
  ]),
  guard('hx-diagram', [
    required('hx-diagram/controller.js', ['../../core/runtime/index.js', '../../core/events/index.js', '../../core/ux/scrollManager.js', '../../core/renderer.js']),
    required('hx-diagram/formRenderer.js', ['../../core/renderer.js', '../../core/engineering/numberService.js']),
    required('hx-diagram/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('hx-diagram/logic.js', ['../../core/engineering/numberService.js']),
    required('hx-diagram/renderPipeline.js', ['../../core/renderer.js', '../../core/engineering/numberService.js', '../../core/ux/focusManager.js']),
    required('hx-diagram/results.js', ['../../core/renderer.js', '../../core/resultRenderer.js', '../../core/engineering/numberService.js']),
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
    required('en-378-safety-check/importController.js', ['../../core/state/index.js']),
    required('en-378-safety-check/index.js', ['../../core/data/index.js', '../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('en-378-safety-check/logic.js', ['../../core/data/index.js']),
    required('en-378-safety-check/refrigerantCoverage.js', ['../../core/data/index.js']),
    required('en-378-safety-check/schema.js', ['../../core/formSchema.js']),
    required('en-378-safety-check/state.js', ['../../core/data/index.js'])
  ], { extraFiles: ['alternativeRiskMeasures.js', 'chargeLimitCalculation.js', 'displayLabels.js', 'importController.js', 'installationSafetyRequirements.js', 'plannerGuidance.js', 'refrigerantCoverage.js', 'reportAdapter.js', 'savedRecords.js', 'snapshotImport.js', 'stateConsistency.js'], excludedFiles: ['controller.js', 'view.js', 'viewModel.js'] }),
  guard('drinking-water', [
    required('drinking-water/controller.js', ['../../core/savedRecords.js', '../../core/domUpdate.js', '../../core/ux/scrollManager.js']),
    required('drinking-water/dynamicRenderer.js', ['../../core/ux/scrollManager.js', '../../core/ux/focusManager.js']),
    required('drinking-water/index.js', ['../../core/runtime/index.js', '../../core/typedDtoReportAdapter.js']),
    required('drinking-water/logic.js', ['../../core/engineering/numbers.js', '../../core/engineering/numberService.js']),
    required('drinking-water/results.js', ['../../core/renderer.js', '../../core/resultRenderer.js', '../../core/engineering/numbers.js']),
    required('drinking-water/schema.js', ['../../core/formSchema.js']),
    required('drinking-water/view.js', ['../../core/renderer.js', '../../core/engineering/numbers.js', '../../core/savedRecords.js']),
    required('drinking-water/viewModel.js', ['../../core/engineering/numbers.js'])
  ], { extraFiles: ['dynamicRenderer.js'] })
];
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
for (const legacyBoundary of ['js/platform', 'js/framework', 'js/data']) {
  if (fs.existsSync(path.join(root, legacyBoundary))) {
    throw new Error(`Legacy runtime boundary must remain removed: ${legacyBoundary}`);
  }
}

for (const coreArea of requiredCoreAreas) {
  if (!readProjectFile(coreFile('appCore.js')).includes(coreArea)) throw new Error(`Core area is not documented in appCore.js: ${coreArea}`);
}
for (const expectedExport of requiredCoreExports) {
  if (!readProjectFile(coreFile('index.js')).includes(expectedExport)) throw new Error(`Core entry point does not export ${expectedExport}`);
}

for (const expectedToken of ['defineDataCatalogEntry', 'createDataCatalog', 'dataCatalog', 'rainwater.areaTypes', 'pipes.systems', 'refrigerants.items']) {
  if (!readProjectFile(coreFile('data/catalog.js')).includes(expectedToken)) throw new Error(`Core data catalog contract is missing ${expectedToken}`);
}
for (const expectedSection of ['Core first', 'Core responsibility paths', 'Module import rule', 'Central data path', 'Reference module guard', 'Module responsibility', 'Static resources', 'Transition contract']) {
  if (!readProjectFile('docs/contracts/framework-kernel-contract.md').includes(expectedSection)) throw new Error(`Framework kernel contract is missing section: ${expectedSection}`);
}
for (const referenceModule of referenceModules) {
  const allowedLegacyImports = new Set(referenceModule.allowedLegacyImports || []);
  for (const relativePath of referenceModule.files) {
    const absolutePath = path.join(root, relativePath);
    if (!fs.existsSync(absolutePath)) throw new Error(`Reference module ${referenceModule.id} file missing: ${relativePath}`);
    const source = readProjectFile(relativePath);
    for (const specifier of importSpecifiers(source)) {
      if (allowedLegacyImports.has(specifier)) continue;
      for (const forbiddenImport of forbiddenReferenceModuleImports) {
        if (specifier.startsWith(forbiddenImport)) throw new Error(`Reference module ${referenceModule.id} must not import ${specifier} from ${relativePath}`);
      }
    }
  }
  assertFileContains(
    moduleFile(`${referenceModule.id}/config.js`),
    '../../core/contracts/index.js',
    `Reference module ${referenceModule.id} must use the Core contracts entry point in its config.js`
  );

  for (const { file, specifiers } of referenceModule.requiredImports) {
    for (const specifier of specifiers) assertFileContains(file, specifier, `Reference module ${referenceModule.id} must use ${specifier} in ${file}`);
  }
}

console.log('Framework kernel audit passed.');
