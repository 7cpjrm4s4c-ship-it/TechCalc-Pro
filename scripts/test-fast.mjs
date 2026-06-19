import { execFileSync } from 'node:child_process';

const commands = [
  ['node', ['scripts/check-js-imports.mjs']],
  ['node', ['tests/number-service.test.mjs']],
  ['node', ['tests/platform-policy.test.mjs']],
  ['node', ['tests/module-contract.test.mjs']],
  ['node', ['tests/saved-record-interaction.test.mjs']],
  ['node', ['tests/input-confirmation.test.mjs']]
];

for (const [cmd, args] of commands) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  execFileSync(cmd, args, { stdio: 'inherit' });
}

console.log('TechCalc fast test gate ok');
