import { createStore, registerModuleStore } from './centralStore.js';

let anonymousStoreIndex = 0;

export function createModuleState(initial = {}, options = {}) {
  const moduleId = options.moduleId || `anonymous-${++anonymousStoreIndex}`;
  return registerModuleStore(moduleId, createStore(initial, { moduleId }));
}
