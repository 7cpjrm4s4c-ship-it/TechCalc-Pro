import { getDataVersions } from '../utils/refrigerants/index.js';

export const F_GASES_SYSTEM_SNAPSHOT_VERSION = 4;
const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
const numberOrNull = value => value === '' || value == null ? null : Number(String(value).replace(',', '.'));

export function createFGasesSystemSnapshot(state = {}, { generatedAt = new Date().toISOString() } = {}) {
  return Object.freeze({
    snapshotType: 'techcalc.f-gases.system',
    snapshotVersion: F_GASES_SYSTEM_SNAPSHOT_VERSION,
    generatedAt,
    moduleId: 'f-gases-check',
    dataVersions: clone(state.dataVersions ?? getDataVersions()),
    system: {
      systemName: state.systemName || '', applicationType: state.applicationType || '', installationType: state.installationType || '',
      mobileEquipmentType: state.mobileEquipmentType || '', productCategory: state.productCategory || '', constructionType: state.constructionType || '', splitType: state.splitType || '',
      performanceRange: state.performanceRange || '', ratedCapacityKw: numberOrNull(state.ratedCapacityKw), refrigerantId: state.refrigerantId || '', chargeKg: numberOrNull(state.chargeKg),
      assessmentDate: state.assessmentDate || '', placedOnMarketDate: state.placedOnMarketDate || '', installedAtSiteDate: state.installedAtSiteDate || '', plannedActivity: state.plannedActivity || '',
      refrigerantOrigin: state.refrigerantOrigin || '', preChargedStatus: state.preChargedStatus || '', leakDetectionSystemStatus: state.leakDetectionSystemStatus || '',
      hermeticallySealedStatus: state.hermeticallySealedStatus || '', hermeticallySealedLabelStatus: state.hermeticallySealedLabelStatus || '', coolingBelowMinus50Status: state.coolingBelowMinus50Status || '',
      siteSafetyRestrictionStatus: state.siteSafetyRestrictionStatus || '', nationalSafetyStandardRestrictionStatus: state.nationalSafetyStandardRestrictionStatus || '', cascadePrimaryCircuitStatus: state.cascadePrimaryCircuitStatus || '',
      specificRefrigerantLossPercent: numberOrNull(state.specificRefrigerantLossPercent), personCertificationStatus: state.personCertificationStatus || '', companyCertificationStatus: state.companyCertificationStatus || ''
    }
  });
}

export default createFGasesSystemSnapshot;
