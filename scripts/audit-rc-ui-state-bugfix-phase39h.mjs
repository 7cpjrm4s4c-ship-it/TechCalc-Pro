import fs from 'node:fs';

function read(path) { return fs.readFileSync(path, 'utf8'); }
function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

const hxPipeline = read('js/modules/hx-diagram/renderPipeline.js');
assert(hxPipeline.includes('function syncHxFormFields'), 'h,x dynamic renderer must hydrate visible form inputs from selected saved records');
assert(hxPipeline.includes('return updateAllLiveIslands();'), 'h,x saved/clear structural updates must also refresh live process/results/diagram islands');
assert(!/if \(savedStructural\) \{[\s\S]*?return withHxScrollFreeze\([\s\S]*?\);\s*\}\s*\n\s*const vm = createHxRenderModel/.test(hxPipeline), 'h,x saved structural path must not return before diagram/result refresh');

const drinkingView = read('js/modules/drinking-water/view.js');
assert(drinkingView.includes('tc-collection-row tc-consumer-row--editable'), 'drinking-water draft rows must use the shared collection row geometry');
assert(drinkingView.includes('class="tc-quantity-field"'), 'drinking-water quantity editor must use the shared quantity field contract');
assert(drinkingView.includes('mini-button mini-button--danger'), 'drinking-water draft delete button must use the shared mini action geometry');

console.log('Phase 39H RC UI/state bugfix audit ok');
