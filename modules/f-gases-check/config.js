import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({
  id: 'f-gases-check',
  title: 'F-Gase-Check',
  shortTitle: 'F-Gase',
  group: 'Kälte-, Klima- und Wärmepumpentechnik',
  accent: 'blue',
  order: 30,
  defaultVisible: false,
  migrationStatus: 'platform',
  capabilities: [
    MODULE_CAPABILITIES.CENTRAL_NUMBER_SERVICE,
    MODULE_CAPABILITIES.CENTRAL_SCROLL,
    MODULE_CAPABILITIES.FORM_SCHEMA,
    MODULE_CAPABILITIES.RESULT_SCHEMA
  ],
  description: 'Regulatorischer Check für Kälte-, Klima- und Wärmepumpenanlagen.'
});
