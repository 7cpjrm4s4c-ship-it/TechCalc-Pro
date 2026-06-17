# Phase 11C – Store-zentrierte Modulbindung

Ziel dieser Phase ist, den zentralen Store als verbindliche Quelle für Modulzustände zu stärken.

## Regeln

- `data-field` ist die einzige zulässige UI-State-Bindung für Inputs, Selects und Textareas.
- `data-segment` ist die zentrale Bindung für Segment-/Switch-Auswahl.
- `change`, `blur` und `Enter` committen sofort in den Store und lösen einen Render aus.
- Freie Klicks im Modul bestätigen offene Eingaben, sind aber nicht mehr Voraussetzung für Berechnungen.
- Module dürfen fachliche Adapter behalten, aber nicht mehr den zentralen Store umgehen.

## Warum

Die vorherigen Phasen hatten bereits Store und Event-Pipeline eingeführt. In der Praxis liefen aber noch Module mit alten direkten DOM-/Eventpfaden parallel. Phase 11C ergänzt eine store-zentrierte Binding-Schicht, die den Renderpfad robuster macht und Module schrittweise aus dem Hybridzustand führt.
