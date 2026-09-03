import { state as en378SafetyCheckState } from '../modules/en-378-safety-check/state.js';
import { state as fGasesCheckState } from '../modules/f-gases-check/state.js';
import { state as floodingVerificationState } from '../modules/flooding-verification/state.js';

const clone = value => typeof structuredClone === 'function'
  ? structuredClone(value)
  : JSON.parse(JSON.stringify(value));

function migrateFloodingVerificationState(input = {}) {
  const next = clone(input || {});
  if (!next.pipeSlopePercent && next.pipeSlopePermille) {
    const legacy = Number(String(next.pipeSlopePermille).replace(',', '.'));
    if (Number.isFinite(legacy) && legacy > 0) next.pipeSlopePercent = String(legacy / 10).replace('.', ',');
  }
  delete next.pipeSlopePermille;
  return next;
}

function createStateAdapter(id, moduleState, migrate = value => clone(value || {})) {
  return Object.freeze({
    id,
    read: () => ({ state: moduleState.get() }),
    apply: moduleData => {
      const incoming = moduleData?.state;
      if (incoming && typeof incoming === 'object') {
        moduleState.replace(migrate(incoming), { notify: false });
      }
    },
    reset: () => moduleState.reset()
  });
}

const fGasesCheckAdapter = createStateAdapter('f-gases-check', fGasesCheckState);
const en378SafetyCheckAdapter = createStateAdapter('en-378-safety-check', en378SafetyCheckState);

const floodingVerificationAdapter = Object.freeze({
  id: 'flooding-verification',
  read: () => ({ state: floodingVerificationState.get() }),
  apply: moduleData => {
    const incoming = moduleData?.state;
    if (incoming && typeof incoming === 'object') {
      floodingVerificationState.replace(migrateFloodingVerificationState(incoming), { notify: false });
    }
  },
  reset: () => floodingVerificationState.reset()
});

const adapters = Object.freeze([
  fGasesCheckAdapter,
  en378SafetyCheckAdapter,
  floodingVerificationAdapter
]);

export function appendProjectModuleStates(data = {}) {
  const project = clone(data);
  project.modules = project.modules && typeof project.modules === 'object' ? project.modules : {};
  adapters.forEach(adapter => {
    project.modules[adapter.id] = clone(adapter.read());
  });
  return project;
}

export function applyProjectModuleStates(data = {}) {
  const modules = data?.modules && typeof data.modules === 'object' ? data.modules : {};
  adapters.forEach(adapter => adapter.apply(modules[adapter.id]));
}

export function resetProjectModuleStates() {
  adapters.forEach(adapter => adapter.reset());
}

export function registeredProjectModuleIds() {
  return adapters.map(adapter => adapter.id);
}

export { migrateFloodingVerificationState };
