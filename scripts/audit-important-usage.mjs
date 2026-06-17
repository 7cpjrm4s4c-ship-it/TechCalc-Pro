import fs from 'node:fs';

const files = ['css/components.css', 'css/layout.css', 'css/modules.css', 'css/tokens.css'].filter(fs.existsSync);
const details = [];
let total = 0;
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!line.includes('!important')) return;
    total += (line.match(/!important/g) || []).length;
    details.push({ file, line: index + 1, text: line.trim() });
  });
}
const report = {
  importantCount: total,
  budget: 35,
  status: total <= 35 ? 'ok' : 'over-budget',
  note: 'Phase 8 tightens the !important budget after removing duplicated settings-panel overrides. Remaining usages are tracked debt, not a default styling mechanism.',
  examples: details.slice(0, 40)
};
fs.mkdirSync('docs/audits/json', { recursive: true });
fs.writeFileSync('docs/audits/json/important-usage-audit-phase8.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (total > 35) process.exitCode = 1;
