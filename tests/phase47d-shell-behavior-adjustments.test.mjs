import assert from 'node:assert/strict';
import fs from 'node:fs';

const router = fs.readFileSync(new URL('../js/core/router.js', import.meta.url), 'utf8');
const settings = fs.readFileSync(new URL('../js/platform/shell/settingsController.js', import.meta.url), 'utf8');
const guard = fs.readFileSync(new URL('../js/core/unsavedWorkGuard.js', import.meta.url), 'utf8');

assert.match(settings, /closeAllSubmenus\(\);[\s\S]*clearPersistedOpenSubmenu\(\);/, 'Beim Schließen des Hauptmenüs müssen alle Unterkarten geschlossen und der gespeicherte Offen-Zustand entfernt werden.');
assert.match(router, /loadPreferences\(\)\.mobileQuickAccess/, 'Das Startmodul muss aus der Moduleinstellungs-Reihenfolge abgeleitet werden.');
assert.match(router, /preferred\.find\(id => modules\.get\(id\)\)/, 'Das erste verfügbare Modul der gespeicherten Liste muss Startmodul sein.');
assert.match(router, /resetViewportAfterModuleChange/, 'Der Modulwechsel muss die Viewportposition zentral zurücksetzen.');
assert.match(router, /scrollTo\(\{ top: 0, left: 0, behavior: 'auto' \}\)/, 'Der neue Modulscreen muss oben beginnen.');
assert.match(guard, /beforeunload/, 'Ungespeicherte Arbeit muss beim Schließen oder Neuladen geschützt werden.');
assert.match(guard, /event\.returnValue/, 'Der native Browser-Schließhinweis muss für Dirty-State aktiviert werden.');
assert.match(guard, /techcalc-project-saved/, 'Nach erfolgreichem Projektexport muss der Dirty-State zurückgesetzt werden.');
assert.match(guard, /techcalc-project-loaded/, 'Nach dem Laden eines Projekts muss der Dirty-State zurückgesetzt werden.');

console.log('Phase 47D shell behavior adjustments ok');
