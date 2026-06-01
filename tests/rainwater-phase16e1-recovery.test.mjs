import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync('js/modules/rainwater/index.js', 'utf8');

assert.match(
  source,
  /import\s*\{[^}]*registerPipelineCommitHandler[^}]*\}\s*from\s*['"]\.\.\/\.\.\/core\/eventPipeline\.js['"]/s,
  'rainwater must explicitly import registerPipelineCommitHandler from the central event pipeline'
);

assert.match(
  source,
  /registerPipelineCommitHandler\(\s*root\s*,\s*['"]rainwater:lookup-hydration['"]/,
  'rainwater lookup hydration must be registered through the central pipeline hook'
);

console.log('phase16e.1 rainwater recovery regression ok');
