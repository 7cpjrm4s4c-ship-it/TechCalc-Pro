export const EN_378_SNAPSHOT_IMPORT_VERSION = 1;
export const F_GASES_SYSTEM_SNAPSHOT_TYPE = 'techcalc.f-gases.system';

const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));

const stringValue = value => value == null ? '' : String(value);

const isRecord = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isPositiveNumber = value => typeof value === 'number' && Number.isFinite(value) && value > 0;

export function validateFGasesSystemSnapshot(snapshot = {}) {
  const errors = [];

  if (!isRecord(snapshot)) errors.push('snapshot:invalid-object');
  if (snapshot?.snapshotType !== F_GASES_SYSTEM_SNAPSHOT_TYPE) errors.push('snapshot:unsupported-type');
  if (!Number.isInteger(snapshot?.snapshotVersion) || snapshot.snapshotVersion < 1) errors.push('snapshot:invalid-version');
  if (!isRecord(snapshot?.system)) errors.push('snapshot:missing-system');

  const system = isRecord(snapshot?.system) ? snapshot.system : {};
  if (!system.refrigerantId) errors.push('system:missing-refrigerant');
  if (!isPositiveNumber(system.chargeKg)) errors.push('system:invalid-charge');

  return Object.freeze({
    isValid: errors.length === 0,
    errors: Object.freeze(errors)
  });
}

export function canImportFGasesSystemSnapshot(snapshot = {}) {
  return validateFGasesSystemSnapshot(snapshot).isValid;
}

export function buildEN378StateFromFGasesSnapshot(snapshot = {}, currentState = {}) {
  const validation = validateFGasesSystemSnapshot(snapshot);
  if (!validation.isValid) {
    return Object.freeze({
      importStatus: 'rejected',
      importErrors: validation.errors
    });
  }

  const system = snapshot.system || {};
  const generatedAt = snapshot.generatedAt || '';
  const importedSnapshotId = [
    snapshot.snapshotType || F_GASES_SYSTEM_SNAPSHOT_TYPE,
    snapshot.snapshotVersion || '',
    generatedAt,
    system.systemName || ''
  ].join(':');

  return Object.freeze({
    importedSnapshot: clone(snapshot),
    importedSnapshotId,
    importedSnapshotVersion: snapshot.snapshotVersion || '',
    importedAt: new Date().toISOString(),
    importStatus: 'imported',
    importErrors: Object.freeze([]),
    sourceModuleId: snapshot.moduleId || 'f-gases-check',
    sourceModuleVersion: snapshot.snapshotVersion || '',
    importedSystemName: system.systemName || '',
    refrigerantId: system.refrigerantId || '',
    chargeKg: stringValue(system.chargeKg),
    dataVersions: clone(snapshot.dataVersions || currentState.dataVersions || {})
  });
}

export default buildEN378StateFromFGasesSnapshot;
