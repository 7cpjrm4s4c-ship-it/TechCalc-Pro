import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const phase = '37B';
const jsonPath = 'docs/audits/json/browser-runtime-smoke-phase37b.json';
const mdPath = 'docs/audits/phase37b-browser-runtime-smoke.md';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const specs = [
  {
    id: 'BR-01',
    name: 'Shell boot and module mount',
    scope: 'All 11 active module routes',
    priority: 'P1',
    selectorContract: ['#app[data-active-module-id]', '.module-nav [data-module-id], #overflowMenu [data-module-id]']
  },
  {
    id: 'BR-02',
    name: 'Saved-record controls reachable',
    scope: 'Saved-record capable modules',
    priority: 'P1',
    selectorContract: ['#app', 'save/edit/delete text affordances']
  },
  {
    id: 'BR-03',
    name: 'Mobile nav swipe guard',
    scope: 'Pointer movement over module nav',
    priority: 'P1',
    selectorContract: ['.module-nav', '#app[data-active-module-id]']
  },
  {
    id: 'BR-04',
    name: 'Settings scroll lock restore',
    scope: 'Mobile and desktop settings panel',
    priority: 'P1',
    selectorContract: ['#settingsButton', '#settingsPanel', '#closeSettings']
  },
  {
    id: 'BR-05',
    name: 'Service-worker offline shell',
    scope: 'PWA registration and cached reload',
    priority: 'P1',
    selectorContract: ['navigator.serviceWorker', '#app']
  }
];

const files = [
  'playwright.config.mjs',
  'tests/e2e/phase37b-runtime-smoke.spec.mjs',
  'tests/platform-browser-runtime-phase37b.test.mjs'
];

const checks = files.map(file => ({ file, exists: existsSync(file) }));
const scripts = packageJson.scripts || {};
const requiredScripts = ['test:phase37b', 'test:e2e', 'test:e2e:phase37b'];
const scriptChecks = requiredScripts.map(name => ({ name, command: scripts[name] || '', exists: Boolean(scripts[name]) }));

let importCheck = 'not-run';
try {
  execFileSync('node', ['scripts/check-js-imports.mjs'], { stdio: 'pipe' });
  importCheck = 'passed';
} catch (error) {
  importCheck = 'failed';
}

const report = {
  phase,
  name: 'Browser Runtime Smoke Baseline',
  status: checks.every(item => item.exists) && scriptChecks.every(item => item.exists) && importCheck === 'passed' ? 'ready' : 'incomplete',
  modulesInScope: 11,
  browserProjects: ['chromium-desktop', 'webkit-mobile'],
  specCount: specs.length,
  specs,
  fileChecks: checks,
  scriptChecks,
  importCheck,
  note: 'Phase 37B adds executable Playwright browser-runtime smoke coverage. Node validation verifies the harness contract; Playwright execution requires npm install --save-dev @playwright/test http-server and npx playwright install in the target environment.'
};

mkdirSync('docs/audits/json', { recursive: true });
mkdirSync('docs/audits', { recursive: true });
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);

const md = `# Phase 37B - Browser Runtime Smoke Baseline\n\n## Ziel\n\nPhase 37B ergänzt die bisherige Node-Testbasis um eine Browser-Runtime-Smoke-Schicht. Der Fokus liegt auf den Risiken, die Node-Tests strukturell nicht abdecken: echtes Routing im Browser, DOM-Mounts, mobile Pointer-Gesten, Scroll-Lock-Verhalten und Service-Worker-Offline-Fähigkeit.\n\n## Umfang\n\n- 11 aktive Modulrouten\n- Chromium Desktop\n- WebKit Mobile Profil\n- Modulwechsel\n- Saved-Record-Erreichbarkeit\n- Mobile Navigation Swipe Guard\n- Settings Scroll Lock / Restore\n- Service-Worker Offline Reload\n\n## Neue Artefakte\n\n- \`playwright.config.mjs\`\n- \`tests/e2e/phase37b-runtime-smoke.spec.mjs\`\n- \`tests/platform-browser-runtime-phase37b.test.mjs\`\n- \`docs/audits/json/browser-runtime-smoke-phase37b.json\`\n\n## Ergebnis\n\nStatus: **${report.status}**\n\nDie Phase 37B ändert keine Runtime-Logik. Sie legt die Browser-Testschicht als Release-Candidate-Gate an und hält die bestehende Node-Import- und Modul-Smoke-Basis unverändert stabil.\n\n## Ausführung\n\nLokale Browser-Ausführung nach Dependency-Installation:\n\n\`\`\`bash\nnpm install\nnpx playwright install\nnpm run test:e2e:phase37b\n\`\`\`\n\nNode-Gate ohne Browser-Installation:\n\n\`\`\`bash\nnpm run test:phase37b\n\`\`\`\n`;
writeFileSync(mdPath, md);

console.log(`phase37b browser-runtime audit ${report.status}`);
