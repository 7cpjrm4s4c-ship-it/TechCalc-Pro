import config from './config.js';
import schema from './schema.js';
import { calculate } from './logic.js';
import { buildFGasesResultModel } from './results.js';
import { listRefrigerants } from '../../utils/refrigerants/index.js';
import { renderModuleShell } from '../../core/renderer.js';
import { renderFormSchema } from '../../core/formSchema.js';
import { renderResultModel } from '../../platform/resultRenderer/index.js';

function schemaWithRefrigerants() {
  const options = [{ value: '', label: 'Bitte wählen' }, ...listRefrigerants().map(item => ({ value: item.id, label: item.name || item.id }))];
  return {
    ...schema,
    fields: schema.fields.map(field => field.key === 'refrigerantId' ? { ...field, options } : field)
  };
}

export function renderView(snapshot = {}) {
  const result = calculate(snapshot);
  const resultModel = buildFGasesResultModel(snapshot, result);
  const form = renderFormSchema(schemaWithRefrigerants(), snapshot, { title: 'Anlagen- und Bewertungsdaten', accent: 'blue', result });
  const output = renderResultModel(resultModel, 'blue');
  return renderModuleShell(config, `
    <div class="tc-module-layout tc-module-layout--2">
      <div class="tc-module-column">
        <div class="tc-module-section" data-platform-dynamic="form">${form}</div>
      </div>
      <div class="tc-module-column">
        <div class="tc-module-section" data-platform-dynamic="result-saved">${output}</div>
      </div>
    </div>`);
}

export default renderView;
