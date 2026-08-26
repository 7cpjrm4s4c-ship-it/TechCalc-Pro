import { getApplicableRegulations, getDataStatus, getDataVersions, getGwp, getRefrigerant } from '../../utils/refrigerants/index.js';

function finiteNumber(value) {
  if (value == null || String(value).trim() === '') return null;
  const normalized = typeof value === 'string' ? value.replace(',', '.') : value;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

export function calculate(snapshot = {}) {
  const refrigerant = getRefrigerant(snapshot.refrigerantId);
  const gwp = getGwp(snapshot.refrigerantId);
  const chargeKg = finiteNumber(snapshot.chargeKg);
  const dataStatus = getDataStatus();
  const dataVersions = getDataVersions();
  const canCalculateCo2Equivalent = chargeKg != null && gwp != null;

  return Object.freeze({
    status: canCalculateCo2Equivalent ? 'calculated' : 'not-specified',
    refrigerant,
    gwp,
    chargeKg,
    co2EquivalentTonnes: canCalculateCo2Equivalent ? (chargeKg * gwp) / 1000 : null,
    applicableRegulations: getApplicableRegulations(snapshot),
    dataStatus,
    dataVersions,
    checks: Object.freeze({
      placingOnMarket: 'not-specified',
      service: 'not-specified',
      leakCheck: 'not-specified',
      documentation: 'not-specified',
      certification: 'not-specified',
      operatorDuties: 'not-specified'
    })
  });
}

export default calculate;
