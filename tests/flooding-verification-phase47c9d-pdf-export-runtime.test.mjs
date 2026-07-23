import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { collectCurrentModule, reportSections } from '../js/core/pdf/pdfDataMapping.js';

const dto = {
  metadata: {
    dtoType: 'techcalc.flooding-verification.report',
    dtoVersion: 1,
    moduleTitle: 'Überflutungsnachweis'
  },
  summary: { planningVolumeM3: 42, governingLabel: 'DIN 1986-100' },
  surfaces: [],
  rainfall: {},
  hydraulics: {},
  floodingVerification: {},
  retentionVerification: {},
  diagnostics: {},
  interpretation: {},
  sources: []
};

const runtimeModule = {
  state: { get: () => ({ projectName: 'Runtime-Test' }) },
  report: snapshot => {
    assert.equal(snapshot.projectName, 'Runtime-Test');
    return dto;
  }
};

const registryEntry = {
  id: 'flooding-verification',
  title: 'Überflutungsnachweis',
  shortTitle: 'Überflutung',
  module: {
    loadedModule: runtimeModule
  }
};

const modules = new Map([['flooding-verification', registryEntry]]);
const moduleData = collectCurrentModule(modules, () => 'flooding-verification');
assert.equal(moduleData.reportSource, 'typed-dto');
assert.equal(moduleData.reportDto, dto);
assert.equal(moduleData.sections.length, 0);
assert.equal(reportSections(moduleData).length, 12);
assert.match(reportSections(moduleData)[0].title, /Ergebniszusammenfassung/);

const appSource = await readFile(new URL('../js/core/app.js', import.meta.url), 'utf8');
assert.match(appSource, /registration\.loadedModule\s*=\s*loadedModule/);
assert.match(appSource, /registration\.report\s*=\s*loadedModule\?\.report/);
assert.match(appSource, /modules\.register\(registration\)/);

const mappingSource = await readFile(new URL('../js/core/pdf/pdfDataMapping.js', import.meta.url), 'utf8');
assert.match(mappingSource, /registryEntry\?\.module\?\.loadedModule/);
assert.match(mappingSource, /reportSource:\s*'typed-dto'/);

console.log('Phase 47C.9D PDF export runtime bridge regression ok');
