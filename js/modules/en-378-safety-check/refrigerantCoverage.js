import { getEN378SafetyData, listRefrigerants } from '../../utils/refrigerants/index.js';

export const EN_378_REFRIGERANT_COVERAGE_VERSION = 1;

export function listFGasesEN378Coverage() {
  return Object.freeze(listRefrigerants().map(refrigerant => {
    const safetyData = getEN378SafetyData(refrigerant.id);
    return Object.freeze({
      refrigerantId: refrigerant.id,
      label: refrigerant.name || refrigerant.id,
      group: refrigerant.group || '',
      isFGasRelevant: Boolean(refrigerant.regulatory?.fluorinatedGreenhouseGas),
      hasEN378SafetyData: Boolean(safetyData),
      safetyClass: safetyData?.safetyClass || '',
      sourceTable: safetyData?.table || ''
    });
  }));
}

export function getUnsupportedFGasesRefrigerants() {
  return Object.freeze(listFGasesEN378Coverage()
    .filter(entry => entry.isFGasRelevant && !entry.hasEN378SafetyData));
}

export function getUnsupportedEN378Refrigerants() {
  return Object.freeze(listFGasesEN378Coverage()
    .filter(entry => !entry.hasEN378SafetyData));
}

export function canAssessRefrigerantWithEN378(refrigerantId) {
  return Boolean(getEN378SafetyData(refrigerantId));
}

export function assertFGasesEN378Coverage() {
  const unsupported = getUnsupportedFGasesRefrigerants();
  if (unsupported.length) {
    throw new Error(`EN-378-Sicherheitsdaten fehlen für F-Gase-Kältemittel: ${unsupported.map(item => item.refrigerantId).join(', ')}`);
  }
  return true;
}

export default Object.freeze({
  EN_378_REFRIGERANT_COVERAGE_VERSION,
  listFGasesEN378Coverage,
  getUnsupportedFGasesRefrigerants,
  getUnsupportedEN378Refrigerants,
  canAssessRefrigerantWithEN378,
  assertFGasesEN378Coverage
});
