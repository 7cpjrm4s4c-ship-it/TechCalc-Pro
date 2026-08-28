import assert from 'node:assert/strict';
import { calculate } from '../js/modules/f-gases-check/logic.js';
import { buildFGasesResultModel } from '../js/modules/f-gases-check/results.js';
import { formatRefrigerantLabel, getRefrigerant } from '../js/utils/refrigerants/index.js';

assert.equal(formatRefrigerantLabel(null), '');
assert.equal(formatRefrigerantLabel(getRefrigerant('HFKW-134a')), 'R134a');
assert.equal(formatRefrigerantLabel(getRefrigerant('HFKW-125')), 'R125');
assert.equal(formatRefrigerantLabel(getRefrigerant('R-404A')), 'R404A');
assert.equal(formatRefrigerantLabel(getRefrigerant('R-290')), 'R290 (Propan)');
assert.equal(formatRefrigerantLabel(getRefrigerant('R-717')), 'R717 (Ammoniak)');
assert.equal(formatRefrigerantLabel(getRefrigerant('R-744')), 'R744 (Kohlendioxid)');

const state = {
  applicationType: 'heat-pump',
  installationType: 'stationary',
  productCategory: 'self-contained-ac-heat-pump',
  constructionType: 'self-contained',
  ratedCapacityKw: '192.7',
  refrigerantId: 'R-404A',
  chargeKg: '24.4',
  placedOnMarketDate: '11.11.2029',
  commissioningDate: '11.11.2031',
  plannedActivity: 'installation',
  refrigerantOrigin: 'new',
  preChargedStatus: 'yes',
  hermeticallySealedStatus: 'no',
  hermeticallySealedLabelStatus: 'no',
  specificRefrigerantLossPercent: '0',
  personCertificationStatus: 'verified',
  companyCertificationStatus: 'verified'
};
const result = calculate(state);
assert.equal(result.checks.placingOnMarket, 'no-prohibition-found');
assert.equal(result.checks.service, 'prohibited');
const model = buildFGasesResultModel(state, result);
assert.equal(model.groups.find(group => group.title === 'Kältemittel und Klimawirkung').rows.find(row => row.label === 'Kältemittel').value, 'R404A');
assert.equal(model.primary.rows.find(row => row.label === 'Wartung / Instandhaltung').value, 'Serviceverbot vorhanden');

const emptyStateResult = buildFGasesResultModel({}, calculate({}));
assert.equal(emptyStateResult.groups.find(group => group.title === 'Kältemittel und Klimawirkung').rows.find(row => row.label === 'Kältemittel').value, '—');

console.log('F-Gases refrigerant labels, initial empty state and R404A legal-date regression passed.');
