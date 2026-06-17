import fs from 'node:fs';

const css = fs.readFileSync('css/components.css', 'utf8');
const requiredPrimitives = [
  '.tc-card',
  '.tc-card__header',
  '.tc-card__body',
  '.tc-field',
  '.tc-result-list',
  '.tc-result-item',
  '.tc-save-actions',
  '.tc-actions',
  '.tc-scroll-safe'
];

const missing = requiredPrimitives.filter(selector => !css.includes(selector));
const importantCount = (css.match(/!important/g) || []).length;
const legacySelectorLines = css
  .split(/\r?\n/)
  .filter(line => /^\s*[.:#\[]?[^{}]*(dw-|ph-|rainwater-|wastewater-|hx-|pipe-|buffer-)/.test(line));

const report = {
  requiredPrimitives,
  missing,
  importantCount,
  importantBudget: 35,
  legacySelectorLines: legacySelectorLines.length,
  note: 'Phase 16D establishes global tc-* primitives and keeps legacy module selectors as tracked migration debt.'
};

fs.mkdirSync('docs/audits/json', { recursive: true });
fs.writeFileSync('docs/audits/json/css-system-audit-phase16d.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

if (missing.length) {
  console.error(`Missing Phase 16D CSS primitives: ${missing.join(', ')}`);
  process.exit(1);
}
if (importantCount > report.importantBudget) {
  console.error(`!important budget exceeded: ${importantCount} > ${report.importantBudget}`);
  process.exit(1);
}
