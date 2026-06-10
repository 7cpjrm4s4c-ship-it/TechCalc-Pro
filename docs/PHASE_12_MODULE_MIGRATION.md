# Phase 12 - Modulmigration auf Global Standard

## Ziel

Phase 12 startet die fachliche Migration der Module auf den globalen Plattformstandard. Der erste Zielkandidat ist `heating-cooling`, weil das Modul alle kritischen Mechaniken kombiniert:

- Select-Felder mit Stammdaten
- Segment-/Switch-Logik
- Berechnung nach `change`, `blur` und `Enter`
- optionale Speicherung
- Auswahl und Bearbeitung gespeicherter Leitungsabschnitte
- Mobile/Desktop Bedienbarkeit

## Umgesetzt fuer Heizung / Kaelte

- stabiler Store-Key: `moduleId: 'heating-cooling'`
- Medium und Rohrsystem sind im Schema als `FIELD_TYPES.SELECT` mit Stammdatenoptionen definiert
- zentrale Selects markieren `data-commit="immediate"` und `data-lookup="true"`
- zentrale Event-Pipeline committed Selects sofort und triggert damit die Berechnung
- Segment-/Switch-Interaktionen laufen ueber `segment:select`
- Leitungsabschnitt Save/Update/Load/Delete ist als zentrale Action registriert
- gespeicherte Leitungsabschnitte aktualisieren den Store mit strukturellen Actions
- Tastaturaktivierung fuer zentrale Actions wurde in der Pipeline ergaenzt

## Verbindliche Regel ab Phase 12

Neue oder migrierte Module duerfen fuer Standardaktionen keine eigenen Event-Inseln mehr einfuehren. Erlaubt ist nur noch ein duennes Adapter-Layer fuer fachliche Datentransformationen, beispielsweise:

- `savedLineSectionPatch(item, state)`
- `buildLineSectionRecord(state, result)`
- optionale Stammdatenmapper

UI-Events, Store-Commits und Render-Trigger gehoeren in die Plattform.
