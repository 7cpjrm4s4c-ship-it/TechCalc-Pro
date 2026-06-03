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

export function renderPlatformResultsAndSaved({ config, resultModel, savedRecords } = {}) {
  const accent = config?.accent || 'blue';
  const results = renderResultModel(resultModel || {}, accent);
  const saved = renderSavedRecords(savedRecords, accent);
  return stack([results, saved].filter(Boolean).join(''));
}

export function renderPlatformModuleView({ config, schema, state, result, resultModel, savedRecords } = {}) {
  const form = renderPlatformForm({ config, schema, state, result });
  const side = renderPlatformResultsAndSaved({ config, resultModel, savedRecords });
  return renderModuleShell(config, `<div class="span-6" data-platform-dynamic="form">${form}</div><div class="span-6" data-platform-dynamic="result-saved">${side}</div>`);
}

export default { renderPlatformModuleView, renderPlatformForm, renderPlatformResultsAndSaved };
