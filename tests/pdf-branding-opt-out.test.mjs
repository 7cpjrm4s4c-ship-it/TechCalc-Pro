import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GlobalPdfReport } from '../js/core/pdf/pdfLayout.js';

class HeaderCaptureReport extends GlobalPdfReport {
  constructor() {
    super({ appIcon: { width: 1, height: 1 }, companyLogo: { width: 2, height: 1 } });
    this.textValues = [];
    this.imageNames = [];
  }
  text(value) { this.textValues.push(String(value)); return 0; }
  drawImage(resourceName) { this.imageNames.push(resourceName); return true; }
  line() {}
}

function renderHeader(project = {}) {
  const report = new HeaderCaptureReport();
  report.header(project, { title: 'Testmodul', reportHeading: 'Berechnungsprotokoll' }, '29.08.2026');
  return report;
}

const defaultReport = renderHeader();
assert.ok(defaultReport.textValues.includes('TechCalc Pro'), 'TechCalc branding must remain enabled by default');
assert.ok(defaultReport.textValues.includes('HLSK QUICK TOOLS'), 'TechCalc subtitle must remain enabled by default');
assert.ok(defaultReport.imageNames.includes('ImAppIcon'), 'TechCalc icon must remain enabled by default');
assert.ok(defaultReport.imageNames.includes('ImCompanyLogo'), 'company logo must remain independent from TechCalc branding');

const optedOutReport = renderHeader({ showTechCalcBranding: false });
assert.ok(!optedOutReport.textValues.includes('TechCalc Pro'), 'TechCalc title must be omitted after opt-out');
assert.ok(!optedOutReport.textValues.includes('HLSK QUICK TOOLS'), 'TechCalc subtitle must be omitted after opt-out');
assert.ok(!optedOutReport.imageNames.includes('ImAppIcon'), 'TechCalc icon must be omitted after opt-out');
assert.ok(optedOutReport.imageNames.includes('ImCompanyLogo'), 'company logo must remain visible after TechCalc opt-out');
assert.ok(optedOutReport.textValues.includes('Berechnungsprotokoll'), 'report heading must remain visible after TechCalc opt-out');

const controlsCss = fs.readFileSync(new URL('../css/components-controls.css', import.meta.url), 'utf8');
assert.match(controlsCss, /#pdfShowTechCalcBranding\s*\{[^}]*width:\s*51px[^}]*height:\s*31px/s, 'branding control must use iOS switch proportions');
assert.match(controlsCss, /background-image:\s*radial-gradient\(circle at 15\.5px 50%/, 'off state must render the iOS-style white thumb on the left');
assert.match(controlsCss, /#pdfShowTechCalcBranding:checked\s*\{[^}]*background-color:\s*var\(--accent-blue[^}]*circle at calc\(100% - 15\.5px\) 50%/s, 'enabled state must move the thumb to the right');
assert.doesNotMatch(controlsCss, /#pdfShowTechCalcBranding::before/, 'switch must not depend on pseudo-elements on a replaced checkbox control');
assert.match(controlsCss, /#pdfShowTechCalcBranding:focus-visible/, 'toggle switch must retain a keyboard focus state');

console.log('PDF branding opt-out contract passed.');
