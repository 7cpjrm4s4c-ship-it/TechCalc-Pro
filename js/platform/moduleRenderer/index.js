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
    addAction: model.addAction || 'saved:add',
    updateAction: model.updateAction || 'saved:update',
    addDisabled: Boolean(model.addDisabled),
    updateDisabled: Boolean(model.updateDisabled),
    listHtml: `<div ${model.dynamicAttr || 'data-platform-dynamic="saved-record-list"'}>${listHtml}</div>`,
    accent: model.accent || accent
  });
}

export function renderPlatformModuleView({ config, schema, state, result, resultModel, savedRecords } = {}) {
  const accent = config?.accent || 'blue';
  const form = renderFormSchema(schema, state, { title: 'Eingaben', accent });
  const results = renderResultModel(resultModel || {}, accent);
  const saved = renderSavedRecords(savedRecords, accent);
  return renderModuleShell(config, `<div class="span-6">${form}</div><div class="span-6">${stack([results, saved].filter(Boolean).join(''))}</div>`);
}

export default { renderPlatformModuleView };
