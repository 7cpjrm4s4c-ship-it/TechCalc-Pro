import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const rel = (...parts) => path.join(ROOT, ...parts);
const exists = (p) => fs.existsSync(rel(p));
const list = (dir, pred = () => true) => {
  const base = rel(dir);
  if (!fs.existsSync(base)) return [];
  const out = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else {
        const relative = path.relative(ROOT, full).replaceAll(path.sep, '/');
        if (pred(relative)) out.push(relative);
      }
    }
  };
  walk(base);
  return out.sort();
};

const rootFiles = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name);

const misplacedRootDocs = rootFiles.filter((name) => /^PHASE_.*\.md$/.test(name) || /^RELEASE_NOTES_PHASE.*\.md$/.test(name));
const misplacedRootAuditJson = rootFiles.filter((name) => name.endsWith('.json') && !['package.json', 'manifest.json'].includes(name));

const phaseDocs = list('docs/phases', (f) => /PHASE_.*\.md$/.test(path.basename(f)));
const auditJson = list('docs/audits/json', (f) => f.endsWith('.json'));
const architectureDocs = list('docs/architecture', (f) => f.endsWith('.md'));
const archiveDocs = list('docs/archive', (f) => f.endsWith('.md'));

const requiredDirs = [
  'docs/phases',
  'docs/audits/json',
  'docs/audits/reports',
  'docs/architecture',
  'docs/release-notes',
  'docs/archive/phase-artifacts'
];

const findings = [];
for (const dir of requiredDirs) {
  if (!exists(dir)) findings.push({ severity: 'P1', area: 'documentation-structure', message: `Missing documentation directory: ${dir}` });
}
if (misplacedRootDocs.length) findings.push({ severity: 'P1', area: 'root-cleanup', count: misplacedRootDocs.length, message: 'Phase/release docs remain in project root.' });
if (misplacedRootAuditJson.length) findings.push({ severity: 'P1', area: 'root-cleanup', count: misplacedRootAuditJson.length, message: 'Audit JSON artefacts remain in project root.' });
if (phaseDocs.length < 100) findings.push({ severity: 'P2', area: 'phase-index', count: phaseDocs.length, message: 'Phase documentation index coverage appears low.' });
if (auditJson.length < 30) findings.push({ severity: 'P2', area: 'audit-index', count: auditJson.length, message: 'Audit JSON archive coverage appears low.' });
if (architectureDocs.length < 4) findings.push({ severity: 'P2', area: 'architecture-index', count: architectureDocs.length, message: 'Architecture documentation coverage appears low.' });

const p0 = findings.filter((f) => f.severity === 'P0').length;
const p1 = findings.filter((f) => f.severity === 'P1').length;
const p2 = findings.filter((f) => f.severity === 'P2').length;
const score = p0 ? 0 : p1 ? 4.2 : p2 ? 4.7 : 5;
const result = {
  phase: '30C',
  name: 'Documentation Reorganization',
  score,
  grade: score >= 4.8 ? 'A' : score >= 4.0 ? 'B' : 'C',
  counts: {
    phaseDocs: phaseDocs.length,
    auditJson: auditJson.length,
    architectureDocs: architectureDocs.length,
    archivedRootPhaseDocs: archiveDocs.length,
    misplacedRootDocs: misplacedRootDocs.length,
    misplacedRootAuditJson: misplacedRootAuditJson.length
  },
  findings,
  targetStructure: requiredDirs,
  generatedAt: new Date().toISOString()
};

const outPath = rel('docs/audits/json/documentation-structure-audit-phase30c.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
