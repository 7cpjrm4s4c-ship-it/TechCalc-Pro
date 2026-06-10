import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({
  id: 'hx-diagram',
  title: 'h,x-Diagramm',
  shortTitle: 'h,x',
  group: 'Lufttechnik',
  accent: 'cyan',
  order: 27,
  defaultVisible: false,

  migrationStatus: 'phase-26b3-result-renderer',
  capabilities: [MODULE_CAPABILITIES.CENTRAL_NUMBER_SERVICE, MODULE_CAPABILITIES.FORM_SCHEMA, MODULE_CAPABILITIES.CENTRAL_SAVED_RECORDS],
  description: 'Luftzustände, Zustandsänderungen und Verlauf im h,x-Diagramm nach Mollier.'
});
