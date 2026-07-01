import assert from 'node:assert/strict';
import { readProjectFile } from '../js/core/projectStorage.js';

const dataUrl = 'data:image/png;base64,aGVsbG8=';
const project = {
  app: 'TechCalc Pro',
  format: 'techcalc-project',
  version: 3,
  meta: {
    client: 'RC10 Kunde',
    project: 'TCProj Roundtrip',
    projectNo: 'RC10-001',
    companyLogo: '',
    companyLogoName: ''
  },
  assets: {
    companyLogo: {
      name: 'logo.png',
      mime: 'image/png',
      dataUrl
    }
  },
  modules: {
    'heating-cooling': { state: { savedLineSections: [{ id: 'line-1', name: 'VL' }] }, lineSections: [{ id: 'line-1', name: 'VL' }] },
    'hx-diagram': { state: { savedRecords: [{ id: 'hx-1', name: 'Diagramm' }] } },
    'buffer-storage': { state: { volume: 500, calculationType: 'heating' } }
  }
};

function makeFile(name, payload, type = '') {
  return new File([payload], name, { type });
}

const tcproj = await readProjectFile(makeFile('anlage.tcproj', JSON.stringify(project), ''));
assert.equal(tcproj.format, 'techcalc-project');
assert.equal(tcproj.meta.projectNo, 'RC10-001');
assert.equal(tcproj.meta.companyLogo, dataUrl, '.tcproj must hydrate embedded company logo assets');
assert.equal(tcproj.modules['heating-cooling'].lineSections[0].name, 'VL');
assert.equal(tcproj.modules['hx-diagram'].state.savedRecords[0].name, 'Diagramm');

const legacyJson = await readProjectFile(makeFile('legacy.json', JSON.stringify(project), 'application/json'));
assert.equal(legacyJson.meta.companyLogoName, 'logo.png', '.json import must preserve legacy embedded logo metadata');

const mimeOnlyTcproj = await readProjectFile(makeFile('', JSON.stringify(project), 'application/vnd.techcalc.project+json'));
assert.equal(mimeOnlyTcproj.format, 'techcalc-project', 'native picker files without usable names must still open by MIME type');

const bomTcproj = await readProjectFile(makeFile('bom.tcproj', `\uFEFF${JSON.stringify(project)}`, ''));
assert.equal(bomTcproj.meta.projectNo, 'RC10-001', '.tcproj reader must tolerate UTF-8 BOM');

const wrappedTcproj = await readProjectFile(makeFile('wrapped.tcproj', JSON.stringify({ project }), ''));
assert.equal(wrappedTcproj.format, 'techcalc-project', 'wrapped project envelopes must be accepted for legacy exports');

await assert.rejects(
  () => readProjectFile(makeFile('invalid.txt', JSON.stringify(project), 'text/plain')),
  /\.tcproj, \.json oder \.tcp/
);


const indexHtml = await import('node:fs/promises').then(fs => fs.readFile(new URL('../index.html', import.meta.url), 'utf8'));
assert.match(indexHtml, /<input[^>]+id="openProjectFile"[^>]+type="file"[^>]*>/, 'project file input must exist');
assert.doesNotMatch(indexHtml, /id="openProjectFile"[^>]+accept=/, 'iOS Files greys out custom .tcproj extensions when accept is restrictive; runtime validation must replace accept filtering');

console.log('RC.10 project file format regression ok');
