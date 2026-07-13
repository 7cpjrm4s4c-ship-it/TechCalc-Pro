# Phase 47C.4.3 – Platform Conformance Review und Cleanup

Version: 1.4.0-dev.2  
Status: umgesetzt  
Modul: `flooding-verification`

## Anlass

Vor der Fortsetzung der Fachimplementierung wurde der Stand aus 47C.1 bis 47C.4.2 gegen die verbindlichen Contracts, ADRs, Audits und Quality Gates geprüft. Maßgebend waren insbesondere:

- `docs/contracts/module-contract.md`,
- `docs/contracts/flooding-verification-contract.md`,
- ADR-0007 und ADR-0008,
- Architecture Rules und Platform-Convergence-Vorgaben,
- zentrale Save-, Collection-, Event-, State-, Render-, Theme-, Projekt- und PWA-Verträge.

## Festgestellte Abweichungen

1. Das Modul importierte Flächen- und Hydraulikdaten direkt aus `rainwater/tables.js`.
2. Die vollständige Flächenbearbeitung wurde über einen modulspezifischen DOM-Listener gebunden.
3. Die Modulsteuerung enthielt eine eigene Debounce-Logik zusätzlich zur zentralen Event-Deduplizierung.
4. Die Projektpersistenz enthielt einen direkt auf `flooding-verification` zugeschnittenen Wrapper.
5. Neue Shared- und Moduldateien waren im statischen Offline-Precache nachzuziehen.

## Cleanup

### Gemeinsame Fachdatenschicht

Die Flächenstammdaten, Nennweiten, hydraulischen Tabellen, Dachablaufdaten und Rinnenkombinationen liegen nun in:

`js/shared/rainwaterDomainTables.js`

Das Regenwassermodul re-exportiert diese Daten nur noch über seinen bisherigen Pfad. Das Überflutungsmodul greift direkt auf die Shared-Schicht zu und besitzt keine Laufzeitabhängigkeit zum Regenwassermodul für Fachdatentabellen.

### Zentrale Collection-Aktionen

Die Bearbeiten-Aktion wird über den bestehenden zentralen Collection-Aktionspfad ausgeführt. Der Collection-Renderer adressiert eine konfigurierbare Edit-Collection; die Module-Runtime verarbeitet diese über `platform:collection:add`. Ein eigener Click-Listener im Modul wurde entfernt.

### Zentrale Event-Deduplizierung

Die modulspezifische Debounce- und Fingerprint-Logik wurde entfernt. Pointer-, Touch- und Click-Deduplizierung verbleiben ausschließlich in der zentralen Event- und Collection-Pipeline.

### Zentrale Projektadapter

Neue additive Modulstates werden über `js/core/projectModuleStateAdapters.js` registriert. `projectStorage.js` kennt keine konkrete Flooding-State-Instanz mehr. Der Adapter übernimmt Lesen, Anwenden, Reset und die idempotente Migration des alten Gefälleschlüssels.

### Rendering, CSS und Tokens

Das Modul verwendet weiterhin ausschließlich:

- `createPlatformModule`,
- Form- und Result-Schema-Renderer,
- zentralen Collection-Renderer,
- zentralen Saved-Record-Controller,
- bestehende Card-, Button-, Segment-, Grid- und Result-Komponenten,
- zentrale Modulakzent- und Theme-Tokens.

Es wurden keine modulspezifischen CSS-Dateien, Inline-Styles oder alternativen Rendering-Engines eingeführt.

## Regression

Ergänzt beziehungsweise angepasst wurden Prüfungen für:

- Verbot modulspezifischer Event-Listener und Debounce-Pfade,
- ausschließliche Verwendung der Shared-Fachdatenschicht,
- zentrale Collection-Bearbeitung,
- generische Projektadapter,
- bestehende hydraulische Referenzwerte und Gefällemigration,
- Projektimport, Projektreset und Saved Records.

## Freigabebedingung

47C.5 darf erst fortgesetzt werden, wenn der Deploy erfolgreich ist und die bestehende Gate-Suite keine Regression meldet. Die gleiche Platform-Conformance-Prüfung ist bei allen weiteren Blöcken 47C.5 bis 47C.7 verbindlich.
