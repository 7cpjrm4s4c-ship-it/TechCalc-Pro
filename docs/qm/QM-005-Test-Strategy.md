# QM-005 Test Strategy

Status: verbindlich ab Version 1.3.3-dev.7

## Testpyramide

- `npm test`: schnelle Unit-/Contract-Tests.
- `npm run test:integration`: Plattform-, Modul- und Integrationsguards.
- `npm run build`: Produktionsbuild-Verifikation.
- `npm run build:minified`: minifizierte Build-Verifikation, sofern Release- oder PWA-nah gearbeitet wird.

## Testziele

- Berechnungen deterministisch prüfen.
- Persistenz und Migration abwärtskompatibel halten.
- Modulregistrierung und gespeicherte Records absichern.
- PDF-Export und Renderpfade gegen Referenzmodule prüfen.
- PWA-Verhalten in Build- und Smoke-Tests bestätigen.

## Manuelle Tests

Manuelle Tests sind zulässig, wenn Browser-, iOS-, Windows- oder PWA-Verhalten nicht vollständig automatisiert abbildbar ist. Ergebnisse müssen in Phasen- oder Release-Dokumentation nachvollziehbar festgehalten werden.


## Toolchain-Hygiene ab Phase 46A

Das aktive Verzeichnis `scripts/` darf nur Skripte enthalten, die über `package.json` oder `scripts/test-integration.mjs` erreichbar sind.

Verbindliche Regel:

- neue Audit-Skripte müssen entweder in die Pipeline eingebunden oder nach Abschluss der Phase entfernt werden
- historische Audit-Skripte verbleiben nicht im aktiven Tooling-Pfad
- `npm run lint` führt `audit:toolchain` aus und blockiert unverdrahtete Skripte

Standard-Gates:

- `npm run lint`
- `npm test`
- `npm run test:integration`
- `npm run build`
- `npm run build:minified`
