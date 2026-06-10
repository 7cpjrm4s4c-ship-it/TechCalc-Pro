# Phase 16E – Event Pipeline Consolidation

## Ziel

Die Plattform übernimmt weitere UI-/UX-Ereignisse zentral. Module sollen nicht mehr eigene DOM-Events für Standardaktionen wie Speichern, Aktualisieren, Auswahl, Löschen, Accordion oder Lookup-Hydration binden.

## Umgesetzt

- `eventPipeline` besitzt jetzt `registerPipelineCommitHandler()` als zentrale Commit-Hook-Schnittstelle.
- Regenwasser nutzt diese Commit-Hook-Schnittstelle für Lookup-Hydration statt eines direkten `tc:commit`-Listeners.
- Pufferspeicher nutzt `bindSavedRecordWorkflow()` statt eigener Save-/Update-/Select-/Delete-/Accordion-Handler.
- Druckhaltung nutzt `bindSavedRecordWorkflow()` statt eigener Save-/Update-/Select-/Delete-/Accordion-Handler.
- Plattform-Audit erkennt `savedRecordController` als zentrale Saved-Record-Nutzung.
- Regressionstest `event-pipeline-phase16e` ergänzt.

## Ergebnis

Der direkte Modul-Event-Score wurde weiter reduziert. Verbleibende Event-Altlasten liegen noch in legacy-lastigen Modulen wie Trinkwasser, WRG/Mischluft, h,x und Schmutzwasser und werden in den nächsten Entkernungsphasen entfernt.
