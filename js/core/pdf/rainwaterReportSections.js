import { formatEngineeringNumber } from '../numberService.js';
const a=v=>Array.isArray(v)?v:[];
const t=v=>v==null||v===''?'—':String(v);
const f=(v,k='generic')=>v==null||v===''?'—':formatEngineeringNumber(v,k);
const r=(l,v,u='')=>[l,t(v),u];
const n=(l,v,k,u='')=>[l,f(v,k),v==null||v===''?'':u];
const emergencyLabel=x=>x==='rect'?'Rechteckiger Notüberlauf':x==='round'?'Runder Notüberlauf':x==='manual'?'Herstellerwert / manuell':x||'—';

function surfaceSection(s,i){
 const d=s.drain||{}, st=s.stack||{}, c=s.collector||{}, e=s.emergency||{};
 const rows=[
  r('Bezeichnung',s.name),r('Bereich',s.mode),r('Flächenart',s.areaTypeLabel||s.areaType),
  n('Entwässerungsfläche A',s.areaM2,'area','m²'),n('Spitzenabflussbeiwert Cs',s.runoffCoefficientCs,'factor'),
  n(s.mode==='property'?'Regenspende r(5,2)':'Regenspende r(5,5)',s.designRainIntensity,'rainIntensity','l/(s·ha)')
 ];
 if(s.mode==='roof') rows.push(n('Starkregenspende r(5,100)',s.hundredYearRainIntensity,'rainIntensity','l/(s·ha)'));
 rows.push(
  n('Entwässerungsmenge Qr',s.rainwaterFlowLs,'flow','l/s'),r('Ablaufdimension',d.nominalDiameter),
  n('Abflussvermögen je Ablauf',d.capacityLs,'flow','l/s'),n('Anstauhöhe am Ablauf',d.headMm,'length','mm'),
  n('Erforderliche Abläufe',d.requiredCount,'integer','Stk.'),r('Fallleitung',st.nominalDiameter),
  n('Fallleitungen Anzahl',st.count,'integer','Stk.'),n('Abfluss je Fallleitung',st.flowPerStackLs,'flow','l/s'),
  r('Sammelleitung',c.nominalDiameter),r('Füllungsgrad Sammelleitung',c.fillRatio),r('Gefälle Sammelleitung',c.slopeCmM,'cm/m')
 );
 if(s.mode==='roof') rows.push(
  r('Notentwässerung Typ',emergencyLabel(e.type)),n('Basis-Notabfluss',e.baseFlowLs,'flow','l/s'),
  n('Sicherheitsfaktor',e.safetyFactor,'factor'),n('Bemessungsabfluss QNot',e.requiredFlowLs,'flow','l/s'),
  n('Anstauhöhe Notüberlauf',e.headMm,'length','mm'),
  ...(e.type==='rect'?[n('Breite Notüberlauf',e.widthMm,'length','mm')]:[]),
  ...(e.type==='round'?[n('Durchmesser Notüberlauf',e.diameterMm,'length','mm')]:[]),
  ...(e.type==='manual'?[r('Hersteller-DN Notüberlauf',e.manufacturerDn)]:[]),
  n('Abflussvermögen je Notüberlauf',e.capacityLs,'flow','l/s'),
  n('Erforderliche Anzahl Notüberläufe',e.requiredCount,'integer','Stk.'),
  n('Rechnerisch erforderliche Breite',e.requiredWidthMm,'length','mm'),
  r('Hinweis','Notentwässerung als Vorbemessung. Überflutungsnachweis und Rückhalteraumbemessung sind nicht Bestandteil dieser Berechnung.')
 );
 return {title:`${i+1}. ${s.name||`Regenfläche ${i+1}`}`,rows,isLineSection:false};
}
export function buildRainwaterReportSections(dto={}){
 if(dto.metadata?.dtoType!=='techcalc.rainwater.report') return [];
 const sections=a(dto.surfaces).map(surfaceSection);
 if(a(dto.warnings).length) sections.push({title:`${sections.length+1}. Hinweise / Prüfhinweise`,rows:a(dto.warnings).map(x=>r('Hinweis',x)),isLineSection:false});
 return sections;
}
export default buildRainwaterReportSections;
