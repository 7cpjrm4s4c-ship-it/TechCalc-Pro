import { state } from './state.js';

function toggleNumericSign(value) {
  const current = String(value ?? '').trim();
  if (!current) return '-';
  return current.startsWith('-') ? current.slice(1) : `-${current}`;
}

function bindMixedAirSignDelegation(root){
  if (!root || root.__tcMixedAirSignBound) return;
  root.__tcMixedAirSignBound = true;
  root.addEventListener('click', event => {
    const button = event.target?.closest?.('[data-mixed-air-sign]');
    if (!button || !root.contains(button)) return;
    event.preventDefault();
    event.stopPropagation();
    const id = button.dataset.mixedAirSign;
    const input = root.querySelector(`[data-field="${id}"]`);
    state.set({ [id]: toggleNumericSign(input?.value) }, { action: 'mixed-air:toggle-sign' });
  });
}

export function bindMixedAirActions(root){
  bindMixedAirSignDelegation(root);
}

// Phase 45C: Mischluft has no saved records; project state is persisted through central project storage.
