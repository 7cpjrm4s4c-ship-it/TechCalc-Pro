import config from './config.js';
import schema from './schema.js';
import { state, initialState } from './state.js';
import { calculate } from './logic.js';
import { results } from './results.js';
import { buildRainwaterReportDto } from './reportAdapter.js';
import controller, { buildRainwaterRecord, rainwaterSavedStats, rainwaterSavedSubtitle, statePatchFromSurface, bindRainwaterController } from './controller.js';
import { createLineSectionController } from '../../platform/lineSectionController/index.js';
import { createRainwaterDynamicRenderer } from '../../platform/dynamicRenderer/index.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createRainwaterView } from './view.js';

const lineSectionController = createLineSectionController({
 state,listKey:'surfaces',activeIdKey:'activeSurfaceId',nameKey:'areaName',expandedIdKey:'expandedSurfaceResultId',
 recordPrefix:'rain-surface',cardTitle:'Gespeicherte Fläche',nameInputId:'areaName',namePlaceholder:'z. B. Dachfläche Nord',
 emptyText:'Noch keine Regenflächen gespeichert.',accent:'green',dynamicAttr:'line-sections',
 title:item=>item.name||'Regenfläche',subtitle:rainwaterSavedSubtitle,stats:rainwaterSavedStats,
 currentResult:()=>calculate(state.get()),
 buildRecord:({currentState,result,items,id,name,existing})=>buildRainwaterRecord(currentState,result,items,id,name,existing),
 hydrateRecord:({item,currentState})=>statePatchFromSurface(item,currentState)
});
const { view, dynamicRenderers }=createRainwaterView({config,calculate,lineSectionController});
const rainwaterDynamicRenderer=createRainwaterDynamicRenderer({calculate,lineSectionController,...dynamicRenderers});
function updateRainwaterDynamic(root,s,meta={}){rainwaterDynamicRenderer.update(root,s,meta);}
function isDynamicRainwaterAction(meta={}){return String(meta.action||'')!=='initial';}
function bindRainwaterPlatform(root){bindRainwaterController(root,lineSectionController);}
function report(snapshot=state.get()){return buildRainwaterReportDto({state:snapshot,calculation:calculate(snapshot)});}
export default createPlatformModule({
 config,schema,state,initialState,calculate,results,report,controller,view,bind:bindRainwaterPlatform,
 dynamicUpdate:updateRainwaterDynamic,isDynamicAction:isDynamicRainwaterAction
});
