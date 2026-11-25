import assert from 'node:assert/strict';

import pressureHoldingModule from '../modules/pressure-holding/index.js';
import { calculate } from '../modules/pressure-holding/logic.js';
import { buildPressureRecord } from '../modules/pressure-holding/controller.js';
import { reportSections } from '../core/pdf/pdfDataMapping.js';

const baseState = {
  plantName: 'Test Heizung',
  systemType: 'heating',
  holdingType: 'dynamic',
  dynamicType: 'reflexomat',
  heatPowerKw: 250,
  systemVolumeL: '16.000',
  additionalVolumeL: 0,
  waterContentMode: 'manual',
  specificWaterContent: 15,
  frostMode: 'water',
  tMaxC: 80,
  tMinC: 10,
  staticHeightM: 15,
  staticPressureBar: 1.5,
  safetyValveBar: 3,
  connectionType: 'default',
  pumpPressureBar: 0,
  includeServitec: 'false'
};

function germanInteger(value) {
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(value);
}

const result = calculate(baseState);
assert.equal(result.systemVolume, 16000, 'calculation must use 16.000 l as 16,000 litres');
assert.ok(result.selectedStandardVolume > 0, 'calculation must determine a standard vessel volume');

const expectedStandardRaw = String(Math.round(result.selectedStandardVolume));
const expectedStandardPdf = germanInteger(result.selectedStandardVolume);

const record = buildPressureRecord(baseState, result, [], 'pressure-test', 'Test Heizung');
assert.equal(record.result.systemVolume, 16000, 'saved pressure record must preserve the litre value used by the calculation');
assert.equal(record.result.selectedStandardVolume, result.selectedStandardVolume, 'saved pressure record must preserve the calculated standard vessel volume');
assert.ok(record.rows.some(row => row[0] === 'Anlagenvolumen' && row[1] === '16000' && row[2] === 'l'));
assert.ok(record.rows.some(row => row[0] === 'Standardvolumen' && row[1] === expectedStandardRaw && row[2] === 'l'));
assert.ok(record.rows.some(row => row[0] === 'Ausdehnungskoeffizient'));
assert.ok(record.rows.some(row => row[0] === 'Ausdehnungsvolumen'));
assert.ok(record.rows.some(row => row[0] === 'Wasservorlage'));
assert.ok(record.rows.some(row => row[0] === 'Volumenfaktor'));

pressureHoldingModule.calculate(baseState);
const dto = pressureHoldingModule.report({ ...baseState, savedPlants: [record] });
const sections = reportSections({
  id: 'pressure-holding',
  title: 'Druckhaltung',
  shortTitle: 'Druckhaltung',
  reportDto: dto,
  reportSource: 'typed-dto'
});
// After Review-Runde 2 req 4: each saved record is split into Druckhaltung and accessory blocks
const druckhaltungSection = sections.find(section => section.isLineSection && section.title.includes('Druckhaltung'));
assert.ok(druckhaltungSection, 'saved pressure records must have Druckhaltung section');
const rows = druckhaltungSection.rows;
assert.ok(rows.some(row => row[0] === 'Anlagenvolumen' && row[1] === '16.000' && row[2] === 'l'));
assert.ok(rows.some(row => row[0] === 'Standardvolumen' && row[1] === expectedStandardPdf && row[2] === 'l'));
assert.ok(rows.some(row => row[0] === 'Ausdehnungskoeffizient'));
assert.ok(rows.some(row => row[0] === 'Verdampfungsdruck'));
assert.ok(rows.some(row => row[0] === 'Verwendeter statischer Druck'));

// After Workshop-Ergebnis: PDF-Blockstruktur - each accessory is a separate block
// Check that accessory blocks exist (Entgasung, Nachspeisung, Wasseraufbereitung, Sicherheitsventil)
const entgasungSection = sections.find(section => section.isLineSection && section.title.includes('Entgasung'));
const nachspeisungSection = sections.find(section => section.isLineSection && section.title.includes('Nachspeisung'));
const wasseraufbereitungSection = sections.find(section => section.isLineSection && section.title.includes('Wasseraufbereitung'));
const sicherheitsventilSection = sections.find(section => section.isLineSection && section.title.includes('Sicherheitsventil'));

// At least one accessory block should exist (Sicherheitsventil is always present)
assert.ok(sicherheitsventilSection, 'saved pressure records must have Sicherheitsventil section');

// Verify that the accessory blocks are in the correct order after Druckhaltung
const druckhaltungIndex = sections.findIndex(s => s.isLineSection && s.title.includes('Druckhaltung'));
const entgasungIndex = sections.findIndex(s => s.isLineSection && s.title.includes('Entgasung'));
const nachspeisungIndex = sections.findIndex(s => s.isLineSection && s.title.includes('Nachspeisung'));
const wasseraufbereitungIndex = sections.findIndex(s => s.isLineSection && s.title.includes('Wasseraufbereitung'));
const sicherheitsventilIndex = sections.findIndex(s => s.isLineSection && s.title.includes('Sicherheitsventil'));

// All accessory blocks should come after Druckhaltung
if (entgasungIndex >= 0) assert.ok(entgasungIndex > druckhaltungIndex, 'Entgasung block should come after Druckhaltung');
if (nachspeisungIndex >= 0) assert.ok(nachspeisungIndex > druckhaltungIndex, 'Nachspeisung block should come after Druckhaltung');
if (wasseraufbereitungIndex >= 0) assert.ok(wasseraufbereitungIndex > druckhaltungIndex, 'Wasseraufbereitung block should come after Druckhaltung');
assert.ok(sicherheitsventilIndex > druckhaltungIndex, 'Sicherheitsventil block should come after Druckhaltung');

// ============================================================================
// Runde 8: Hinweise block tests
// ============================================================================

// Test with state that has accessories with notes
const stateWithNotes = {
  plantName: 'Test mit Hinweisen',
  systemType: 'heating',
  holdingType: 'mag',
  useServitec: 'true',
  connectionType: 'suction',
  waterContentMode: 'known',
  systemVolumeL: '500',
  additionalVolumeL: '',
  frostMode: 'water',
  tMaxC: '50',
  tMinC: '10',
  staticHeightM: '10',
  staticPressureBar: '',
  pumpPressureBar: '',
  safetyValveBar: '3',
  dynamicType: 'reflexomat',
  feedType: 'auto',
  feedPressureBar: '3.0',
  systemSeparation: 'systemSeparator',
  feedLineLengthM: '15', // >= 10m triggers note
  waterTreatmentMethod: 'softening',
  regionalWaterHardness: '15',
  heatPowerKw: '3000'
};

const resultWithNotes = calculate(stateWithNotes);
const recordWithNotes = buildPressureRecord(stateWithNotes, resultWithNotes, [], 'test-with-notes', 'Test mit Hinweisen');

pressureHoldingModule.calculate(stateWithNotes);
const dtoWithNotes = pressureHoldingModule.report({ ...stateWithNotes, savedPlants: [recordWithNotes] });
const sectionsWithNotes = reportSections({
  id: 'pressure-holding',
  title: 'Druckhaltung',
  shortTitle: 'Druckhaltung',
  reportDto: dtoWithNotes,
  reportSource: 'typed-dto'
});

// Test 1: Report-DTO contains "Hinweise" block with all expected notes
const hinweiseSection = sectionsWithNotes.find(s => s.isLineSection && s.title === 'Hinweise');
assert.ok(hinweiseSection, 'Report-DTO must contain Hinweise section when notes exist (Auftrag A - Runde 8)');

if (hinweiseSection) {
  // Test 2: Notes are prefixed with block names
  const noteRows = hinweiseSection.rows || [];
  assert.ok(noteRows.length > 0, 'Hinweise section must contain note rows');
  
  // Check that at least one note has a block name prefix
  const notesWithPrefix = noteRows.filter(row => 
    row[1] && (row[1].includes('Sprührohrentgaser:') || 
               row[1].includes('Nachspeiseeinrichtung:') || 
               row[1].includes('Wasseraufbereitung:') || 
               row[1].includes('Sicherheitsventil:'))
  );
  assert.ok(notesWithPrefix.length > 0, 'Notes must be prefixed with block names (Auftrag A - Runde 8)');
  
  // Test 3: Value blocks contain only value fields, no note rows
  // Check that no accessory block contains rows with label "Hinweis"
  const accessorySections = sectionsWithNotes.filter(s => 
    s.isLineSection && 
    (s.title.includes('Sprührohrentgaser') || 
     s.title.includes('Nachspeiseeinrichtung') || 
     s.title.includes('Wasseraufbereitung') || 
     s.title.includes('Sicherheitsventil'))
  );
  
  accessorySections.forEach(section => {
    const hasNoteRows = (section.rows || []).some(row => row[0] === 'Hinweis');
    assert.ok(!hasNoteRows, `Accessory block "${section.title}" should not contain rows with label "Hinweis" (Auftrag A - Runde 8)`);
  });
}

// Test 4: Verify Hinweise block appears when notes exist (safety valve always has note)
// Note: Safety valve always has a product neutrality note, so Hinweise block will always appear
const stateWithSafetyValveOnly = {
  ...baseState,
  plantName: 'Test mit Sicherheitsventil',
  useServitec: 'false',
  feedType: 'manual',
  feedLineLengthM: '5'
};

const resultWithSafetyValveOnly = calculate(stateWithSafetyValveOnly);
const recordWithSafetyValveOnly = buildPressureRecord(stateWithSafetyValveOnly, resultWithSafetyValveOnly, [], 'test-sv-only', 'Test mit Sicherheitsventil');

pressureHoldingModule.calculate(stateWithSafetyValveOnly);
const dtoWithSafetyValveOnly = pressureHoldingModule.report({ ...stateWithSafetyValveOnly, savedPlants: [recordWithSafetyValveOnly] });
const sectionsWithSafetyValveOnly = reportSections({
  id: 'pressure-holding',
  title: 'Druckhaltung',
  shortTitle: 'Druckhaltung',
  reportDto: dtoWithSafetyValveOnly,
  reportSource: 'typed-dto'
});

const hinweiseSectionSV = sectionsWithSafetyValveOnly.find(s => s.isLineSection && s.title === 'Hinweise');
assert.ok(hinweiseSectionSV, 'Hinweise section should appear when safety valve note exists (Auftrag A - Runde 8)');

// Test 5: Verify notes reach Report-DTO (trace each note element)
// This test verifies that notes from accessoryBlocks are properly collected and passed through
const stateForNoteTrace = {
  plantName: 'Test Note Trace',
  systemType: 'heating',
  holdingType: 'mag',
  useServitec: 'true',
  connectionType: 'suction',
  waterContentMode: 'known',
  systemVolumeL: '500',
  additionalVolumeL: '',
  frostMode: 'water',
  tMaxC: '50',
  tMinC: '10',
  staticHeightM: '10',
  staticPressureBar: '',
  pumpPressureBar: '',
  safetyValveBar: '3',
  dynamicType: 'reflexomat',
  feedType: 'auto',
  feedPressureBar: '3.0',
  systemSeparation: 'systemSeparator',
  feedLineLengthM: '15',
  waterTreatmentMethod: 'softening',
  regionalWaterHardness: '15',
  heatPowerKw: '3000'
};

const resultForTrace = calculate(stateForNoteTrace);
const recordForTrace = buildPressureRecord(stateForNoteTrace, resultForTrace, [], 'test-trace', 'Test Note Trace');

// Verify that accessoryBlocks are present in the record
assert.ok(recordForTrace.result.accessoryBlocks, 'accessoryBlocks must be present in record.result');
assert.ok(Array.isArray(recordForTrace.result.accessoryBlocks), 'accessoryBlocks must be an array');

// Verify that at least one accessory block has notes
const blocksWithNotes = recordForTrace.result.accessoryBlocks.filter(b => b.notes && b.notes.length > 0);
assert.ok(blocksWithNotes.length > 0, 'At least one accessory block must have notes for tracing');

// Verify that notes are strings (not objects or other types)
blocksWithNotes.forEach(block => {
  block.notes.forEach(note => {
    assert.ok(typeof note === 'string', `Note in block "${block.title}" must be a string`);
    assert.ok(note.length > 0, `Note in block "${block.title}" must not be empty`);
  });
});

console.log('pressure-holding saved-record PDF values and intermediate results ok');
