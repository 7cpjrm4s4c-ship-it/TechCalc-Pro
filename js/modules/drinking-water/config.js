import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({
  id: 'drinking-water',
  title: 'Trinkwasserberechnung',
  shortTitle: 'Trinkwasser',
  group: 'Sanitärtechnik',
  accent: 'blue',
  order: 35,
  defaultVisible: false,

  migrationStatus: 'phase-25b3-result-renderer-migration phase-25c-dynamic-controller-contract phase-25d-hardening phase-25e-final-hardening phase-25e1-water-heating-preview-fix phase-25e2a-water-heating-ui-switch-fix phase-25e2b-navigation-persistence-fix phase-25e2c-water-heating-visible-labels-fix',
  capabilities: [MODULE_CAPABILITIES.CENTRAL_NUMBER_SERVICE, MODULE_CAPABILITIES.FORM_SCHEMA, MODULE_CAPABILITIES.CENTRAL_SAVED_RECORDS],
  description: 'Nutzungseinheiten, Einzelverbraucher, Summen- und Spitzendurchfluss nach DIN 1988-300.'
});
