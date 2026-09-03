import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({
  id: 'en-378-safety-check',
  title: 'EN 378 Sicherheitscheck',
  shortTitle: 'EN 378',
  group: 'Kälte-, Klima- und Wärmepumpentechnik',
  accent: 'blue',
  order: 31,
  defaultVisible: false,
  migrationStatus: 'platform',
  capabilities: [
    MODULE_CAPABILITIES.CENTRAL_NUMBER_SERVICE,
    MODULE_CAPABILITIES.CENTRAL_SCROLL,
    MODULE_CAPABILITIES.FORM_SCHEMA,
    MODULE_CAPABILITIES.RESULT_SCHEMA
  ],
  description: 'Sicherheitstechnischer Check für Kälte-, Klima- und Wärmepumpenanlagen nach EN 378.'
});
