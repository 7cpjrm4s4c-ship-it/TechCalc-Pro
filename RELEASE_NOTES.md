## Version 1.3.4 - Final Release

TechCalc Pro 1.3.4 ist freigegeben.

### Neu
- Toolchain bereinigt und auf aktive Build-/Audit-Skripte reduziert.
- Security-Hardening mit abgeschlossenem DOM-Sink-/innerHTML-Audit ergänzt.
- Accessibility-Baseline auf WCAG 2.1 AA als internes Zielniveau festgelegt.
- E2E-Abdeckung für Mischluft, Legacy-Migration, Projektverwaltung und PDF-Export erweitert.

### Verbesserungen
- Release Notes zeigen weiterhin nur Final Releases, Release Candidates und Hotfixes – keine `dev.x`-Zwischenstände.
- Qualitätsprüfungen für Toolchain, DOM-Sinks, Accessibility und E2E-Coverage sind in `npm run lint` integriert.
- Projektstruktur weiter reduziert und bereinigt.
- Entwicklungs- und Deployment-Pakete sind wieder als getrennte Release-Artefakte verfügbar.

### Behoben
- Verwaiste Toolchain-Skripte wurden entfernt oder konsolidiert.
- Offener innerHTML-/DOM-Sink-Audit aus früheren Versionen wurde abgeschlossen.
- Accessibility-Zielniveau und statische Prüfung wurden nachgezogen.
- E2E-Lücke für den neuen Mischluft-Workflow wurde geschlossen.

## Version 1.3.3 - Final Release

TechCalc Pro 1.3.3 ist freigegeben.

### Neu
- Wärmerückgewinnung und Mischluft sind in eigenständige Fachmodule getrennt.
- Bestehende Projekte werden ohne Datenverlust migriert.
- Gespeicherte Mischluft-Datensätze werden korrekt dem neuen Mischluft-Modul zugeordnet.
- Projektlebenszyklus für Mischluft vollständig integriert: Eingabe, Berechnung, Speichern, Laden, PDF und Export.
- Dokumentation, Modulverträge, Quality Manual und Architecture Baseline konsolidiert.

### Verbesserungen
- Release Notes zeigen künftig keine `dev.x`-Zwischenstände mehr in der App.
- Dokumentationsstruktur deutlich reduziert und bereinigt.
- Architektur- und Qualitätsreferenzen für künftige Versionen vereinheitlicht.

### Behoben
- Mischluft-Speicherdialog ergänzt.
- Legacy-Mischluft-Records werden beim Laden alter Projekte korrekt migriert.
- Veraltete Release-Notes-Einträge aus der App-Ansicht entfernt.
