// Backward-compatible facade kept for phase 1-3 imports.
// New platform code should import from moduleDefinition.js and formSchema.js directly.
export {
  MODULE_CONTRACT_VERSION,
  MODULE_CAPABILITIES,
  defineModuleConfig,
  defineModuleDefinition,
  assertModuleRegistrationContract,
  moduleContractSummary
} from './moduleDefinition.js';

export {
  FIELD_TYPES,
  defineFormSchema,
  validateFormSchema as validateSchema,
  readSchemaDefaults,
  renderFormSchema as renderSchemaForm,
  renderResultSchema as renderSchemaResults
} from './formSchema.js';

import { renderModuleShell } from './renderer.js';
import { defineModuleDefinition } from './moduleDefinition.js';
import { renderFormSchema, renderResultSchema } from './formSchema.js';

export function normalizeModuleDefinition(definition = {}) {
  return defineModuleDefinition(definition);
}

export function renderContractModule(definition, state) {
  const module = defineModuleDefinition(definition);
  if (typeof module.calculate !== 'function') {
    throw new Error(`Module contract: calculate(state) fehlt (${module.config.id}).`);
  }
  const result = module.calculate(state || {});
  const inner = [
    renderFormSchema(module.schema, state, { title: 'Eingaben', accent: module.config.accent }),
    renderResultSchema(module.results, result, { accent: module.config.accent })
  ].join('');
  return renderModuleShell(module.config, inner);
}
