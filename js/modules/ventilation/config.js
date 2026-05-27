import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({ id:'ventilation', title:'Lüftung', shortTitle:'Lüftung', group:'Lufttechnik', accent:'cyan', order:20, defaultVisible:true, migrationStatus:'legacy-adapter', capabilities:[MODULE_CAPABILITIES.CENTRAL_SAVED_RECORDS], description:'Luftleistung, Volumenstrom, Temperaturspreizung und Massenstrom.' });
