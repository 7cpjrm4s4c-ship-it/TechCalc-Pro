import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({ id:'ventilation', title:'Lüftung', shortTitle:'Lüftung', group:'Lufttechnik', accent:'cyan', order:20, defaultVisible:true, migrationStatus: 'phase-13e-ventilation-temperature-render-fix phase-19b1-platform-mount phase-19b2b-line-section-controller', capabilities: [MODULE_CAPABILITIES.CENTRAL_SAVED_RECORDS, MODULE_CAPABILITIES.FORM_SCHEMA, MODULE_CAPABILITIES.CENTRAL_NUMBER_SERVICE], description:'Luftleistung, Volumenstrom, Temperaturspreizung und Massenstrom.' });
