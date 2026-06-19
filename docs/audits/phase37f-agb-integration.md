# Phase 37F – AGB Integration

## Ziel

Die Allgemeinen Geschäftsbedingungen werden als statische Legal-Seite in die App integriert und im Settings-Menü erreichbar gemacht.

## Änderungen

- Neue Datei: `docs/legal/agb.html`
- Settings-Menü: „Rechtliches & App“ enthält jetzt einen aktiven Link `AGB öffnen`.
- Service Worker: `docs/legal/agb.html` wird im Precache geführt.
- Guard: `test:phase37f` prüft Datei, Link und Precache.

## Runtime Impact

Keine Fachlogikänderung. Keine Moduländerung.

## Hinweis

Die AGB enthalten Platzhalter für Herausgeberdaten und sollten vor produktiver Veröffentlichung juristisch final geprüft werden.
