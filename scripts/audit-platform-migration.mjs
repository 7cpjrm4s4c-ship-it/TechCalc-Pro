import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const modulesDir = path.join(root, 'js/modules');
const moduleIds = fs.readdirSync(modulesDir).filter(name => fs.statSync(path.join(modulesDir, name)).isDirectory()).sort();
const legacyNumberPatterns = [
  /replace\s*\(\s*['"]\s*,\s*['"]\.['"]\s*\)/,
  /replace\s*\(\s*\/\\\.\/g\s*,\s*['"]['"]\s*\)/,
  /parseFloat\s*\(/,
  /Number\s*\(\s*String\s*\([^)]*\)\s*\.replace/
];

function read(file){ return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function has(file, needle){ return read(file).includes(needle); }
function countLegacyNumber(text){ return legacyNumberPatterns.reduce((sum, re) => sum + (text.match(new RegExp(re.source, 'g')) || []).length, 0); }

const modules = moduleIds.map(id => {
  const base = path.join(modulesDir, id);
  const files = fs.readdirSync(base).filter(f => f.endsWith('.js'));
  const fullText = files.map(f => read(path.join(base, f))).join('\n');
  const config = read(path.join(base, 'config.js'));
  return {
    id,
    defineModuleConfig: config.includes('defineModuleConfig'),
    schemaFile: fs.existsSync(path.join(base, 'schema.js')),
    usesCentralNumberService: fullText.includes('numberService') || fullText.includes("core/numbers") || fullText.includes('utils/calculations.js'),
    legacyNumberParsers: countLegacyNumber(fullText),
    usesCentralSavedRecords: fullText.includes('savedRecords.js') || fullText.includes('savedCalculationController'),
    hasLegacyModuleClasses: /(dw-|ph-|rainwater-|wastewater-|hx-|pipe-|buffer-)/.test(fullText),
    migrationStatus: (config.match(/migrationStatus:\s*['"]([^'"]+)['"]/) || [])[1] || 'unknown'
  };
});

const summary = {
  total: modules.length,
  schemaModules: modules.filter(m => m.schemaFile).length,
  centralNumberService: modules.filter(m => m.usesCentralNumberService).length,
  legacyNumberParsers: modules.reduce((sum, m) => sum + m.legacyNumberParsers, 0),
  centralSavedRecords: modules.filter(m => m.usesCentralSavedRecords).length,
  legacyClassModules: modules.filter(m => m.hasLegacyModuleClasses).length,
  modules
};

fs.writeFileSync('platform-migration-audit-phase8.json', JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
