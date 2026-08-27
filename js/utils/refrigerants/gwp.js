const gwp = (refrigerantId, ar4, ar5, fGasRegulation) => Object.freeze({
  refrigerantId,
  ar4,
  ar5,
  fGasRegulation,
  value: fGasRegulation
});

export const GWP_DATASET = Object.freeze({
  version: '1.0.0',
  source: Object.freeze({
    id: 'UBA-GWP-2026-03',
    title: 'Treibhauspotentiale (GWP) ausgewählter Verbindungen und Gemische',
    publisher: 'Umweltbundesamt',
    sourceVersion: 'März 2026'
  }),
  updatedAt: '2026-08-27',
  status: 'specified',
  items: Object.freeze([
    gwp('HFKW-32', 675, 677, 675),
    gwp('HFKW-125', 3500, 3170, 3500),
    gwp('HFKW-134a', 1430, 1300, 1430),
    gwp('HFKW-143a', 4470, 4800, 4470),
    gwp('HFKW-152a', 124, 138, 124),
    gwp('HFKW-227ea', 3220, 3350, 3220),
    gwp('HFKW-1234yf', 4, 1, 0.501),
    gwp('HFKW-1234ze (E)', 7, 1, 1.37),
    gwp('R-290', 3.3, null, 0.02),
    gwp('R-600', 4, null, 0.006),
    gwp('R-600a', 3, null, 0),
    gwp('R-717', 0, null, 0),
    gwp('R-744', 1, null, 1),
    gwp('R-1270', 1.8, null, 0),
    gwp('R-404A', 3922, 3943, 3922),
    gwp('R-407A', 2107, 1923, 2107),
    gwp('R-407C', 1774, 1624, 1774),
    gwp('R-407F', 1825, 1674, 1825),
    gwp('R-410A', 2088, 1924, 2088),
    gwp('R-448A', 1387, 1273, 1386),
    gwp('R-449A', 1397, 1282, 1396),
    gwp('R-450A', 605, 547, 601),
    gwp('R-452A', 2140, 1945, 2139),
    gwp('R-452B', 698, 676, 697),
    gwp('R-454A', 239, 238, 237),
    gwp('R-454B', 466, 467, 465),
    gwp('R-454C', 148, 146, 146),
    gwp('R-455A', 148, 146, 146),
    gwp('R-507A', 3985, 3985, 3985),
    gwp('R-513A', 631, 573, 629),
    gwp('R-515B', 293, 299, 288)
  ])
});

export default GWP_DATASET;
