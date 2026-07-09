# Theme Contract

Status: verbindlich ab Version 1.3.2

## Ziel

Light, Dark und System Theme nutzen dieselben Komponentenvertraege. Modulfarben, Prozessfarben und globale UI-Farben bleiben getrennt.

## Farblogik

### Modulfarben

- Heizung: Orange
- Kälte: Cyan
- Pufferspeicher: Blau
- Druckhaltung: Blau
- WRG/Mischluft: Türkis
- h,x-Diagramm: Türkis
- Rohr: Blau
- Trinkwasser: Grün
- Regenwasser: Grün
- Schmutzwasser: Grün

### Prozessfarben

- Heizleistung: Orange
- Kühl-/Kälteleistung: Cyan
- Lüftung/WRG/h,x: Türkis

### Globale UI-Farben

Globale Controls wie Speichern, Aktualisieren, Dialogbuttons und Standardnavigation erben keine Modulfarbe.

## CSS-Regeln

1. Komponenten nutzen zentrale Tokens.
2. Module definieren keine eigenen Card-, Button-, Accordion-, Radius- oder Shadow-Regeln.
3. Keine neuen CSS-Hotfixdateien ohne dokumentierte Ausnahme.
4. `theme-light-final.css` darf keine Duplikatschicht fuer neue Hotfixes werden.
