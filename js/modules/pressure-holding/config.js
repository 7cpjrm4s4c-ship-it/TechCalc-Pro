import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({
  id: 'pressure-holding',
  title: 'Druckhaltung',
  shortTitle: 'Druck',
  group: 'HLK-Anlagen',
  accent: 'purple',
  order: 15,
  defaultVisible: false,

  migrationStatus: 'phase-16e-event-pipeline-consolidation phase-20b2-saved-record-controller phase-20b3-result-renderer',
  capabilities: [MODULE_CAPABILITIES.CENTRAL_NUMBER_SERVICE, MODULE_CAPABILITIES.FORM_SCHEMA, MODULE_CAPABILITIES.CENTRAL_SAVED_RECORDS],
  description: 'Auslegung von MAG und dynamischer Druckhaltung für Heiz- und Kühlwassersysteme nach Reflex-Berechnungsgrundlagen.'
});
