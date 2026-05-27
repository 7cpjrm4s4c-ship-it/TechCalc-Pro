import { renderModuleShell } from './renderer.js';
import { mountModule } from './mount.js';
import { renderFormSchema, renderResultSchema } from './formSchema.js';
import { defineModuleDefinition } from './moduleDefinition.js';

export function createSchemaModule(definition) {
  const moduleDefinition = defineModuleDefinition(definition);
  if (typeof moduleDefinition.calculate !== 'function') {
    throw new Error(`Schema module ${moduleDefinition.config.id} needs calculate(state).`);
  }
  function view(snapshot) {
    const result = moduleDefinition.calculate(snapshot || {});
    const body = [
      renderFormSchema(moduleDefinition.schema, snapshot, { accent: moduleDefinition.config.accent }),
      renderResultSchema(moduleDefinition.results, result, { accent: moduleDefinition.config.accent })
    ].join('');
    return renderModuleShell(moduleDefinition.config, body);
  }
  return {
    ...moduleDefinition,
    mount(root) {
      return mountModule(root, moduleDefinition.state, view, moduleDefinition.afterRender);
    }
  };
}
