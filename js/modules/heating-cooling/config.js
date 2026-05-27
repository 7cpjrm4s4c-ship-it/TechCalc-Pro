import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({ id:'heating-cooling', title:'Heizung / Kälte', shortTitle:'Heizung', group:'HLK-Anlagen', accent:'orange', order:10, defaultVisible:true, migrationStatus:'legacy-adapter', capabilities:[MODULE_CAPABILITIES.CENTRAL_NUMBER_SERVICE], description:'Leistung, Massenstrom und Temperaturspreizung für wassergeführte Systeme.' });
