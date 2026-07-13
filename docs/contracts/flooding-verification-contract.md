# Contract Überflutungsnachweis

Status: verbindlich für Version 1.4.0 ab Phase 47B  
Modul-ID: `flooding-verification`  
Anzeigename: Überflutungsnachweis

## Zweck und Geltungsbereich

Das Modul ermittelt das erforderliche Rückhaltevolumen für den Überflutungsnachweis auf Grundlage der im Projekt hinterlegten fachlichen Vorgaben und des bereitgestellten Merkblatts zur DIN 1986-100. Der Vertrag definiert Modulgrenzen, Datenmodell, Berechnungsschnittstellen, UI-Struktur, Persistenz, PDF-Ausgabe und Regression. Er ersetzt keine Normprüfung durch den Anwender.

## Verbindliche Modulgrenzen

1. Das Modul ist ein eigenständiges Fachmodul und verwendet die stabile ID `flooding-verification`.
2. Es greift nicht direkt auf den State des Moduls `rainwater` zu.
3. Wiederverwendbare KOSTRA-Link-, Zahlen- oder Flächenkataloglogik wird über Shared-/Utility-Schnittstellen bereitgestellt; sie wird nicht kopiert.
4. Save, Load, Selection, Keyboard, Theme, Render, PDF und Projektimport folgen den zentralen Plattform-Contracts.
5. Die Fachlogik bleibt deterministisch und frei von DOM-, Navigation- und Persistenzabhängigkeiten.

## UI-Vertrag

### Card-Struktur

Das Modul verwendet genau eine fachliche Card `Flächen` für alle Teilflächen. Innerhalb dieser Card gibt es zwei Sammlungen:

- Dachflächen
- Grundstücksflächen außerhalb von Gebäuden

Für einzelne Teilflächen werden keine zusätzlichen Cards erzeugt. Jede Sammlung unterstützt Hinzufügen, Bearbeiten und Entfernen mehrerer Einträge.

### Teilflächeneintrag

Jeder Eintrag enthält mindestens:

- stabile lokale ID,
- Gruppe `roof` oder `property`,
- frei vergebbare Bezeichnung,
- Flächenart,
- Fläche in m²,
- Spitzenabflussbeiwert `Cs`,
- Herkunft des Beiwerts `preset` oder `manual`.

Eine manuelle Änderung des vorbelegten Beiwerts ist zulässig und muss in State, Ergebnisdarstellung und PDF als Benutzerwert erkennbar bleiben.

### Weitere Eingabebereiche

- Regenspenden mit KOSTRA-/OpenKo-Link analog zum Regenwassermodul
- Geländeparameter und maßgebende Regendauer für Gleichung 20
- maximaler Durchfluss `Qvoll` für Gleichung 21
- fachliche Hinweise für Sonderfälle

Externe Links müssen vor Navigation den aktuellen Session-/Projektzustand über den zentralen Plattformpfad sichern.

## State- und Datenmodell

Der Modulzustand ist vollständig serialisierbar. Die kanonische Struktur lautet konzeptionell:

```js
{
  schemaVersion: 1,
  rain: {
    r2ByDuration: { 5: '', 10: '', 15: '' },
    r30ByDuration: { 5: '', 10: '', 15: '' },
    r100Duration5: ''
  },
  site: {
    meanSlopePercent: '',
    governingDurationMinutes: 10,
    durationSource: 'automatic'
  },
  discharge: {
    qFullLs: ''
  },
  surfaces: [
    {
      id: '',
      group: 'roof',
      name: '',
      surfaceType: '',
      areaM2: '',
      runoffCoefficientCs: '',
      coefficientSource: 'preset'
    }
  ],
  activeSurfaceId: null,
  expandedSurfaceResultId: null
}
```

Abgeleitete Summen und Ergebnisse werden nicht als zweite Wahrheit dauerhaft gespeichert, sofern sie jederzeit deterministisch aus dem Eingabestate berechnet werden können.

## Berechnungsvertrag

### Aggregationen

- `ADach`: Summe aller Dachflächen
- `AFaG`: Summe aller Grundstücksflächen außerhalb von Gebäuden
- `Ages`: `ADach + AFaG`
- `Aeff2`: Summe `Ai × Cs,i` über alle Teilflächen
- befestigter Flächenanteil: aus den fachlich als befestigt klassifizierten Teilflächen abzuleiten; die Klassifikation liegt im Flächenkatalog und nicht in der View

### Gleichung 20

Die Logik berechnet das Rückhaltevolumen für die maßgebende Regendauer `D`. Bei mehreren Teilflächen wird die gewichtete Summe `Σ(Ai × Cs,i)` verwendet. Der Abflussbeiwert wird nur im Term des zwei- beziehungsweise fünfjährlichen Bemessungsregens berücksichtigt.

### Gleichung 21

Die Logik berechnet getrennte Ergebnisse für `D = 5`, `10` und `15` Minuten. Maßgebend ist der größte nichtnegative, endliche Wert. `Qvoll` wird als Eingabewert in l/s geführt.

### Endergebnis

Das maßgebende Rückhaltevolumen ist der größere Wert aus Gleichung 20 und dem Maximalwert der Gleichung 21. Die Ergebnisstruktur muss zusätzlich die maßgebende Gleichung und Regendauer ausweisen.

### Numerische Regeln

- interne Berechnung mit JavaScript-Zahlen ohne frühzeitige Rundung,
- Rundung ausschließlich in ViewModel/PDF,
- negative Rückhaltevolumina werden fachlich als `0` ausgegeben und intern mit Diagnoseflag dokumentiert,
- ungültige oder fehlende Pflichtwerte erzeugen keinen stillen Fallback auf fachlich plausible Standardwerte,
- alle Einheiten sind an Schnittstellengrenzen explizit.

## Ergebnis- und PDF-Vertrag

Die Ergebnissicht enthält mindestens:

- Flächensummen und gewichtete Abflussfläche,
- verwendete Regenspenden,
- Gleichung 20,
- Gleichung 21 für 5, 10 und 15 Minuten,
- maßgebendes Ergebnis,
- maßgebende Gleichung und gegebenenfalls Regendauer,
- Hinweise auf manuell überschriebene Beiwerte,
- Warnhinweise zu Sonderfällen.

Die PDF-Ausgabe verwendet ausschließlich den zentralen regelbasierten PDF-Renderer. Lange Flächenlisten müssen tabellarisch über mehrere Seiten fortgesetzt werden können.

## Persistenz und Migration

1. Der Projektstate wird unter `modules['flooding-verification'].state` gespeichert.
2. Neue Saved Records gehören ausschließlich zum Modul `flooding-verification`.
3. Projekte vor Version 1.4.0 enthalten keinen Modulstate; beim Laden wird der Initialzustand ergänzt, ohne bestehende Module zu verändern.
4. Migrationen sind idempotent und über `schemaVersion` versioniert.
5. Das Regenwassermodul wird nicht migriert oder umgedeutet.

## Accessibility-, Mobile- und PWA-Vertrag

- Collection-Aktionen sind vollständig per Tastatur und Touch bedienbar.
- Touch-Ziele und Formularschriftgrößen folgen der bestehenden iOS-/iPadOS-Baseline.
- Hinzufügen oder Entfernen einer Fläche darf keinen unkontrollierten Zoom, Fokusverlust oder Scrollsprung verursachen.
- Offlinebetrieb enthält Modulcode, Flächenkatalog und Dokumentationsassets im generierten Precache.
- Light, Dark und System verwenden dieselbe DOM-Struktur und zentrale Tokens.

## Nicht Bestandteil der ersten Implementierung

- automatische Ermittlung von `Qvoll` aus DN, Gefälle und Füllungsgrad,
- Berechnung nach DWA-A 117 bei Einleitungsbegrenzung,
- vollständiger Notentwässerungsnachweis für `r(5,100)`,
- automatische Übernahme von Daten aus dem Regenwassermodul.

Diese Punkte dürfen nur über einen ergänzten Contract und eine eigene Phase eingeführt werden.

## Abnahmekriterien

- beliebig viele Dach- und Grundstücksflächen in einer gemeinsamen Card,
- deterministische Referenzberechnung für Gleichung 20 und 21,
- korrekte Auswahl des maßgebenden Ergebnisses,
- Save/Edit/Load, Import/Export und Projektmigration,
- mehrseitige PDF-Ausgabe mit Flächenliste,
- vollständige Keyboard-, Touch-, Theme-, Browser- und PWA-Regression,
- keine Regression des Regenwassermoduls.
