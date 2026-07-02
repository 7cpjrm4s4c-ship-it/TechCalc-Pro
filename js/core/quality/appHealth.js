import { performanceBudget } from './performanceBudget.js';
import { platformPolicy } from '../platformPolicy.js';

export const appHealthChecks = Object.freeze({
  version: '1.3.2-dev.2-phase5',
  checks: Object.freeze([
    'module-contract',
    'number-locale-regression',
    'ui-policy',
    'import-syntax',
    'release-notes',
    'performance-budget'
  ])
});

export function createHealthSnapshot({ modules = null } = {}) {
  const moduleReport = typeof modules?.contractReport === 'function' ? modules.contractReport() : [];
  const legacyModules = moduleReport.filter(item => item.migrationStatus === 'legacy');
  return Object.freeze({
    version: appHealthChecks.version,
    policyVersion: platformPolicy.version,
    budgetVersion: performanceBudget.version,
    moduleCount: moduleReport.length,
    legacyModuleCount: legacyModules.length,
    legacyModules: Object.freeze(legacyModules.map(item => item.id)),
    checks: appHealthChecks.checks
  });
}
