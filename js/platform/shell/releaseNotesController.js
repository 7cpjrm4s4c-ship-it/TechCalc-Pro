function escapeHtml(value = '') {
  return String(value).replace(/[&<>"]/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[char]));
}

export function parseReleaseNotes(markdown = '') {
  const lines = String(markdown || '').split(/\r?\n/);
  const notes = [];
  let current = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const heading = line.match(/^#{1,3}\s+(.*)$/);
    if (heading) {
      const text = heading[1].trim();
      const versionHeading = text.match(/^(?:TechCalc\s+Pro\s+)?(?:Version\s+)?([0-9]+\.[0-9]+\.[0-9]+(?:[-.]rc\.?\d+)?)\s*(?:[·-–]\s*(.*))?$/i);
      const phaseHeading = text.match(/^(Phase\s+\d+[A-Z]?(?:\.\d+)?)\s*(?:[·-–]\s*(.*))?$/i);
      if (versionHeading) {
        current = { version: versionHeading[1], title: versionHeading[2] || '', items: [] };
      } else if (phaseHeading) {
        current = { version: phaseHeading[1], title: phaseHeading[2] || '', items: [] };
      } else {
        current = { version: text, title: '', items: [] };
      }
      notes.push(current);
      continue;
    }
    if (!current) continue;
    const item = line.replace(/^[-*]\s+/, '').trim();
    if (item && !item.startsWith('#')) current.items.push(item);
  }

  return notes;
}

export function renderReleaseNotes(notes, host = document.getElementById('releaseNotesDynamic')) {
  if (!host) return;
  if (!notes?.length) {
    host.innerHTML = '<p>Release Notes konnten nicht geladen werden.</p>';
    return;
  }
  host.innerHTML = notes.slice(0, 18).map(note => `
    <div class="release-note">
      <strong>${escapeHtml(note.version)}${note.title ? ` · ${escapeHtml(note.title)}` : ''}</strong>
      <small>${escapeHtml(note.items.slice(0, 4).join(' '))}</small>
    </div>
  `).join('');
}

function latestSemanticVersion(notes = []) {
  const versionPattern = /^([0-9]+\.[0-9]+\.[0-9]+)(?:\b|\s|[·-–])/;
  for (const note of notes || []) {
    const match = String(note?.version || '').match(versionPattern);
    if (match) return match[1];
  }
  return '';
}

function syncDisplayedVersion(appVersion, notes = []) {
  const displayVersion = latestSemanticVersion(notes) || appVersion;
  const versionHost = document.querySelector?.('[data-app-version-current]');
  if (versionHost) versionHost.textContent = displayVersion;
  const legacyVersionHost = document.getElementById?.('appVersion');
  if (legacyVersionHost) legacyVersionHost.textContent = displayVersion;
  document.querySelectorAll?.('input[name="version"]').forEach(input => { input.value = displayVersion; });
  return displayVersion;
}

let releaseNotesControllerInitialized = false;

export function initializeReleaseNotesController({
  appVersion = '1.3.0',
  releaseNotesUrl = './RELEASE_NOTES.md',
  versionHost = document.querySelector('[data-app-version-current]'),
  fallback = document.getElementById('releaseNotesFallback'),
  host = document.getElementById('releaseNotesDynamic'),
  fetchImpl = typeof fetch === 'function' ? fetch.bind(globalThis) : null
} = {}) {
  if (releaseNotesControllerInitialized) return Promise.resolve(false);
  releaseNotesControllerInitialized = true;

  syncDisplayedVersion(appVersion);

  return loadReleaseNotes({ appVersion, releaseNotesUrl, fallback, host, fetchImpl });
}

export async function loadReleaseNotes({
  appVersion = '1.3.0',
  releaseNotesUrl = './RELEASE_NOTES.md',
  fallback = document.getElementById('releaseNotesFallback'),
  host = document.getElementById('releaseNotesDynamic'),
  fetchImpl = typeof fetch === 'function' ? fetch.bind(globalThis) : null
} = {}) {
  try {
    if (!fetchImpl) throw new Error('fetch is not available');
    const separator = releaseNotesUrl.includes('?') ? '&' : '?';
    const response = await fetchImpl(`${releaseNotesUrl}${separator}v=${encodeURIComponent(appVersion)}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!response.ok) throw new Error(`Release Notes HTTP ${response.status}`);
    const markdown = await response.text();
    const notes = parseReleaseNotes(markdown);
    syncDisplayedVersion(appVersion, notes);
    renderReleaseNotes(notes, host);
    return true;
  } catch (error) {
    console.warn('Release Notes konnten nicht dynamisch geladen werden.', error);
    if (fallback) {
      const notes = parseReleaseNotes(fallback.textContent || '');
      syncDisplayedVersion(appVersion, notes);
      renderReleaseNotes(notes, host);
    }
    return false;
  }
}

export default initializeReleaseNotesController;
