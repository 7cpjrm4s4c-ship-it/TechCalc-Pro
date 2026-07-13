# Contract Überflutungs- und Rückhaltenachweis

Status: verbindlich für Version 1.4.0 ab Phase 47B.1  
Modul-ID: `flooding-verification`  
Anzeigename: Überflutungsnachweis

## Zweck und Geltungsbereich

Das Modul erstellt einen nachvollziehbaren Überflutungs- und Rückhaltenachweis für Grundstücksentwässerungen. Es umfasst:

- Überflutungsnachweis nach den bereitgestellten Vorgaben der DIN 1986-100, Gleichungen (20) und (21),
- Prüfung beziehungsweise Dimensionierung einer Regenwasserleitung anhand Tabelle A.5 der DIN 1986-100,
- manuell vorgegebenen Vollfüllungsabfluss,
- behördlich vorgegebene maximale Einleitungsmenge,
- zusätzliches Rückhaltevolumen nach dem einfachen Verfahren des DWA-A 117 bei Einleitungsbegrenzung,
- detaillierten, prüffähigen PDF-Nachweis für Entwässerungsgesuche.

Die automatische Regendauer wird ausschließlich nach der in den bereitgestellten DIN-Unterlagen wiedergegebenen Zuordnung unter Bezug auf DWA-A 118 bestimmt. Ohne die aktuelle vollständige Fassung des DWA-A 118 wird keine darüber hinausgehende Konformitätsaussage abgegeben. Das Modul ersetzt nicht die fachliche Prüfung und Verantwortung des Anwenders.

## Verbindliche Modulgrenzen

1. Das Modul ist ein eigenständiges Fachmodul mit der stabilen ID `flooding-verification`.
2. Der kanonische Modulstate ist unabhängig vom State anderer Module.
3. Flächen dürfen nur auf ausdrückliche Nutzeraktion aus `rainwater` als validierter Snapshot übernommen werden.
4. Übernommene Daten werden als Deep Copy mit neuen lokalen IDs gespeichert. Es gibt keine Live-Synchronisierung und keine Rückschreibung.
5. Gemeinsame KOSTRA-Link-, Zahlen-, Flächenkatalog- und Transferlogik wird über Shared-/Utility-Schnittstellen bereitgestellt und nicht dupliziert.
6. Save, Load, Selection, Keyboard, Theme, Render, PDF und Projektimport folgen den zentralen Plattform-Contracts.
7. Die Fachlogik bleibt deterministisch und frei von DOM-, Navigation- und Persistenzabhängigkeiten.
8. UI, PDF und gespeicherte Ergebnisse werden aus demselben Calculation Report Model erzeugt.

## UI-Vertrag

### Fachbereiche

Das Modul gliedert sich in:

1. Flächen
2. Regenspenden
3. Gelände und Regendauer
4. Leitungs- und Abflussnachweis
5. Überflutungsnachweis
6. Rückhalteraum bei Einleitungsbegrenzung
7. Ergebnisse und PDF

### Card `Flächen`

Das Modul verwendet genau eine fachliche Card `Flächen`. Innerhalb dieser Card gibt es zwei Sammlungen:

- Dachflächen
- Grundstücksflächen außerhalb von Gebäuden

Für einzelne Teilflächen werden keine zusätzlichen Cards erzeugt. Jede Sammlung unterstützt Hinzufügen, Bearbeiten und Entfernen mehrerer Einträge.

Am Anfang der Card stehen zwei explizite Aktionen:

- `Flächen aus Regenwasser übernehmen`
- `Fläche manuell hinzufügen`

Ein Hinweis erklärt, dass importierte Flächen unabhängige Kopien sind und Änderungen nicht an das Regenwassermodul zurückgegeben werden.

### Teilflächeneintrag

Jeder Eintrag enthält mindestens:

- stabile lokale ID,
- optionale Quell-ID und Importmetadaten,
- Gruppe `roof` oder `property`,
- frei vergebbare Bezeichnung,
- Flächenart,
- Fläche `A` in m²,
- Spitzenabflussbeiwert `Cs`,
- mittleren Abflussbeiwert `Cm`, sofern für DWA-A 117 erforderlich,
- Herkunft der Beiwerte `preset`, `manual` oder `imported`,
- Kennzeichnung, ob der Datensatz nach dem Import geändert wurde,
- fachliche Klassifikation für befestigte beziehungsweise nicht schadlos überflutbare Flächen.

Eine manuelle Änderung vorbelegter oder importierter Werte ist zulässig und muss in State, Ergebnisdarstellung und PDF erkennbar bleiben.

### Import aus Regenwasser

Der Import erfolgt ausschließlich durch den Nutzerbutton. Der Transferadapter übernimmt mindestens:

- Bezeichnung,
- Flächenart,
- Fläche `A`,
- Spitzenabflussbeiwert `Cs`,
- vorhandene stabile Quell-ID, soweit verfügbar.

Der Adapter normalisiert Quellwerte in das Transfermodell des Überflutungsnachweises. Direkter Zugriff auf UI-Objekte oder mutable State-Referenzen des Regenwassermoduls ist unzulässig.

Bei erneutem Abruf muss der Nutzer wählen können:

- vorhandene lokale Flächen vollständig ersetzen,
- nur neue Quellflächen ergänzen,
- einzelne bereits importierte Flächen erneut übernehmen,
- Vorgang abbrechen.

Lokale Änderungen dürfen niemals stillschweigend überschrieben werden. Duplikate werden über Quell-ID und Herkunftsmetadaten erkannt.

### Regenspenden

Die Eingabe folgt dem Bedienmuster des Regenwassermoduls und verwendet den zentral hinterlegten KOSTRA-/OpenKo-Link. Erforderlich sind mindestens:

- `r(D,2)` für die maßgebende Dauer der Gleichung (20),
- `r(D,30)` für die maßgebende Dauer der Gleichung (20),
- `r(5,30)`, `r(10,30)` und `r(15,30)` für Gleichung (21),
- für DWA-A 117 alle vom Anwender geprüften Dauerstufen der gewählten Wiederkehrzeit,
- optional `r(5,100)` für den Warn- und Prüfhinweis zur Notentwässerung.

Externe Links sichern vor Navigation den aktuellen Session-/Projektzustand über den zentralen Plattformpfad.

### Gelände und Regendauer

Der Anwender gibt die mittlere Geländeneigung ein. Der befestigte Flächenanteil wird aus der Flächenklassifikation abgeleitet. Die maßgebende Regendauer wird automatisch nach der in DIN 1986-100 wiedergegebenen Zuordnung ermittelt:

- Geländeneigung unter 1 %, befestigter Anteil bis 50 %: 15 min,
- Geländeneigung unter 1 %, befestigter Anteil über 50 %: 10 min,
- Geländeneigung 1 % bis 4 %: 10 min,
- Geländeneigung über 4 %, befestigter Anteil bis 50 %: 10 min,
- Geländeneigung über 4 %, befestigter Anteil über 50 %: 5 min.

Eine manuelle Abweichung ist zulässig, erfordert aber eine Begründung und muss im PDF den automatisch ermittelten und den tatsächlich verwendeten Wert ausweisen.

### Leitungs- und Abflussnachweis

Es gibt vier Betriebsarten:

1. `table-existing-pipe`: vorhandene Leitung anhand Tabelle A.5 prüfen,
2. `table-size-pipe`: kleinste geeignete Nennweite anhand Tabelle A.5 dimensionieren,
3. `manual-full-flow`: extern ermittelten Vollfüllungsabfluss manuell vorgeben,
4. `authority-discharge-limit`: behördlich vorgegebene maximale Einleitungsmenge verwenden.

Für Tabellenmodi werden DN, Gefälle, Tabellenwert `Qvoll`, Fließgeschwindigkeit und Tabellenfundstelle dokumentiert. Nicht tabellierte Gefälle dürfen nicht stillschweigend behandelt werden. Interpolation oder konservative Auswahl ist nur nach einer im Contract dokumentierten Regel und mit sichtbarer Kennzeichnung zulässig.

Eine behördliche Einleitungsbegrenzung darf nicht als hydraulischer Vollfüllungsabfluss bezeichnet werden. Quelle, Aktenzeichen, Datum und Freitextbegründung müssen speicherbar sein.

## State- und Datenmodell

Der Modulzustand ist vollständig serialisierbar. Die kanonische Struktur lautet konzeptionell:

```js
{
  schemaVersion: 2,
  rain: {
    r2ByDuration: { 5: '', 10: '', 15: '' },
    r30ByDuration: { 5: '', 10: '', 15: '' },
    r100Duration5: '',
    retentionByDuration: {},
    source: {
      dataset: '',
      rasterOrLocation: '',
      dataVersion: '',
      entryMode: 'manual'
    }
  },
  site: {
    meanSlopePercent: '',
    governingDurationMinutes: 10,
    automaticDurationMinutes: 10,
    durationSource: 'automatic',
    manualDurationReason: ''
  },
  discharge: {
    mode: 'table-existing-pipe',
    pipe: {
      nominalDiameterDn: '',
      slopePermille: '',
      qFullLs: '',
      velocityMs: '',
      tableReference: 'DIN 1986-100 Tabelle A.5',
      lookupMode: 'exact'
    },
    manualFullFlow: {
      qFullLs: '',
      sourceNote: ''
    },
    authorityLimit: {
      qLimitLs: '',
      authority: '',
      reference: '',
      date: '',
      sourceNote: ''
    }
  },
  retention: {
    enabled: false,
    simpleProcedure: {
      recurrenceFrequencyPerYear: '',
      flowTimeMinutes: '',
      riskClass: 'medium',
      surchargeFactorFz: '',
      reductionFactorFa: '',
      dryWeatherFlowLs: 0,
      upstreamThrottleFlowLs: 0,
      durationResults: []
    }
  },
  surfaces: [
    {
      id: '',
      sourceId: null,
      sourceModule: null,
      sourceImportedAt: null,
      origin: 'manual',
      modifiedAfterImport: false,
      group: 'roof',
      name: '',
      surfaceType: '',
      areaM2: '',
      runoffCoefficientCs: '',
      meanRunoffCoefficientCm: '',
      coefficientSource: 'preset',
      isSealed: true,
      isNotSafelyFloodable: true
    }
  ],
  activeSurfaceId: null,
  expandedSurfaceResultId: null
}
```

Abgeleitete Summen und Ergebnisse werden nicht als konkurrierende zweite Wahrheit dauerhaft gespeichert. Ein optional gespeicherter Calculation Report muss durch Eingabe-Hash, Schema- und App-Version eindeutig als reproduzierbarer Snapshot gekennzeichnet sein.

## Berechnungsvertrag

### Aggregationen

- `ADach`: Summe aller Dachflächen,
- `AFaG`: Summe aller Grundstücksflächen außerhalb von Gebäuden,
- `Ages`: `ADach + AFaG`,
- `Aeff2`: Summe `Ai × Cs,i` über alle Teilflächen,
- `Au`: Summe `Ai × Cm,i`, umgerechnet in ha, für das einfache Verfahren nach DWA-A 117,
- befestigter Flächenanteil: Summe aller als befestigt klassifizierten Flächen dividiert durch `Ages`,
- kritischer Flächenanteil: Anteil der Dachflächen und nicht schadlos überflutbaren Flächen.

Klassifikationen liegen im zentralen Flächenkatalog beziehungsweise explizit im Eintrag, niemals in der View.

### Erforderlicher Regenwasserabfluss `Qr`

Für die Leitungsdimensionierung wird der erforderliche Regenwasserabfluss aus den Einzelflächen und `r(D,2)` berechnet:

```text
Qr = r(D,2) × Σ(Ai × Cs,i) / 10000
```

### Tabelle A.5

Tabelle A.5 ist eine zentrale, versionierte Fachdatentabelle und darf nur einmal gepflegt werden. Sie liefert für die hinterlegten Kombinationen aus DN und Gefälle:

- Vollfüllungsabfluss `Qvoll` in l/s,
- Fließgeschwindigkeit `v` in m/s.

Bei Leitungsdimensionierung wird für das gewählte Gefälle die kleinste hinterlegte DN ausgewählt, deren `Qvoll >= Qr` ist. Wird keine passende DN gefunden, muss das Ergebnis als außerhalb des Tabellenumfangs gekennzeichnet werden.

### Gleichung (20)

Für mehrere Teilflächen wird berechnet:

```text
VRück,20 =
(r(D,30) × Ages − r(D,2) × Σ(Ai × Cs,i))
× D × 60 / (10000 × 1000)
```

Der Abflussbeiwert wird nur im Term des zwei- beziehungsweise fünfjährlichen Bemessungsregens berücksichtigt.

### Gleichung (21)

Die Logik berechnet getrennte Ergebnisse für `D = 5`, `10` und `15` Minuten:

```text
VRück,21,D =
(r(D,30) × Ages / 10000 − Qab)
× D × 60 / 1000
```

`Qab` ist abhängig vom gewählten Modus:

- Tabellenmodus oder manueller Vollfüllungsabfluss: dokumentierter `Qvoll`,
- behördliche Einleitungsbegrenzung: dokumentierter maximal zulässiger Abfluss.

Die Herkunft des verwendeten Wertes bleibt Bestandteil des Ergebnisses. Maßgebend ist der größte nichtnegative, endliche Wert der drei Dauerstufen.

### Einfaches Verfahren nach DWA-A 117

Bei Einleitungsbegrenzung wird zusätzlich das einfache Verfahren angeboten. Vor der Berechnung ist die Anwendbarkeit automatisch zu prüfen. Mindestens zu prüfen sind:

- kanalisierte Einzugsgebietsfläche maximal 200 ha oder Fließzeit maximal 15 min,
- Überschreitungshäufigkeit `n >= 0,1/a` beziehungsweise Wiederkehrzeit `Tn <= 10 a`,
- Regenanteil der Drosselabflussspende `qDr,R,u >= 2 l/(s·ha)`,
- Gültigkeitsbereich der empirischen Funktion für `fA`: `0 <= tf <= 30 min`, `2 <= qDr,R,u <= 40 l/(s·ha)` und `0,1 <= n <= 1,0`.

Außerhalb der Grenzen darf kein uneingeschränkt gültiger Nachweis ausgegeben werden. Es ist der Status `Langzeitsimulation erforderlich` beziehungsweise `einfache Berechnung nur zur Vorbemessung` auszugeben.

Für jede Dauerstufe wird berechnet:

```text
Vs,u = (r(D,n) − qDr,R,u) × D × fz × fA × 0,06
V = Vs,u × Au
```

`fz` wird aus dem gewählten Risikomaß abgeleitet. `fA` wird nach der normativen Funktion des Anhangs B berechnet. Maßgebend ist das größte Speichervolumen aller geprüften Dauerstufen.

### Endergebnis

Ohne Einleitungsbegrenzung ist das maßgebende Rückhaltevolumen der größere Wert aus Gleichung (20) und Gleichung (21).

Bei Einleitungsbegrenzung wird zusätzlich das Ergebnis des einfachen Verfahrens nach DWA-A 117 ausgewiesen. Der für die Planung anzusetzende größte Wert wird transparent markiert, ohne die unterschiedlichen Nachweisarten begrifflich zu vermischen.

### Sonderfälle

- Kritischer Flächenanteil über 70 % erzeugt einen Hinweis auf die zusätzliche Prüfung der Notentwässerung für `r(5,100)`.
- Einleitungsbegrenzung erzeugt den Hinweis auf den zusätzlichen Rückhaltenachweis.
- Nicht tabellierte DN-/Gefällekombinationen, manuelle Overrides und Eingaben außerhalb von Gültigkeitsbereichen erzeugen sichtbare Diagnoseflags.

### Numerische Regeln

- interne Berechnung mit voller JavaScript-Präzision ohne frühzeitige Rundung,
- Rundung ausschließlich in ViewModel und PDF,
- negative Volumina werden als `0` dargestellt und mit Diagnoseflag dokumentiert,
- fehlende Pflichtwerte erzeugen keinen stillen Fallback,
- Einheiten sind an allen Schnittstellengrenzen explizit,
- Tabellenwerte werden ohne Zwischenrundung übernommen,
- UI und PDF verwenden identische Rohwerte.

## Calculation Report Model und PDF-Vertrag

Der Berechnungskern erzeugt ein unveränderliches Calculation Report Model. Dieses enthält mindestens:

1. Projekt- und Verfasserdaten,
2. Regelwerks- und Datenstände,
3. Herkunft und Änderungsstatus aller importierten Flächen,
4. vollständige Flächenaufstellung mit `A`, `Cs`, `Cm`, gewichteten Flächen und Summen,
5. Geländeneigung, befestigten Anteil, automatische Regendauer, Override und Begründung,
6. sämtliche verwendeten Regenspenden samt KOSTRA-Quelle,
7. Berechnung `Qr`,
8. Leitungsmodus, DN, Gefälle, Tabellenfundstelle, `Qvoll`, Geschwindigkeit und Auslastung,
9. Quelle und Begründung manueller oder behördlicher Abflusswerte,
10. vollständige Einsetzrechnung der Gleichungen (20) und (21),
11. Gleichung (21) für 5, 10 und 15 Minuten,
12. Anwendungsprüfung und Dauerstufentabelle des DWA-A-117-Verfahrens,
13. `Au`, `qDr,R,u`, `fz`, `fA`, `Vs,u` und Rückhaltevolumen je Dauerstufe,
14. Ergebnisvergleich und maßgebende Werte,
15. Warnungen, Einschränkungen und manuelle Overrides,
16. App-Version, Schema-Version, Berechnungszeitpunkt und reproduzierbaren Eingabe-Hash.

Die PDF-Struktur lautet mindestens:

1. Deckblatt,
2. Zusammenfassung,
3. Grundlagen und Regelwerksstände,
4. Flächenaufstellung,
5. Regendauer und Regenspenden,
6. Leitungs- und Abflussnachweis,
7. Gleichung (20),
8. Gleichung (21),
9. Rückhaltenachweis nach DWA-A 117, sofern aktiviert,
10. Ergebnisvergleich,
11. Hinweise, Einschränkungen und Anlagen.

Die Ausgabe verwendet ausschließlich den zentralen regelbasierten PDF-Renderer. Lange Tabellen werden mehrseitig fortgesetzt; Tabellenköpfe werden wiederholt; Formeln und Ergebnisblöcke dürfen nicht unlesbar getrennt werden. Die Ausgabe muss in A4, in Farbe und Schwarz-Weiß prüfbar bleiben.

## Persistenz und Migration

1. Der Projektstate wird unter `modules['flooding-verification'].state` gespeichert.
2. Neue Saved Records gehören ausschließlich zum Modul `flooding-verification`.
3. Projekte vor Version 1.4.0 erhalten beim Laden einen Initialzustand, ohne bestehende Module zu verändern.
4. Migrationen sind idempotent und über `schemaVersion` versioniert.
5. Das Regenwassermodul wird nicht migriert, umgedeutet oder durch lokale Änderungen beeinflusst.
6. Importmetadaten bleiben mit der lokalen Kopie erhalten, auch wenn die Quellfläche später gelöscht oder geändert wird.

## Accessibility-, Mobile- und PWA-Vertrag

- Collection- und Importaktionen sind vollständig per Tastatur und Touch bedienbar.
- Touch-Ziele und Formularschriftgrößen folgen der iOS-/iPadOS-Baseline.
- Hinzufügen, Importieren, Ersetzen oder Entfernen darf keinen unkontrollierten Zoom, Fokusverlust oder Scrollsprung verursachen.
- Konflikt- und Überschreibdialoge sind zugänglich beschriftet und nicht ausschließlich farbcodiert.
- Offlinebetrieb enthält Modulcode, Transferadapter, Fachdatentabellen und erforderliche Assets im generierten Precache.
- Light, Dark und System verwenden dieselbe DOM-Struktur und zentrale Tokens.

## Nicht Bestandteil von Version 1.4.0

- hydrodynamische Kanalnetzberechnung,
- Niederschlag-Abfluss-Langzeit- oder Seriensimulation,
- vollständige Berechnung nach einer nicht bereitgestellten aktuellen Fassung des DWA-A 118,
- automatischer KOSTRA-Datenabruf ohne Nutzerfreigabe,
- vollständiger Notentwässerungsnachweis; `r(5,100)` wird nur für Prüfhinweis und dokumentierte Vorprüfung verwendet,
- bidirektionale Synchronisierung mit dem Regenwassermodul,
- stiller automatischer Flächenimport beim Öffnen des Moduls.

## Abnahmekriterien

- beliebig viele Dach- und Grundstücksflächen in einer gemeinsamen Card,
- expliziter Snapshot-Import aus Regenwasser sowie vollständig manuelle Erfassung,
- unabhängige Bearbeitung ohne Rückschreibung,
- konfliktfreier erneuter Import ohne stilles Überschreiben,
- deterministische Referenzberechnungen für `Qr`, Tabelle A.5, Gleichung (20), Gleichung (21) und DWA-A 117,
- korrekte Auswahl und eindeutige Benennung der maßgebenden Ergebnisse,
- Prüfung aller fachlichen Gültigkeitsgrenzen,
- Save/Edit/Load, Import/Export und Projektmigration,
- prüffähige mehrseitige PDF-Ausgabe mit vollständigem Rechenweg,
- vollständige Keyboard-, Touch-, Theme-, Browser- und PWA-Regression,
- keine Regression und keine State-Änderung des Regenwassermoduls.
