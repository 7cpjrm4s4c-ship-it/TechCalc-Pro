import { getDataVersions, getRefrigerant, getSafetyClass } from '../../utils/refrigerants/index.js';

const numberOrNull = value => {
  if (value === '' || value == null) return null;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const hasValue = value => String(value ?? '').trim().length > 0;

export function hasRequiredAssessmentInput(currentState = {}) {
  return Boolean(
    hasValue(currentState.refrigerantId)
    && numberOrNull(currentState.chargeKg) !== null
    && numberOrNull(currentState.roomVolumeM3) !== null
    && hasValue(currentState.installationLocation)
    && hasValue(currentState.accessArea)
    && hasValue(currentState.usageType)
    && hasValue(currentState.ventilationType)
  );
}

export function calculate(currentState = {}) {
  const refrigerant = currentState.refrigerantId ? getRefrigerant(currentState.refrigerantId) : null;
  const safetyClass = refrigerant?.safetyClassRef ? getSafetyClass(refrigerant.safetyClassRef) : null;
  const chargeKg = numberOrNull(currentState.chargeKg);
  const roomVolumeM3 = numberOrNull(currentState.roomVolumeM3);
  const inputComplete = hasRequiredAssessmentInput(currentState);

  return Object.freeze({
    status: inputComplete ? 'ready-for-assessment' : 'incomplete',
    inputComplete,
    refrigerant: refrigerant ? Object.freeze({ ...refrigerant }) : null,
    safetyClass: safetyClass ? Object.freeze({ ...safetyClass }) : null,
    chargeKg,
    roomVolumeM3,
    importedSnapshotVersion: currentState.importedSnapshotVersion || null,
    requiredMeasures: Object.freeze([]),
    notices: Object.freeze([]),
    dataVersions: currentState.dataVersions || getDataVersions()
  });
}

export default calculate;
