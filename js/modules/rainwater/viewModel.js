import { renderFormSchema } from '../../core/formSchema.js';
import { renderResultModel } from '../../platform/resultRenderer/index.js';
import schema from './schema.js';
import { buildRainwaterResultModel } from './results.js';
import { rainwaterSavedController } from './controller.js';

export function formContent(s = {}, r = {}) {
  return renderFormSchema(schema, s, { title: 'Eingaben', accent: 'green', result: r });
}

export function savedRecordsContent(s = {}) {
  return rainwaterSavedController.renderCard(s);
}

export function resultContent(s = {}, r = {}) {
  return renderResultModel(buildRainwaterResultModel(s, r), 'green');
}

export function createRainwaterViewModel(s = {}, r = {}) {
  return {
    formHtml: formContent(s, r),
    savedRecordsHtml: savedRecordsContent(s),
    resultHtml: resultContent(s, r)
  };
}

export default {
  formContent,
  savedRecordsContent,
  resultContent,
  createRainwaterViewModel
};
