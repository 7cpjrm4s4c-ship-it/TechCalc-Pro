import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pdfDataMappingSource = readFileSync(new URL('../js/core/pdf/pdfDataMapping.js', import.meta.url), 'utf8');

const builderRegistryMatch = pdfDataMappingSource.match(/const typedReportSectionBuilders = Object\.freeze\(\{([\s\S]*?)\}\);/);
assert.ok(builderRegistryMatch, 'typed PDF report section builders must be registered centrally');

const builderRegistry = builderRegistryMatch[1];
const expectedBuilders = {
  'techcalc.flooding-verification.report': 'buildFloodingReportSections',
  'techcalc.rainwater.report': 'buildRainwaterReportSections',
  'techcalc.f-gases-check.report': 'buildFGasesReportSections'
};

for (const [dtoType, builderName] of Object.entries(expectedBuilders)) {
  assert.match(
    builderRegistry,
    new RegExp(`'${dtoType.replaceAll('.', '\\.')}': ${builderName}`),
    `${dtoType} must use the central typed PDF section registry`
  );
}

assert.doesNotMatch(
  pdfDataMappingSource,
  /reportDto\.metadata\?\.dtoType\s*===\s*'techcalc\.flooding-verification\.report'\s*\?/,
  'flooding-verification must not bypass the central typed DTO section dispatch'
);
assert.match(
  pdfDataMappingSource,
  /const buildSections = typedReportSectionBuilders\[dtoType\] \|\| buildGenericReportSections;/,
  'typed DTO dispatch must use one central builder lookup with the generic fallback'
);
assert.match(
  pdfDataMappingSource,
  /const sections = buildTypedDtoReportSections\(moduleData\.reportDto\);/,
  'typed DTO reports must enter the shared section dispatch path'
);

console.log('PDF report engine unification 1.6.1 regression ok');
