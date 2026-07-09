# Render Contract

Status: verbindlich ab Phase 42D

## Ziel

Module aktualisieren nur die UI-Bereiche, die sich fachlich geaendert haben. Vollstaendige Rebuilds von Modulinseln sind zu vermeiden, wenn sie Fokus, Scrollposition oder mobile Taps gefaehrden.

## Regeln

1. Render-Pfade sind differenziell zu bevorzugen.
2. Saved-Aktionen duerfen notwendige Ausgabeinseln aktualisieren, aber keine unnoetigen strukturellen Rebuilds oberhalb des Saved-Bereichs erzeugen.
3. Inputs duerfen beim Field-Commit nicht ersetzt werden, wenn dadurch der naechste Tap/Fokus verloren geht.
4. Diagramm- und Ergebnis-Outlets sind Teil des Render-Vertrags, nicht des Save-Vertrags.
5. Lokale Scroll-/Focus-Nebenwirkungen im Renderpfad sind nicht zulaessig.

## h,x-Sonderfall

Das h,x-Modul besitzt gekoppelte Ausgabeinseln:

- Prozessauswahl
- Ergebnisblock
- Diagramm

Saved-Selection muss diese Outlets synchronisieren. h,x besitzt trotzdem keinen eigenen Save-/Selection-Vertrag.
