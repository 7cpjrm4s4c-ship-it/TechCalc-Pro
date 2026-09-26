const source = Object.freeze({
  id: 'DIN-EN-378-1-2021-06-ANNEX-E',
  title: 'DIN EN 378-1:2021-06 / EN 378-1:2016+A1:2020 (D), Anhang E',
  table: 'E.1, E.2, E.3',
  updatedAt: '2026-09-01'
});

const value = number => number == null ? null : number;
const nonFlammable = null;

const safetyData = ({
  refrigerantId,
  standardNumber,
  table,
  safetyClass,
  fluidGroupPed,
  practicalLimitKgM3,
  atelOdlKgM3,
  lflKgM3 = nonFlammable,
  vaporDensity25C1013KpaKgM3,
  molarMassKgKmol,
  normalBoilingPointC,
  criticalTemperatureC
}) => Object.freeze({
  refrigerantId,
  standardNumber,
  table,
  safetyClass,
  toxicityClass: safetyClass?.startsWith('B') ? 'B' : 'A',
  flammabilityClass: safetyClass?.replace(/^[AB]/, '') || '',
  fluidGroupPed,
  practicalLimitKgM3: value(practicalLimitKgM3),
  atelOdlKgM3: value(atelOdlKgM3),
  lflKgM3: value(lflKgM3),
  vaporDensity25C1013KpaKgM3: value(vaporDensity25C1013KpaKgM3),
  molarMassKgKmol: value(molarMassKgKmol),
  normalBoilingPointC: value(normalBoilingPointC),
  criticalTemperatureC: value(criticalTemperatureC),
  source: Object.freeze({ sourceId: source.id, table })
});

export const EN378_SAFETY_DATASET = Object.freeze({
  version: '1.0.0',
  source,
  updatedAt: '2026-09-01',
  status: 'specified',
  scope: 'EN 378 safety data for TechCalc Pro core refrigerants only',
  items: Object.freeze([
    safetyData({ refrigerantId: 'HFKW-32', standardNumber: '32', table: 'E.1', safetyClass: 'A2L', fluidGroupPed: 1, practicalLimitKgM3: 0.061, atelOdlKgM3: 0.30, lflKgM3: 0.307, vaporDensity25C1013KpaKgM3: 2.13, molarMassKgKmol: 52.0, normalBoilingPointC: -52, criticalTemperatureC: 648 }),
    safetyData({ refrigerantId: 'HFKW-125', standardNumber: '125', table: 'E.1', safetyClass: 'A1', fluidGroupPed: 2, practicalLimitKgM3: 0.39, atelOdlKgM3: 0.37, vaporDensity25C1013KpaKgM3: 4.91, molarMassKgKmol: 120.0, normalBoilingPointC: -49, criticalTemperatureC: 733 }),
    safetyData({ refrigerantId: 'HFKW-134a', standardNumber: '134a', table: 'E.1', safetyClass: 'A1', fluidGroupPed: 2, practicalLimitKgM3: 0.25, atelOdlKgM3: 0.21, vaporDensity25C1013KpaKgM3: 4.17, molarMassKgKmol: 102.0, normalBoilingPointC: -26, criticalTemperatureC: 743 }),
    safetyData({ refrigerantId: 'HFKW-143a', standardNumber: '143a', table: 'E.1', safetyClass: 'A2L', fluidGroupPed: 1, practicalLimitKgM3: 0.056, atelOdlKgM3: 0.58, lflKgM3: 0.282, vaporDensity25C1013KpaKgM3: 3.44, molarMassKgKmol: 84.0, normalBoilingPointC: -47, criticalTemperatureC: 750 }),
    safetyData({ refrigerantId: 'HFKW-152a', standardNumber: '152a', table: 'E.1', safetyClass: 'A2', fluidGroupPed: 1, practicalLimitKgM3: 0.027, atelOdlKgM3: 0.14, lflKgM3: 0.130, vaporDensity25C1013KpaKgM3: 2.70, molarMassKgKmol: 66.0, normalBoilingPointC: -25, criticalTemperatureC: 455 }),
    safetyData({ refrigerantId: 'HFKW-227ea', standardNumber: '227ea', table: 'E.1', safetyClass: 'A1', fluidGroupPed: 2, practicalLimitKgM3: 0.63, atelOdlKgM3: 0.63, vaporDensity25C1013KpaKgM3: 6.95, molarMassKgKmol: 170.0, normalBoilingPointC: -15 }),
    safetyData({ refrigerantId: 'HFKW-1234yf', standardNumber: '1234yf', table: 'E.1', safetyClass: 'A2L', fluidGroupPed: 1, practicalLimitKgM3: 0.058, atelOdlKgM3: 0.47, lflKgM3: 0.289, vaporDensity25C1013KpaKgM3: 4.66, molarMassKgKmol: 114.0, normalBoilingPointC: -29.5, criticalTemperatureC: 405 }),
    safetyData({ refrigerantId: 'HFKW-1234ze (E)', standardNumber: '1234ze(E)', table: 'E.1', safetyClass: 'A2L', fluidGroupPed: 1, practicalLimitKgM3: 0.061, atelOdlKgM3: 0.28, lflKgM3: 0.303, vaporDensity25C1013KpaKgM3: 4.66, molarMassKgKmol: 114.0, normalBoilingPointC: -19, criticalTemperatureC: 368 }),
    safetyData({ refrigerantId: 'R-290', standardNumber: '290', table: 'E.1', safetyClass: 'A3', fluidGroupPed: 1, practicalLimitKgM3: 0.008, atelOdlKgM3: 0.09, lflKgM3: 0.038, vaporDensity25C1013KpaKgM3: 1.80, molarMassKgKmol: 44.0, normalBoilingPointC: -42, criticalTemperatureC: 470 }),
    safetyData({ refrigerantId: 'R-600', standardNumber: '600', table: 'E.1', safetyClass: 'A3', fluidGroupPed: 1, practicalLimitKgM3: 0.008, atelOdlKgM3: 0.0024, lflKgM3: 0.038, vaporDensity25C1013KpaKgM3: 2.38, molarMassKgKmol: 58.1, normalBoilingPointC: 0, criticalTemperatureC: 365 }),
    safetyData({ refrigerantId: 'R-600a', standardNumber: '600a', table: 'E.1', safetyClass: 'A3', fluidGroupPed: 1, practicalLimitKgM3: 0.011, atelOdlKgM3: 0.059, lflKgM3: 0.043, vaporDensity25C1013KpaKgM3: 2.38, molarMassKgKmol: 58.1, normalBoilingPointC: -12, criticalTemperatureC: 460 }),
    safetyData({ refrigerantId: 'R-717', standardNumber: '717', table: 'E.1', safetyClass: 'B2L', fluidGroupPed: 1, practicalLimitKgM3: 0.00035, atelOdlKgM3: 0.00022, lflKgM3: 0.116, vaporDensity25C1013KpaKgM3: 0.70, molarMassKgKmol: 17.0, normalBoilingPointC: -33, criticalTemperatureC: 630 }),
    safetyData({ refrigerantId: 'R-744', standardNumber: '744', table: 'E.1', safetyClass: 'A1', fluidGroupPed: 2, practicalLimitKgM3: 0.1, atelOdlKgM3: 0.072, vaporDensity25C1013KpaKgM3: 1.80, molarMassKgKmol: 44.0, normalBoilingPointC: -78 }),
    safetyData({ refrigerantId: 'R-1270', standardNumber: '1270', table: 'E.1', safetyClass: 'A3', fluidGroupPed: 1, practicalLimitKgM3: 0.008, atelOdlKgM3: 0.0017, lflKgM3: 0.046, vaporDensity25C1013KpaKgM3: 1.72, molarMassKgKmol: 42.1, normalBoilingPointC: -48, criticalTemperatureC: 455 }),
    safetyData({ refrigerantId: 'R-404A', standardNumber: '404A', table: 'E.2', safetyClass: 'A1', fluidGroupPed: 2, practicalLimitKgM3: 0.52, atelOdlKgM3: 0.52, vaporDensity25C1013KpaKgM3: 3.99, molarMassKgKmol: 97.6, normalBoilingPointC: -46.5 }),
    safetyData({ refrigerantId: 'R-407A', standardNumber: '407A', table: 'E.2', safetyClass: 'A1', fluidGroupPed: 2, practicalLimitKgM3: 0.33, atelOdlKgM3: 0.31, vaporDensity25C1013KpaKgM3: 3.68, molarMassKgKmol: 90.1, normalBoilingPointC: -45.2 }),
    safetyData({ refrigerantId: 'R-407C', standardNumber: '407C', table: 'E.2', safetyClass: 'A1', fluidGroupPed: 2, practicalLimitKgM3: 0.31, atelOdlKgM3: 0.29, vaporDensity25C1013KpaKgM3: 3.53, molarMassKgKmol: 86.2, normalBoilingPointC: -43.8 }),
    safetyData({ refrigerantId: 'R-407F', standardNumber: '407F', table: 'E.2', safetyClass: 'A1', fluidGroupPed: 2, practicalLimitKgM3: 0.32, atelOdlKgM3: 0.32, vaporDensity25C1013KpaKgM3: 3.36, molarMassKgKmol: 82.1, normalBoilingPointC: -46.1 }),
    safetyData({ refrigerantId: 'R-410A', standardNumber: '410A', table: 'E.2', safetyClass: 'A1', fluidGroupPed: 2, practicalLimitKgM3: 0.44, atelOdlKgM3: 0.42, vaporDensity25C1013KpaKgM3: 2.97, molarMassKgKmol: 72.6, normalBoilingPointC: -51.6 }),
    safetyData({ refrigerantId: 'R-448A', standardNumber: '448A', table: 'E.2', safetyClass: 'A1', fluidGroupPed: 2, practicalLimitKgM3: 0.388, atelOdlKgM3: 0.388, vaporDensity25C1013KpaKgM3: 3.58, molarMassKgKmol: 86.3, normalBoilingPointC: -45.9 }),
    safetyData({ refrigerantId: 'R-449A', standardNumber: '449A', table: 'E.2', safetyClass: 'A1', fluidGroupPed: 2, practicalLimitKgM3: 0.357, atelOdlKgM3: 0.357, vaporDensity25C1013KpaKgM3: 3.62, molarMassKgKmol: 87.2, normalBoilingPointC: -46.0 }),
    safetyData({ refrigerantId: 'R-450A', standardNumber: '450A', table: 'E.2', safetyClass: 'A1', fluidGroupPed: 2, practicalLimitKgM3: 0.320, atelOdlKgM3: 0.320, vaporDensity25C1013KpaKgM3: 4.54, molarMassKgKmol: 108.7, normalBoilingPointC: -23.4 }),
    safetyData({ refrigerantId: 'R-452A', standardNumber: '452A', table: 'E.2', safetyClass: 'A1', fluidGroupPed: 2, practicalLimitKgM3: 0.423, atelOdlKgM3: 0.423, vaporDensity25C1013KpaKgM3: 4.30, molarMassKgKmol: 103.5, normalBoilingPointC: -47.5 }),
    safetyData({ refrigerantId: 'R-452B', standardNumber: '452B', table: 'E.2', safetyClass: 'A2L', fluidGroupPed: 1, practicalLimitKgM3: 0.062, atelOdlKgM3: 0.364, lflKgM3: 0.310, vaporDensity25C1013KpaKgM3: 2.63, molarMassKgKmol: 63.5, normalBoilingPointC: -51.0 }),
    safetyData({ refrigerantId: 'R-454A', standardNumber: '454A', table: 'E.2', safetyClass: 'A2L', fluidGroupPed: 1, practicalLimitKgM3: 0.056, atelOdlKgM3: 0.461, lflKgM3: 0.278, vaporDensity25C1013KpaKgM3: 3.34, molarMassKgKmol: 80.5, normalBoilingPointC: -48.4 }),
    safetyData({ refrigerantId: 'R-454B', standardNumber: '454B', table: 'E.2', safetyClass: 'A2L', fluidGroupPed: 1, practicalLimitKgM3: 0.059, atelOdlKgM3: 0.358, lflKgM3: 0.297, vaporDensity25C1013KpaKgM3: 2.60, molarMassKgKmol: 62.6, normalBoilingPointC: -50.9 }),
    safetyData({ refrigerantId: 'R-454C', standardNumber: '454C', table: 'E.2', safetyClass: 'A2L', fluidGroupPed: 1, practicalLimitKgM3: 0.059, atelOdlKgM3: 0.445, lflKgM3: 0.293, vaporDensity25C1013KpaKgM3: 3.78, molarMassKgKmol: 90.8, normalBoilingPointC: -46.0 }),
    safetyData({ refrigerantId: 'R-455A', standardNumber: '455A', table: 'E.2', safetyClass: 'A2L', fluidGroupPed: 1, practicalLimitKgM3: 0.086, atelOdlKgM3: 0.429, lflKgM3: 0.431, vaporDensity25C1013KpaKgM3: 3.64, molarMassKgKmol: 87.5, normalBoilingPointC: -51.6 }),
    safetyData({ refrigerantId: 'R-507A', standardNumber: '507A', table: 'E.3', safetyClass: 'A1', fluidGroupPed: 2, practicalLimitKgM3: 0.53, atelOdlKgM3: 0.53, vaporDensity25C1013KpaKgM3: 4.04, molarMassKgKmol: 98.9, normalBoilingPointC: -46.7 }),
    safetyData({ refrigerantId: 'R-513A', standardNumber: '513A', table: 'E.3', safetyClass: 'A1', fluidGroupPed: 2, practicalLimitKgM3: 0.329, atelOdlKgM3: 0.329, vaporDensity25C1013KpaKgM3: 4.52, molarMassKgKmol: 108.4, normalBoilingPointC: -29.1 }),
    safetyData({ refrigerantId: 'R-515B', standardNumber: '515B', table: 'E.3', safetyClass: 'A1', fluidGroupPed: 2, practicalLimitKgM3: 0.306, atelOdlKgM3: 0.306, vaporDensity25C1013KpaKgM3: 4.97, molarMassKgKmol: 118.7, normalBoilingPointC: -18.9 })
  ])
});

export default EN378_SAFETY_DATASET;
