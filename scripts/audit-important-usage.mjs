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
  budget: 90,
  status: total <= 90 ? 'ok' : 'over-budget',
  note: 'Phase 7 keeps only defensive overrides such as fixed overlays, display locks and pointer-event guards.',
  examples: details.slice(0, 40)
};
fs.writeFileSync('important-usage-audit-phase7.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (total > 90) process.exitCode = 1;
