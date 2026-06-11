import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const modulesRoot = path.join(root, 'js/modules');
const outDir = path.join(root, 'docs/audits/json');
fs.mkdirSync(outDir, { recursive: true });

const requiredFiles = ['index.js', 'schema.js', 'logic.js', 'state.js', 'results.js'];
const optionalRuntimeFiles = ['controller.js', 'view.js', 'viewModel.js', 'dynamicRenderer.js'];
const expectedModules = fs.readdirSync(modulesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const savedOptionalModules = new Set(['unit-converter']);
const coreText = [
  'js/core/eventPipeline.js',
  'js/core/stateBinding.js',
  'js/core/scrollManager.js',
  'js/core/renderCoordinator.js',
  'js/core/projectStorage.js',
  'js/core/moduleRuntime.js',
  'js/core/savedRecordController.js'
].map((file) => read(path.join(root, file))).join('\n');
const central = {
  enterTab: /Enter/.test(coreText) && /Tab/.test(coreText),
  scroll: /preserveScroll|scrollManager|preserveModuleSwitchScroll|preserveSavedRecordScroll/.test(coreText),
  reset: /resetAllSessionData|state\.reset|resetRoot/.test(coreText),
};
const unitSwitchModules = new Set(['unit-converter', 'heating-cooling', 'pipe-sizing', 'ventilation', 'rainwater', 'drinking-water', 'hx-diagram']);

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

async function schemaStats(moduleName) {
  const schemaPath = path.join(modulesRoot, moduleName, 'schema.js');
  const mod = await import(pathToFileURL(schemaPath).href + `?phase31c=${Date.now()}-${Math.random()}`);
  const schema = mod.default || Object.values(mod).find((value) => value && Array.isArray(value.fields));
  const fields = Array.isArray(schema?.fields) ? schema.fields : [];
  const groups = Array.isArray(schema?.groups) ? schema.groups : [];
  return {
    fieldCount: fields.length,
    groupCount: groups.length,
    inputFieldCount: fields.filter((field) => !['STATS', 'DISPLAY', 'INFO', 'CUSTOM'].includes(String(field.type))).length,
    selectOrSegmentCount: fields.filter((field) => ['SELECT', 'SEGMENT'].includes(String(field.type))).length,
    decimalOrTextCount: fields.filter((field) => ['DECIMAL', 'INTEGER', 'NUMBER', 'TEXT'].includes(String(field.type))).length,
    hasImmediateCommit: fields.some((field) => field.commit === 'immediate'),
    hasUnitLabels: fields.some((field) => Object.prototype.hasOwnProperty.call(field, 'unit')),
  };
}

const modules = [];
for (const moduleName of expectedModules) {
  const dir = path.join(modulesRoot, moduleName);
  const files = fs.readdirSync(dir).filter((name) => name.endsWith('.js')).sort();
  const texts = Object.fromEntries(files.map((name) => [name, read(path.join(dir, name))]));
  const allText = Object.values(texts).join('\n');
  const stats = await schemaStats(moduleName);
  const missingRequired = requiredFiles.filter((name) => !files.includes(name));
  const hasSavedRecords = /saved|Saved|record|Record|storage|Storage/.test(allText);
  const hasResetPath = /reset|initialState|defaultState|createInitialState/.test(allText);
  const hasResultPath = /result|Result|renderResult|results/.test(allText);
  const hasNavigationHook = /Enter|Tab|focus|commit|keydown|confirm/.test(allText);
  const hasScrollGuard = /scroll|Scroll|preventScroll|preserve/.test(allText);
  const hasUnitSwitch = stats.hasUnitLabels || /unit|Unit|Einheit|category|from|to/.test(allText);

  const checks = {
    inputs: stats.inputFieldCount > 0 && stats.groupCount > 0,
    savedRecords: savedOptionalModules.has(moduleName) || hasSavedRecords,
    enterTab: stats.inputFieldCount > 0 && (hasNavigationHook || central.enterTab),
    scroll: central.scroll && (hasScrollGuard || /schemaModuleMount|bindSavedRecordWorkflow|createSchemaModule/.test(allText) || stats.inputFieldCount > 0),
    results: hasResultPath,
    reset: hasResetPath || central.reset,
    unitSwitch: !unitSwitchModules.has(moduleName) || hasUnitSwitch,
  };

  modules.push({
    module: moduleName,
    files,
    missingRequired,
    optionalRuntimeFilesPresent: optionalRuntimeFiles.filter((name) => files.includes(name)),
    schema: stats,
    checks,
    status: missingRequired.length === 0 && Object.values(checks).every(Boolean) ? 'pass' : 'review',
  });
}

const report = {
  phase: '31C',
  title: 'Module smoke test audit',
  generatedAt: new Date().toISOString(),
  central,
  moduleCount: modules.length,
  passed: modules.filter((item) => item.status === 'pass').length,
  review: modules.filter((item) => item.status !== 'pass').length,
  modules,
};

fs.writeFileSync(path.join(outDir, 'module-smoke-audit-phase31c.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Phase 31C module smoke audit: ${report.passed}/${report.moduleCount} pass, ${report.review} review`);
if (report.review > 0) {
  for (const item of modules.filter((entry) => entry.status !== 'pass')) {
    console.log(`- ${item.module}: ${JSON.stringify(item.checks)} missing=${item.missingRequired.join(',')}`);
  }
  process.exitCode = 1;
}
