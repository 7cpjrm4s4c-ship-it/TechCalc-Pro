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

const adapters = Object.freeze([
  Object.freeze({
    id: 'flooding-verification',
    read: () => ({ state: floodingVerificationState.get() }),
    apply: moduleData => {
      const incoming = moduleData?.state;
      if (incoming && typeof incoming === 'object') {
        floodingVerificationState.replace(migrateFloodingVerificationState(incoming), { notify: false });
      }
    },
    reset: () => floodingVerificationState.reset()
  })
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
