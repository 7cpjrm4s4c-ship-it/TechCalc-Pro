import { execFileSync } from 'node:child_process';

const tests = [
  'tests/flooding-verification-phase47c2.test.mjs',
  'tests/flooding-verification-rain-duration-phase47c3.test.mjs',
  'tests/flooding-verification-project-storage-phase47c31.test.mjs',
  'tests/flooding-verification-phase47c4.test.mjs',
  'tests/flooding-verification-phase47c41-regressions.test.mjs',
  'tests/flooding-verification-phase47c42.test.mjs',
  'tests/flooding-verification-phase47c43-platform-conformance.test.mjs',
  'tests/flooding-verification-phase47c44-regression.test.mjs',
  'tests/flooding-verification-phase47c44-regressions.test.mjs',
  'tests/phase47c45-ui-duration-sealed-share.test.mjs',
  'tests/flooding-verification-phase47c5.test.mjs',
  'tests/flooding-verification-phase47c61-dwa117-core.test.mjs',
  'tests/flooding-verification-phase47c62-applicability.test.mjs',
  'tests/flooding-verification-phase47c63-automatic-factors.test.mjs',
  'tests/flooding-verification-phase47c63-automatic-retention.test.mjs',
  'tests/flooding-verification-phase47c63-corrections.test.mjs',
  'tests/flooding-verification-phase47c63-derived-form-state.test.mjs',
  'tests/flooding-verification-phase47c63-duration-comparison.test.mjs',
  'tests/flooding-verification-combined-storage.test.mjs',
  'tests/flooding-verification-rainwater-import-upsert.test.mjs',
  'tests/flooding-verification-retention-rain-recurrence-regression.test.mjs',
  'tests/flooding-verification-phase47c7b-result-prioritization.test.mjs',
  'tests/flooding-verification-phase47c7c-diagnostics.test.mjs',
  'tests/flooding-verification-phase47c7d-interpretation.test.mjs',
  'tests/flooding-verification-phase47c7e-plausibility.test.mjs',
  'tests/flooding-verification-phase47c7f-regression-gate.test.mjs',
  'tests/flooding-verification-phase47c81-ui-harmonization.test.mjs',
  'tests/flooding-verification-phase47c82a-result-hierarchy.test.mjs',
  'tests/flooding-verification-phase47c82b-result-table-layout.test.mjs',
  'tests/flooding-verification-phase47c82c-numeric-formatting.test.mjs',
  'tests/flooding-verification-phase47c82d-typography.test.mjs',
  'tests/flooding-verification-phase47c82e-card-spacing.test.mjs',
  'tests/flooding-verification-phase47c82f-responsive-audit.test.mjs',
  'tests/flooding-verification-phase47c82g-visual-regression-gate.test.mjs',
  'tests/flooding-verification-phase47c9a-pdf-architecture-review.test.mjs',
  'tests/flooding-verification-phase47c9b-report-dto.test.mjs',
  'tests/flooding-verification-phase47c9c-authority-pdf-sections.test.mjs',
  'tests/flooding-verification-phase47c9d-authority-table-layout.test.mjs',
  'tests/flooding-verification-phase47c9d-pdf-export-runtime.test.mjs',
  'tests/flooding-verification-phase47c10a-cover-page.test.mjs',
  'tests/flooding-verification-phase47c10b-executive-summary.test.mjs',
  'tests/flooding-verification-phase47c10c-professional-tables.test.mjs',
  'tests/flooding-verification-phase47c10d-engineering-typography.test.mjs',
  'tests/flooding-verification-phase47c10e-authority-charts.test.mjs',
  'tests/flooding-verification-phase47c10f-table-of-contents.test.mjs',
  'tests/flooding-verification-phase47c10g-corporate-flow.test.mjs',
  'tests/flooding-verification-phase47c11-authority-finalization.test.mjs',
  'tests/flooding-verification-phase47c12-review-fixes.test.mjs',
  'tests/flooding-verification-phase47c12f-final-qa.test.mjs',
  'tests/flooding-verification-phase47d-conditional-dwa-pdf.test.mjs',
  'tests/flooding-verification-phase47d-german-pdf-labels.test.mjs'
];

for (const file of tests) {
  console.log(`> node ${file}`);
  execFileSync(process.execPath, [file], { stdio: 'inherit' });
}

console.log(`Flooding verification phase 47C regression gate ok (${tests.length} test files)`);