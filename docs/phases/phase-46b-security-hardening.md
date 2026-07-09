# Phase 46B – Security Hardening

Status: abgeschlossen  
Version: 1.3.4-dev.2

## Ziel

Die aus der externen Bewertung abgeleitete Security-Lücke zum offenen `innerHTML`-Audit wird geschlossen. Ziel ist eine nachvollziehbare DOM-Sink-Policy ohne funktionale Änderungen an den Fachmodulen.

## Analyse

Die statische Prüfung ergab `innerHTML`-Nutzung in 12 Runtime-Dateien. Die Vorkommen liegen überwiegend in zentralen Plattform-Renderpfaden oder Dynamic-Renderer-Inseln. Ein akuter XSS-Befund wurde nicht festgestellt, die bisherige Dokumentation enthielt jedoch noch eine offene mittelfristige Härtungsaufgabe.

## Design Review

Für 1.3.4 gilt ein DOM-Sink-Vertrag:

- `innerHTML` ist nur in allow-gelisteten Renderpfaden zulässig.
- Release Notes aus Markdown werden im Browser nicht per direktem HTML-Template geschrieben.
- Verbotene Sinks (`insertAdjacentHTML`, `outerHTML`-Assignment, `document.write`, `eval`, `new Function`) sind im Runtime-Code nicht erlaubt.
- Der Audit muss in `npm run lint` laufen.

## Implementierung

- `js/platform/shell/releaseNotesController.js` rendert Release Notes im Browser über DOM-Knoten und `textContent`.
- Der Node-Test-Fallback bleibt erhalten, escaped aber weiterhin über den zentralen Renderer-Helfer.
- `scripts/audit-dom-sinks-phase46b.mjs` wurde ergänzt und in `lint` eingebunden.
- `docs/security/SECURITY_HARDENING_1.3.4.md` dokumentiert das Ergebnis.

## Regression

Geprüfte Gates:

- `npm run lint`
- `npm test`
- `npm run test:integration`
- `npm run build`
- `npm run build:minified`

## Ergebnis

Phase 46B schließt das offene `innerHTML`-Audit ab und macht neue DOM-Sink-Verstöße künftig im Standard-Lint sichtbar.

## Referenzen

- `docs/security/SECURITY_HARDENING_1.3.4.md`
- `scripts/audit-dom-sinks-phase46b.mjs`
- `docs/qm/QM-003-Architecture-Rules.md`
