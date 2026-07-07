# Event Contract

Status: verbindlich ab Phase 43C

## Ziel

Interaktionen laufen ueber zentrale Event-Pipeline und dokumentierte Moduladapter. Mehrfach gebundene oder konkurrierende Listener sind zu vermeiden.

## Regeln

1. Globale Eingabe-, Keyboard- und Collection-Aktionen laufen ueber `js/core/eventPipeline.js`.
2. Module duerfen fachliche Aktionen anbinden, aber keine zentralen Plattforminteraktionen duplizieren.
3. `preventDefault()` und `stopPropagation()` sind nur zulaessig, wenn sie den zentralen Vertrag schuetzen und dokumentiert sind.
4. Pointer-/Click-Doppelpfade fuer dieselbe Aktion sind nicht zulaessig.
5. Neue Event-Ausnahmen muessen in einem Contract oder ADR dokumentiert werden.
