export const usageTypes = [
  { value: 'residential', label: 'Unregelmaessige Benutzung  -  Wohnhaeuser, Bueros', k: 0.5 },
  { value: 'regular', label: 'Regelmaessige Benutzung  -  Schulen, Hotels, Restaurants', k: 0.7 },
  { value: 'frequent', label: 'Haeufige Benutzung  -  oeffentliche Toiletten/Duschen', k: 1.0 },
  { value: 'custom', label: 'Benutzerdefinierte Abflusskennzahl', k: null }
];

export const fixtureTypes = [
  { id: 'washbasin', name: 'Waschbecken / Bidet', du: 0.5, dn: 'DN 40' },
  { id: 'shower-no-plug', name: 'Dusche ohne Stoepsel', du: 0.6, dn: 'DN 50' },
  { id: 'shower-plug', name: 'Dusche mit Stoepsel', du: 0.8, dn: 'DN 50' },
  { id: 'urinal-cistern', name: 'Einzelurinal mit Spuelkasten', du: 0.8, dn: 'DN 50' },
  { id: 'urinal-flush', name: 'Einzelurinal mit Druckspueler', du: 0.5, dn: 'DN 50' },
  { id: 'stand-urinal', name: 'Standurinal', du: 0.2, dn: 'DN 50' },
  { id: 'waterless-urinal', name: 'Urinal ohne Wasserspuelung', du: 0.1, dn: 'DN 50' },
  { id: 'bathtub', name: 'Badewanne', du: 0.8, dn: 'DN 50' },
  { id: 'kitchen-combined', name: 'Kuechenspuele + Geschirrspueler gemeinsamer Geruchverschluss', du: 0.8, dn: 'DN 50' },
  { id: 'kitchen-sink', name: 'Kuechenspuele / Ausgussbecken', du: 0.8, dn: 'DN 50' },
  { id: 'dishwasher', name: 'Geschirrspueler', du: 0.8, dn: 'DN 50' },
  { id: 'washing-8', name: 'Waschmaschine bis 8 kg', du: 0.8, dn: 'DN 50' },
  { id: 'washing-12', name: 'Waschmaschine bis 12 kg', du: 1.5, dn: 'DN 56/60' },
  { id: 'wc-45', name: 'WC mit 4,0/4,5 l Spuelkasten', du: 1.8, dn: 'DN 80 / DN 90', wc: true },
  { id: 'wc-6', name: 'WC mit 6,0 l Spuelkasten/Druckspueler', du: 2.0, dn: 'DN 80 bis DN 100', wc: true },
  { id: 'wc-75', name: 'WC mit 7,5 l Spuelkasten/Druckspueler', du: 2.0, dn: 'siehe Anmerkung', wc: true },
  { id: 'wc-9', name: 'WC mit 9,0 l Spuelkasten/Druckspueler', du: 2.5, dn: 'DN 100', wc: true },
  { id: 'floor-50', name: 'Bodenablauf DN 50', du: 0.8, dn: 'DN 50' },
  { id: 'floor-70', name: 'Bodenablauf DN 70', du: 1.5, dn: 'DN 70' },
  { id: 'floor-100', name: 'Bodenablauf DN 100', du: 2.0, dn: 'DN 100' },
  { id: 'custom', name: 'Freier Entwaesserungsgegenstand', du: 0, dn: '-', custom: true }
];

export const branchConnectionTable = [
  { dn: 'DN 50', di: 44, k05: 1.0, k07: 1.0, k10: 0.8, maxLength: 4 },
  { dn: 'DN 56/60', di: '49/56', k05: 2.0, k07: 2.0, k10: 1.0, maxLength: 4 },
  { dn: 'DN 70', di: 68, k05: 9.0, k07: 4.6, k10: 2.2, maxLength: 4, note: 'Keine Klosetts.' },
  { dn: 'DN 80', di: 75, k05: 13.0, k07: 8.0, k10: 4.0, maxLength: 10, note: 'Maximal zwei Klosetts.' },
  { dn: 'DN 90', di: 79, k05: 13.0, k07: 10.0, k10: 5.0, maxLength: 10 },
  { dn: 'DN 100', di: 96, k05: 16.0, k07: 12.0, k10: 6.4, maxLength: 10 }
];

export const stackTable = [
  { dn: 'DN 60', noRadius: 0.5, withRadius: 0.7 },
  { dn: 'DN 70', noRadius: 1.5, withRadius: 2.0 },
  { dn: 'DN 80', noRadius: 2.0, withRadius: 2.6, wcMin: true },
  { dn: 'DN 90', noRadius: 2.7, withRadius: 3.5, wcMin: true },
  { dn: 'DN 100', noRadius: 4.0, withRadius: 5.2 },
  { dn: 'DN 125', noRadius: 5.8, withRadius: 7.6 },
  { dn: 'DN 150', noRadius: 9.5, withRadius: 12.4 },
  { dn: 'DN 200', noRadius: 16.0, withRadius: 21.0 }
];

const dn = ['DN 70','DN 80','DN 90','DN 100','DN 125','DN 150','DN 200','DN 225','DN 250','DN 300'];
const a3 = [
  [0.2,null,null,null,null,null,null,6.3,8.6,11.4,21.0],[0.3,null,null,null,null,null,4.2,7.7,10.5,14.0,25.8],[0.4,null,null,null,null,2.4,4.8,8.9,12.2,16.2,29.9],[0.5,null,null,null,1.8,2.7,5.4,10.0,13.7,18.1,33.4],[0.6,null,null,1.1,1.9,3.0,5.9,11.0,15.0,19.8,36.7],[0.7,0.8,1.1,1.2,2.1,3.2,6.4,11.8,16.2,21.4,39.6],[0.8,0.9,1.1,1.3,2.2,3.5,6.8,12.7,17.3,22.9,42.4],[0.9,0.9,1.2,1.4,2.4,3.7,7.3,13.4,18.4,24.3,45.0],[1.0,1.0,1.3,1.5,2.5,3.9,7.7,14.2,19.4,25.7,47.4],[1.5,1.2,1.6,1.8,3.1,4.7,9.4,17.4,23.8,31.5,58.2],[2.0,1.4,1.8,2.1,3.5,5.5,10.9,20.1,27.5,36.4,67.2],[2.5,1.6,2.0,2.4,4.0,6.1,12.2,22.5,30.8,40.7,75.2],[3.0,1.7,2.2,2.6,4.4,6.7,13.3,24.7,33.7,44.6,82.4],[4.0,2.0,2.6,3.0,5.0,7.8,15.4,28.5,39.0,51.5,null],[5.0,2.2,2.9,3.3,5.6,8.7,17.2,31.9,null,null,null]
];
const a4 = [
  [0.2,null,null,null,null,null,5.7,10.9,14.4,19.0,35.1],[0.3,null,null,null,null,3.5,7.0,12.9,17.6,23.3,43.1],[0.4,null,null,null,2.6,4.1,8.1,14.9,20.4,27.0,49.9],[0.5,null,1.5,1.7,2.9,4.6,9.0,16.7,22.8,30.2,55.8],[0.6,1.3,1.7,1.9,3.2,5.0,9.9,18.3,25.0,33.1,61.2],[0.7,1.4,1.8,2.1,3.5,5.4,10.7,19.8,27.1,35.8,66.1],[0.8,1.5,1.9,2.2,3.7,5.8,11.5,21.2,29.0,38.3,70.7],[0.9,1.6,2.1,2.4,4.0,6.1,12.2,22.5,30.7,40.6,75.0],[1.0,1.7,2.2,2.5,4.2,6.5,12.8,23.7,32.4,42.8,79.1],[1.5,2.0,2.7,3.1,5.1,7.9,15.7,29.1,39.7,52.5,97.0],[2.0,2.4,3.1,3.5,5.9,9.2,18.2,33.6,45.9,60.7,112.1],[2.5,2.6,3.4,4.0,6.7,10.3,20.3,37.6,51.4,67.9,125.4],[3.0,2.9,3.8,4.3,7.3,11.3,22.3,41.2,56.3,74.4,null],[4.0,3.4,4.4,5.0,8.4,13.0,25.8,47.6,null,null,null],[5.0,3.8,4.9,5.6,9.4,14.6,28.8,null,null,null,null]
];
const a5 = [
  [0.2,null,null,null,null,null,null,12.5,17.2,22.7,42.1],[0.3,null,null,null,null,null,8.3,15.4,21.1,27.9,51.7],[0.4,null,null,null,null,4.9,9.6,17.8,24.4,32.3,59.7],[0.5,null,null,null,3.5,5.4,10.8,20.0,27.3,36.2,66.9],[0.6,null,null,2.3,3.9,6.0,11.8,21.9,30.0,39.7,73.3],[0.7,1.6,2.1,2.5,4.2,6.5,12.8,23.7,32.4,42.9,79.3],[0.8,1.8,2.3,2.6,4.5,6.9,13.7,25.3,34.7,45.9,84.8],[0.9,1.9,2.4,2.8,4.7,7.3,14.5,26.9,36.8,48.7,90.0],[1.0,2.0,2.6,3.0,5.0,7.7,15.3,28.4,38.8,51.3,94.9],[1.5,2.4,3.2,3.6,6.1,9.5,18.8,34.8,47.6,62.9,116.3],[2.0,2.8,3.7,4.2,7.1,11.0,21.7,40.2,55.0,72.7,134.4],[2.5,3.1,4.1,4.7,7.9,12.3,24.3,45.0,61.5,81.4,150.4],[3.0,3.5,4.5,5.2,8.7,13.5,26.7,49.3,67.4,89.2,164.8],[4.0,4.0,5.2,6.0,10.1,15.6,30.8,57.0,77.9,103.0,null],[5.0,4.5,5.8,6.7,11.3,17.4,34.5,63.8,null,null,null]
];

function rowsToTable(rows) {
  return rows.map(row => ({ slope: row[0], values: Object.fromEntries(dn.map((name, idx) => [name, row[idx + 1]])) }));
}

export const hydraulicTables = {
  '0.5': rowsToTable(a3),
  '0.7': rowsToTable(a4),
  '1.0': rowsToTable(a5)
};

export const dnOrder = dn;
