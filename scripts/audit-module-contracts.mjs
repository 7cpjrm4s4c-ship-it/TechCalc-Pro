import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const modulesDir = new URL('../js/modules/', import.meta.url).pathname;
const rows = [];

for (const name of readdirSync(modulesDir)) {
  const dir = join(modulesDir, name);
  const configPath = join(dir, 'config.js');
  const indexPath = join(dir, 'index.js');
  if (!existsSync(configPath) || !existsSync(indexPath)) continue;
  const config = readFileSync(configPath, 'utf8');
  const index = readFileSync(indexPath, 'utf8');
  const hasSchemaFile = existsSync(join(dir, 'schema.js'));
  const usesDefineConfig = config.includes('defineModuleConfig');
  const exposesSchema = /export default \{[^}]*schema/s.test(index) || index.includes('schema,');
  const legacyRendererImports = (index.match(/from '\.\.\/\.\.\/core\/renderer\.js'/g) || []).length;
  const ownUiClasses = (index.match(/\b[a-z]{2,}-[a-z0-9-]+/g) || []).filter(cls => !cls.startsWith('tc-'));
  rows.push({
    module: name,
    usesDefineConfig,
    hasSchemaFile,
    exposesSchema,
    legacyRendererImports,
    ownUiClassSamples: [...new Set(ownUiClasses)].slice(0, 12)
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  contractTarget: '1.3.0',
  modules: rows,
  summary: {
    total: rows.length,
    withDefineConfig: rows.filter(r => r.usesDefineConfig).length,
    withSchemaFile: rows.filter(r => r.hasSchemaFile).length,
    exposingSchema: rows.filter(r => r.exposesSchema).length
  }
};

writeFileSync(new URL('../module-contract-audit-phase5.json', import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary, null, 2));
