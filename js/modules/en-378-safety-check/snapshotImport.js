export const EN_378_SNAPSHOT_IMPORT_VERSION = 1;

const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));

const stringValue = value => value == null ? '' : String(value);

export function canImportFGasesSystemSnapshot(snapshot = {}) {
  return snapshot?.snapshotType === 'techcalc.f-gases.system' && Boolean(snapshot.system);
}

export function buildEN378StateFromFGasesSnapshot(snapshot = {}, currentState = {}) {
  if (!canImportFGasesSystemSnapshot(snapshot)) return Object.freeze({});

  const system = snapshot.system || {};
  const generatedAt = snapshot.generatedAt || '';
  const importedSnapshotId = [
    snapshot.snapshotType || 'techcalc.f-gases.system',
    snapshot.snapshotVersion || '',
    generatedAt,
    system.systemName || ''
  ].join(':');

  return Object.freeze({
    importedSnapshot: clone(snapshot),
    importedSnapshotId,
    importedSnapshotVersion: snapshot.snapshotVersion || '',
    importedAt: new Date().toISOString(),
    sourceModuleId: snapshot.moduleId || 'f-gases-check',
    sourceModuleVersion: snapshot.snapshotVersion || '',
    importedSystemName: system.systemName || '',
    refrigerantId: system.refrigerantId || '',
    chargeKg: stringValue(system.chargeKg),
    dataVersions: clone(snapshot.dataVersions || currentState.dataVersions || {})
  });
}

export default buildEN378StateFromFGasesSnapshot;
