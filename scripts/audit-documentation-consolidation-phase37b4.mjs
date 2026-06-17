import { readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

function walk(dir) {
  let out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) out = out.concat(walk(file));
    else out.push(file);
  }
  return out;
}

const phaseFiles = walk('docs/phases').filter((file) => file.endsWith('.md'));
const nestedPhaseFiles = phaseFiles.filter((file) => path.relative('docs/phases', file).includes(path.sep));
const summaryFiles = phaseFiles.filter((file) => /phase-\d+\.md$/.test(path.basename(file)));
const totalBytes = phaseFiles.reduce((sum, file) => sum + statSync(file).size, 0);

const result = {
  phase: '37B.4',
  fileCount: phaseFiles.length,
  summaryFileCount: summaryFiles.length,
  nestedPhaseFileCount: nestedPhaseFiles.length,
  totalBytes,
  status: phaseFiles.length <= 30 && nestedPhaseFiles.length === 0 ? 'pass' : 'fail',
  files: phaseFiles.map((file) => path.relative('docs/phases', file)).sort()
};

mkdirSync('docs/audits/json', { recursive: true });
writeFileSync('docs/audits/json/documentation-consolidation-phase37b4.json', `${JSON.stringify(result, null, 2)}\n`);

if (result.status !== 'pass') {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log(`Phase 37B.4 documentation consolidation ok: ${result.fileCount} files, ${result.totalBytes} bytes`);
