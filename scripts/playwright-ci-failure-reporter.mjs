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
    if (!this.failures.length) {
      console.log(`Playwright CI summary: ${result.status}`);
      return;
    }

    console.error(`Playwright CI failures: ${this.failures.length}`);
    for (const [index, failure] of this.failures.entries()) {
      console.error(`\n[${index + 1}] ${failure.projectName} :: ${failure.title}`);
      console.error(`    ${failure.location}`);
      if (failure.errors) console.error(failure.errors);
    }
  }
}
