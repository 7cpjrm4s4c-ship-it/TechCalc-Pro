# Phase 12D – Heizung/Kälte Store-first Rebuild

Phase 12D setzt den Heizung/Kälte-Umbau ohne Legacy-Patch fort.

## Ziel

Das Modul darf bei normalen Feld-, Select- und Segment-Aktionen nicht mehr vollständig neu geladen werden. Statische Karten bleiben stehen; nur dynamische Bereiche werden aktualisiert.

## Änderungen

- Segment-Schalter werden in der zentralen Event-Pipeline sofort optisch gesetzt, bevor der Render-Scheduler läuft.
- Mobile `pointerup`/`touchend` benötigen keinen zweiten Screen-Tap mehr, um Heizung/Kälte oder Berechnungsziel zu übernehmen.
- Select-Änderungen für Medium und Rohrsystem aktualisieren Stammdaten und Ergebnisse granular.
- Eingabefelder werden bei normaler Berechnung nicht mehr neu aufgebaut, solange sich Modus, Ziel oder Einheit nicht ändern.
- `kg/h`/`m3/h` bleibt als Einheitenselect im Feld bestehen und wird nur bei Ziel-/Einheitenwechsel neu gerendert.
- Saved-Line-Selection wird als vollständige Store-Hydration behandelt (`hydrateLineSectionState`).
- Dynamic-Renderer merkt sich den letzten Modus/Ziel/Einheitenzustand und vermeidet unnötige Card-Rebuilds.

## Abschlusskriterium für Heizung/Kälte

Heizung/Kälte gilt erst nach praktischer Mobile/Desktop-Prüfung als vollständig migriert. Phase 12D entfernt weitere Render-Ursachen, ersetzt aber noch nicht die gesamte HTML-Erzeugung durch die generische Schema-Engine. Das bleibt der letzte Schritt der Heizung/Kälte-Referenzmigration.
