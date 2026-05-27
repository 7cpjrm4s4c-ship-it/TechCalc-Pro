import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({
  id: 'hx-diagram',
  title: 'h,x-Diagramm',
  shortTitle: 'h,x',
  group: 'Lufttechnik',
  accent: 'cyan',
  order: 27,
  defaultVisible: false,

  migrationStatus: 'legacy-adapter',
  capabilities: [MODULE_CAPABILITIES.CENTRAL_NUMBER_SERVICE],
  description: 'Luftzustände, Zustandsänderungen und Verlauf im h,x-Diagramm nach Mollier.'
});
