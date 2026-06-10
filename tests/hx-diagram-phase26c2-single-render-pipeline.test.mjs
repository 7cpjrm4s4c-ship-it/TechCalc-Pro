import assert from 'node:assert/strict';
import fs from 'node:fs';
import config from '../js/modules/hx-diagram/config.js';
import { createHxRenderModel, renderResults, renderDiagram, renderDynamicSections, renderProcessSelection, HX_DYNAMIC } from '../js/modules/hx-diagram/renderPipeline.js';
import { isDynamicHxDiagramAction } from '../js/modules/hx-diagram/dynamicRenderer.js';

const base = 'js/modules/hx-diagram/';
const view = fs.readFileSync(base + 'view.js', 'utf8');
const dynamic = fs.readFileSync(base + 'dynamicRenderer.js', 'utf8');
const pipeline = fs.readFileSync(base + 'renderPipeline.js', 'utf8');
const formRenderer = fs.readFileSync(base + 'formRenderer.js', 'utf8');

assert.match(config.migrationStatus, /^phase-26c(2|3)-/);
assert.ok(fs.existsSync(base + 'renderPipeline.js'), 'renderPipeline.js must exist');
assert.match(view, /data-hx-dynamic="\$\{HX_DYNAMIC\.results\}"/, 'view must expose result dynamic island');
assert.match(view, /data-hx-dynamic="\$\{HX_DYNAMIC\.diagram\}"/, 'view must expose diagram dynamic island');
assert.match(formRenderer, /data-hx-dynamic="\$\{HX_DYNAMIC\.process\}"/, 'form renderer must expose process dynamic island');
assert.match(dynamic, /renderDynamicSections/, 'dynamic renderer must delegate to the central h,x render pipeline');
assert.match(pipeline, /export function renderResults/, 'pipeline must own result rendering entrypoint');
assert.match(pipeline, /export function renderDiagram/, 'pipeline must own diagram rendering entrypoint');
assert.match(pipeline, /export function renderDynamicSections/, 'pipeline must own dynamic section orchestration');

const snapshot = { tempC: '20', rhPercent: '50', targetTempC: '8', targetRhPercent: '90', process: 'cool-dehumidify', savedProcesses: [] };
const vm = createHxRenderModel(snapshot);
assert.ok(Array.isArray(vm.activePath) && vm.activePath.length >= 2, 'view model must expose live process path');
assert.match(renderResults(vm), /Automatische Zustandsänderung/, 'pipeline must render result section');
assert.match(renderDiagram(vm), /h,x-Diagramm/, 'pipeline must render diagram section');
assert.match(renderProcessSelection(vm), /Luftbehandlung wählen/, 'pipeline must render process selection section');
assert.equal(isDynamicHxDiagramAction({ action: 'platform:field:input' }), true, 'field input must use dynamic pipeline');
assert.equal(isDynamicHxDiagramAction({ action: 'hx:process' }), true, 'process selection must use dynamic pipeline');

const root = documentLikeRoot();
renderDynamicSections(root, snapshot, { action: 'platform:field:input', changed: ['tempC'] });
assert.match(root.hosts[HX_DYNAMIC.results].innerHTML, /Automatische Zustandsänderung/, 'dynamic pipeline must update result island');
assert.match(root.hosts[HX_DYNAMIC.diagram].innerHTML, /h,x-Diagramm/, 'dynamic pipeline must update diagram island');
assert.match(root.hosts[HX_DYNAMIC.process].innerHTML, /Luftbehandlung wählen/, 'dynamic pipeline must update process island');
assert.ok(root.__tcHxRenderPipeline, 'dynamic pipeline must stamp root with render metadata');

function documentLikeRoot() {
  const hosts = Object.fromEntries(Object.values(HX_DYNAMIC).map(key => [key, { innerHTML: '' }]));
  return {
    hosts,
    querySelector(selector) {
      const match = String(selector).match(/data-hx-dynamic="([^"]+)"/);
      return match ? hosts[match[1]] || null : null;
    }
  };
}

console.log('hx diagram phase 26C.2 single render pipeline ok');
