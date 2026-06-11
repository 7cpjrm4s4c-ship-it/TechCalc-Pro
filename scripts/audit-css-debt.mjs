import fs from 'node:fs';
const css = fs.readFileSync('css/components.css', 'utf8');
const lines = css.split(/\r?\n/);
const legacyPrefixes = ['dw-', 'ph-', 'rainwater-', 'wastewater-', 'hx-', 'pipe-', 'buffer-'];
const patchComments = lines.filter(line => /v\d+|Bugfix|fix|patch|Phase \d+|Release v/i.test(line)).length;
const importantCount = (css.match(/!important/g) || []).length;
const legacySelectorLines = lines.filter(line => /^\s*[.:#\[]?[^{}]*(dw-|ph-|rainwater-|wastewater-|hx-|pipe-|buffer-)/.test(line));
const duplicateSelectors = new Map();
for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed.endsWith('{')) continue;
  const selector = trimmed.slice(0, -1).trim();
  duplicateSelectors.set(selector, (duplicateSelectors.get(selector) || 0) + 1);
}
const duplicates = [...duplicateSelectors.entries()].filter(([, count]) => count > 1).sort((a,b)=>b[1]-a[1]);
const report = {
  totalLines: lines.length,
  importantCount,
  patchComments,
  legacySelectorLines: legacySelectorLines.length,
  duplicateSelectors: duplicates.slice(0, 50).map(([selector, count]) => ({ selector, count })),
  note: 'Phase 8 removes duplicated settings-panel overrides and tracks remaining legacy selectors as explicit migration debt.'
};
fs.mkdirSync('docs/audits/json', { recursive: true });
fs.writeFileSync('docs/audits/json/css-debt-audit-phase8.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
