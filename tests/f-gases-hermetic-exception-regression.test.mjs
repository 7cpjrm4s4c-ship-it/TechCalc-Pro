import assert from 'node:assert/strict';
import schema from '../modules/f-gases-check/schema.js';
import { initialState } from '../modules/f-gases-check/state.js';
import { calculate } from '../modules/f-gases-check/logic.js';
import { buildFGasesResultModel } from '../modules/f-gases-check/results.js';
import { buildFGasesReportDto } from '../modules/f-gases-check/reportAdapter.js';
import { buildFGasesReportSections } from '../core/pdf/fGasesReportSections.js';

const hermeticField = schema.fields.find(field => field.key === 'hermeticallySealedStatus');
assert.equal(hermeticField.label, 'Hermetisch geschlossene Einrichtung nach Art. 3 Nr. 9 VO (EU) 2024/573');
assert.equal(hermeticField.options.find(option => option.value === 'yes').label, 'Nachgewiesen');

const base = {
  applicationType: 'heat-pump', installationType: 'stationary', productCategory: 'self-contained-ac-heat-pump', constructionType: 'self-contained', ratedCapacityKw: '20',
  refrigerantId: 'R-513A', chargeKg: '24.4', placedOnMarketDate: '01.01.2028', commissioningDate: '01.06.2028', stockAssessmentDate: '01.06.2029', plannedActivity: 'maintenance',
  refrigerantOrigin: 'new', hermeticallySealedStatus: 'yes', hermeticallySealedLabelStatus: 'yes', specificRefrigerantLossPercent: '5', personCertificationStatus: 'verified', companyCertificationStatus: 'verified'
};
const result = calculate(base);
const loss = result.operatorDutyDetails.obligations.find(item => item.type === 'specific-refrigerant-loss');
assert.equal(loss.status, 'exception-applies');
assert.equal(loss.maximumPercent, null);
assert.equal(loss.legalSource, 'DE-CHEMKLIMA:§2(3)');
assert.equal(loss.exceptionReason, 'hermetically-sealed-and-labelled');

const operatorRows = buildFGasesResultModel(base, result).groups.find(group => group.title === 'Betreiberpflichten').rows;
assert.ok(operatorRows.some(row => row.label === 'Maximal zulässiger spezifischer Kältemittelverlust' && row.value === '§ 2 Abs. 1 nicht anwendbar'));
assert.ok(operatorRows.some(row => row.label === 'Begründung' && row.value.includes('§ 2 Abs. 3 ChemKlimaschutzV')));
assert.ok(!operatorRows.some(row => row.value === 'Ausnahme anwendbar'));

const dto = buildFGasesReportDto({ state: base, calculation: result, generatedAt: '2029-06-01T12:00:00.000Z' });
const pdfRows = buildFGasesReportSections(dto).find(section => section.title === '6. Betreiberpflichten').rows;
assert.ok(pdfRows.some(row => row[0] === 'Maximal zulässiger spezifischer Kältemittelverlust' && row[1] === '§ 2 Abs. 1 nicht anwendbar'));
assert.ok(pdfRows.some(row => row[0] === 'Rechtsgrundlage' && row[1] === '§ 2 Abs. 3 ChemKlimaschutzV'));

const nonHermetic = calculate({ ...base, hermeticallySealedStatus: 'no', hermeticallySealedLabelStatus: 'no' });
const nonHermeticLoss = nonHermetic.operatorDutyDetails.obligations.find(item => item.type === 'specific-refrigerant-loss');
assert.equal(nonHermeticLoss.status, 'applies');
assert.equal(nonHermeticLoss.maximumPercent, 2);

// ---------------------------------------------------------------------------
// Art. 5 Abs. 1 Unterabsatz 3 VO (EU) 2024/573: Wohngebäude-Ausnahme für
// hermetisch geschlossene, gekennzeichnete Einrichtungen < 3 kg (Anhang I).
// ---------------------------------------------------------------------------
const residentialField = schema.fields.find(field => field.key === 'installedInResidentialBuilding');
assert.ok(residentialField, 'neues Feld installedInResidentialBuilding muss im Schema existieren');
assert.deepEqual(residentialField.options.map(option => option.value), ['', 'yes', 'no', 'unknown']);
assert.deepEqual(residentialField.visibleWhen, { installationType: 'stationary', hermeticallySealedStatus: 'yes', hermeticallySealedLabelStatus: 'yes' }, 'Feld nur erforderlich bei ortsfest + hermetisch + gekennzeichnet');
assert.equal(initialState.installedInResidentialBuilding, '', 'Standardwert leer');

const residentialBase = {
  applicationType: 'heat-pump', installationType: 'stationary', productCategory: 'self-contained-ac-heat-pump', constructionType: 'self-contained', ratedCapacityKw: '20',
  chargeKg: '2.5', placedOnMarketDate: '01.01.2028', commissioningDate: '01.06.2028', stockAssessmentDate: '01.06.2029', plannedActivity: 'maintenance',
  refrigerantOrigin: 'new', hermeticallySealedStatus: 'yes', hermeticallySealedLabelStatus: 'yes', personCertificationStatus: 'verified', companyCertificationStatus: 'verified'
};
// HFKW-143a: Anhang I, GWP 4470 -> 2,5 kg = 11,175 t CO2-Äq. (>= 10 t): Unterabsatz-2-Ausnahme greift NICHT.
const highGwpCase = { ...residentialBase, refrigerantId: 'HFKW-143a' };
assert.equal(calculate(highGwpCase).co2EquivalentTonnes, 11.175);

// 1) Wohngebäude-Fall: Ausnahme nach Unterabsatz 3 -> keine Dichtheitsprüfpflicht
const residentialYes = calculate({ ...highGwpCase, installedInResidentialBuilding: 'yes' });
assert.equal(residentialYes.checks.leakCheck, 'exception-applies', 'Wohngebäude + hermetisch + < 3 kg: keine Prüfpflicht');
assert.equal(residentialYes.leakCheckDetails.required, false);
assert.equal(residentialYes.leakCheckDetails.intervalMonths, null);
assert.equal(residentialYes.leakCheckDetails.exceptionBasis, 'art-5-1-unterabsatz-3');
assert.deepEqual([...residentialYes.leakCheckDetails.missingInputs], []);
assert.ok(residentialYes.regulationEvaluation.some(entry => entry.rule.id === 'FG-011' && entry.status === 'matched' && entry.rule.effect === 'hermetic-threshold-exception'), 'FG-011 meldet die Ausnahme');
assert.ok(!residentialYes.regulationEvaluation.some(entry => entry.rule.id === 'FG-010' && entry.status === 'matched'), 'FG-010 (Prüfpflicht) darf nicht greifen');
assert.ok(!residentialYes.regulationEvaluation.some(entry => ['FG-012', 'FG-013', 'FG-014', 'FG-016', 'FG-017'].includes(entry.rule.id) && entry.status === 'matched'), 'Intervall-/Leckage-Erkennung-Regeln (FG-012..FG-017) dürfen bei Ausnahme nicht greifen');
assert.ok(!residentialYes.documentationDetails.obligations.some(item => item.type === 'leak-check-records'), 'FG-020 (Aufzeichnungen) entfällt ohne Prüfpflicht');
const residentialModel = buildFGasesResultModel({ ...highGwpCase, installedInResidentialBuilding: 'yes' }, residentialYes);
const leakGroup = residentialModel.groups.find(group => group.title === 'Dichtheitskontrolle');
assert.ok(leakGroup.rows.some(row => row.label === 'Bewertung' && row.value.includes('Art. 5 Abs. 1 Unterabsatz 3')), 'Ausnahme wird im UI-Klartext ausgewiesen');
assert.ok(leakGroup.rows.some(row => row.label === 'Rechtsgrundlage Ausnahme' && row.value.includes('Unterabsatz 3')));
const residentialDto = buildFGasesReportDto({ state: { ...highGwpCase, installedInResidentialBuilding: 'yes' }, calculation: residentialYes, generatedAt: '2029-06-01T12:00:00.000Z' });
const residentialPdfLeak = buildFGasesReportSections(residentialDto).find(section => section.title.startsWith('4.'));
assert.ok(residentialPdfLeak.rows.some(row => row[0] === 'Rechtsgrundlage Ausnahme' && String(row[1]).includes('Art. 5 Abs. 1 Unterabsatz 3')), 'PDF weist die Ausnahme nachvollziehbar aus');
assert.ok(buildFGasesReportSections(residentialDto).find(section => section.title.startsWith('2.')).rows.some(row => row[0] === 'In Wohngebäude installiert' && row[1] === 'ja'), 'PDF Abschnitt 2 zeigt die Angabe');

// 2) Gegenprobe: Nicht-Wohngebäude -> Prüfpflicht bleibt (12 Monate, da 11,175 t < 50 t)
const residentialNo = calculate({ ...highGwpCase, installedInResidentialBuilding: 'no' });
assert.equal(residentialNo.checks.leakCheck, 'required', 'residential=no: Dichtheitsprüfpflicht bleibt bestehen');
assert.equal(residentialNo.leakCheckDetails.intervalMonths, 12);
assert.equal(residentialNo.leakCheckDetails.exceptionBasis, null);
assert.deepEqual([...residentialNo.leakCheckDetails.missingInputs], []);

// 3) Unbekannt-Fall: keine Ausnahme, Klartext-Hinweis auf die fehlende Angabe
const residentialUnknown = calculate({ ...highGwpCase, installedInResidentialBuilding: 'unknown' });
assert.equal(residentialUnknown.checks.leakCheck, 'required', 'residential=unknown: konservativ keine Ausnahme');
assert.deepEqual([...residentialUnknown.leakCheckDetails.missingInputs], ['installedInResidentialBuilding']);
const unknownModel = buildFGasesResultModel({ ...highGwpCase, installedInResidentialBuilding: 'unknown' }, residentialUnknown);
const unknownNotice = unknownModel.notices.find(notice => notice.title === 'Unvollständige Bewertung');
assert.ok(unknownNotice, 'Hinweis auf unvollständige Bewertung muss erscheinen');
assert.ok(unknownNotice.messages.some(message => message.includes('„In Wohngebäude installiert“') && message.includes('Art. 5')), 'Klartext nennt das Feld und die Rechtsgrundlage');

// 4) R-410A 2,5 kg (Prompt-Beispiel): 5,22 t CO2-Äq. < 10 t -> Unterabsatz-2-Ausnahme (unverändert)
const r410a = calculate({ ...residentialBase, refrigerantId: 'R-410A', installedInResidentialBuilding: 'yes' });
assert.equal(r410a.co2EquivalentTonnes, 5.22);
assert.equal(r410a.checks.leakCheck, 'exception-applies');
assert.equal(r410a.leakCheckDetails.exceptionBasis, 'art-5-1-unterabsatz-2');

// 5) Anhang-II-Gruppe-1: Unterabsatz-3-Ausnahme nicht anwendbar; 2-kg-Ausnahme (Unterabsatz 5) unverändert
const annex2Case = { ...residentialBase, refrigerantId: 'HFKW-1234ze (E)', chargeKg: '2.5', installedInResidentialBuilding: 'yes' };
const annex2Required = calculate(annex2Case);
assert.equal(annex2Required.checks.leakCheck, 'required', 'Anhang II: Wohngebäude-Ausnahme (Unterabsatz 3) gilt nicht');
assert.equal(annex2Required.leakCheckDetails.intervalMonths, 12);
assert.equal(annex2Required.leakCheckDetails.exceptionBasis, null);
const annex2Small = calculate({ ...residentialBase, refrigerantId: 'HFKW-1234ze (E)', chargeKg: '1.5', installedInResidentialBuilding: 'no' });
assert.equal(annex2Small.checks.leakCheck, 'exception-applies', '2-kg-Hermetik-Ausnahme (Unterabsatz 5) bleibt unverändert');
assert.equal(annex2Small.leakCheckDetails.exceptionBasis, 'art-5-1-unterabsatz-5');

// 6) Nicht-hermetische ortsfeste Anlage: Verhalten exakt wie zuvor (keine Regression)
const nonHermeticRes = calculate({ ...highGwpCase, hermeticallySealedStatus: 'no', hermeticallySealedLabelStatus: 'no', installedInResidentialBuilding: 'yes' });
assert.equal(nonHermeticRes.checks.leakCheck, 'required');
assert.equal(nonHermeticRes.leakCheckDetails.intervalMonths, 12);
assert.deepEqual([...nonHermeticRes.leakCheckDetails.missingInputs], [], 'ohne Hermetik keine Wohngebäude-Abfrage');

// ---------------------------------------------------------------------------
// FG-063 (§ 2 Abs. 2 ChemKlimaschutzV): Hermetik-Ausschluss wie bei FG-060 (§ 2 Abs. 3)
// ---------------------------------------------------------------------------
const fg63Hermetic = calculate({ ...highGwpCase, installedInResidentialBuilding: 'yes' });
const fg63Exempt = fg63Hermetic.operatorDutyDetails.obligations.find(item => item.id === 'FG-063');
assert.ok(fg63Exempt, 'FG-063-Pflicht muss als Eintrag geführt werden');
assert.equal(fg63Exempt.status, 'exception-applies', 'hermetisch + gekennzeichnet: FG-063-Pflicht entfällt (§ 2 Abs. 3)');
assert.equal(fg63Exempt.legalSource, 'DE-CHEMKLIMA:§2(3)');
assert.equal(fg63Exempt.exceptionReason, 'hermetically-sealed-and-labelled');
const fg63Model = buildFGasesResultModel({ ...highGwpCase, installedInResidentialBuilding: 'yes' }, fg63Hermetic);
const dutyRows = fg63Model.groups.find(group => group.title === 'Betreiberpflichten').rows;
assert.ok(dutyRows.some(row => row.label === 'Zugang zu lösbaren Verbindungen' && row.value === '§ 2 Abs. 2 nicht anwendbar'), 'UI: FG-063-Ausnahme als „nicht anwendbar“ ausgewiesen');
assert.ok(dutyRows.some(row => row.label === 'Begründung' && row.value.includes('§ 2 Abs. 3 ChemKlimaschutzV')));
const fg63Dto = buildFGasesReportDto({ state: { ...highGwpCase, installedInResidentialBuilding: 'yes' }, calculation: fg63Hermetic, generatedAt: '2029-06-01T12:00:00.000Z' });
const fg63Pdf = buildFGasesReportSections(fg63Dto).find(section => section.title.startsWith('6.'));
assert.ok(fg63Pdf.rows.some(row => row[0] === 'Zugang zu lösbaren Verbindungen' && row[1] === '§ 2 Abs. 2 nicht anwendbar'), 'PDF: FG-063-Ausnahme ausgewiesen');
assert.ok(fg63Pdf.rows.some(row => row[0] === 'Rechtsgrundlage' && row[1] === '§ 2 Abs. 3 ChemKlimaschutzV'));

// Hermetisch ohne bestätigte Kennzeichnung: Pflicht bleibt mit bestehendem Status
const fg63NoLabel = calculate({ ...highGwpCase, hermeticallySealedLabelStatus: 'no' });
const fg63NoLabelDuty = fg63NoLabel.operatorDutyDetails.obligations.find(item => item.id === 'FG-063');
assert.equal(fg63NoLabelDuty.status, 'required-if-technically-possible-and-reasonable', 'unbestätigte Kennzeichnung: Pflicht bleibt bestehen');
// Nicht hermetisch: Pflicht bleibt (unverändert)
const fg63NotHermetic = calculate({ ...highGwpCase, hermeticallySealedStatus: 'no', hermeticallySealedLabelStatus: 'no' });
const fg63NotHermeticDuty = fg63NotHermetic.operatorDutyDetails.obligations.find(item => item.id === 'FG-063');
assert.equal(fg63NotHermeticDuty.status, 'required-if-technically-possible-and-reasonable', 'nicht hermetisch: Pflicht bleibt bestehen');

console.log('F-Gases hermetic exception regression passed.');
