import { getDataVersions } from '../utils/refrigerants/index.js';

export const F_GASES_SYSTEM_SNAPSHOT_VERSION = 3;

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
      applicationType: state.applicationType || '',
      installationType: state.installationType || '',
      productCategory: state.productCategory || '',
      constructionType: state.constructionType || '',
      splitType: state.splitType || '',
      performanceRange: state.performanceRange || '',
      ratedCapacityKw: state.ratedCapacityKw === '' || state.ratedCapacityKw == null ? null : Number(state.ratedCapacityKw),
      refrigerantId: state.refrigerantId || '',
      chargeKg: state.chargeKg === '' || state.chargeKg == null ? null : Number(state.chargeKg),
      assessmentDate: state.assessmentDate || '',
      placedOnMarketDate: state.placedOnMarketDate || '',
      plannedActivity: state.plannedActivity || '',
      refrigerantOrigin: state.refrigerantOrigin || '',
      preChargedStatus: state.preChargedStatus || '',
      leakDetectionSystemStatus: state.leakDetectionSystemStatus || '',
      hermeticallySealedStatus: state.hermeticallySealedStatus || '',
      hermeticallySealedLabelStatus: state.hermeticallySealedLabelStatus || '',
      coolingBelowMinus50Status: state.coolingBelowMinus50Status || '',
      siteSafetyRestrictionStatus: state.siteSafetyRestrictionStatus || '',
      nationalSafetyStandardRestrictionStatus: state.nationalSafetyStandardRestrictionStatus || '',
      cascadePrimaryCircuitStatus: state.cascadePrimaryCircuitStatus || '',
      specificRefrigerantLossPercent: state.specificRefrigerantLossPercent === '' || state.specificRefrigerantLossPercent == null ? null : Number(state.specificRefrigerantLossPercent),
      personCertificationStatus: state.personCertificationStatus || '',
      companyCertificationStatus: state.companyCertificationStatus || ''
    }
  };

  return Object.freeze(snapshot);
}

export default createFGasesSystemSnapshot;
