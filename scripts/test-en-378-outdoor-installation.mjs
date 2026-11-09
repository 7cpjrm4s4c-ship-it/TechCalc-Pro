import assert from 'node:assert/strict';
import { assessChargeLimit } from '../modules/en-378-safety-check/chargeLimitCalculation.js';
import { assessInstallationSafetyRequirements } from '../modules/en-378-safety-check/installationSafetyRequirements.js';
import { calculate } from '../modules/en-378-safety-check/logic.js';
import { normalizeEN378StateTransition, EN378_EN60335_TRANSITION_FIELDS } from '../modules/en-378-safety-check/stateTransitions.js';

const base = {
  refrigerantId: 'R-32',
  chargeKg: '8',
  roomVolumeM3: '80',
  installationLocation: 'outdoor',
  installationClass: 'II',
  accessArea: 'general-access',
  usageType: 'industrial',
  applicationType: 'other',
  locationLevel: 'other',
  ventilationType: 'natural',
  isOutdoorDefinitionConfirmed: 'yes',
  outdoorSafeArrangement: 'yes',
  outdoorPreventBuildingEntry: 'yes',
  hasOutdoorProtectiveCover: 'no',
  outdoorRefrigerantAccumulationPossible: 'no',
};
const charge = assessChargeLimit(base);
const assessment = assessInstallationSafetyRequirements(base, charge);
const byId = id => assessment.requirements.find(item => item.id === id);
assert.equal(byId('outdoor.safe-arrangement')?.status, 'passed');
assert.equal(byId('outdoor.prevent-refrigerant-entry')?.status, 'passed');
assert.equal(byId('outdoor.refrigerant-accumulation')?.status, 'passed');
assert.equal(byId('outdoor.refrigerant-accumulation')?.status, 'passed', 'Nein bedeutet: keine Ansammlung, kein nicht erfüllter Prüfpunkt');
assert.equal(byId('outdoor.cover-ventilation'), undefined);
assert.equal(byId('outdoor.en378-2-6-2-14'), undefined);
assert.equal(byId('outdoor.ignition-sources'), undefined);
assert.equal(byId('outdoor.safe-arrangement')?.source?.sourceSection, '4.2');

const accumulationState = {
  ...base,
  outdoorRefrigerantAccumulationPossible: 'yes',
  outdoorEN3782_6_2_14EN60335Applicable: 'no',
  outdoorEN3782_6_2_14HazardousAreaConfirmed: 'yes',
  outdoorEN3782_6_2_14HazardousAreaEvidenceReference: 'Gefährdungsbeurteilung-01',
  outdoorEN3782_6_2_14ComponentAssessmentConfirmed: 'yes',
  outdoorEN3782_6_2_14ComponentAssessmentEvidenceReference: 'Komponentenbewertung-01',
  outdoorEN3782_6_2_14ProtectionConditionsConfirmed: 'yes',
  outdoorEN3782_6_2_14ProtectionEvidenceReference: 'Schutzmaßnahmen-01',
  outdoorEN3782_6_2_14AirflowProtectionUsed: 'no',
  outdoorEN3782_6_2_14SurfaceTemperatureConfirmed: 'yes',
  outdoorEN3782_6_2_14HazardousAreaExceedsEquipment: 'no'
};
const accumulationAssessment = assessInstallationSafetyRequirements(accumulationState, assessChargeLimit(accumulationState));
const byAccumulationId = id => accumulationAssessment.requirements.find(item => item.id === id);
assert.equal(byAccumulationId('outdoor.en378-2-6-2-14.hazardous-area')?.status, 'passed');
assert.equal(byAccumulationId('outdoor.en378-2-6-2-14.components')?.status, 'passed');
assert.equal(byAccumulationId('outdoor.en378-2-6-2-14.protection')?.status, 'passed');
assert.equal(byAccumulationId('outdoor.en378-2-6-2-14.surface-temperature')?.status, 'passed');
assert.equal(byAccumulationId('outdoor.en378-2-6-2-14.documentation-applicability')?.status, 'passed', 'Nein bedeutet: der entflammbare Bereich reicht nicht über das Gerät hinaus.');
assert.equal(byAccumulationId('outdoor.en378-2-6-2-14.documentation')?.status, undefined);
assert.equal(byAccumulationId('outdoor.en378-2-6-2-14.airflow-availability')?.status, undefined);
assert.ok(accumulationAssessment.requirements.filter(item => item.source?.sourceSection === '6.2.14').length >= 5);

const en60335State = {
  ...base,
  outdoorRefrigerantAccumulationPossible: 'yes',
  outdoorEN3782_6_2_14EN60335Applicable: 'yes',
  outdoorEN3782_6_2_14EN60335Compliant: 'yes',
  outdoorEN3782_6_2_14EN60335EvidenceReference: 'EN60335-Konformität-01'
};
const en60335Assessment = assessInstallationSafetyRequirements(en60335State, assessChargeLimit(en60335State));
assert.equal(en60335Assessment.requirements.find(item => item.id === 'outdoor.en378-2-6-2-14.en60335')?.status, 'passed');
assert.equal(en60335Assessment.requirements.some(item => item.id === 'outdoor.en378-2-6-2-14.components'), false);
assert.equal(en60335Assessment.requirements.some(item => item.id === 'outdoorEN3782_6_2_14EN60335EvidenceReference'), false, 'Eine eingetragene EN-60335-Nachweisreferenz darf nicht als offen erscheinen.');

const nonCompliantEN60335State = {
  ...base,
  outdoorRefrigerantAccumulationPossible: 'yes',
  outdoorEN3782_6_2_14EN60335Applicable: 'yes',
  outdoorEN3782_6_2_14EN60335Compliant: 'no'
};
const nonCompliantEN60335Assessment = assessInstallationSafetyRequirements(nonCompliantEN60335State, assessChargeLimit(nonCompliantEN60335State));
assert.equal(nonCompliantEN60335Assessment.requirements.find(item => item.id === 'outdoor.en378-2-6-2-14.en60335-compliance')?.status, 'not-applicable');
assert.equal(nonCompliantEN60335Assessment.requirements.find(item => item.id === 'outdoor.en378-2-6-2-14.hazardous-area')?.status, 'not-assessed');

const airflowState = {
  ...accumulationState,
  outdoorEN3782_6_2_14AirflowProtectionUsed: 'yes',
  outdoorEN3782_6_2_14AirflowAvailabilityConfirmed: 'no',
  outdoorEN3782_6_2_14AirflowInterlockConfirmed: 'yes'
};
const airflowAssessment = assessInstallationSafetyRequirements(airflowState, assessChargeLimit(airflowState));
assert.equal(airflowAssessment.requirements.find(item => item.id === 'outdoor.en378-2-6-2-14.airflow-availability')?.status, 'failed');
assert.equal(airflowAssessment.requirements.find(item => item.id === 'outdoor.en378-2-6-2-14.airflow-interlock')?.status, 'passed');

const documentationState = {
  ...accumulationState,
  outdoorEN3782_6_2_14HazardousAreaExceedsEquipment: 'yes',
  outdoorEN3782_6_2_14EquipmentDocumentationUpdated: 'no'
};
const documentationAssessment = assessInstallationSafetyRequirements(documentationState, assessChargeLimit(documentationState));
assert.equal(documentationAssessment.requirements.find(item => item.id === 'outdoor.en378-2-6-2-14.documentation')?.status, 'failed');

const coverState = {
  ...base,
  hasOutdoorProtectiveCover: 'yes',
  outdoorCoverVentilated: 'no'
};
const coverAssessment = assessInstallationSafetyRequirements(coverState, assessChargeLimit(coverState));
assert.equal(coverAssessment.requirements.find(item => item.id === 'outdoor.cover-ventilation')?.status, 'failed');

const openState = {
  ...base,
  isOutdoorDefinitionConfirmed: '',
  outdoorSafeArrangement: '',
  outdoorPreventBuildingEntry: '',
  hasOutdoorProtectiveCover: '',
  outdoorRefrigerantAccumulationPossible: ''
};
const openAssessment = assessInstallationSafetyRequirements(openState, assessChargeLimit(openState));
assert.equal(openAssessment.status, 'not-assessed');
assert.deepEqual(openAssessment.missingInputs, ['isOutdoorDefinitionConfirmed']);
const openCalculation = calculate(openState);
assert.equal(openCalculation.plannerGuidance.groups[0]?.id, 'openPoints');
assert.ok(openCalculation.plannerGuidance.groups.some(group => group.id === 'location' && group.items.some(item => item.id === 'outdoor.definition-confirmed')));
const openItems = openCalculation.plannerGuidance.groups.find(group => group.id === 'openPoints')?.items || [];
assert.equal(openItems.filter(item => item.id === 'outdoor.definition-confirmed').length, 1);
assert.equal(openItems.find(item => item.id === 'outdoor.definition-confirmed')?.title, 'Definition „im Freien“ bestätigt');
assert.equal(openCalculation.plannerGuidance.groups.find(group => group.id === 'location')?.items.filter(item => item.id === 'outdoor.definition-confirmed').length, 1);
assert.ok(!openAssessment.requirements.some(item => item.id === 'outdoor.refrigerant-accumulation'));
assert.ok(!openAssessment.requirements.some(item => item.id.startsWith('detector.')));
assert.ok(!openAssessment.requirements.some(item => item.id.startsWith('alarm.')));

const accumulationWithFailedPrerequisite = { ...base, outdoorPreventBuildingEntry: 'no', outdoorRefrigerantAccumulationPossible: 'yes' };
const blockedFollowUps = assessInstallationSafetyRequirements(accumulationWithFailedPrerequisite, assessChargeLimit(accumulationWithFailedPrerequisite));
assert.ok(!blockedFollowUps.requirements.some(item => item.id === 'outdoor.refrigerant-accumulation'));
assert.ok(!blockedFollowUps.requirements.some(item => item.id.startsWith('detector.')));


const ventilationState = {
  ...accumulationState,
  ventilationType: 'mechanical',
  outdoorVentilationGeneralConfirmed: 'yes',
  outdoorVentilationNationalRulesConfirmed: 'yes',
  outdoorMechanicalVentilationOpeningsConfirmed: 'no'
};
const ventilationAssessment = assessInstallationSafetyRequirements(ventilationState, assessChargeLimit(ventilationState));
assert.equal(ventilationAssessment.requirements.find(item => item.id === 'outdoor.ventilation-general')?.status, 'passed');
assert.equal(ventilationAssessment.requirements.find(item => item.id === 'outdoor.ventilation-national-rules')?.status, 'passed');
assert.equal(ventilationAssessment.requirements.find(item => item.id === 'outdoor.mechanical-ventilation-openings')?.status, 'failed');
assert.equal(ventilationAssessment.requirements.find(item => item.id === 'outdoor.mechanical-ventilation-openings')?.source?.sourceSection, '5.13.5');

const noMechanicalVentilationState = {
  ...accumulationState,
  ventilationType: 'natural',
  outdoorVentilationGeneralConfirmed: 'yes',
  outdoorVentilationNationalRulesConfirmed: 'yes'
};
const noMechanicalVentilationAssessment = assessInstallationSafetyRequirements(noMechanicalVentilationState, assessChargeLimit(noMechanicalVentilationState));
assert.equal(noMechanicalVentilationAssessment.requirements.find(item => item.id === 'outdoor.mechanical-ventilation-openings'), undefined);
assert.equal(noMechanicalVentilationAssessment.requirements.find(item => item.id === 'outdoor.mechanical-ventilation-applicability'), undefined);

const undeterminedMechanicalVentilationState = {
  ...accumulationState,
  ventilationType: '',
  outdoorVentilationGeneralConfirmed: 'yes',
  outdoorVentilationNationalRulesConfirmed: 'yes'
};
const undeterminedMechanicalVentilationAssessment = assessInstallationSafetyRequirements(undeterminedMechanicalVentilationState, assessChargeLimit(undeterminedMechanicalVentilationState));
assert.equal(undeterminedMechanicalVentilationAssessment.requirements.find(item => item.id === 'outdoor.mechanical-ventilation-applicability'), undefined);
assert.equal(undeterminedMechanicalVentilationAssessment.requirements.find(item => item.id === 'outdoor.mechanical-ventilation-openings'), undefined);

const calculation = calculate(base);
assert.equal(calculation.effectiveState.chargeKg, '8');
assert.ok(calculation.installationSafetyAssessment.requirements.some(item => item.id === 'outdoor.safe-arrangement'));

const staleEN60335State = {
  outdoorEN3782_6_2_14EN60335Applicable: 'no',
  outdoorEN3782_6_2_14EN60335Compliant: 'no',
  outdoorEN3782_6_2_14EN60335EvidenceReference: 'alte-konformitaet.pdf',
  ...Object.fromEntries(EN378_EN60335_TRANSITION_FIELDS.map(field => [field, 'yes']))
};
const switchToApplicable = normalizeEN378StateTransition(
  staleEN60335State,
  { outdoorEN3782_6_2_14EN60335Applicable: 'yes' },
  { action: 'field:input:select' }
);
assert.equal(switchToApplicable.outdoorEN3782_6_2_14EN60335Applicable, 'yes');
for (const field of EN378_EN60335_TRANSITION_FIELDS) {
  assert.equal(switchToApplicable[field], '', `Wechsel auf EN 60335 = Ja muss ${field} zurücksetzen.`);
}

const staleCompliantState = {
  ...staleEN60335State,
  outdoorEN3782_6_2_14EN60335Applicable: 'yes',
  outdoorEN3782_6_2_14EN60335Compliant: 'no'
};
const switchToCompliant = normalizeEN378StateTransition(
  staleCompliantState,
  { outdoorEN3782_6_2_14EN60335Compliant: 'yes' },
  { action: 'field:change:immediate' }
);
for (const field of EN378_EN60335_TRANSITION_FIELDS.filter(field => !['outdoorEN3782_6_2_14EN60335Compliant', 'outdoorEN3782_6_2_14EN60335EvidenceReference'].includes(field))) {
  assert.equal(switchToCompliant[field], '', `Wechsel auf EN 60335-konform = Ja muss ${field} zurücksetzen.`);
}

const switchToNotApplicable = normalizeEN378StateTransition(
  staleCompliantState,
  { outdoorEN3782_6_2_14EN60335Applicable: 'no' },
  { action: 'field:input:select' }
);
assert.equal(switchToNotApplicable.outdoorEN3782_6_2_14EN60335Compliant, '');
assert.equal(switchToNotApplicable.outdoorEN3782_6_2_14EN60335EvidenceReference, '');
for (const field of EN378_EN60335_TRANSITION_FIELDS.filter(field => !['outdoorEN3782_6_2_14EN60335Compliant', 'outdoorEN3782_6_2_14EN60335EvidenceReference'].includes(field))) {
  assert.equal(switchToNotApplicable[field], '');
}

const hydratedEN60335State = normalizeEN378StateTransition(
  {},
  { ...staleEN60335State },
  { action: 'line:select' }
);
assert.deepEqual(hydratedEN60335State, staleEN60335State, 'Gespeicherte Datensätze müssen ohne interaktive Bereinigung geladen werden.');

const unrelatedCommit = normalizeEN378StateTransition(
  staleEN60335State,
  { chargeKg: '9' },
  { action: 'field:input:select' }
);
assert.deepEqual(unrelatedCommit, { chargeKg: '9' }, 'Unabhängige Eingaben dürfen keine EN-60335-Felder verändern.');

console.log('EN 378 outdoor installation section 4.2 tests passed.');
