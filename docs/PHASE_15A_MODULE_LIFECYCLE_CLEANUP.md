# Phase 15A – Module Lifecycle Cleanup

Ziel der Phase ist die Stabilisierung der zentralen App-Logik, bevor weitere Module fachlich bereinigt werden.

## Grundsatz

Alle Modulwechsel laufen über genau einen globalen Renderpfad. Module dürfen Navigation, Router, Root-Render, Event-Bindings oder globale UI-Zustände nicht eigenständig steuern.

## Umgesetzt

- Der Modul-Root wird nur noch über eine zentrale Render-Queue beschrieben.
- Mehrfach ausgelöste Navigationen durch `click`, `hashchange`, `popstate` oder Projekt-Reload werden serialisiert.
- Vor jedem neuen Mount wird das aktuelle Modul vollständig über den zentralen Cleanup-Pfad abgemeldet.
- Veraltete Event-Pipeline- und Pointer-Zustände am App-Root werden vor dem nächsten Mount gelöscht.
- Navigation wird erst nach erfolgreichem Content-Mount aktualisiert.

## Behebtes Fehlerbild

Vorher konnte die App in folgenden Zustand laufen:

```txt
Nav Item aktiv markiert
App Root zeigt „Modul wird geladen...“
Mount des Zielmoduls abgeschlossen: nein
```

Das trat besonders nach Wechseln von stark globalisierten Modulen wie Heizung/Kälte oder Lüftung zu anderen Modulen auf.

## Zielarchitektur Phase 15

Nach Phase 15 sollen Module nur noch liefern:

```txt
Schema
Initial State
Lookup-Daten
Berechnung
Ergebnisdefinition
```

Zentralisiert bleiben:

```txt
Router
Navigation
Renderer
Event Pipeline
Saved Records
Accordion State
Scroll/Focus Handling
Number/Locale Handling
UI/CSS Klassen
```
