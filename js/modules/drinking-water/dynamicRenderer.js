import { createDrinkingWaterViewModel } from './viewModel.js';
import { renderInputCard, renderResultCard } from './view.js';

function setIslandInner(root, selector, html){
  const island = root?.querySelector?.(selector);
  if (!island) return false;
  const next = String(html ?? '');
  if (island.innerHTML !== next) island.innerHTML = next;
  return true;
}

export function updateDrinkingWaterDynamic(root, s){
  const vm = createDrinkingWaterViewModel(s);
  setIslandInner(root, '[data-dw-dynamic="input"]', renderInputCard(vm));
  setIslandInner(root, '[data-dw-dynamic="result"]', renderResultCard(vm));
  root.__tcDrinkingWaterDynamic = { at: Date.now() };
}

export function isDynamicDrinkingWaterAction(meta = {}){
  return String(meta.action || '') !== 'initial';
}

export default updateDrinkingWaterDynamic;
