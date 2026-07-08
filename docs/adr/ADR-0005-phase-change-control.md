# ADR-0005 – Phase Change Control

## Status

Accepted – ab Phase 44B.5

## Kontext

TechCalc Pro besitzt eine gewachsene PWA-Architektur mit Modulverträgen, Theme-Verträgen, Offline-Fähigkeit, Import/Export und plattformübergreifenden Anforderungen für iOS, Windows und Desktop-Browser. Änderungen ohne festen Ablauf erhöhen das Risiko von UI-, Runtime-, Cache- und Vertragsregressionen.

## Entscheidung

Jede zukünftige Phase folgt verbindlich dem Ablauf:

1. Analyse – bestehende Dokumentation und Verträge prüfen.
2. Design Review – Zielbild und Referenz festlegen.
3. Implementierung – kleine, nachvollziehbare Änderungen.
4. Regression – gezielte Tests gegen Referenzmodule.
5. Dokumentation – Contracts, ADRs und Phasendokumente aktualisieren.

## Folgen

- Änderungen werden kleiner und auditierbarer.
- Regressionen werden früher sichtbar.
- Phasenabschluss ist erst nach Dokumentation und Regression gültig.
- Gate-Entscheidungen beruhen auf Contracts statt auf ad-hoc-Prüfungen.

## Referenzen

- Phase 44B.5 – Browser Compliance
- Gate 10 – Performance & Cleanup
