import { listRefrigerants } from '../../utils/refrigerants/index.js';

const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function refrigerantOptions(selectedId) {
  const refrigerants = listRefrigerants();
  if (!refrigerants.length) return '<option value="">Keine freigegebenen Kältemitteldaten</option>';
  return ['<option value="">Bitte wählen</option>', ...refrigerants.map(item => {
    const id = item.id || item.name || '';
    const selected = id === selectedId ? ' selected' : '';
    return `<option value="${escapeHtml(id)}"${selected}>${escapeHtml(item.name || id)}</option>`;
  })].join('');
}

export function renderView(snapshot = {}) {
  return `
    <section class="card">
      <h2>F-Gase-Check</h2>
      <p>Technisches Grundgerüst. Regulatorische Daten und GWP-Werte sind noch nicht spezifiziert.</p>
      <div class="form-grid" data-platform-dynamic="form">
        <label>Anlagenbezeichnung
          <input type="text" data-field="systemName" value="${escapeHtml(snapshot.systemName)}">
        </label>
        <label>Anlagenart
          <input type="text" data-field="systemType" value="${escapeHtml(snapshot.systemType)}">
        </label>
        <label>Bauform
          <input type="text" data-field="constructionType" value="${escapeHtml(snapshot.constructionType)}">
        </label>
        <label>Leistungsbereich
          <input type="text" data-field="performanceRange" value="${escapeHtml(snapshot.performanceRange)}">
        </label>
        <label>Kältemittel
          <select data-field="refrigerantId">${refrigerantOptions(snapshot.refrigerantId)}</select>
        </label>
        <label>Füllmenge [kg]
          <input type="text" inputmode="decimal" data-field="chargeKg" value="${escapeHtml(snapshot.chargeKg)}">
        </label>
      </div>
      <div class="card" data-platform-dynamic="result-saved">
        <h3>Bewertungsstatus</h3>
        <p>Fachliche Bewertung noch nicht verfügbar. Es werden keine regulatorischen Aussagen ausgegeben.</p>
      </div>
    </section>`;
}

export default renderView;
