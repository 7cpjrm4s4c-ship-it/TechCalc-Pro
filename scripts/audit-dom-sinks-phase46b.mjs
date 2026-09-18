import fs from 'node:fs';
import path from 'node:path';
import { detectRuntimeLayout } from './runtime-layout.mjs';

const root = process.cwd();
const runtimeLayout = detectRuntimeLayout(root);
const coreFile = relativePath => `${runtimeLayout.coreDir}/${relativePath}`;
const moduleFile = relativePath => `${runtimeLayout.modulesDir}/${relativePath}`;

const allowedInnerHtmlFiles = new Set([
  coreFile('domUpdate.js'),
  coreFile('ui/dynamicRenderer.js'),
  coreFile('lineSectionController/index.js'),
  coreFile('moduleRuntime.js'),
  coreFile('navigation.js'),
  coreFile('platformModuleRuntime.js'),
  moduleFile('drinking-water/dynamicRenderer.js'),
  moduleFile('heat-recovery/dynamicRenderer.js'),
  moduleFile('hx-diagram/renderPipeline.js'),
  moduleFile((mixed-air/dynamicRenderer.js')),
  coreFile('ux/releaseNotesController.js')
]);
