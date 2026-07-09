# Changelog 1.3.3

## Hauptänderungen

- WRG/Mischluft-Modulsplitting abgeschlossen.
- Neues eigenständiges Modul `mixed-air` ergänzt.
- `heat-recovery` auf Wärmerückgewinnung/RLT-Funktion reduziert.
- Legacy-Projektmigration für aktive Mischluft-Eingaben ergänzt.
- Legacy-Saved-Records-Migration ergänzt: Mischluft-Records werden nach `mixed-air`, WRG-Records nach `heat-recovery` übernommen.
- Mischluft-Speicherdialog und Saved-Record-Workflow ergänzt.
- Dokumentation konsolidiert und minimiert.
- Quality Manual eingeführt.
- Modulvertrag und Architecture Baseline 1.3.3 finalisiert.

## Kompatibilität

Bestehende Projekte aus 1.3.2 bleiben kompatibel und werden beim Laden automatisch migriert.

## Breaking Changes

Keine für Anwender. Intern wurden die Modulverantwortlichkeiten von WRG und Mischluft getrennt.
