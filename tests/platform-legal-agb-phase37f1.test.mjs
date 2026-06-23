import fs from 'node:fs';
import assert from 'node:assert/strict';

const agbPath = 'docs/legal/agb.html';
assert.ok(fs.existsSync(agbPath), 'AGB page exists');
const agb = fs.readFileSync(agbPath, 'utf8');

assert.match(agb, /Stefan Filly/);
assert.match(agb, /Römerstraße 22A/);
assert.match(agb, /89250 Senden/);
assert.match(agb, /Telefon: 0172 \/ 7222037/);
assert.match(agb, /Nutzungsbedingungen \(AGB\) – TechCalc Pro/);
assert.match(agb, /Stand:<\/strong> Juni 2026/);
assert.match(agb, /Urheber und alleiniger Rechteinhaber ist Stefan Filly/);
assert.doesNotMatch(agb, /\[Name des Herausgebers\]/);
assert.doesNotMatch(agb, /\[Adresse\]/);
assert.doesNotMatch(agb, /\[E-Mail\]/);

const sw = fs.readFileSync('service-worker.js', 'utf8');
assert.match(sw, /\.\/docs\/legal\/agb\.html/);

console.log('Phase 37F.1 AGB replacement guard passed.');
