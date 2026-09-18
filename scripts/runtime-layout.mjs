import fs from 'node:fs';
import path from 'node:path';

const LAYOUTS = Object.freeze({
  transitional: Object.freeze({
    id: 'transitional',
    coreDir: 'js/core',
    modulesDir: 'js/modules',
    runtimeDirs: Object.freeze(['js'])
  }),
  target: Object.freeze({
    id: 'target',
    coreDir: 'core',
    modulesDir: 'modules',
    runtimeDirs: Object.freeze(['core', 'modules'])
  })
});

function inspectLayout(root, layout) {
  const corePresent = fs.existsSync(path.join(root, layout.coreDir));
  const modulesPresent = fs.existsSync(path.join(root, layout.modulesDir));
  return {
    any: corePresent || modulesPresent,
    complete: corePresent && modulesPresent
  };
}

export function detectRuntimeLayout(root = process.cwd()) {
  const transitional = inspectLayout(root, LAYOUTS.transitional);
  const target = inspectLayout(root, LAYOUTS.target);

  if (transitional.any && !transitional.complete) {
    throw new Error('Incomplete transitional runtime layout: js/core and js/modules must exist together');
  }
  if (target.any && !target.complete) {
    throw new Error('Incomplete target runtime layout: core and modules must exist together');
  }
  if (transitional.complete && target.complete) {
    throw new Error('Mixed runtime layout: transitional and target paths must not coexist');
  }
  if (target.complete) return LAYOUTS.target;
  if (transitional.complete) return LAYOUTS.transitional;

  throw new Error('Runtime layout not found: expected js/core + js/modules or core + modules');
}

export default detectRuntimeLayout;
