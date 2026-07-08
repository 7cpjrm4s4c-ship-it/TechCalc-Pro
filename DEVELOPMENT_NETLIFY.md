# TechCalc Pro 1.3.3-dev.2

Entwicklungsstand für Version 1.3.3 – Phase 45B.

## Phase 45B – Design Review Modulsplitting WRG/Mischluft

- Basis: 1.3.3-dev.1 Phase 45A.
- Umfang: Zielarchitektur, Modul-IDs, Migrationsvertrag, PDF-/Export-Vertrag und Regressionserwartungen.
- Entscheidung: `heat-recovery` bleibt WRG; `mixed-air` wird neues Mischluft-Modul.
- Keine funktionalen Änderungen an Berechnung, UI, Persistenz, PDF, Service Worker oder Runtime.
- Arbeitsstandard: Analyse → Design Review → Implementierung → Regression → Dokumentation.

## Nächster Schritt

Phase 45C – kontrollierte Implementierung in kleinen Schritten: Shared-Air-Utility, Mixed-Air-Modulgerüst, Migration, Registry/Navigation und PDF-/Export-Regression.
