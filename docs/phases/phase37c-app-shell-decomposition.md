# Phase 37C – App-Shell Decomposition

## 37C.1 – Responsibility Map

`app.js` wurde in Verantwortungsbereiche zerlegt. Die Extraktionsreihenfolge wurde auf risikoarme Shell-Controller gelegt.

## 37C.2 – Theme Controller Extraction

Theme-Initialisierung, Theme-Persistenz und Theme-Umschaltung wurden nach `js/platform/shell/themeController.js` ausgelagert.

## 37C.2A–37C.2F – Regression Stabilisierung

Die mobile Trinkwasser-Scroll-Regression wurde über Surface-No-Op-Unterdrückung stabilisiert. Zusätzlich wurden Kupfer-Dimensionen DN65–DN100 korrigiert.

## 37C.3 – Settings Controller Extraction

Die Settings-Drawer-Logik wurde aus `js/core/app.js` nach `js/platform/shell/settingsController.js` extrahiert.

Umfang:

- Settings öffnen/schließen
- Page-Scroll-Lock für Drawer
- Submenu-Persistenz
- Außenklick/Escape-Schließen
- iOS/Safari Touchmove-Guard
- PDF-Preload beim Öffnen

Ziel: App-Shell weiter entflechten, ohne Runtime-Verhalten zu ändern.

## 37C.4 – Release Notes Controller Extraction

Release-Notes-Parsing, dynamisches Laden und Rendering wurden aus `js/core/app.js` nach `js/platform/shell/releaseNotesController.js` extrahiert.

Umfang:

- Versionsanzeige setzen
- `RELEASE_NOTES.md` cache-bypassed laden
- Fallback aus eingebettetem Release-Notes-Block verwenden
- Markdown-Abschnitte parsen
- Release-Notes-Liste rendern

Ziel: App-Shell weiter in Richtung Composition Root reduzieren; keine Änderung am sichtbaren Release-Notes-Verhalten.


## 37C.5 – Feedback Controller Extraction

Feedback-Submit, Payload-Aufbau, Statusmeldungen und Fehlerbehandlung wurden aus `js/core/app.js` nach `js/platform/shell/feedbackController.js` extrahiert.

## 37C.6 – Service Worker Controller Extraction

Service-Worker-Registration, `TECHCALC_CACHE_UPDATED`-Message-Handling und Session-Cache-Markierung wurden aus `js/core/app.js` nach `js/platform/shell/serviceWorkerController.js` extrahiert.

Umfang:

- registriert `service-worker.js` weiterhin mit Version-Query
- fordert `registration.update()` nach Load an
- verarbeitet Cache-Update-Nachrichten ohne Auto-Reload
- hält laufende Berechnungen bei PDF-/PWA-Wechseln stabil
- ergänzt Precache um den neuen Shell-Controller

Ziel: `app.js` weiter auf Bootstrap und Composition Root reduzieren, ohne Service-Worker-Verhalten zu ändern.

## 37C.7 – App-Shell Decomposition Closure

Phase 37C.7 schließt die App-Shell-Decomposition als kontrollierte Stabilisierungsphase ab.

Ergebnis:

- `js/core/app.js` bleibt als Composition Root erhalten.
- Theme, Settings, Release Notes, Feedback und Service Worker liegen in eigenen Shell-Controllern.
- `app.js` enthält weiterhin nur Bootstrap, Lazy-Module-Registrierung, Router-Composition, Session-Persistenz und globale Modulnavigation.
- Alle Shell-Controller sind im Service-Worker-Precache enthalten.
- Die Settings-Drawer-Korrekturen aus 37C.4A–37C.4F bleiben als stabile Mobile-UX-Basis erhalten.

Technischer Abschluss:

- App-Shell-Controller: 5/5 vorhanden.
- `app.js`: unter 320 Zeilen.
- Keine extrahierten Shell-Verantwortungen verbleiben in `app.js`.
- Neuer Audit: `scripts/audit-app-shell-closure-phase37c7.mjs`.
- Neuer Guard: `test:phase37c7`.

Bewertung:

Phase 37C hat den Monolith-Befund aus dem Audit substanziell reduziert. `app.js` ist nicht vollständig leergezogen, sondern bewusst als Composition Root belassen. Das ist der richtige Zielzustand vor RC: minimale Orchestrierung im Core, konkrete UI-/Shell-Verantwortungen in separaten Controllern.
