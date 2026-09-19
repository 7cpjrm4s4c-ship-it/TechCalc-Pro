import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { detectRuntimeLayout } from '../scripts/runtime-layout.mjs';

const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'techcalc-runtime-layout-'));
const clearLayout = () => {
  for (const dir of ['js', 'core', 'modules']) {
    fs.rmSync(path.join(workspace, dir), { recursive: true, force: true });
  }
};

try {
  fs.mkdirSync(path.join(workspace, 'js/core'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'js/modules'), { recursive: true });
  assert.equal(detectRuntimeLayout(workspace).id, 'transitional');

  clearLayout();
  fs.mkdirSync(path.join(workspace, 'core'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'modules'), { recursive: true });
  assert.equal(detectRuntimeLayout(workspace).id, 'target');

  fs.mkdirSync(path.join(workspace, 'js/core'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'js/modules'), { recursive: true });
  assert.throws(() => detectRuntimeLayout(workspace), /Mixed runtime layout/);

  clearLayout();
  fs.mkdirSync(path.join(workspace, 'core'), { recursive: true });
  assert.throws(() => detectRuntimeLayout(workspace), /Incomplete target runtime layout/);
} finally {
  fs.rmSync(workspace, { recursive: true, force: true });
}

console.log('runtime layout transition contract ok');
