import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFloodingDiagnosticModel } from '../js/modules/flooding-verification/diagnosticModel.js';

test('complete calculation produces successful status', () => {
  const model = buildFloodingDiagnosticModel({
    result: { combinedStorage: { status: 'complete' }, warnings: [], criticalShare: 0.4 },
    applicability: { status: 'applicable', messages: [] },
    retentionComparison: { messages: [] }
  });
  assert.equal(model.status, 'complete');
  assert.equal(model.statusLabel, 'Berechnung erfolgreich');
  assert.equal(model.notices.length, 0);
});

test('incomplete calculation prioritizes errors and recommendations', () => {
  const model = buildFloodingDiagnosticModel({
    result: { combinedStorage: { status: 'pending-dwa' }, warnings: ['Regenspenden fehlen.'] },
    applicability: { status: 'incomplete', messages: [] },
    retentionComparison: { messages: [] }
  });
  assert.equal(model.status, 'incomplete');
  assert.equal(model.messages.errors.length, 1);
  assert.equal(model.messages.recommendations.length, 1);
  assert.ok(model.statusReason.includes('Regenspenden fehlen.'));
  assert.deepEqual(model.notices.map(item => item.title), ['Fehler', 'Empfehlungen']);
});

test('outside domain produces normative status and recommendation', () => {
  const model = buildFloodingDiagnosticModel({
    result: { combinedStorage: { status: 'complete' }, warnings: [] },
    applicability: { status: 'long-term-simulation-required', messages: [{ severity: 'error', text: 'Anwendungsgrenze nicht erfüllt.' }] },
    retentionComparison: { messages: [] }
  });
  assert.equal(model.status, 'incomplete');
  assert.ok(model.statusReason.includes('Anwendungsgrenze nicht erfüllt.'));
  assert.ok(model.messages.recommendations.some(item => item.text.includes('Langzeitsimulation')));
});

test('diagnostics are deduplicated and sorted by priority', () => {
  const model = buildFloodingDiagnosticModel({
    result: { combinedStorage: { status: 'complete' }, warnings: ['Hinweistext', 'Hinweistext', 'Der Wert ist überschritten.'] },
    applicability: { status: 'applicable', messages: [] },
    retentionComparison: { messages: [] }
  });
  assert.equal(model.messages.hints.length, 1);
  assert.equal(model.messages.warnings.length, 1);
  assert.equal(model.status, 'complete-with-warnings');
  assert.ok(model.statusReason.includes('Der Wert ist überschritten.'));
  assert.deepEqual(model.notices.map(item => item.title), ['Warnungen', 'Hinweise']);
});

test('multiple warnings are summarized without hiding additional diagnostics', () => {
  const model = buildFloodingDiagnosticModel({
    result: {
      combinedStorage: { status: 'complete' },
      warnings: ['Warnung eins.', 'Warnung zwei.', 'Warnung drei.']
    },
    applicability: { status: 'applicable', messages: [] },
    retentionComparison: { messages: [] }
  });
  assert.ok(model.statusReason.includes('Warnung eins.'));
  assert.ok(model.statusReason.includes('Warnung zwei.'));
  assert.ok(model.statusReason.includes('Weitere 1 Meldung(en)'));
  assert.equal(model.messages.warnings.length, 3);
});

test('critical share creates a planning recommendation', () => {
  const model = buildFloodingDiagnosticModel({
    result: { combinedStorage: { status: 'complete' }, warnings: [], criticalShare: 0.71 },
    applicability: { status: 'applicable', messages: [] },
    retentionComparison: { messages: [] }
  });
  assert.ok(model.messages.recommendations.some(item => item.text.includes('Notentwässerung')));
});