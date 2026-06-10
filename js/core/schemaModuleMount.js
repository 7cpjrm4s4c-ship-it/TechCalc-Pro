import { renderModuleShell } from './renderer.js';
import { mountModule } from './mount.js';
import { createSchemaView } from './schemaRenderer.js';
import { defineModuleDefinition } from './moduleDefinition.js';

export function createSchemaModule(definition) {
  const moduleDefinition = defineModuleDefinition(definition);
  if (typeof moduleDefinition.calculate !== 'function') {
    throw new Error(`Schema module ${moduleDefinition.config.id} needs calculate(state).`);
  }
  const schemaView = createSchemaView(moduleDefinition);
  function view(snapshot) {
    return renderModuleShell(moduleDefinition.config, schemaView(snapshot || {}));
  }
  return {
    ...moduleDefinition,
    mount(root) {
      return mountModule(root, moduleDefinition.state, view, moduleDefinition.afterRender);
    }
  };
}
