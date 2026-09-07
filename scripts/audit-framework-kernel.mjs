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

const requiredCoreAreas = [
  'contracts',
  'data',
  'events',
  'pdf',
  'runtime',
  'state',
  'storage',
  'styles',
  'ui',
  'ux'
];

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

const forbiddenReferenceModuleImports = [
  '../../platform/',
  '../../shared/',
  '../../utils/'
];

const referenceModules = [
  {
    id: 'unit-converter',
    files: [
      'js/modules/unit-converter/config.js',
      'js/modules/unit-converter/controller.js',
      'js/modules/unit-converter/index.js',
      'js/modules/unit-converter/logic.js',
      'js/modules/unit-converter/results.js',
      'js/modules/unit-converter/schema.js',
      'js/modules/unit-converter/state.js',
      'js/modules/unit-converter/view.js',
      'js/modules/unit-converter/viewModel.js'
    ],
    requiredImports: [
      {
        file: 'js/modules/unit-converter/index.js',
        specifiers: [
          '../../core/runtime/index.js',
          '../../core/typedDtoReportAdapter.js',
          '../../core/numberService.js'
        ]
      },
      {
        file: 'js/modules/unit-converter/logic.js',
        specifiers: ['../../core/data/index.js']
      },
      {
        file: 'js/modules/unit-converter/results.js',
        specifiers: [
          '../../core/data/index.js',
          '../../core/numberService.js'
        ]
      },
      {
        file: 'js/modules/unit-converter/schema.js',
        specifiers: ['../../core/formSchema.js']
      },
      {
        file: 'js/modules/unit-converter/view.js',
        specifiers: ['../../core/renderer.js']
      },
      {
        file: 'js/modules/unit-converter/viewModel.js',
        specifiers: [
          '../../core/renderer.js',
          '../../core/resultRenderer.js',
          '../../core/data/index.js',
          '../../core/numberService.js'
        ]
      }
    ]
  },
  {
    id: 'pipe-sizing',
    files: [
      'js/modules/pipe-sizing/config.js',
      'js/modules/pipe-sizing/controller.js',
      'js/modules/pipe-sizing/index.js',
      'js/modules/pipe-sizing/logic.js',
      'js/modules/pipe-sizing/results.js',
      'js/modules/pipe-sizing/schema.js',
      'js/modules/pipe-sizing/state.js',
      'js/modules/pipe-sizing/view.js',
      'js/modules/pipe-sizing/viewModel.js'
    ],
    requiredImports: [
      {
        file: 'js/modules/pipe-sizing/controller.js',
        specifiers: [
          '../../core/runtime/index.js',
          '../../core/numberService.js'
        ]
      },
      {
        file: 'js/modules/pipe-sizing/index.js',
        specifiers: [
          '../../core/runtime/index.js',
          '../../core/typedDtoReportAdapter.js',
          '../../core/numberService.js'
        ]
      },
      {
        file: 'js/modules/pipe-sizing/logic.js',
        specifiers: ['../../core/data/index.js']
      },
      {
        file: 'js/modules/pipe-sizing/results.js',
        specifiers: [
          '../../core/numberService.js',
          '../../core/renderer.js'
        ]
      },
      {
        file: 'js/modules/pipe-sizing/schema.js',
        specifiers: ['../../core/formSchema.js']
      },
      {
        file: 'js/modules/pipe-sizing/view.js',
        specifiers: ['../../core/renderer.js']
      },
      {
        file: 'js/modules/pipe-sizing/viewModel.js',
        specifiers: [
          '../../core/renderer.js',
          '../../core/resultRenderer.js',
          '../../core/data/index.js'
        ]
      }
    ]
  }
];

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertFileContains(relativePath, expectedToken, message) {
  const source = readProjectFile(relativePath);
  if (!source.includes(expectedToken)) {
    throw new Error(message || `${relativePath} is missing ${expectedToken}`);
  }
}

for (const relativePath of requiredFiles) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    throw new Error(`Missing framework kernel file: ${relativePath}`);
  }
}

const appCore = readProjectFile('js/core/appCore.js');
for (const coreArea of requiredCoreAreas) {
  if (!appCore.includes(coreArea)) {
    throw new Error(`Core area is not documented in appCore.js: ${coreArea}`);
  }
}

const coreIndex = readProjectFile('js/core/index.js');
for (const expectedExport of requiredCoreExports) {
  if (!coreIndex.includes(expectedExport)) {
    throw new Error(`Core entry point does not export ${expectedExport}`);
  }
}

const frameworkIndex = readProjectFile('js/framework/index.js');
if (!frameworkIndex.includes('../core/index.js')) {
  throw new Error('Framework entry point must delegate to js/core/index.js');
}

if (frameworkIndex.includes('../modules/')) {
  throw new Error('Framework entry point must not import modules');
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

const coreDataCatalog = readProjectFile('js/core/data/catalog.js');
if (!coreDataCatalog.includes('../../data/catalog.js')) {
  throw new Error('Core data catalog must expose the central catalog implementation');
}

const frameworkDataCatalog = readProjectFile('js/framework/dataCatalog.js');
if (!frameworkDataCatalog.includes('../data/catalog.js')) {
  throw new Error('Framework data catalog must delegate to js/data/catalog.js');
}

const contract = readProjectFile('docs/contracts/framework-kernel-contract.md');
for (const expectedSection of [
  'Core first',
  'Core responsibility paths',
  'Module import rule',
  'Central data path',
  'Reference module guard',
  'Module responsibility'
]) {
  if (!contract.includes(expectedSection)) {
    throw new Error(`Framework kernel contract is missing section: ${expectedSection}`);
  }
}

for (const referenceModule of referenceModules) {
  for (const relativePath of referenceModule.files) {
    const source = readProjectFile(relativePath);
    for (const forbiddenImport of forbiddenReferenceModuleImports) {
      if (source.includes(`'${forbiddenImport}`) || source.includes(`"${forbiddenImport}`)) {
        throw new Error(`Reference module ${referenceModule.id} must not import ${forbiddenImport} from ${relativePath}`);
      }
    }
  }

  for (const { file, specifiers } of referenceModule.requiredImports) {
    for (const specifier of specifiers) {
      assertFileContains(
        file,
        specifier,
        `Reference module ${referenceModule.id} must use ${specifier} in ${file}`
      );
    }
  }
}

console.log('Framework kernel audit passed.');
