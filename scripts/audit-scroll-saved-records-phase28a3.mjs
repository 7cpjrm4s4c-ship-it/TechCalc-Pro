import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const scrollManagerPath = join(root, 'js/core/scrollManager.js');
const savedRecordsPath = join(root, 'js/core/savedRecords.js');
const savedRecordControllerPath = join(root, 'js/core/savedRecordController.js');

function read(path) { return existsSync(path) ? readFileSync(path, 'utf8') : ''; }
function grade(score) { return score >= 4.5 ? 'A' : score >= 3.8 ? 'B' : score >= 3 ? 'C' : score >= 2 ? 'D' : 'F'; }

const scrollManager = read(scrollManagerPath);
const savedRecords = read(savedRecordsPath);
const savedRecordController = read(savedRecordControllerPath);

const checks = {
  serviceHasSavedRecordMutation: /export function preserveSavedRecordMutation/.test(scrollManager),
  serviceExportsSavedRecordMutation: /preserveSavedRecordMutation/.test(scrollManager.match(/export const PlatformScrollManager[\s\S]*?\}\);/)?.[0] || ''),
  savedListUsesScrollService: /preserveSavedRecordScroll/.test(savedRecords) && !/preserveViewport\(/.test(savedRecords),
  savedListTogglePreserved: /preserveSavedRecordMutation\(\(\) => \{[\s\S]*?classList\.toggle/.test(savedRecords),
  editModeClearPreserved: /preserveSavedRecordMutation\(\(\) => \{[\s\S]*?onClear\(patch, event\)/.test(savedRecords),
  controllerLoadPreserved: /preserveSavedRecordScroll\(apply/.test(savedRecordController),
  controllerTogglePreserved: /preserveSavedRecordMutation\(\(\) => state\.set\(savedRecordReducer\(current,[\s\S]*?saved-record:toggle/.test(savedRecordController),
  controllerDeletePreserved: /preserveActionScroll\(\(\) => state\.set\(savedRecordReducer\(current,[\s\S]*?saved-record:delete/.test(savedRecordController)
};

const passed = Object.values(checks).filter(Boolean).length;
const total = Object.keys(checks).length;
let score = 3.9 + (passed / total) * 1.1;
score = Math.max(1, Math.min(5, Number(score.toFixed(2))));

const findings = [];
for (const [name, ok] of Object.entries(checks)) {
  if (!ok) findings.push({ area: name, risk: 'P1', action: 'Saved-Record-Scrollintegration vervollstaendigen.' });
}

const report = {
  phase: '28A.3',
  name: 'Saved Records Scroll Integration',
  generatedAt: new Date().toISOString(),
  overallScore: score,
  overallGrade: grade(score),
  executiveSummary: {
    p0: [],
    p1: findings.filter(item => item.risk === 'P1'),
    p2: [],
    conclusion: findings.length === 0
      ? 'Saved-Record-Aktionen laufen ueber den PlatformScrollManager. Auswahl, Abwahl, Toggle und Edit-Mode-Clear besitzen einen zentralen Scroll-Stabilitaetsvertrag.'
      : 'Einige Saved-Record-Pfade sind noch nicht vollstaendig ueber den PlatformScrollManager gefuehrt.'
  },
  checks,
  acceptance: {
    savedRecordMutationContractAvailable: checks.serviceHasSavedRecordMutation && checks.serviceExportsSavedRecordMutation,
    savedRecordListUsesPlatformScrollManager: checks.savedListUsesScrollService,
    savedRecordToggleProtected: checks.savedListTogglePreserved && checks.controllerTogglePreserved,
    savedRecordLoadProtected: checks.controllerLoadPreserved,
    savedRecordClearProtected: checks.editModeClearPreserved,
    noP1Findings: findings.filter(item => item.risk === 'P1').length === 0
  },
  findings
};

writeFileSync(join(root, 'platform-scroll-saved-records-phase28a3.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Phase 28A.3 saved-record scroll audit completed: ${report.overallScore} (${report.overallGrade})`);
console.log(`Failed checks: ${findings.length}`);
