import { execFileSync } from 'node:child_process';

const commands = [
  ['node', ['scripts/check-js-imports.mjs']],
  ['node', ['tests/number-service.test.mjs']],
  ['node', ['tests/platform-policy.test.mjs']],
  ['node', ['tests/module-contract.test.mjs']],
  ['node', ['scripts/audit-module-contracts.mjs']],
  ['node', ['scripts/audit-ui-classes.mjs']],
  ['node', ['scripts/audit-platform-migration.mjs']],
  ['node', ['scripts/audit-css-debt.mjs']],
  ['node', ['scripts/audit-important-usage.mjs']],
  ['node', ['scripts/audit-rerender-risk.mjs']]
];

for (const [cmd, args] of commands) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  execFileSync(cmd, args, { stdio: 'inherit' });
}
console.log('TechCalc quality gate ok');
