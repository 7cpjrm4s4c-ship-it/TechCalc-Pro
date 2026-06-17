import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({ id:'pipe-sizing', title:'Rohrdimensionierung', shortTitle:'Rohr', group:'Sanitär / Heizung', accent:'blue', order:30, defaultVisible:true, capabilities: [MODULE_CAPABILITIES.CENTRAL_NUMBER_SERVICE, MODULE_CAPABILITIES.FORM_SCHEMA, MODULE_CAPABILITIES.CENTRAL_SAVED_RECORDS], description:'Empfehlung der DN anhand Volumenstrom oder Massenstrom und maximalem Druckverlust.' });
