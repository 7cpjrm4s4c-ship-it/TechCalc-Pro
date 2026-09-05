import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { collectCurrentModule, lineSectionItems } from '../js/core/pdf/pdfDataMapping.js';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const pdfDataMappingSource = read('js/core/pdf/pdfDataMapping.js');
const typedDtoReportAdapterSource = read('js/core/typedDtoReportAdapter.js');
const serviceWorkerSource = read('service-worker.js');
const appSource = read('js/core/app.js');

const moduleIndexPaths = [
  'js/modules/heating-cooling/index.js',
  'js/modules/ventilation/index.js',
  'js/modules/pressure-holding/index.js',
  'js/modules/buffer-storage/index.js',
  'js/modules/heat-recovery/index.js',
  'js/modules/mixed-air/index.js',
  'js/modules/hx-diagram/index.js',
  'js/modules/pipe-sizing/index.js',
  'js/modules/unit-converter/index.js',
  'js/modules/drinking-water/index.js',
  'js/modules/wastewater/index.js',
  'js/modules/rainwater/index.js',
  'js/modules/flooding-verification/index.js',
  'js/modules/f-gases-check/index.js',
  'js/modules/en-378-safety-check/index.js'
];

assert.match(
  pdfDataMappingSource,
  /PDF-Export benötigt ein Typed-DTO\. Legacy-DOM-Export ist deaktiviert\./,
  'PDF export must reject non-typed module data instead of falling back to DOM scraping'
);
assert.doesNotMatch(pdfDataMappingSource, /collectLegacyDomModule|extractCardRows|data-pdf-field|querySelector(All)?\(/, 'PDF data mapping must not contain legacy DOM export collectors');
assert.doesNotMatch(pdfDataMappingSource, /reportSource:\s*'legacy-dom'/, 'legacy DOM report source must be removed');
assert.doesNotMatch(
  typedDtoReportAdapterSource.match(/function report[\s\S]*?\n  \}/)?.[0] || '',
  /calculate\s*\(/,
  'typed DTO report() must not trigger module calculations'
);

const expectedBuilderRegistry = {
  'techcalc.flooding-verification.report': 'buildFloodingReportSections',
  'techcalc.rainwater.report': 'buildRainwaterReportSections',
  'techcalc.f-gases-check.report': 'buildFGasesReportSections',
  'techcalc.en-378-safety-check.report': 'buildEN378ReportSections'
};
const registryMatch = pdfDataMappingSource.match(/const typedReportSectionBuilders = Object\.freeze\(\{([\s\S]*?)\}\);/);
assert.ok(registryMatch, 'typed PDF report section builders must be registered centrally');
const registrySource = registryMatch[1];
for (const [dtoType, builderName] of Object.entries(expectedBuilderRegistry)) {
  assert.match(
    registrySource,
    new RegExp(`${dtoType.replaceAll('.', '\\.').replaceAll('-', '\\-')}': ${builderName}`),
    `${dtoType} must use the central typed PDF section registry`
  );
}
assert.match(
  pdfDataMappingSource,
  /typedReportSectionBuilders\[dtoType\] \|\| buildGenericReportSections/,
  'typed DTO dispatch must use the generic section builder for modules without specialized PDF sections'
);

const heatingReportDto = {
  metadata: {
    dtoType: 'techcalc.generic-module.report',
    moduleId: 'heating-cooling',
    moduleTitle: 'Heizung / Kälte',
    reportHeading: 'Heizung / Kälte'
  },
  summary: {},
  input: {},
  sections: []
};
const collectedHeating = collectCurrentModule(new Map([[
  'heating-cooling',
  {
    title: 'Heizung / Kälte',
    report: () => heatingReportDto,
    state: { get: () => ({}) }
  }
]]), () => 'heating-cooling');
assert.equal(collectedHeating.reportDto.metadata.reportHeading, 'Berechnungsprotokoll');
assert.equal(heatingReportDto.metadata.reportHeading, 'Heizung / Kälte', 'report DTO normalization must not mutate the module-owned DTO');

const collectedFlooding = collectCurrentModule(new Map([[
  'flooding-verification',
  {
    title: 'Überflutungsnachweis',
    report: () => ({
      metadata: {
        dtoType: 'techcalc.flooding-verification.report',
        moduleId: 'flooding-verification',
        moduleTitle: 'Überflutungsnachweis',
        reportHeading: 'Behördennachweis'
      }
    }),
    state: { get: () => ({}) }
  }
]]), () => 'flooding-verification');
assert.equal(collectedFlooding.reportDto.metadata.reportHeading, 'Behördennachweis');

const lineItems = lineSectionItems([
  ['Bezeichnung', 'Test Kälte', ''],
  ['Leistung', '250', 'kW'],
  ['Volumenstrom', '34,368', 'm³/h'],
  ['Bezeichnung 2', 'Test Heizung', ''],
  ['Leistung', '435,25', 'kW'],
  ['Volumenstrom', '25', 'm³/h']
]);
assert.deepEqual(lineItems.map(item => item.title), ['Test Kälte', 'Test Heizung']);
assert.deepEqual(lineItems.flatMap(item => item.rows).filter(row => /^Bezeichnung/i.test(row[0])), []);

for (const moduleIndexPath of moduleIndexPaths) {
  const source = read(moduleIndexPath);
  assert.match(source, /createTypedDtoReportAdapter/, `${moduleIndexPath} must use the central typed DTO report adapter`);
  assert.match(source, /report:\s*typedReportAdapter\.report/, `${moduleIndexPath} must expose the central typed DTO report function`);
  assert.doesNotMatch(source, /function\s+report[\s\S]*?calculate\s*\(/, `${moduleIndexPath} must not calculate inside report()`);
}

assert.match(read('js/modules/f-gases-check/reportAdapter.js'), /resultModel = null/, 'F-Gase report DTO must accept the cached result model');
assert.match(read('js/modules/en-378-safety-check/reportAdapter.js'), /resultModel = null/, 'EN 378 report DTO must accept the cached result model');
assert.match(appSource, /flooding-verification/);
assert.match(appSource, /rainwater/);
assert.match(appSource, /f-gases-check/);
assert.match(serviceWorkerSource, /\.\/js\/core\/typedDtoReportAdapter\.js/, 'typed DTO adapter must be precached with runtime assets');

console.log('PDF report engine typed DTO unification 1.6.1 regression ok');
