import REFRIGERANT_DATASET from './refrigerants.js';
import GWP_DATASET from './gwp.js';
import SAFETY_CLASS_DATASET from './safety-classes.js';
import REGULATION_DATASET from './regulations.js';

const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));

export function getDataVersions() {
  return Object.freeze({
    refrigerants: REFRIGERANT_DATASET.version,
    gwp: GWP_DATASET.version,
    regulations: REGULATION_DATASET.version,
    safetyClasses: SAFETY_CLASS_DATASET.version
  });
}

export function getDataStatus() {
  return Object.freeze({
    refrigerants: REFRIGERANT_DATASET.status,
    gwp: GWP_DATASET.status,
    regulations: REGULATION_DATASET.status,
    safetyClasses: SAFETY_CLASS_DATASET.status
  });
}

export function listRefrigerants() {
  return clone(REFRIGERANT_DATASET.items) ?? [];
}

export function getRefrigerant(refrigerantId) {
  if (!refrigerantId) return null;
  const item = REFRIGERANT_DATASET.items.find(entry => entry.id === refrigerantId || entry.name === refrigerantId);
  return clone(item ?? null);
}

export function getGwp(refrigerantId) {
  if (!refrigerantId) return null;
  const entry = GWP_DATASET.items.find(item => item.refrigerantId === refrigerantId || item.id === refrigerantId);
  return entry?.value ?? null;
}

export function listSafetyClasses() {
  return clone(SAFETY_CLASS_DATASET.items) ?? [];
}

export function getSafetyClass(safetyClassId) {
  if (!safetyClassId) return null;
  const item = SAFETY_CLASS_DATASET.items.find(entry => entry.id === safetyClassId);
  return clone(item ?? null);
}

export function listRegulations() {
  return clone(REGULATION_DATASET.rules) ?? [];
}

export function getApplicableRegulations() {
  return listRegulations();
}

export default Object.freeze({
  getDataVersions,
  getDataStatus,
  listRefrigerants,
  getRefrigerant,
  getGwp,
  listSafetyClasses,
  getSafetyClass,
  listRegulations,
  getApplicableRegulations
});
