import { validateFormSchema, readSchemaDefaults } from './formSchema.js';

export const MODULE_CONTRACT_VERSION = '1.3.2-dev.1';

export const MODULE_CAPABILITIES = Object.freeze({
  LEGACY_MOUNT: 'legacyMount',
  FORM_SCHEMA: 'formSchema',
  CENTRAL_SAVED_RECORDS: 'centralSavedRecords',
  CENTRAL_SCROLL: 'centralScroll',
  CENTRAL_NUMBER_SERVICE: 'centralNumberService',
  RESULT_SCHEMA: 'resultSchema'
});

const REQUIRED_CONFIG_FIELDS = ['id', 'title', 'shortTitle', 'group', 'accent'];

export function defineModuleConfig(config = {}) {
  const normalized = {
    contractVersion: MODULE_CONTRACT_VERSION,
    capabilities: [],
    migrationStatus: 'legacy',
    ...config
  };
  REQUIRED_CONFIG_FIELDS.forEach(field => {
    if (!normalized[field]) throw new Error(`Module config incomplete: ${field} missing.`);
  });
  return Object.freeze({
    ...normalized,
    capabilities: Object.freeze([...(normalized.capabilities || [])])
  });
}

export function defineModuleDefinition(definition = {}) {
  const config = defineModuleConfig(definition.config || definition);
  if (definition.schema) validateFormSchema(definition.schema);
  if (definition.calculate && typeof definition.calculate !== 'function') {
    throw new Error(`Module ${config.id}: calculate must be a function.`);
  }
  return Object.freeze({
    ...definition,
    config,
    schema: definition.schema || null,
    initialState: Object.freeze({ ...readSchemaDefaults(definition.schema || {}), ...(definition.initialState || {}) }),
    results: Object.freeze([...(definition.results || [])])
  });
}

export function assertModuleRegistrationContract(module = {}) {
  const source = module.module || module;
  const config = module.config || source.config || {};
  defineModuleConfig(config);
  if (source.schema) validateFormSchema(source.schema);
  if (source.results && !Array.isArray(source.results)) {
    throw new Error(`Module ${config.id}: results must be an array.`);
  }
  if (source.schema && typeof source.calculate !== 'function') {
    throw new Error(`Module ${config.id}: schema modules must expose calculate(state).`);
  }
  return true;
}

export function moduleContractSummary(module = {}) {
  const config = module.config || module.module?.config || {};
  const source = module.module || module;
  const capabilities = new Set(config.capabilities || []);
  if (source.schema) capabilities.add(MODULE_CAPABILITIES.FORM_SCHEMA);
  if (source.results) capabilities.add(MODULE_CAPABILITIES.RESULT_SCHEMA);
  if (typeof source.mount === 'function' && !source.schema) capabilities.add(MODULE_CAPABILITIES.LEGACY_MOUNT);
  return {
    id: config.id,
    title: config.title,
    contractVersion: config.contractVersion || 'legacy',
    migrationStatus: config.migrationStatus || 'legacy',
    capabilities: [...capabilities]
  };
}
