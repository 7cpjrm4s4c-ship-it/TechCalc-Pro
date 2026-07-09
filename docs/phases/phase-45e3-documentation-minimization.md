# Phase 45E.3 – Documentation Minimization

Version: 1.3.3-dev.8  
Status: abgeschlossen

## Ziel

Reduktion der Dokumentationsdateien auf das absolut notwendige Maß, ohne aktive Referenzen, Modulverträge, ADRs, Phasenhistorie oder rechtlich/release-relevante Unterlagen zu verlieren.

## Ausgangslage

Phase 45E.2 hat das Quality Manual eingeführt, aber die Dateianzahl erhöht. Ziel von 45E.3 war deshalb nicht weitere Ergänzung, sondern echte Minimierung.

## Analyse

Als verzichtbar identifiziert wurden historische Audit-Rohdaten, JSON-Baselines, CSS-Zwischenartefakte, alte Einzel-Audits, doppelte Release-Notes und archivierte Zwischenstände ohne aktiven Referenzwert.

## Designentscheidung

Aktiv bleiben nur Dokumente mit aktuellem Referenz- oder notwendigem Nachvollziehbarkeitswert:

- Quality Manual
- Contracts
- ADRs
- Phasendokumentation
- Engineering-Standards
- Release-/Migrationsunterlagen
- Recht/Security
- kompakte Archiv- und Audit-Indizes

Historische Detailartefakte werden nicht mehr standardmäßig im Development-ZIP mitgeführt.

## Implementierung

- `docs/audits/` auf README und konsolidierte Audit-Historie reduziert.
- `docs/archive/` auf README und Archivmanifest reduziert.
- Historische JSON-, CSS-, Report- und Einzel-Auditdateien entfernt.
- Doppelte `docs/release-notes/` entfernt; Root-Release-Notes bleiben maßgeblich.
- Dokumentationsindex und Audit-README aktualisiert.

## Regression

Die Änderung betrifft ausschließlich Dokumentation. Anwendungscode, Modulcode, Runtime, Persistenz, PDF, PWA und Service Worker wurden nicht verändert.

## Ergebnis

Die Dokumentationsdateien wurden deutlich reduziert. Die aktive Referenzstruktur bleibt erhalten und ist konsistenter als vor der Minimierung.

## Risiken

Historische Detailtiefe einzelner Roh-Audits ist nicht mehr direkt im Paket enthalten. Dieses Risiko wird durch QM, Phasendokumentation, Audit-History und Archivmanifest akzeptiert.

## Betroffene Bereiche

- `docs/audits/`
- `docs/archive/`
- `docs/README.md`
- `RELEASE_NOTES.md`
- `DEVELOPMENT_NETLIFY.md`

## Referenzen

- `docs/qm/QM-001-Quality-Manual.md`
- `docs/qm/QM-012-Documentation-Standard.md`
- `docs/audits/AUDIT_HISTORY.md`
- `docs/archive/ARCHIVE_MANIFEST.md`
