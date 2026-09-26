import assert from 'node:assert/strict';

const projectStorage = await import('../core/storage/projectStorage.js');
const ventilationModule = await import('../modules/ventilation/index.js');
const ventilationController = await import('../modules/ventilation/controller.js');
assert.equal(typeof projectStorage.collectProjectData, 'function', 'projectStorage must import cleanly and expose collectProjectData');
assert.equal(typeof projectStorage.applyProjectData, 'function', 'projectStorage must import cleanly and expose applyProjectData');
assert.equal(typeof ventilationModule.default, 'object', 'ventilation platform module must import cleanly');
assert.equal(typeof ventilationController.ventilationLineSectionController?.read, 'function', 'ventilation controller exposes line-section read contract');
assert.equal(typeof ventilationController.ventilationLineSectionController?.write, 'function', 'ventilation controller exposes line-section write contract');
console.log('ventilation phase19d project-storage import regression ok');
