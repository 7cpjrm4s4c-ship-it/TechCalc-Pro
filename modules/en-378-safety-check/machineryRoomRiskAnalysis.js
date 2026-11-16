/**
 * Machinery Room Risk Analysis per EN 378-3:2020-12, Section 4.3
 * Specification: docs/contracts/en378/machinery-room-risk-analysis.md
 */

import { getEN378SafetyData } from '../../core/data/index.js';

export const MACHINERY_ROOM_RISK_ANALYSIS_VERSION = 1;

const text = value => String(value ?? '').trim();
const numberOrNull = value => {
  if (value === '' || value == null) return null;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};
const yes = value => value === 'yes';
const hasValue = value => text(value).length > 0;

/**
 * Field list for 5.1-5.14 machinery room requirements
 */
export const MACHINERY_ROOM_5_1_TO_5_14_FIELDS = Object.freeze([
  'machineryRoomLargestSystemChargeKg',
  'hasEmergencyVentilation',
  'hasEmergencyVentilationControlInside',
  'hasEmergencyVentilationControlOutside',
  'hasEmergencyStopInside',
  'hasEmergencyStopOutside',
  'hasEmergencyLighting',
  'hasDetector',
  'hasAlarm',
  'hasIndependentAlarmPower',
  'hasSafetyShutoffValves',
  'hasVentilationOpenings',
  'hasExplosionProtectedElectricalEquipment'
]);

/**
 * Hinweistext A: Keine Risikoanalyse vorhanden
 */
export const HINWEIS_A = 'Für die Bewertung des Aufstellortes 4.3 liegt keine Risikoanalyse vor. Eine normative Bewertung als Maschinenraum kann daher nicht abgeschlossen werden. Bitte vervollständige die Risikoanalyse oder wähle einen alternativen Aufstellort gemäß DIN EN 378-3.';

/**
 * Hinweistext B: Kein Maschinenraum erforderlich
 */
export const HINWEIS_B = 'Die Risikoanalyse ergibt, dass kein separater Maschinenraum erforderlich ist. Bitte wähle einen alternativen Aufstellort gemäß DIN EN 378-3, Abschnitt 4.4, 4.5 oder 4.6.';

/**
 * Planerhinweis für Maschinenraumbewertung
 */
export const MACHINERY_ROOM_NOTICE = 'Ein begehbares Gehäuse, das groß genug ist, um von Personen betreten zu werden, ist als Maschinenraum zu bewerten (EN 378-3, 4.3, Anmerkung 3).';

/**
 * Assess machinery room risk analysis status
 * @param {Object} state - Current form state
 * @returns {Object} Assessment result with status and details
 */
export function assessMachineryRoomRiskAnalysis(state = {}) {
  const installationLocation = text(state.installationLocation);
  const riskAnalysisStatus = text(state.machineryRoomRiskAnalysisStatus);
  const riskAnalysisResult = text(state.machineryRoomRiskAnalysisResult);

  // Pfad nicht aktiv, wenn nicht machinery-room
  if (installationLocation !== 'machinery-room') {
    return Object.freeze({
      status: 'open',
      result: null,
      isApplicable: false,
      hintText: null,
      notices: Object.freeze([])
    });
  }

  // Status 'absent' (leer) oder nicht vorhanden
  if (riskAnalysisStatus !== 'present') {
    return Object.freeze({
      status: 'open',
      result: null,
      isApplicable: true,
      hintText: HINWEIS_A,
      notices: Object.freeze([MACHINERY_ROOM_NOTICE])
    });
  }

  // Status 'present' aber Ergebnis offen
  if (riskAnalysisResult === '') {
    return Object.freeze({
      status: 'open',
      result: null,
      isApplicable: true,
      hintText: null,
      notices: Object.freeze([MACHINERY_ROOM_NOTICE])
    });
  }

  // Ergebnis 'yes' - Maschinenraum erforderlich
  if (riskAnalysisResult === 'yes') {
    return Object.freeze({
      status: 'required',
      result: 'yes',
      isApplicable: true,
      hintText: null,
      notices: Object.freeze([MACHINERY_ROOM_NOTICE])
    });
  }

  // Ergebnis 'no' - kein Maschinenraum erforderlich
  if (riskAnalysisResult === 'no') {
    return Object.freeze({
      status: 'not-required',
      result: 'no',
      isApplicable: true,
      hintText: HINWEIS_B,
      notices: Object.freeze([MACHINERY_ROOM_NOTICE])
    });
  }

  // Fallback
  return Object.freeze({
    status: 'open',
    result: null,
    isApplicable: true,
    hintText: null,
    notices: Object.freeze([])
  });
}

/**
 * Check for conditional requirement: below-grade detector and alarm
 * EN 378-3:2020-12, 4.3: "Bei Anlagen unter Erdgleiche mit brennbaren Kältemitteln 
 * der Klasse 3 und einer Füllmenge von mehr als m2 muss ein zusätzlicher Gasdetektor 
 * und ein akustischer/visueller Alarm eingesetzt werden"
 * m2 = 26 * LFL (EN 378-1:2021-06, Anhang C)
 */
export function assessBelowGradeDetectorAlarm(state = {}) {
  const locationLevel = text(state.locationLevel);
  const isBasementLocation = text(state.isBasementLocation);
  const refrigerantId = text(state.refrigerantId);
  const chargeKg = numberOrNull(state.chargeKg);

  // Check if below grade
  const isBelowGrade = locationLevel === 'underground' ||
    locationLevel === 'deepest-underground' ||
    (locationLevel === 'upper-no-emergency-exit-or-basement' && isBasementLocation === 'yes');

  if (!isBelowGrade) {
    return null; // Not applicable
  }

  // Get safety data for flammability class and LFL
  const safetyData = refrigerantId ? getEN378SafetyData(refrigerantId) : null;
  const flammabilityClass = safetyData?.flammabilityClass;
  const lflKgM3 = numberOrNull(safetyData?.lflKgM3);

  // Check if flammability class is 3
  if (flammabilityClass !== '3') {
    return null; // Not applicable
  }

  // Check if LFL is available
  if (lflKgM3 == null || lflKgM3 <= 0) {
    return Object.freeze({
      id: 'machinery-room.below-grade-detector-alarm',
      category: 'machineryRoom',
      title: 'Zusätzlicher Gasdetektor und Alarm bei unterirdischer Aufstellung',
      requirement: 'Bei Anlagen unter Erdgleiche mit brennbaren Kältemitteln der Klasse 3 und einer Füllmenge von mehr als m2 muss ein zusätzlicher Gasdetektor und ein akustischer/visueller Alarm eingesetzt werden.',
      measure: 'Zusätzlichen Gasdetektor und akustischen/visuellen Alarm vorsehen und nachweisen.',
      status: 'not-assessed',
      priority: 'required',
      source: Object.freeze({ sourcePart: 'DIN EN 378-3', sourceSection: '2020-12, 4.3' }),
      missingInputs: Object.freeze(['lflKgM3']),
      details: Object.freeze({ reason: 'LFL-Wert für das ausgewählte Kältemittel fehlt' })
    });
  }

  // Calculate m2 = 26 * LFL
  const m2 = 26 * lflKgM3;

  // Check if chargeKg > m2
  if (chargeKg == null || chargeKg <= 0) {
    return Object.freeze({
      id: 'machinery-room.below-grade-detector-alarm',
      category: 'machineryRoom',
      title: 'Zusätzlicher Gasdetektor und Alarm bei unterirdischer Aufstellung',
      requirement: `Bei Anlagen unter Erdgleiche mit brennbaren Kältemitteln der Klasse 3 und einer Füllmenge von mehr als ${m2.toFixed(3)} kg muss ein zusätzlicher Gasdetektor und ein akustischer/visueller Alarm eingesetzt werden.`,
      measure: 'Zusätzlichen Gasdetektor und akustischen/visuellen Alarm vorsehen und nachweisen.',
      status: 'not-assessed',
      priority: 'required',
      source: Object.freeze({ sourcePart: 'DIN EN 378-3', sourceSection: '2020-12, 4.3' }),
      missingInputs: Object.freeze(['chargeKg']),
      details: Object.freeze({ m2: round(m2, 3), thresholdExceeded: false })
    });
  }

  const thresholdExceeded = chargeKg > m2;

  return Object.freeze({
    id: 'machinery-room.below-grade-detector-alarm',
    category: 'machineryRoom',
    title: 'Zusätzlicher Gasdetektor und Alarm bei unterirdischer Aufstellung',
    requirement: `Bei Anlagen unter Erdgleiche mit brennbaren Kältemitteln der Klasse 3 und einer Füllmenge von mehr als ${m2.toFixed(3)} kg muss ein zusätzlicher Gasdetektor und ein akustischer/visueller Alarm eingesetzt werden (m2 = 26 m³ × LFL = ${m2.toFixed(3)} kg).`,
    measure: thresholdExceeded ? 'Zusätzlichen Gasdetektor und akustischen/visuellen Alarm nachweisen.' : 'Keine zusätzliche Maßnahme erforderlich (Füllmenge ≤ m2).',
    status: thresholdExceeded ? 'required' : 'passed',
    priority: 'required',
    source: Object.freeze({ sourcePart: 'DIN EN 378-3', sourceSection: '2020-12, 4.3' }),
    missingInputs: Object.freeze([]),
    details: Object.freeze({ m2: round(m2, 3), thresholdExceeded, lflKgM3: round(lflKgM3, 6) })
  });
}

function round(value, digits = 3) {
  if (!Number.isFinite(value)) return null;
  return Number(value.toFixed(digits));
}

export default {
  assessMachineryRoomRiskAnalysis,
  assessBelowGradeDetectorAlarm,
  MACHINERY_ROOM_5_1_TO_5_14_FIELDS,
  HINWEIS_A,
  HINWEIS_B,
  MACHINERY_ROOM_NOTICE
};
