# Phase 12 – Berechnung ohne Speichern

## Ziel

Berechnung und Speicherung sind fachlich getrennte Aktionen.

- Eingaben werden während der Bearbeitung in den Modul-State übernommen.
- Eine Berechnung wird nach bestätigter Eingabe ausgelöst.
- Bestätigung erfolgt zentral über `Enter`, `change/blur` oder Touch/Klick auf eine freie Fläche der App.
- Speichern ist optional und dient nur dazu, einen Datensatz später wieder auszuwählen oder zu aktualisieren.

## Zentrale Änderung

`bindCommonInputs` unterscheidet jetzt zwischen:

1. **unrendered input**: Werte sind im State, aber die Ergebnisansicht wurde noch nicht neu gerendert.
2. **confirmed input**: Nutzer bestätigt per Enter oder Tap/Klick außerhalb des Feldes; danach wird gerendert.

Dadurch bleibt die mobile Tastatur während der Eingabe stabil, aber die Berechnung hängt nicht mehr an der Speichern-Aktion.

## Modulspezifische Korrekturen

### Regenwasser

Wenn noch keine Fläche gespeichert wurde, rechnet das Modul mit einer transienten Fläche aus der aktuellen Eingabe (`__current_input__`). Die Fläche muss nicht mehr über `Speichern` oder `Hinzufügen` persistiert werden, um ein Ergebnis zu erhalten.

### Trinkwasser

Aktuelle Nutzungseinheiten und Einzelverbraucher werden als temporäre Berechnungsgrundlage berücksichtigt. Gespeicherte Einträge bleiben weiterhin für Wiederverwendung und Bearbeitung verfügbar, sind aber keine Voraussetzung für die Berechnung.

## Quality Gate

Neuer Test:

```bash
npm run test:input-confirmation
```

Der zentrale Quality-Gate-Lauf (`npm test`) prüft jetzt zusätzlich, dass Enter-/Touch-Bestätigung und optionale Speicherung strukturell abgesichert sind.
