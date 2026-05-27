import assert from 'node:assert/strict';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { modules } from '../js/core/registry.js';

const modulesDir = new URL('../js/modules/', import.meta.url).pathname;
for (const name of readdirSync(modulesDir)) {
  const configPath = join(modulesDir, name, 'config.js');
  if (!existsSync(configPath)) continue;
  const { default: config } = await import(pathToFileURL(configPath).href);
  modules.register({ config, mount() {} });
}

const report = modules.contractReport();
assert.ok(report.length >= 10, 'registered module count');
for (const item of report) {
  assert.ok(item.id, 'module id');
  assert.equal(item.contractVersion, '1.3.0', `${item.id}: contract version`);
  assert.ok(Array.isArray(item.capabilities), `${item.id}: capabilities array`);
}
console.log(`module-contract regression ok (${report.length} modules)`);
