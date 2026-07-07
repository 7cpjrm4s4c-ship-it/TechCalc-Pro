# Selection Contract

Status: verbindlich ab Phase 42D

## Ziel

Gespeicherte Eintraege werden ueber einen zentralen Selection-Vertrag geladen, markiert und bearbeitbar gemacht.

## Regeln

1. Auswahl eines gespeicherten Eintrags setzt die zentrale Selection-ID.
2. Die Inputs werden aus dem gewaehlten Datensatz hydratisiert.
3. Die Saved-Card wird zentral als ausgewaehlt markiert.
4. Der Save/Edit-Zustand wird aus der Selection abgeleitet.
5. Auswahl darf keine lokalen Scroll-Restore-Ketten oder Fokuszwang ausloesen.
6. Loeschen eines Eintrags hebt die Selection kontrolliert auf.

## DOM-Vertrag

Saved-Cards muessen ueber zentrale Attribute/Klassen ansprechbar bleiben. Module duerfen keine eigenen Selection-Klassen als Ersatzvertrag einfuehren.
