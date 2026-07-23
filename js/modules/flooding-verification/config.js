import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export const FLOODING_VERIFICATION_FEATURE_FLAG = 'floodingVerification';

export default defineModuleConfig({
  id: 'flooding-verification',
  title: 'Überflutungsnachweis',
  shortTitle: 'Überflutung',
  group: 'Sanitär',
  accent: 'green',
  order: 20,
  defaultVisible: false,
  migrationStatus: 'platform',
  capabilities: [
    MODULE_CAPABILITIES.CENTRAL_NUMBER_SERVICE,
    MODULE_CAPABILITIES.CENTRAL_SCROLL,
    MODULE_CAPABILITIES.CENTRAL_SAVED_RECORDS,
    MODULE_CAPABILITIES.FORM_SCHEMA,
    MODULE_CAPABILITIES.RESULT_SCHEMA
  ],
  description: 'Überflutungs- und Rückhaltenachweis mit Flächenverwaltung, Leitungsnachweis und prüffähigem Berechnungsreport.'
});
