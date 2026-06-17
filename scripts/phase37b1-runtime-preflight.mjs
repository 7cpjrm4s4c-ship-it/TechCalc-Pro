import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const port = Number(process.env.PLAYWRIGHT_PORT || 4173);
const host = '127.0.0.1';
const findings = [];

function add(id, status, detail) {
  findings.push({ id, status, detail });
}

function waitForPort(timeoutMs = 5000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    function probe() {
      const socket = createConnection({ host, port }, () => {
        socket.end();
        resolve(true);
      });
      socket.on('error', () => {
        socket.destroy();
        if (Date.now() - started > timeoutMs) reject(new Error(`port ${port} did not open within ${timeoutMs}ms`));
        else setTimeout(probe, 100);
      });
    }
    probe();
  });
}

let playwrightTestAvailable = false;
try {
  require.resolve('@playwright/test');
  playwrightTestAvailable = true;
  add('playwright-test-package', 'passed', '@playwright/test is resolvable');
} catch {
  add('playwright-test-package', 'blocked', '@playwright/test is not installed in this runtime; install it with npm install -D @playwright/test before npm run test:e2e:phase37b1');
}

let server;
try {
  server = spawn(process.execPath, ['scripts/serve-static.mjs'], {
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  await waitForPort();
  add('static-server', 'passed', `zero-dependency static server answered on http://${host}:${port}`);
} catch (error) {
  add('static-server', 'failed', error.message);
} finally {
  if (server && !server.killed) server.kill('SIGTERM');
}

for (const file of [
  'playwright.config.mjs',
  'tests/e2e/phase37b-runtime-smoke.spec.mjs',
  'scripts/serve-static.mjs'
]) {
  add(`file:${file}`, existsSync(file) ? 'passed' : 'failed', file);
}

const report = {
  phase: '37B.1',
  name: 'Browser Runtime Execution Preflight',
  status: findings.every(item => item.status === 'passed') ? 'ready' : 'blocked-by-environment',
  generatedAt: new Date().toISOString(),
  findings
};

mkdirSync('docs/audits/json', { recursive: true });
writeFileSync('docs/audits/json/browser-runtime-execution-phase37b1.json', `${JSON.stringify(report, null, 2)}\n`);

const failed = findings.filter(item => item.status === 'failed');
if (failed.length > 0) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(`phase37b1 runtime preflight ${report.status}`);
if (!playwrightTestAvailable) process.exitCode = 0;
