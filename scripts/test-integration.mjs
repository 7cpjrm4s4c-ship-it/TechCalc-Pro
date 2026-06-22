import { execFileSync } from 'node:child_process';

const commands = [
  ['node', ['scripts/generate-precache-manifest.mjs', '--check']],
  ['node', ['scripts/check-js-imports.mjs']],
  ['node', ['scripts/audit-package-script-hygiene-phase39a.mjs']],
  ['node', ['scripts/audit-service-worker-version-injection-phase39c.mjs']],
  ['node', ['scripts/audit-core-module-preload-phase39d.mjs']],
  ['node', ['scripts/audit-manifest-icons-phase39e.mjs']],
  ['node', ['scripts/audit-feedback-offline-fallback-phase39f.mjs']],
  ['node', ['scripts/audit-rc-ui-state-bugfix-phase39h.mjs']],
  ['node', ['tests/platform-feedback-offline-fallback-phase39f.test.mjs']],
  ['node', ['scripts/audit-module-smoke-phase31c.mjs']],
  ['node', ['scripts/audit-platform-convergence-phase37a.mjs']],
  ['node', ['scripts/audit-browser-runtime-phase37b2.mjs']],
  ['node', ['scripts/audit-service-worker-offline-phase37b3.mjs']],
  ['node', ['scripts/audit-release-candidate-phase37e.mjs']],
  ['node', ['tests/platform-browser-runtime-phase37b2.test.mjs']],
  ['node', ['tests/platform-service-worker-offline-phase37b3.test.mjs']],
  ['node', ['tests/platform-release-candidate-phase37e.test.mjs']],
  ['node', ['tests/platform-legal-agb-phase37f1.test.mjs']],
  ['node', ['tests/platform-precache-manifest-phase38a.test.mjs']],
  ['node', ['tests/platform-viewport-accessibility-phase38c.test.mjs']],
  ['node', ['scripts/audit-buffer-storage-remove-compare-phase38d9.mjs']],
  ['node', ['scripts/audit-buffer-storage-remove-compare-phase38d10.mjs']],
  ['node', ['scripts/audit-low-end-mobile-rendering-phase38e.mjs']],
  ['node', ['scripts/audit-esbuild-minification-phase38f.mjs']],
  ['node', ['scripts/audit-release-package-hygiene-phase38g.mjs']],
  ['node', ['scripts/audit-netlify-npm-registry-phase38h.mjs']]
];

for (const [cmd, args] of commands) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  execFileSync(cmd, args, { stdio: 'inherit' });
}

console.log('TechCalc integration gate ok');
