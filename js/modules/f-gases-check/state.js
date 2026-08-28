import { createModuleState } from '../../core/state.js';
import { getDataVersions } from '../../utils/refrigerants/index.js';

export const F_GASES_SCHEMA_VERSION = 5;

export const initialState = Object.freeze({
  schemaVersion: F_GASES_SCHEMA_VERSION,
  systemName: '',
  applicationType: '',
  installationType: '',
  mobileEquipmentType: '',
  productCategory: '',
  constructionType: '',
  splitType: '',
  performanceRange: '',
  ratedCapacityKw: '',
  refrigerantId: '',
  chargeKg: '',
  placedOnMarketDate: '',
  commissioningDate: '',
  stockAssessmentDate: '',
  plannedActivity: 'installation',
  refrigerantOrigin: '',
  preChargedStatus: '',
  leakDetectionSystemStatus: '',
  hermeticallySealedStatus: '',
  hermeticallySealedLabelStatus: '',
  coolingBelowMinus50Status: '',
  siteSafetyRestrictionStatus: '',
  nationalSafetyStandardRestrictionStatus: '',
  cascadePrimaryCircuitStatus: '',
  specificRefrigerantLossPercent: '',
  personCertificationStatus: '',
  companyCertificationStatus: '',
  savedSystems: Object.freeze([]),
  activeSavedSystemId: null,
  expandedSavedSystemId: null,
  savedSystemName: '',
  dataVersions: getDataVersions()
});

export const state = createModuleState(initialState, { moduleId: 'f-gases-check' });
export default state;
