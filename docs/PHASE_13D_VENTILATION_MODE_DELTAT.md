# Phase 13D – Lüftung Temperaturdifferenz nach Betriebsart

Lüftung leitet die Temperaturdifferenz jetzt strikt aus den aktiven Temperaturwerten der aktuellen Betriebsart ab.

- Heizung: ΔT = Zulufttemperatur − Raumtemperatur
- Kälte: ΔT = Raumtemperatur − Zulufttemperatur
- Heizung und Kälte nutzen getrennte Temperaturfelder im Store.
- ΔT bleibt schreibgeschützt und wird nicht aus gespeicherten Datensätzen als editierbarer Wert hydratisiert.

Damit bleibt die Temperaturdifferenz fachlich konsistent und kann nicht von den Lufttemperaturen abweichen.
