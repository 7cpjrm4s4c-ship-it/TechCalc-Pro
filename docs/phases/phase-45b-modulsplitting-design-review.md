# Phase 45B – Design Review Modulsplitting WRG/Mischluft

## Status

- Version: `1.3.3-dev.2`
- Basis: `1.3.3-dev.1` Phase 45A
- Phase: Design Review
- Implementierungsstatus: keine funktionalen Runtime-Änderungen

## Analyse

Phase 45A hat bestätigt, dass das bestehende Kombimodul `heat-recovery` fachlich zwei unterschiedliche Berechnungsbereiche enthält. Kritisch sind nicht die Oberflächen, sondern Persistenz, Migration, PDF-/Export-Struktur und die aktuell gemeinsame Luftzustandslogik.

## Design Review

### Zielbild

Das Kombimodul wird in zwei Zielmodule getrennt:

- `heat-recovery` bleibt das WRG-Modul.
- `mixed-air` wird neues Mischluft-Modul.

Damit bleibt der historisch wichtigste Modulschlüssel stabil, während Mischluft einen eindeutigen fachlichen Schlüssel erhält.

### Zielarchitektur

Die Zielmodule erhalten jeweils eigene Dateien für:

- `config.js`
- `state.js`
- `schema.js`
- `logic.js`
- `viewModel.js`
- `view.js`
- `results.js`
- `controller.js`
- `index.js`

Gemeinsame lufttechnische Hilfsfunktionen werden aus `heat-recovery/logic.js` in einen Shared-Bereich extrahiert. Keine Zielimplementierung darf wieder einen kombinierten `mode`-Dispatcher verwenden.

### Migrationsmodell

`projectStorage` bleibt rückwärtskompatibel. Alte Projektdateien mit `modules['heat-recovery']` werden beim Laden normalisiert:

- WRG-State nach `heat-recovery`.
- Mischluft-State nach `mixed-air`.
- Defaults werden ergänzt, wenn ein Teilbereich fehlt.
- Bestehende WRG-Saved-Records verbleiben bei `heat-recovery`.

### Referenzverhalten

Die Berechnungsergebnisse dürfen sich durch den Split nicht ändern. Der Split ist zuerst eine strukturelle Maßnahme. Formeländerungen sind in 45C ausdrücklich nicht freigegeben.

## Implementierungsvorgabe für 45C

45C muss klein und rückbaubar bleiben. Empfohlene Reihenfolge:

1. Shared-Air-Utility extrahieren und gegen bestehende WRG/Mischluft-Ergebnisse testen.
2. `mixed-air` als neues Modulgerüst anlegen, zunächst ohne Navigation-Aktivierung.
3. Persistenzmigration für Altprojekte ergänzen.
4. Navigation und App-Registry aktivieren.
5. PDF-/Export-Schnitt getrennt validieren.

## Regression

Für Phase 45B wurden keine funktionalen Änderungen eingeführt. Regression beschränkt sich auf Build-/Import-/Lint-Gates. Die fachliche Regression erfolgt nach Implementierung in 45C/45D.

## Dokumentation

Ergänzt wurden:

- `docs/adr/ADR-0006-wrg-mixed-air-module-splitting.md`
- `docs/contracts/wrg-mixed-air-splitting-contract.md`
- dieses Phasendokument

## Entscheidung

Phase 45B gibt Phase 45C frei, jedoch nur unter folgenden Bedingungen:

- keine Formeländerungen,
- kein Entfernen des Altprojektpfads ohne Migration,
- keine Duplikation psychrometrischer Kernfunktionen,
- kleine Commits/Änderungspakete entlang Analyse → Design Review → Implementierung → Regression → Dokumentation.
