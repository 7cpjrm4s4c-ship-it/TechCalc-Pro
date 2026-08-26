import { getDataVersions } from '../utils/refrigerants/index.js';

export const F_GASES_SYSTEM_SNAPSHOT_VERSION = 1;

const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));

export function createFGasesSystemSnapshot(state = {}, { generatedAt = new Date().toISOString() } = {}) {
  const snapshot = {
    snapshotType: 'techcalc.f-gases.system',
    snapshotVersion: F_GASES_SYSTEM_SNAPSHOT_VERSION,
    generatedAt,
    moduleId: 'f-gases-check',
    dataVersions: clone(state.dataVersions ?? getDataVersions()),
    system: {
      systemName: state.systemName || '',
      systemType: state.systemType || '',
      constructionType: state.constructionType || '',
      performanceRange: state.performanceRange || '',
      refrigerantId: state.refrigerantId || '',
      chargeKg: state.chargeKg === '' || state.chargeKg == null ? null : Number(state.chargeKg)
    }
  };

  return Object.freeze(snapshot);
}

export default createFGasesSystemSnapshot;
