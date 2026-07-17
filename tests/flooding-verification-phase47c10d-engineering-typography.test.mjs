import assert from 'node:assert/strict';
import fs from 'node:fs';
import { applyEngineeringTypography, pdfHexText, sanitizeText } from '../js/core/pdf/pdfText.js';

assert.equal(applyEngineeringTypography('75,51 m3'), '75,51 m³');
assert.equal(applyEngineeringTypography('3.000,00 m2'), '3.000,00 m²');
assert.equal(applyEngineeringTypography('371,00 l/(s*ha)'), '371,00 l/(s·ha)');
assert.equal(applyEngineeringTypography('A x Cs'), 'A × Cs');
assert.equal(sanitizeText('A * C'), 'A × C');
assert.match(pdfHexText('m² m³ × ·'), /^<[0-9A-F]+>$/);
assert.notEqual(pdfHexText('m² m³ × ·'), pdfHexText('m2 m3 x *'));

const tableSource = fs.readFileSync(new URL('../js/core/pdf/authorityTables.js', import.meta.url), 'utf8');
assert.match(tableSource, /entry\.valueM3/, 'DIN duration table must consume the actual valueM3 field.');
assert.match(tableSource, /A \[m²\]/);
assert.match(tableSource, /A × Cₛ \[m²\]/);
assert.match(tableSource, /l\/\(s·ha\)/);
assert.doesNotMatch(tableSource, /\$\{number\(durationValue\(entry\)\)\} m3/);

console.log('Phase 47C.10D engineering typography and DIN duration regression ok');
