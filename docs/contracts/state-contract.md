# State Contract

Status: verbindlich ab Phase 43C

## Ziel

Fachlicher Zustand, Draft-Zustand, gespeicherte Eintraege und UI-Auswahl bleiben getrennt und nachvollziehbar.

## Regeln

1. Inputs schreiben in den zentral vorgesehenen Modulzustand.
2. Draft-Zustand darf aktive Eingabeelemente nicht durch Rebuilds ersetzen.
3. Selection-State wird separat vom fachlichen Eingabezustand gehalten.
4. Persistierte Daten duerfen nicht implizit durch UI-Renderpfade veraendert werden.
5. Migration/Legacy-Import muss Zustand normalisieren, bevor UI gerendert wird.
