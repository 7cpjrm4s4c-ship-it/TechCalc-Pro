import { execFileSync } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

console.log('> node tests/phase47d-regression-contract.test.mjs');
execFileSync(process.execPath, ['tests/phase47d-regression-contract.test.mjs'], { stdio: 'inherit' });

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
