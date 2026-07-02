function escapeHtml(value = '') {
  return String(value).replace(/[&<>"]/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[char]));
}

function normalizeReleaseVersion(value = '') {
  return String(value || '')
    .replace(/\s+RC\s*/i, '-rc.')
    .replace(/-rc(\d+)/i, '-rc.$1')
    .toLowerCase();
}

function releaseSortKey(note = {}) {
  const raw = normalizeReleaseVersion(note.version);
  const match = raw.match(/^(\d+)\.(\d+)\.(\d+)(?:-rc\.(\d+))?$/i);
  if (!match) return [0, 0, 0, -1];
  return [Number(match[1]), Number(match[2]), Number(match[3]), match[4] ? Number(match[4]) : 9999];
}

function compareReleaseNotesDesc(a, b) {
  const ak = releaseSortKey(a);
  const bk = releaseSortKey(b);
  for (let i = 0; i < Math.max(ak.length, bk.length); i += 1) {
    if ((bk[i] || 0) !== (ak[i] || 0)) return (bk[i] || 0) - (ak[i] || 0);
  }
  return 0;
}

function dedupeReleaseNotes(notes = []) {
  const seen = new Set();
  return notes.filter(note => {
    const key = normalizeReleaseVersion(note.version);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function parseReleaseNotes(markdown = '') {
  const lines = String(markdown || '').split(/\r?\n/);
  const notes = [];
  let current = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || /^<!--.*-->$/.test(line)) continue;
    const heading = line.match(/^#{1,3}\s+(.*)$/);
    if (heading) {
      const text = heading[1].trim();
      const versionHeading = text.match(/^(?:TechCalc\s+Pro\s+)?(?:Version\s+)?([0-9]+\.[0-9]+\.[0-9]+(?:\s+RC\s*\d+|[-.]rc\.?\d+)?)\s*(?:[·\-–]\s*(.*))?$/i);
      const phaseHeading = text.match(/^(Phase\s+\d+[A-Z]?(?:\.\d+)?)\s*(?:[·\-–]\s*(.*))?$/i);
      if (versionHeading) {
        current = {
          version: normalizeReleaseVersion(versionHeading[1]),
          title: versionHeading[2] || '',
          items: []
        };
        notes.push(current);
      } else if (phaseHeading) {
        current = { version: phaseHeading[1], title: phaseHeading[2] || '', items: [] };
        notes.push(current);
      } else if (current) {
        current.items.push(text);
      }
      continue;
    }
    if (!current) continue;
    const item = line.replace(/^[-*]\s+/, '').trim();
    if (item && !item.startsWith('#')) current.items.push(item);
  }

  return dedupeReleaseNotes(notes).sort(compareReleaseNotesDesc);
}

export function renderReleaseNotes(notes, host = document.getElementById('releaseNotesDynamic')) {
  if (!host) return;
  if (!notes?.length) {
    host.innerHTML = '<p>Release Notes konnten nicht geladen werden.</p>';
    return;
  }
  host.innerHTML = notes.slice(0, 18).map((note, index) => `
    <article class="release-note${index === 0 ? ' is-current' : ''}">
      <div class="release-note__header">
        <strong class="release-note__version">${escapeHtml(note.version)}</strong>
        ${index === 0 ? '<span class="release-note__badge">Aktuell</span>' : ''}
      </div>
      ${note.title ? `<strong class="release-note__title">${escapeHtml(note.title)}</strong>` : ''}
      <small>${escapeHtml(note.items.slice(0, 4).join(' '))}</small>
    </article>
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
  appVersion = '1.3.2-dev.7',
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
  appVersion = '1.3.2-dev.7',
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
