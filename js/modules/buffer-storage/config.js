import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({
  id: 'buffer-storage',
  title: 'Pufferspeicher',
  shortTitle: 'Puffer',
  group: 'HLK-Anlagen',
  accent: 'cyan',
  order: 16,
  defaultVisible: false,

  migrationStatus: 'legacy-adapter',
  capabilities: [MODULE_CAPABILITIES.CENTRAL_SAVED_RECORDS],
  description: 'Auslegung von Pufferspeichern für Kaltwassersätze, Wärmepumpen-Abtaubetrieb sowie Kälte-/Wärmevorlagen.'
});
