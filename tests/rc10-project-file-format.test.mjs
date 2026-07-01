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

await assert.rejects(
  () => readProjectFile(makeFile('invalid.txt', JSON.stringify(project), 'text/plain')),
  /\.tcproj, \.json oder \.tcp/
);

console.log('RC.10 project file format regression ok');
