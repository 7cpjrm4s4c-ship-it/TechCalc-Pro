import { APP_VERSION, VERSION_POLICY } from './version.js';

const FALLBACK_RELEASE_NOTES = [
  {
    version: '1.0.1',
    date: '2026-05-19',
    changes: [
      'Release-Notes-Bereich im Header-Menü ergänzt.',
      'Feedback-Funktion mit E-Mail-Weiterleitung integriert.',
      'Semantische Versionierung eingeführt.'
    ]
  },
  {
    version: '1.0.0',
    date: '2026-05-18',
    changes: [
      'Initialer stabiler Release von TechCalc Pro.',
      'Pufferspeicher-Modul integriert.',
      'PDF-Layoutstruktur überarbeitet.',
      'Projekt speichern und laden ergänzt.'
    ]
  }
];

function esc(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'
  }[char]));
}

function formatDate(value = '') {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleDateString('de-DE');
}

async function loadReleaseNotes() {
  try {
    const response = await fetch('./release-notes.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Release Notes müssen ein Array sein.');
    return data;
  } catch (error) {
    console.info('Release Notes werden aus lokalem Fallback geladen.', error);
    return FALLBACK_RELEASE_NOTES;
  }
}

function renderReleaseNotes(container, notes) {
  if (!container) return;
  container.innerHTML = `
    <div class="release-notes__intro">
      <div class="settings-info-row"><span>Aktuelle Version</span><strong>${esc(APP_VERSION)}</strong></div>
      <p>Release Notes können später über das Hosting als <code>release-notes.json</code> gepflegt werden.</p>
    </div>
    <div class="release-notes__policy">
      <h3>Versionierung</h3>
      <p><strong>Patch</strong>: ${esc(VERSION_POLICY.patch)}</p>
      <p><strong>Minor</strong>: ${esc(VERSION_POLICY.minor)}</p>
      <p><strong>Major</strong>: ${esc(VERSION_POLICY.major)}</p>
    </div>
    <div class="release-notes__list">
      ${notes.map(note => `
        <article class="release-note-card">
          <header>
            <strong>Version ${esc(note.version)}</strong>
            <span>${esc(formatDate(note.date))}</span>
          </header>
          <ul>
            ${(note.changes || []).map(change => `<li>${esc(change)}</li>`).join('')}
          </ul>
        </article>
      `).join('')}
    </div>
  `;
}

export async function initReleaseNotes() {
  const container = document.getElementById('releaseNotesList');
  if (!container) return;
  container.innerHTML = '<p class="settings-hint">Release Notes werden geladen …</p>';
  const notes = await loadReleaseNotes();
  renderReleaseNotes(container, notes);
}
