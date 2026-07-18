import { execFileSync } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const contractTests = [
  'tests/phase47d-regression-contract.test.mjs',
  'tests/phase47d-shell-behavior-adjustments.test.mjs'
];

for (const file of contractTests) {
  console.log(`> node ${file}`);
  execFileSync(process.execPath, [file], { stdio: 'inherit' });
}

const commands = [
  ['run', 'lint'],
  ['test'],
  ['run', 'test:flooding'],
  ['run', 'test:integration'],
  ['run', 'build'],
  ['run', 'test:e2e']
];

for (const args of commands) {
  console.log(`> npm ${args.join(' ')}`);
  execFileSync(npm, args, { stdio: 'inherit' });
}

console.log('Phase 47D consolidated regression gate ok');
