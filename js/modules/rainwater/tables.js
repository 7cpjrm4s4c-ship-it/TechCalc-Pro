export const areaTypes = [
  { id:'metal-roof', name:'Dachfläche · Metall/Glas/Schiefer/Faserzement', cs:1.0, cm:0.9, group:'Dachflächen' },
  { id:'tile-roof', name:'Dachfläche · Ziegel/Abdichtungsbahn', cs:1.0, cm:0.8, group:'Dachflächen' },
  { id:'flat-gravel-roof', name:'Flachdach · Kies/Gründach > 3° oder 5 %', cs:0.8, cm:0.8, group:'Dachflächen' },
  { id:'green-extensive-steep', name:'Extensivbegrünung > 5°', cs:0.7, cm:0.4, group:'Dachflächen' },
  { id:'green-extensive-10', name:'Extensivbegrünung ≤ 5° ab 10 cm Aufbau', cs:0.4, cm:0.2, group:'Dachflächen' },
  { id:'green-intensive', name:'Intensivbegrünung ≤ 5° ab 30 cm Aufbau', cs:0.2, cm:0.1, group:'Dachflächen' },
  { id:'concrete-asphalt', name:'Beton/Asphalt', cs:1.0, cm:0.9, group:'Verkehrsflächen' },
  { id:'paving-sealed', name:'Pflaster mit Fugenverguss', cs:1.0, cm:0.8, group:'Verkehrsflächen' },
  { id:'paving-open', name:'Pflaster/Platten mit offenen Fugen', cs:0.7, cm:0.6, group:'Verkehrsflächen' },
  { id:'gravel', name:'Lockerer Kiesbelag / Schotterrasen', cs:0.3, cm:0.2, group:'Verkehrsflächen' },
  { id:'lawn-flat', name:'Rasenfläche · flaches Gelände', cs:0.2, cm:0.1, group:'Grünflächen' },
  { id:'lawn-steep', name:'Rasenfläche · steiles Gelände', cs:0.3, cm:0.2, group:'Grünflächen' },
  { id:'custom', name:'Freie Fläche / eigener Abflussbeiwert', cs:0, cm:0, custom:true, group:'Benutzerdefiniert' }
];

export const dnOrder = ['DN 70','DN 80','DN 90','DN 100','DN 125','DN 150','DN 200','DN 225','DN 250','DN 300'];
const dn = dnOrder;
const a3 = [[0.2,null,null,null,null,null,null,6.3,8.6,11.4,21.0],[0.3,null,null,null,null,null,4.2,7.7,10.5,14.0,25.8],[0.4,null,null,null,null,2.4,4.8,8.9,12.2,16.2,29.9],[0.5,null,null,null,1.8,2.7,5.4,10.0,13.7,18.1,33.4],[0.6,null,null,1.1,1.9,3.0,5.9,11.0,15.0,19.8,36.7],[0.7,0.8,1.1,1.2,2.1,3.2,6.4,11.8,16.2,21.4,39.6],[0.8,0.9,1.1,1.3,2.2,3.5,6.8,12.7,17.3,22.9,42.4],[1.0,1.0,1.3,1.5,2.5,3.9,7.7,14.2,19.4,25.7,47.4],[1.5,1.2,1.6,1.8,3.1,4.7,9.4,17.4,23.8,31.5,58.2],[2.0,1.4,1.8,2.1,3.5,5.5,10.9,20.1,27.5,36.4,67.2],[3.0,1.7,2.2,2.6,4.4,6.7,13.3,24.7,33.7,44.6,82.4],[5.0,2.2,2.9,3.3,5.6,8.7,17.2,31.9,null,null,null]];
const a4 = [[0.2,null,null,null,null,null,5.7,10.9,14.4,19.0,35.1],[0.3,null,null,null,null,3.5,7.0,12.9,17.6,23.3,43.1],[0.4,null,null,null,2.6,4.1,8.1,14.9,20.4,27.0,49.9],[0.5,null,1.5,1.7,2.9,4.6,9.0,16.7,22.8,30.2,55.8],[0.7,1.4,1.8,2.1,3.5,5.4,10.7,19.8,27.1,35.8,66.1],[1.0,1.7,2.2,2.5,4.2,6.5,12.8,23.7,32.4,42.8,79.1],[1.5,2.0,2.7,3.1,5.1,7.9,15.7,29.1,39.7,52.5,97.0],[2.0,2.4,3.1,3.5,5.9,9.2,18.2,33.6,45.9,60.7,112.1],[3.0,2.9,3.8,4.3,7.3,11.3,22.3,41.2,56.3,74.4,null],[5.0,3.8,4.9,5.6,9.4,14.6,28.8,null,null,null,null]];
const a5 = [[0.2,null,null,null,null,null,null,12.5,17.2,22.7,42.1],[0.3,null,null,null,null,null,8.3,15.4,21.1,27.9,51.7],[0.4,null,null,null,null,4.9,9.6,17.8,24.4,32.3,59.7],[0.5,null,null,null,3.5,5.4,10.8,20.0,27.3,36.2,66.9],[0.7,1.6,2.1,2.5,4.2,6.5,12.8,23.7,32.4,42.9,79.3],[1.0,2.0,2.6,3.0,5.0,7.7,15.3,28.4,38.8,51.3,94.9],[1.5,2.4,3.2,3.6,6.1,9.5,18.8,34.8,47.6,62.9,116.3],[2.0,2.8,3.7,4.2,7.1,11.0,21.7,40.2,55.0,72.7,134.4],[3.0,3.5,4.5,5.2,8.7,13.5,26.7,49.3,67.4,89.2,164.8],[5.0,4.5,5.8,6.7,11.3,17.4,34.5,63.8,null,null,null]];
function rowsToTable(rows) { return rows.map(row => ({ slope: row[0], values: Object.fromEntries(dn.map((name, idx) => [name, row[idx + 1]])) })); }
export const hydraulicTables = { '0.5': rowsToTable(a3), '0.7': rowsToTable(a4), '1.0': rowsToTable(a5) };

export const roofDrainTable = [
  { dn:'DN 50', capacity:0.9, head:35 }, { dn:'DN 70', capacity:1.7, head:35 }, { dn:'DN 75', capacity:2.6, head:35 },
  { dn:'DN 90', capacity:3.0, head:35 }, { dn:'DN 100', capacity:4.5, head:35 }, { dn:'DN 125', capacity:7.0, head:45 }, { dn:'DN 150', capacity:8.1, head:45 }
];
export const gutterCombinations = {
  withOutlet: [
    { nominal:'250', di:60, q:1.8 }, { nominal:'250', di:80, q:2.2 }, { nominal:'280', di:80, q:3.0 }, { nominal:'280', di:100, q:3.3 },
    { nominal:'333', di:80, q:5.0 }, { nominal:'333', di:100, q:5.3 }, { nominal:'400', di:100, q:9.0 }, { nominal:'400', di:120, q:9.3 }
  ],
  withoutOutlet: [
    { nominal:'250', di:60, q:1.5 }, { nominal:'250', di:80, q:2.0 }, { nominal:'280', di:80, q:2.6 }, { nominal:'280', di:100, q:3.0 },
    { nominal:'333', di:80, q:4.0 }, { nominal:'333', di:100, q:4.5 }, { nominal:'400', di:100, q:6.8 }, { nominal:'400', di:120, q:7.4 },
    { nominal:'500', di:100, q:10.5 }, { nominal:'500', di:120, q:12.0 }, { nominal:'500', di:150, q:14.5 }
  ]
};
