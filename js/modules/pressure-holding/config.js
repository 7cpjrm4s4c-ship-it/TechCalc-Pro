import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({
  id: 'pressure-holding',
  title: 'Druckhaltung',
  shortTitle: 'Druck',
  group: 'HLK-Anlagen',
  accent: 'purple',
  order: 15,
  defaultVisible: false,

  migrationStatus: 'legacy-adapter',
  capabilities: [MODULE_CAPABILITIES.CENTRAL_NUMBER_SERVICE],
  description: 'Auslegung von MAG und dynamischer Druckhaltung für Heiz- und Kühlwassersysteme nach Reflex-Berechnungsgrundlagen.'
});
