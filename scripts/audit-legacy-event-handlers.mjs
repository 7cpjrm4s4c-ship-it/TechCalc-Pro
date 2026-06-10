import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const files = walk('js/modules').filter(file => file.endsWith('.js'));
const findings = [];
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const addEventListener = (src.match(/\.addEventListener\s*\(/g) || []).length;
  const directHandlers = (src.match(/\bon(click|change|input|blur|keydown)\s*=/g) || []).length;
  const legacySelectors = (src.match(/querySelector(All)?\([^\n]+data-.*(save|update|select|delete|toggle)/g) || []).length;
  if (addEventListener || directHandlers || legacySelectors) {
    findings.push({ file, addEventListener, directHandlers, legacySelectors });
  }
}

const total = findings.reduce((acc, item) => acc + item.addEventListener + item.directHandlers + item.legacySelectors, 0);
const result = {
  phase: '11B',
  purpose: 'Find remaining module-local event handlers that must be migrated behind the central event pipeline.',
  totals: {
    filesWithLegacyHandlers: findings.length,
    legacyHandlerScore: total
  },
  findings
};
writeFileSync('legacy-event-handler-audit-phase11b.json', JSON.stringify(result, null, 2));

if (total > 140) {
  throw new Error(`Legacy event handler score too high: ${total}`);
}
console.log(`legacy event handler audit ok (${findings.length} files, score ${total})`);
