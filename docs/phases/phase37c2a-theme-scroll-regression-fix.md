# Phase 37C.2A – Theme Extraction Regression Fix

## Ausgangslage
Nach Phase 37C.2 wurde auf Touch-Geräten im Modul Trinkwasser ein Scroll-Rücksprung beobachtet. Der Fehler trat nur beim Finger-Scroll innerhalb eines Teilbereichs auf; Speichern, Eingabe, Löschen und globaler Body-Scroll waren nicht betroffen.

## Ursache
Der No-Click-Scroll-Schutz konnte nach `touchstart` / `pointerdown` eine Viewport-Snapshot-Restaurierung bis zum synthetischen `click` behalten, obwohl der Nutzer zwischenzeitlich gescrollt hatte. Dadurch wurde die Scrollposition nach einer echten Touch-Scroll-Geste wieder auf den ursprünglichen Snapshot zurückgesetzt.

Zusätzlich wurde die ausgelagerte Theme-Controller-Initialisierung idempotent gehärtet, damit keine doppelten Theme-Listener entstehen können.

## Änderungen
- `js/core/renderer.js`
  - `bindNoClickScroll()` erkennt Touch-/Pointer-Bewegungen.
  - Pending Viewport-Snapshots werden bei Bewegung über 8 px verworfen.
  - Native Scroll-Events verwerfen ebenfalls pending Snapshots.
- `js/platform/shell/themeController.js`
  - Initialisierung mit einmaligem Guard abgesichert.
- `tests/platform-app-shell-theme-controller-phase37c2a.test.mjs`
  - neuer Regression-Guard für Touch-/Pointer-Move-Cancellation und Theme-Controller-Idempotenz.

## Validierung
- `npm run build`
- `npm run test:phase37c2a`
- `npm run test:phase37c2`
- `npm run test:phase37b3`
- `npm run test:module-smoke`

## Ergebnis
37C.2 bleibt erhalten. Die Theme-Logik bleibt ausgelagert, während der Trinkwasser-Touchscroll nicht mehr durch eine veraltete Viewport-Restaurierung zurückgesetzt werden darf.
