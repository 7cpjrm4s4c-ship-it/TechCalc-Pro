export const PDF_PT_PER_MM = 72 / 25.4;

export const PDF_PAGE = {
  width: 595.28,
  height: 841.89
};

export const PDF_THEME = {
  margin: 8 * PDF_PT_PER_MM,
  text: [17, 24, 39],
  muted: [100, 116, 139],
  line: [203, 213, 225],
  rowLine: [226, 232, 240],
  soft: [248, 250, 252],
  accentBg: [234, 243, 248],
  accent: [7, 89, 133],
  table: {
    gap: 18,
    rowMinHeight: 14.2,
    rowPaddingTop: 4.8,
    rowPaddingBottom: 4.6,
    labelSize: 6.15,
    valueSize: 6.35,
    labelColor: [71, 85, 105],
    valueColor: [17, 24, 39]
  },
  chart: {
    maxWidth: 548,
    maxHeight: 250,
    minHeight: 118,
    padding: 6,
  }
};

export const PDF_GRID = {
  labelLeftRatio: 0.30,
  valueLeftRatio: 0.20,
  labelRightRatio: 0.30,
  valueRightRatio: 0.20
};

export const REPORT_TEMPLATE_VERSION = 'global-report-template-5-rc7-fixed-anchors';
