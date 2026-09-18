import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({
  id: 'heat-recovery',
  title: 'Wärmerückgewinnung',
  shortTitle: 'WRG',
  group: 'Lufttechnik',
  accent: 'cyan',
  order: 25,
  defaultVisible: false,

  capabilities: [
    MODULE_CAPABILITIES.CENTRAL_NUMBER_SERVICE,
    MODULE_CAPABILITIES.FORM_SCHEMA,
    MODULE_CAPABILITIES.CENTRAL_SAVED_RECORDS
  ],
  description: 'Berechnung von Wärmerückgewinnung in Lüftungsanlagen. phase-24d-hardening phase-24e-final-hardening'
});
