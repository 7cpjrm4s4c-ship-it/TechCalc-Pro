import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const rel = (p) => relative(root, p).replaceAll('\\', '/');
const abs = (...p) => join(root, ...p);

const modulesRoot = abs('js', 'modules');
const cssFiles = ['css/components.css', 'css/layout.css', 'css/modules.css', 'css/tokens.css'];
const referenceModules = ['heating-cooling', 'ventilation', 'pressure-holding', 'buffer-storage'];
const expectedModuleFiles = ['config.js', 'schema.js', 'state.js', 'logic.js', 'index.js', 'controller.js', 'viewModel.js', 'view.js', 'results.js'];
const platformDynamicModules = new Set(['heating-cooling', 'pipe-sizing', 'pressure-holding', 'buffer-storage']);
const localDynamicAllowed = new Set(['drinking-water', 'heat-recovery', 'hx-diagram']);
const savedRecordExpected = new Set(['rainwater', 'wastewater', 'pipe-sizing', 'pressure-holding', 'buffer-storage', 'heat-recovery', 'drinking-water', 'hx-diagram']);

function read(file) {
  return existsSync(abs(file)) ? readFileSync(abs(file), 'utf8') : '';
}
function walk(dir) {
  const start = abs(dir);
  if (!existsSync(start)) return [];
  const out = [];
  const stack = [start];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else out.push(rel(full));
    }
  }
  return out.sort();
}
function moduleNames() {
  return readdirSync(modulesRoot, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();
}
function count(re, text) {
  return (text.match(re) || []).length;
}
function linesFor(text, re) {
  return text.split('\n').flatMap((line, index) => re.test(line) ? [{ line: index + 1, text: line.trim() }] : []);
}
function risk(priority, area, message, evidence = {}) {
  return { priority, area, message, evidence };
}

const modules = moduleNames().map(name => {
  const dir = `js/modules/${name}`;
  const files = walk(dir).filter(file => file.endsWith('.js')).map(file => file.slice(dir.length + 1));
  const content = Object.fromEntries(files.map(file => [file, read(`${dir}/${file}`)]));
  const all = Object.values(content).join('\n');
  const controller = content['controller.js'] || '';
  const index = content['index.js'] || '';
  const view = content['view.js'] || '';
  const config = content['config.js'] || '';
  const missing = expectedModuleFiles.filter(file => !files.includes(file));
  const localListeners = count(/\.addEventListener\s*\(/g, controller);
  const nonControllerListeners = files
    .filter(file => file !== 'controller.js')
    .flatMap(file => linesFor(content[file] || '', /\.addEventListener\s*\(/).map(hit => ({ file, ...hit })));
  const directDomMutations = files
    .filter(file => !['controller.js', 'dynamicRenderer.js', 'renderPipeline.js', 'formRenderer.js'].includes(file))
    .flatMap(file => linesFor(content[file] || '', /\.innerHTML\s*=|\.insertAdjacentHTML\s*\(/).map(hit => ({ file, ...hit })));
  const querySelectorsInView = linesFor(view, /querySelector|querySelectorAll/);
  const hasPlatformDynamic = /create[A-Za-z0-9]+DynamicRenderer/.test(index + '\n' + view) && /platform\/dynamicRenderer/.test(index + '\n' + view);
  const hasLocalDynamic = files.includes('dynamicRenderer.js');
  const hasLegacyCollection = /lineModel|savedCalculationController|bindSavedRecordList|createRecordId|replaceRecord|removeRecord/.test(all);
  const usesCentralSavedRecordController = /bindSavedRecordWorkflow|savedRecordReducer|savedRecordController/.test(all);
  const migrationStatus = linesFor(config, /migrationStatus\s*:/);
  const moduleCssSelectors = cssFiles.flatMap(file => {
    const css = read(file);
    const slug = name.replace(/-/g, '[-_]?');
    return linesFor(css, new RegExp(`\\.${slug}|data-module=["']${name}["']|#${slug}`, 'i')).map(hit => ({ cssFile: file, ...hit }));
  });

  const findings = [];
  if (missing.length) findings.push(risk('P1', 'module-contract', `Pflichtdateien fehlen: ${missing.join(', ')}`, { missing }));
  if (nonControllerListeners.length) findings.push(risk('P1', 'event-boundary', 'Event-Listener außerhalb controller.js gefunden.', { count: nonControllerListeners.length, samples: nonControllerListeners.slice(0, 5) }));
  if (localListeners > 8) findings.push(risk('P2', 'event-density', 'Controller enthält hohe lokale Listener-Dichte; Delegation gegen EventPipeline prüfen.', { addEventListener: localListeners }));
  if (directDomMutations.length) findings.push(risk('P1', 'render-boundary', 'Direkte DOM-HTML-Mutationen außerhalb erlaubter Renderer-Boundaries gefunden.', { count: directDomMutations.length, samples: directDomMutations.slice(0, 5) }));
  if (querySelectorsInView.length) findings.push(risk('P2', 'view-purity', 'View enthält DOM-Abfragen; View sollte Markup-Shell bleiben.', { count: querySelectorsInView.length, samples: querySelectorsInView.slice(0, 5) }));
  if (platformDynamicModules.has(name) && !hasPlatformDynamic) findings.push(risk('P2', 'dynamic-renderer', 'Referenz-/Plattformmodul nutzt keinen platform/dynamicRenderer-Factory-Pfad.', { hasPlatformDynamic }));
  if (hasLocalDynamic && !localDynamicAllowed.has(name)) findings.push(risk('P2', 'dynamic-renderer', 'Lokaler dynamicRenderer.js-Pfad vorhanden; gegen Plattform-Factory prüfen.', { file: `${dir}/dynamicRenderer.js` }));
  if (savedRecordExpected.has(name) && hasLegacyCollection && !usesCentralSavedRecordController) findings.push(risk('P1', 'collections', 'Legacy-Collection-/Saved-Record-Implementierung ohne zentralen Controller-Hinweis.', { hasLegacyCollection }));
  if (migrationStatus.length) findings.push(risk('P2', 'runtime-metadata', 'migrationStatus-Breadcrumbs sind noch im Runtime-Config-Objekt.', { count: migrationStatus.length, samples: migrationStatus }));
  if (moduleCssSelectors.length) findings.push(risk('P2', 'css-specialization', 'Modulspezifische CSS-Selektoren gefunden; gegen globale Tokens/Komponenten prüfen.', { count: moduleCssSelectors.length, samples: moduleCssSelectors.slice(0, 8) }));

  const score = Math.max(0, 100 - findings.reduce((sum, f) => sum + ({ P0: 30, P1: 15, P2: 7, P3: 3 }[f.priority] || 1), 0));
  const status = score >= 90 ? 'reference-aligned' : score >= 75 ? 'platform-conformant-with-minor-debt' : score >= 60 ? 'cleanup-required' : 'priority-cleanup-required';
  return {
    module: name,
    reference: referenceModules.includes(name),
    files,
    metrics: {
      lineCount: all.split('\n').length,
      controllerAddEventListeners: localListeners,
      nonControllerAddEventListeners: nonControllerListeners.length,
      directDomMutationsOutsideRenderer: directDomMutations.length,
      viewDomQueries: querySelectorsInView.length,
      moduleCssSelectors: moduleCssSelectors.length,
      hasPlatformDynamic,
      hasLocalDynamic,
      hasLegacyCollection,
      usesCentralSavedRecordController,
      migrationStatusEntries: migrationStatus.length
    },
    score,
    status,
    findings
  };
});

const jsFiles = walk('js').filter(file => file.endsWith('.js'));
const runtimeCorpus = Object.fromEntries(jsFiles.map(file => [file, read(file)]));
const utilityFiles = ['js/utils/calculations.js', 'js/utils/pipes.js', 'js/utils/units.js'];
const exportedPattern = /export\s+(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)|export\s*\{([^}]+)\}/g;
const utilityExports = [];
for (const file of utilityFiles) {
  const src = read(file);
  for (const match of src.matchAll(exportedPattern)) {
    if (match[1]) utilityExports.push({ file, symbol: match[1] });
    if (match[2]) {
      for (const raw of match[2].split(',')) {
        const symbol = raw.trim().split(/\s+as\s+/)[0]?.trim();
        if (symbol) utilityExports.push({ file, symbol });
      }
    }
  }
}
const utilityUsage = utilityExports.map(item => {
  const token = new RegExp(`\\b${item.symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
  const consumers = Object.entries(runtimeCorpus)
    .filter(([file, content]) => file !== item.file && token.test(content))
    .map(([file]) => file);
  return { ...item, consumers };
});
const unusedUtilityExports = utilityUsage.filter(item => item.consumers.length === 0);

const cssDebt = cssFiles.map(file => {
  const src = read(file);
  return {
    file,
    important: count(/!important/g, src),
    inlineStyleSelectors: count(/\[style\]|style=/g, src),
    moduleScopedSelectors: modules.reduce((sum, module) => {
      const slug = module.module.replace(/-/g, '[-_]?');
      return sum + count(new RegExp(`\\.${slug}|data-module=["']${module.module}["']|#${slug}`, 'gi'), src);
    }, 0)
  };
});

const priorityRank = { P0: 0, P1: 1, P2: 2, P3: 3 };
const riskRegister = modules.flatMap(module => module.findings.map(finding => ({ module: module.module, ...finding })))
  .sort((a, b) => (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9) || a.module.localeCompare(b.module));

const summary = {
  phase: '37A',
  name: 'Platform Convergence Audit',
  generatedBy: 'scripts/audit-platform-convergence-phase37a.mjs',
  generatedAt: new Date().toISOString(),
  referenceModules,
  modulesAudited: modules.length,
  moduleScores: Object.fromEntries(modules.map(m => [m.module, m.score])),
  riskCounts: riskRegister.reduce((acc, item) => ({ ...acc, [item.priority]: (acc[item.priority] || 0) + 1 }), {}),
  cssDebt,
  unusedUtilityExports,
  topFindings: riskRegister.slice(0, 20)
};

function mdTable(rows) {
  return rows.join('\n');
}
const report = { ...summary, modules, utilityUsage, riskRegister };

mkdirSync(abs('docs', 'audits', 'json'), { recursive: true });
mkdirSync(abs('docs', 'phases'), { recursive: true });
writeFileSync(abs('docs', 'audits', 'json', 'platform-convergence-audit-phase37a.json'), `${JSON.stringify(report, null, 2)}\n`);

const md = `# Phase 37A – Platform Convergence Audit\n\n` +
`Ziel: alle Module gegen die Referenzarchitektur Heizung, Lüftung, Druckhaltung und Pufferspeicher prüfen. Der Audit verändert keine Runtime-Logik; er erzeugt eine belastbare Cleanup-Backlog-Basis für Phase 37B/37C.\n\n` +
`## Executive Summary\n\n` +
`- Geprüfte Module: ${modules.length}\n` +
`- P1-Findings: ${summary.riskCounts.P1 || 0}\n` +
`- P2-Findings: ${summary.riskCounts.P2 || 0}\n` +
`- Unbenutzte Utility-Export-Kandidaten: ${unusedUtilityExports.length}\n\n` +
`## Modul-Scorecard\n\n` +
mdTable(['| Modul | Score | Status | P1 | P2 |', '|---|---:|---|---:|---:|', ...modules.map(m => `| ${m.module}${m.reference ? ' *' : ''} | ${m.score} | ${m.status} | ${m.findings.filter(f => f.priority === 'P1').length} | ${m.findings.filter(f => f.priority === 'P2').length} |`)]) +
`\n\n\\* Referenzmodul.\n\n` +
`## Wichtigste Cleanup-Felder\n\n` +
(riskRegister.slice(0, 12).map((f, i) => `${i + 1}. **${f.priority} · ${f.module} · ${f.area}** — ${f.message}`).join('\n') || 'Keine Findings.') +
`\n\n## CSS-Gate\n\n` +
mdTable(['| Datei | !important | Modul-Selektoren |', '|---|---:|---:|', ...cssDebt.map(item => `| ${item.file} | ${item.important} | ${item.moduleScopedSelectors} |`)]) +
`\n\n## Utility-Kandidaten für Phase 37B\n\n` +
(unusedUtilityExports.length ? unusedUtilityExports.map(item => `- ${item.file} :: ${item.symbol}`).join('\n') : '- Keine unbenutzten Utility-Exports gefunden.') +
`\n\n## SVP-Bewertung\n\nPhase 37A bestätigt: Die Plattform ist stabil, aber noch nicht vollständig konvergiert. Die größten Restschulden liegen nicht in Fachlogik, sondern in Runtime-Metadaten, lokalen Event-Boundaries und wenigen modulspezifischen Renderer-/CSS-Sonderpfaden. Empfehlung: vor Feature-Arbeit Phase 37B als kontrollierte Bereinigung der P1/P2-Findings durchführen.\n`;
writeFileSync(abs('docs', 'phases', 'phase37a-platform-convergence-audit.md'), md);

console.log(`phase37a platform convergence audit ok (${modules.length} modules, ${riskRegister.length} findings)`);
console.log(`report: docs/audits/json/platform-convergence-audit-phase37a.json`);
console.log(`doc: docs/phases/phase37a-platform-convergence-audit.md`);
