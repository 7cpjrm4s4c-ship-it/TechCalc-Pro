import { renderModuleShell, stack } from '../../core/renderer.js';
import { renderFormSchema } from '../../core/formSchema.js';
import { renderSavedRecordPanel, renderSavedRecordList } from '../../core/savedRecords.js';
import { renderResultModel } from '../resultRenderer/index.js';

function renderSavedRecords(model = {}, accent = 'blue') {
  if (!model || model.enabled === false) return '';
  const items = Array.isArray(model.items) ? model.items : [];
  const listHtml = renderSavedRecordList(items, {
    activeId: model.activeId,
    expandedId: model.expandedId,
    emptyText: model.emptyText || 'Noch keine Einträge gespeichert.',
    loadAttr: model.loadAttr || 'data-saved-load',
    toggleAttr: model.toggleAttr || 'data-saved-toggle',
    deleteAttr: model.deleteAttr || 'data-saved-delete',
    title: item => item.title || item.name || model.itemTitle || 'Eintrag',
    subtitle: item => item.subtitle || '',
    stats: item => item.stats || []
  });

  return renderSavedRecordPanel({
    title: model.title || 'Gespeicherte Einträge',
    nameFieldId: model.nameFieldId || 'name',
    nameLabel: model.nameLabel || 'Bezeichnung',
    nameValue: model.nameValue || '',
    namePlaceholder: model.namePlaceholder || '',
    addAction: model.addAction || 'line:save',
    updateAction: model.updateAction || 'line:update',
    addDisabled: Boolean(model.addDisabled),
    updateDisabled: Boolean(model.updateDisabled),
    listHtml: `<div ${model.dynamicAttr || 'data-platform-dynamic="saved-record-list"'}>${listHtml}</div>`,
    accent: model.accent || accent
  });
}

export function renderPlatformForm({ config, schema, state, result } = {}) {
  const accent = config?.accent || 'blue';
  return renderFormSchema(schema, state, { title: 'Eingaben', accent, result });
}

export function renderPlatformSaved({ config, savedRecords } = {}) {
  const accent = config?.accent || 'blue';
  return renderSavedRecords(savedRecords, accent);
}

export function renderPlatformResultsAndSaved({ config, resultModel } = {}) {
  return renderPlatformResults({ config, resultModel });
}

export function renderPlatformResults({ config, resultModel } = {}) {
  const accent = config?.accent || 'blue';
  return renderResultModel(resultModel || {}, accent);
}

export function renderPlatformModuleView({ config, schema, state, result, resultModel, savedRecords } = {}) {
  const form = renderPlatformForm({ config, schema, state, result });
  const saved = renderPlatformSaved({ config, savedRecords });
  const side = renderPlatformResults({ config, resultModel });
  return renderModuleShell(config, `<div class="span-6 tc-stack" data-platform-dynamic="form-saved"><div data-platform-dynamic="form">${form}</div><div data-platform-dynamic="saved-records">${saved}</div></div><div class="span-6" data-platform-dynamic="result-saved">${side}</div>`);
}

export default { renderPlatformModuleView, renderPlatformForm, renderPlatformResultsAndSaved };
