import { renderFormSchema } from '../../core/formSchema.js';
import { renderResultModel } from '../../platform/resultRenderer/index.js';
import schema from './schema.js';
import { buildRainwaterResultModel } from './results.js';

export function formContent(s = {}, r = {}) {
  return renderFormSchema(schema, s, { title: 'Eingaben', accent: 'green', result: r });
}

export function resultContent(s = {}, r = {}) {
  return renderResultModel(buildRainwaterResultModel(s, r), 'green');
}

export function createRainwaterViewModel(s = {}, r = {}) {
  return {
    formHtml: formContent(s, r),
    resultHtml: resultContent(s, r)
  };
}

export default {
  formContent,
  resultContent,
  createRainwaterViewModel
};
