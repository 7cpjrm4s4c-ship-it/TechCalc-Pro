export const unitCategories = {
  pressure: { label:' Druck', base:'Pa', units:{ Pa:1, kPa:1000, bar:100000, mbar:100, mWs:9806.65 } },
  power: { label:' Leistung', base:'W', units:{ W:1, kW:1000, MW:1000000, 'J/h':1/3600, 'kJ/h':1000/3600 } },
  energy: { label:' Energie', base:'J', units:{ J:1, kJ:1000, Wh:3600, kWh:3600000, MWh:3600000000, MJ:1000000 } },
  flow: { label:' Volumenstrom', base:'m3/h', units:{ 'm3/h':1, 'm3/min':60, 'm3/s':3600, 'l/h':0.001, 'l/min':0.06, 'l/s':3.6 } },
  weight: { label:' Gewicht', base:'kg', units:{ g:.001, kg:1, t:1000, lb:.45359237 } },
  area: { label:' Flaeche', base:'m2', units:{ 'mm2':0.000001, 'cm2':0.0001, 'm2':1, 'ha':10000, 'km2':1000000 } },
  volume: { label:' Volumen', base:'m3', units:{ ml:0.000001, 'cm3':0.000001, l:0.001, 'dm3':0.001, 'm3':1 } }
};
export function convert(categoryId, value, from, to){ const c = unitCategories[categoryId]; const n = Number(String(value||'').replace(/\./g,'').replace(',','.')); if(!c || !Number.isFinite(n)) return null; return n * c.units[from] / c.units[to]; }
