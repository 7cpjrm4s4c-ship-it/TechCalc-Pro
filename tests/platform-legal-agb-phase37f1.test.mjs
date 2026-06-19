import fs from 'node:fs';
import assert from 'node:assert/strict';

const agbPath = 'docs/legal/agb.html';
assert.ok(fs.existsSync(agbPath), 'AGB page exists');
const agb = fs.readFileSync(agbPath, 'utf8');

assert.match(agb, /Stefan Filly/);
assert.match(agb, /Römerstraße 22A, 89250 Senden/);
assert.match(agb, /stefan\.filly@proton\.me/);
assert.match(agb, /Gültig ab:<\/strong> 19\.06\.2026/);
assert.match(agb, /href="\.\.\/\.\.\/index\.html"/);
assert.match(agb, /Zurück zur App/);
assert.match(agb, /class="back-link"/);
assert.match(agb, /@media \(max-width: 640px\)/);
assert.doesNotMatch(agb, /\[Name des Herausgebers\]/);
assert.doesNotMatch(agb, /\[Adresse\]/);
assert.doesNotMatch(agb, /\[E-Mail\]/);

const sw = fs.readFileSync('service-worker.js', 'utf8');
assert.match(sw, /\.\/docs\/legal\/agb\.html/);

console.log('Phase 37F.1 AGB replacement and back navigation guard passed.');
