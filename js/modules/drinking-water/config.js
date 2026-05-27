import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({
  id: 'drinking-water',
  title: 'Trinkwasserberechnung',
  shortTitle: 'Trinkwasser',
  group: 'Sanitärtechnik',
  accent: 'blue',
  order: 35,
  defaultVisible: false,

  migrationStatus: 'legacy-adapter',
  capabilities: [MODULE_CAPABILITIES.CENTRAL_NUMBER_SERVICE],
  description: 'Nutzungseinheiten, Einzelverbraucher, Summen- und Spitzendurchfluss nach DIN 1988-300.'
});
