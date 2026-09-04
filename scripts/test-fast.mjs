import { execFileSync } from 'node:child_process';
const commands = [
  ['node', ['scripts/check-js-imports.mjs']],
  ['node', ['tests/release-version-single-source.test.mjs']],
  ['node', ['tests/number-service.test.mjs']],
  ['node', ['tests/platform-policy.test.mjs']],
  ['node', ['tests/module-contract.test.mjs']],
  ['node', ['tests/saved-record-interaction.test.mjs']],
  ['node', ['tests/input-confirmation.test.mjs']],
  ['node', ['tests/hx-negative-humidification.test.mjs']],
  ['node', ['tests/hx-enthalpy-power.test.mjs']],
  ['node', ['tests/pressure-holding-pdf-saved-records.test.mjs']],
  ['node', ['tests/buffer-storage-pdf-saved-records.test.mjs']],
  ['node', ['tests/rainwater-manufacturer-drains.test.mjs']],
  ['node', ['tests/unit-converter-btu-per-hour.test.mjs']],
  ['node', ['tests/service-worker-update-flow.test.mjs']],
  ['node', ['tests/rc10-project-file-format.test.mjs']],
  ['node', ['tests/rc11-pdf-pixel-perfect.test.mjs']],
  ['node', ['tests/pdf-branding-opt-out.test.mjs']],
  ['node', ['tests/pdf-report-engine-unification-1.6.1.test.mjs']],
  ['node', ['tests/phase45c-modulsplitting-implementation.test.mjs']],
  ['node', ['tests/phase45c1-project-lifecycle-integration.test.mjs']],
  ['node', ['tests/phase45c2-legacy-saved-records-migration.test.mjs']]
];
for (const [cmd, args] of commands) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  execFileSync(cmd, args, { stdio: 'inherit' });
}
console.log('TechCalc fast test gate ok');
