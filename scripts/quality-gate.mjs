import { execFileSync } from 'node:child_process';

const commands = [
  ['node', ['scripts/check-js-imports.mjs']],
  ['node', ['tests/number-service.test.mjs']],
  ['node', ['tests/platform-policy.test.mjs']],
  ['node', ['tests/module-contract.test.mjs']],
  ['node', ['tests/saved-record-interaction.test.mjs']],
  ['node', ['tests/input-confirmation.test.mjs']],
  ['node', ['tests/heating-cooling-interaction.test.mjs']],
  ['node', ['tests/heating-cooling-global-standard.test.mjs']],
  ['node', ['tests/heating-cooling-phase12g.test.mjs']],
  ['node', ['tests/heating-cooling-phase12h.test.mjs']],
  ['node', ['tests/heating-cooling-phase12i.test.mjs']],
  ['node', ['tests/ventilation-global-standard.test.mjs']],
  ['node', ['tests/ventilation-phase13e.test.mjs']],
  ['node', ['tests/rainwater-global-standard.test.mjs']],
  ['node', ['tests/rainwater-phase14c.test.mjs']],
  ['node', ['tests/rainwater-phase14d.test.mjs']],
  ['node', ['tests/rainwater-phase14e.test.mjs']],
  ['node', ['tests/rainwater-phase14f.test.mjs']],
  ['node', ['tests/rainwater-phase14g.test.mjs']],
  ['node', ['tests/rainwater-phase14l.test.mjs']],
  ['node', ['tests/router-direct-navigation.test.mjs']],
  ['node', ['tests/router-single-navigation-path.test.mjs']],
  ['node', ['tests/central-platform-pipeline.test.mjs']],
  ['node', ['tests/state-binding.test.mjs']],
  ['node', ['tests/event-pipeline-phase11d.test.mjs']],
  ['node', ['tests/event-pipeline-rebind.test.mjs']],
  ['node', ['tests/render-coordinator.test.mjs']],
  ['node', ['scripts/audit-module-contracts.mjs']],
  ['node', ['scripts/audit-ui-classes.mjs']],
  ['node', ['scripts/audit-platform-migration.mjs']],
  ['node', ['scripts/audit-css-debt.mjs']],
  ['node', ['scripts/audit-important-usage.mjs']],
  ['node', ['scripts/audit-rerender-risk.mjs']],
  ['node', ['scripts/audit-mobile-scroll-stability.mjs']],
  ['node', ['scripts/audit-legacy-event-handlers.mjs']]
];

for (const [cmd, args] of commands) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  execFileSync(cmd, args, { stdio: 'inherit' });
}
console.log('TechCalc quality gate ok');
