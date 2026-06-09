import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({
  id: 'drinking-water',
  title: 'Trinkwasserberechnung',
  shortTitle: 'Trinkwasser',
  group: 'Sanitärtechnik',
  accent: 'blue',
  order: 35,
  defaultVisible: false,

  migrationStatus: 'phase-25b3-result-renderer-migration phase-25c-dynamic-controller-contract phase-25d-hardening phase-25e-final-hardening',
  capabilities: [MODULE_CAPABILITIES.CENTRAL_NUMBER_SERVICE, MODULE_CAPABILITIES.FORM_SCHEMA, MODULE_CAPABILITIES.CENTRAL_SAVED_RECORDS],
  description: 'Nutzungseinheiten, Einzelverbraucher, Summen- und Spitzendurchfluss nach DIN 1988-300.'
});
