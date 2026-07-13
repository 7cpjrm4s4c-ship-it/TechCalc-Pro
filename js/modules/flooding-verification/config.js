import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({
  id: 'flooding-verification',
  title: 'Überflutungsnachweis',
  shortTitle: 'Überflutung',
  group: 'Sanitär',
  accent: 'green',
  order: 20,
  defaultVisible: false,
  capabilities: [
    MODULE_CAPABILITIES.CENTRAL_NUMBER_SERVICE,
   