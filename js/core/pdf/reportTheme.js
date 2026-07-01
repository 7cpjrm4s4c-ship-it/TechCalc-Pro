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
    rowMinHeight: 17.2,
    rowPaddingTop: 5.8,
    rowPaddingBottom: 5.6,
    labelSize: 6.15,
    valueSize: 6.25,
    labelColor: [71, 85, 105],
    valueColor: [17, 24, 39],
    valueColumnWidth: 126,
    cellGap: 8,
    valueRightInset: 2.5
  },
  chart: {
    maxWidth: 548,
    maxHeight: 390,
    minHeight: 310,
    fixedHeight: 360,
    padding: 6,
  }
};

export const PDF_GRID = {
  labelLeftRatio: 0.27,
  valueLeftRatio: 0.23,
  labelRightRatio: 0.27,
  valueRightRatio: 0.23
};

export const REPORT_TEMPLATE_VERSION = 'global-report-template-7-rc9-alignment-pagination-chart';
