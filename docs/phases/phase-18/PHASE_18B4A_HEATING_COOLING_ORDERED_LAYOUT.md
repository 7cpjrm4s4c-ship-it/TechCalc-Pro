# Phase 18B.4A – Heizung/Kälte Ordered Card Layout

Ziel dieser Phase ist die Wiederherstellung der fachlich festgelegten Heizung/Kälte UI-Reihenfolge nach der Plattform-Mount-Migration.

Die Plattform darf die Cards nicht generisch als `System`, `Heizung`, `Kälte`, `Saved Records` sortieren. Heizung/Kälte folgt weiterhin der bewährten fachlichen Reihenfolge:

1. Medium
2. Betriebsart
3. aktive Eingaben Heizung/Kälte
4. Ergebnis
5. Rohrdimensionsempfehlung
6. Leitungsabschnitte

Die Modulnavigation bleibt außerhalb der Cards. Der Inhalt scrollt hinter der globalen Navigation und die Navigation ist kein Bestandteil des Modul-Layouts.

Umgesetzt:

- Heizung/Kälte Schema auf Ordered-Layout vorbereitet.
- Generische Fallback-Gruppen `System`, gleichzeitige `Heizung`/`Kälte` Darstellung entfernt.
- Aktive Eingabegruppe wird über `visibleWhen` gesteuert.
- `layout.order` ergänzt, damit die fachliche Reihenfolge als Plattform-Vertrag dokumentiert ist.
- Custom-View/DynamicRenderer aus 18B.4 bleibt erhalten und rendert weiterhin die originale UI-Struktur.
