import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const FAILURE_REPORT_PATH = 'test-results/playwright-ci-failures.txt';

export default class PlaywrightCiFailureReporter {
  constructor() {
    this.failures = [];
  }

  onTestEnd(test, result) {
    if (result.status !== 'failed' && result.status !== 'timedOut') return;

    const projectName = test.parent?.project()?.name || 'unknown-project';
    const location = test.location
      ? `${test.location.file}:${test.location.line}:${test.location.column}`
      : 'unknown-location';
    const errors = (result.errors || [])
      .map(error => error?.stack || error?.message || String(error))
      .filter(Boolean)
      .join('\n\n');

    this.failures.push({
      title: test.titlePath().join(' › '),
      projectName,
      location,
      errors
    });
  }

  onEnd(result) {
    const lines = [];

    if (!this.failures.length) {
      lines.push(`Playwright CI summary: ${result.status}`);
    } else {
      lines.push(`Playwright CI failures: ${this.failures.length}`);
      for (const [index, failure] of this.failures.entries()) {
        lines.push('', `[${index + 1}] ${failure.projectName} :: ${failure.title}`);
        lines.push(`    ${failure.location}`);
        if (failure.errors) lines.push(failure.errors);
      }
    }

    const report = `${lines.join('\n')}\n`;
    mkdirSync(dirname(FAILURE_REPORT_PATH), { recursive: true });
    writeFileSync(FAILURE_REPORT_PATH, report, 'utf8');

    if (this.failures.length) console.error(report);
    else console.log(report.trimEnd());
  }
}
