import assert from 'node:assert/strict';
import fs from 'node:fs';

const router = fs.readFileSync(new URL('../js/core/router.js', import.meta.url), 'utf8');
const settings = fs.readFileSync(new URL('../js/platform/shell/settingsController.js', import.meta.url), 'utf8');
const guard = fs.readFileSync(new URL('../js/core/unsavedWorkGuard.js', import.meta.url), 'utf8');

assert.match(settings, /closeAllSubmenus\(\);[\s\S]*clearPersistedOpenSubmenu\(\);/, 'Beim Schließen des Hauptmenüs müssen alle Unterkarten geschlossen und der gespeicherte Offen-Zustand entfernt werden.');
assert.match(router, /export function preferredStartRoute\(\)/, 'Die Startmodulermittlung muss zentral und testbar sein.');
assert.match(router, /loadPreferences\(\)\.mobileQuickAccess/, 'Das Startmodul muss aus der Moduleinstellungs-Reihenfolge abgeleitet werden.');
assert.match(router, /const initialRoute = preferredStartRoute\(\);[\s\S]*replaceHash\(initialRoute\);/, 'App-Start und Reload müssen den alten Hash durch das oberste konfigurierte Modul ersetzen.');
assert.doesNotMatch(router, /const initialRoute = currentRoute\(\)/, 'Ein historischer Hash darf beim App-Start nicht das konfigurierte Startmodul übersteuern.');
assert.match(router, /window\.scrollTo\(0, 0\)/, 'Der Window-Scrollhost muss zurückgesetzt werden.');
assert.match(router, /document\.documentElement\.scrollTop = 0/, 'Der HTML-Scrollhost muss für mobile Browser zurückgesetzt werden.');
assert.match(router, /document\.body\.scrollTop = 0/, 'Der Body-Scrollhost muss für Safari zurückgesetzt werden.');
assert.match(router, /root\.scrollTop = 0/, 'Der Modulcontainer muss zurückgesetzt werden.');
assert.match(router, /resetViewportAfterModuleChange\(previousRouteId, id\);[\s\S]*renderCallback\(id\)[\s\S]*resetViewportAfterModuleChange\(previousRouteId, id\)/, 'Der Scrollreset muss vor und nach dem asynchronen Modulmount erfolgen.');
assert.match(guard, /\['input', 'change'\]/, 'Eingaben und Auswahländerungen müssen den Dirty-State setzen.');
assert.doesNotMatch(guard, /isTrusted/, 'Fachlich echte, programmatisch weitergereichte Eingabeereignisse dürfen nicht verworfen werden.');
assert.match(guard, /MUTATING_ACTION_SELECTOR/, 'Auch zustandsändernde Modulaktionen müssen als ungespeichert erkannt werden.');
assert.match(guard, /export function applyBeforeUnloadGuard/, 'Der Before-Unload-Handler muss separat prüfbar sein.');
assert.match(guard, /event\.preventDefault\?\.\(\);[\s\S]*event\.returnValue = ''/, 'Der standardkonforme native Verlassen-Hinweis muss aktiviert werden.');
assert.match(guard, /techcalc-project-saved/, 'Nach erfolgreichem Projektexport muss der Dirty-State zurückgesetzt werden.');
assert.match(guard, /techcalc-project-loaded/, 'Nach dem Laden eines Projekts muss der Dirty-State zurückgesetzt werden.');

console.log('Phase 47D shell behavior adjustments ok');
