import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({
  id: 'dashboard',
  title: 'Dashboard',
  shortTitle: 'Dashboard',
  group: 'Start',
  accent: 'blue',
  order: 0,
  defaultVisible: true,
  capabilities: [MODULE_CAPABILITIES.LEGACY_MOUNT],
  migrationStatus: 'platform',
  description: 'Zentrale Startseite mit Schnellzugriffen, Status und Hinweisen.'
});
