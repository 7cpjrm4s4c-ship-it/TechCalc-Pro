import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const sourceReports = [
  { key: 'moduleComparison', path: 'platform-module-comparison-phase27b.json', phase: '27B', area: 'Module Comparison' },
  { key: 'corePlatform', path: 'platform-core-audit-phase27c1.json', phase: '27C.1', area: 'Core Platform' },
  { key: 'stateStorage', path: 'platform-state-storage-audit-phase27c2.json', phase: '27C.2', area: 'State & Storage' },
  { key: 'rendering', path: 'platform-rendering-audit-phase27c3.json', phase: '27C.3', area: 'Rendering' },
  { key: 'uxInfrastructure', path: 'platform-ux-infrastructure-audit-phase27c4.json', phase: '27C.4', area: 'UX Infrastructure' },
  { key: 'performance', path: 'platform-performance-audit-phase27c5.json', phase: '27C.5', area: 'Performance' }
];

function readJson(relativePath) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Required audit report missing: ${relativePath}`);
  }
  return JSON.parse(readFileSync(absolutePath, 'utf8'));
}

function grade(score) {
  if (score >= 4.5) return 'A';
  if (score >= 3.8) return 'B';
  if (score >= 3.0) return 'C';
  if (score >= 2.0) return 'D';
  return 'F';
}

function normalizeRisk(risk) {
  if (['P0', 'P1', 'P2', 'P3'].includes(risk)) return risk;
  if (risk === 'critical') return 'P0';
  if (risk === 'high') return 'P1';
  if (risk === 'medium') return 'P2';
  return 'P3';
}

function ownerFor(area) {
  const normalized = String(area || '').toLowerCase();
  if (normalized.includes('dependency') || normalized.includes('event') || normalized.includes('core')) return 'Platform Core';
  if (normalized.includes('saved') || normalized.includes('storage') || normalized.includes('state')) return 'State & Storage';
  if (normalized.includes('render') || normalized.includes('diagram')) return 'Rendering Platform';
  if (normalized.includes('scroll') || normalized.includes('focus') || normalized.includes('live') || normalized.includes('ux')) return 'UX Infrastructure';
  if (normalized.includes('performance') || normalized.includes('measurement')) return 'Performance Engineering';
  return 'Platform Architecture';
}

function remediationWindow(risk) {
  return {
    P0: 'before-release',
    P1: 'phase-28-hardening',
    P2: 'phase-29-standardization',
    P3: 'backlog'
  }[risk] || 'backlog';
}

function riskTitle(area) {
  return String(area || 'platformRisk')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, char => char.toUpperCase());
}

function actionFor(area) {
  return {
    dependencyGraph: 'Boundary-Tests erweitern und verbotene View/Renderer-Abhaengigkeiten in den betroffenen Modulen abbauen.',
    eventSystem: 'Globale Listener inventarisieren, Cleanup-Contract erzwingen und neue Listener nur ueber zentrale Event-Infrastruktur zulassen.',
    savedRecordStateModel: 'Saved-Record-State je Modul auf einheitliche Arrays, aktive ID und optionale expanded ID normalisieren.',
    renderTriggerConsistency: 'Render-Trigger auf State-Update -> Pipeline/Renderer standardisieren und parallele manuelle Re-Render-Pfade entfernen.',
    scrollStability: 'Scroll- und Fokus-Preservation bei Record-Auswahl, Live-Updates und Modulwechseln als zentralen UX-Vertrag absichern.',
    liveUpdateSideEffects: 'Live-Update-Pfade gegen Fokusverlust, Scrollspruenge und Sonderrenderer-Drift testen.',
    savedRecordInteraction: 'Saved-Record-Auswahl und Update/Delete auf lokale Slot-Aktualisierung begrenzen.',
    measurementBaseline: 'Runtime-Messpunkte fuer Initial Render, Module Switch und Saved-Record-Interaktion einfuehren.'
  }[area] || 'Risiko pruefen, Owner zuweisen und in den Hardening-Backlog aufnehmen.';
}

function normalizeFinding(item, source) {
  const area = item.area || item.dimension || item.category || item.name || 'platformRisk';
  const risk = normalizeRisk(item.risk || item.priority || item.severity);
  return {
    id: `${source.phase}-${String(area).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()}`,
    sourcePhase: source.phase,
    sourceArea: source.area,
    area,
    title: riskTitle(area),
    risk,
    owner: ownerFor(area),
    remediationWindow: remediationWindow(risk),
    score: typeof item.score === 'number' ? item.score : null,
    grade: item.grade || (typeof item.score === 'number' ? grade(item.score) : null),
    action: item.action || item.recommendation || actionFor(area),
    evidence: item.evidence || item.modules || item.module || null
  };
}

const loadedReports = Object.fromEntries(sourceReports.map(source => [source.key, readJson(source.path)]));
const risks = [];

for (const source of sourceReports) {
  const report = loadedReports[source.key];
  const summary = report.executiveSummary;
  if (summary) {
    for (const bucket of ['p0', 'p1', 'p2', 'p3']) {
      for (const item of summary[bucket] || []) {
        risks.push(normalizeFinding({ ...item, risk: bucket.toUpperCase() }, source));
      }
    }
  }
  for (const item of report.findings || []) {
    risks.push(normalizeFinding(item, source));
  }
}

const moduleComparison = loadedReports.moduleComparison;
for (const item of moduleComparison.riskRegister || []) {
  risks.push(normalizeFinding({
    area: item.dimension || item.area || item.module || 'moduleComparison',
    risk: item.risk || item.priority || 'P2',
    action: item.action || item.recommendation,
    modules: item.modules || item.module
  }, sourceReports[0]));
}

const uniqueRisks = [];
const seen = new Set();
for (const risk of risks) {
  const key = `${risk.sourcePhase}:${risk.area}:${risk.risk}:${risk.action}`;
  if (!seen.has(key)) {
    seen.add(key);
    uniqueRisks.push(risk);
  }
}

const riskOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
uniqueRisks.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk] || a.sourcePhase.localeCompare(b.sourcePhase) || a.title.localeCompare(b.title));

const riskCounts = uniqueRisks.reduce((acc, item) => {
  acc[item.risk] = (acc[item.risk] || 0) + 1;
  return acc;
}, { P0: 0, P1: 0, P2: 0, P3: 0 });

const auditScores = sourceReports
  .filter(source => source.key !== 'moduleComparison')
  .map(source => ({
    phase: source.phase,
    area: source.area,
    score: loadedReports[source.key].overallScore,
    grade: loadedReports[source.key].overallGrade
  }));

const overallScore = Number((auditScores.reduce((sum, item) => sum + item.score, 0) / auditScores.length).toFixed(2));
const releaseReadiness = riskCounts.P0 === 0 ? 'release-candidate-with-hardening-backlog' : 'requires-hardening-before-release';

const remediationBacklog = uniqueRisks.map((risk, index) => ({
  rank: index + 1,
  id: risk.id,
  risk: risk.risk,
  owner: risk.owner,
  remediationWindow: risk.remediationWindow,
  title: risk.title,
  action: risk.action
}));

const report = {
  phase: '27D',
  name: 'Platform Risk Register',
  generatedBy: 'scripts/audit-platform-risk-register-phase27d.mjs',
  generatedAt: new Date().toISOString(),
  sourceReports: sourceReports.map(source => source.path),
  overallScore,
  overallGrade: grade(overallScore),
  releaseReadiness,
  riskCounts,
  auditScores,
  risks: uniqueRisks,
  remediationBacklog,
  executiveSummary: {
    status: releaseReadiness,
    p0: uniqueRisks.filter(item => item.risk === 'P0'),
    p1: uniqueRisks.filter(item => item.risk === 'P1'),
    p2: uniqueRisks.filter(item => item.risk === 'P2'),
    p3: uniqueRisks.filter(item => item.risk === 'P3'),
    nextRecommendedPhase: '27E Final Roadmap'
  }
};

writeFileSync(join(root, 'platform-risk-register-phase27d.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Phase 27D platform risk register generated: ${overallScore} (${report.overallGrade}), P0=${riskCounts.P0}, P1=${riskCounts.P1}, P2=${riskCounts.P2}, P3=${riskCounts.P3}`);
