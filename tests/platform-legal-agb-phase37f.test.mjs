import fs from 'node:fs';
import assert from 'node:assert/strict';

const agbPath = 'docs/legal/agb.html';
assert.ok(fs.existsSync(agbPath), 'AGB page exists under docs/legal/agb.html');

const agb = fs.readFileSync(agbPath, 'utf8');
assert.match(agb, /Nutzungsbedingungen \(AGB\)|Allgemeine Geschäftsbedingungen/);
assert.match(agb, /TechCalc Pro/);
assert.match(agb, /Stand:<\/strong> Juni 2026|Stand: Juni 2026/);
assert.match(agb, /Stefan Filly/);
assert.match(agb, /Römerstraße 22A/);
assert.match(agb, /89250 Senden/);
assert.match(agb, /Copyright © 2026 Stefan Filly/);

const index = fs.readFileSync('index.html', 'utf8');
assert.match(index, /href="\.\/docs\/legal\/agb\.html"/);
assert.match(index, /AGB öffnen/);
assert.doesNotMatch(index, /<button class="mini-button" type="button" disabled>AGB vorbereiten<\/button>/);

const sw = fs.readFileSync('service-worker.js', 'utf8');
assert.match(sw, /\.\/docs\/legal\/agb\.html/);

console.log('Phase 37F AGB integration guard passed.');
