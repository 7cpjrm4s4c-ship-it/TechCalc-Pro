import fs from 'node:fs';

const source = fs.readFileSync('js/modules/rainwater/index.js', 'utf8');
const saved = fs.readFileSync('js/core/savedRecords.js', 'utf8');

if (!saved.includes('export function renderSavedRecordPanel')) {
  throw new Error('central renderSavedRecordPanel must exist in savedRecords platform layer');
}
if (!source.includes('renderSavedRecordPanel')) {
  throw new Error('rainwater save panel must be rendered through the central saved-record panel renderer');
}
if (source.includes("card('Gespeicherte Flächen'")) {
  throw new Error('rainwater must not render its saved-record card with module-local card markup');
}
if (source.includes('data-surface-add') || source.includes('data-surface-update')) {
  throw new Error('rainwater must not keep legacy surface add/update marker attributes in the saved panel');
}
console.log('rainwater phase17a.1 saved panel decoupling ok');
