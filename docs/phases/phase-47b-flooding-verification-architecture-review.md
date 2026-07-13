# Phase 47B – Architecture Review Überflutungsnachweis

Version: 1.4.0-dev.1  
Status: abgeschlossen  
Datum: 2026-07-11

## Ausgangslage

Phase 47A definierte die fachlichen Eckpunkte: mehrere Dach- und Grundstücksflächen, gemeinsame Flächen-Card, Regenspenden analog zum Regenwassermodul sowie Berechnung nach Gleichung 20 und 21 des bereitgestellten Merkblatts.

## Architekturprüfung

### Geeignete Plattformbasis

Die vorhandene Modularchitektur aus `config`, `schema`, `state`, `logic`, `viewModel`, `view`, `results`, `controller` und `index` ist geeignet. Die zentrale Modulregistrierung, Saved-Record-Infrastruktur, Projektpersistenz, PDF-Engine, Event-Pipeline und Theme-Tokens werden unverändert genutzt.

### Referenzmodule

- `rainwater`: KOSTRA-Link, Flächenarten und Sanitär-Modulkontext
- `drinking-water`: mobile Eingabe und Keyboard-Vertrag
- `heating-cooling` / `pressure-holding`: Save/Edit/Selection
- Module mit tabellarischer PDF-Ausgabe: mehrseitige Ergebnislisten

Das Regenwassermodul ist Referenz, aber keine Laufzeitabhängigkeit.

## Beschlossene Dateistruktur

```text
js/modules/flooding-verification/
  config.js
  schema.js
  state.js
  logic.js
  viewModel.js
  view.js
  results.js
  controller.js
  index.js
  tables.js
```

Wiederverwendbare Flächenstammdaten und der KOSTRA-Link werden vor der Implementierung auf Eignung für eine Shared-Schicht geprüft. Eine reine Kopie aus `rainwater/tables.js` ist untersagt.

## Beschlossenes Datenmodell

- `surfaces[]` ist die Single Source of Truth für alle Teilflächen.
- `group` trennt Dach und Grundstück.
- `surfaceType` verweist auf stabile Katalog-IDs.
- `runoffCoefficientCs` wird pro Eintrag gespeichert, damit manuelle Abweichungen reproduzierbar bleiben.
- `coefficientSource` kennzeichnet Vorbelegung oder manuelle Änderung.
- Ergebniswerte sind abgeleitet.
- `schemaVersion` steuert spätere Migrationen.

## Berechnungsschnittstelle

`calculate(state)` liefert eine strukturierte, UI-unabhängige Antwort mit:

- normalisierten Eingaben,
- Aggregationen,
- Ergebnis Gleichung 20,
- Ergebnissen Gleichung 21 je Regendauer,
- maßgebendem Ergebnis,
- Diagnose- und Warnflags.

Fehlende Pflichtwerte führen zu expliziten Validierungsfehlern. Rundung findet außerhalb der Fachlogik statt.

## UI- und Interaktionsarchitektur

- Eine Card `Flächen` mit zwei Collection-Sektionen.
- Inline-Editor oder zentraler Collection-Editor innerhalb derselben Card; keine modalen Sonderpfade ohne Plattformvertrag.
- Collection-Inputs nehmen am zentralen Focus-Graph teil.
- Löschen benötigt eine zugängliche Beschriftung und darf Fokus/Scroll nicht destabilisieren.
- Regenspenden bilden eine eigene Card und verwenden den zentral gesicherten externen Link.

## Projektformat

Der Export wird additiv erweitert:

```text
modules.flooding-verification.state
```

Alte Projekte bleiben gültig. Beim Import fehlt der neue Schlüssel zulässigerweise und wird mit dem Initialzustand ergänzt. Es gibt keine Migration aus `modules.rainwater`.

## PDF-Architektur

Die PDF-Ausgabe besteht aus:

1. Berechnungsgrundlagen,
2. Tabelle der Teilflächen,
3. Regenspenden und Regendauer,
4. Ergebnis Gleichung 20,
5. Ergebnis Gleichung 21 für 5/10/15 Minuten,
6. maßgebendem Rückhaltevolumen,
7. Warn- und Prüfhinweisen.

Die Flächentabelle muss über zentrale Tabellenfortsetzung mehrseitig funktionieren.

## Risiken und Kontrollen

| Risiko | Kontrolle |
|---|---|
| falsche Aggregation heterogener Flächen | Einzelflächenmodell und Referenztests |
| Duplikation mit Regenwasser | Shared-Prüfung vor Implementierung |
| mobile Card wächst unkontrolliert | gruppierte Collection, kompakte Zeilen, progressive Details |
| Datenverlust bei Import | additive, idempotente Migration |
| frühzeitige Rundung | Rundung nur in ViewModel/PDF |
| Norm-Sonderfälle werden übersehen | explizite Warnflags und dokumentierter Scope |

## Implementierungsfreigabe für Phase 47C

Phase 47C ist freigegeben unter folgenden Bedingungen:

- keine Erweiterung des fachlichen Scopes ohne Contract-Änderung,
- zuerst Shared-/Collection-Fähigkeit prüfen,
- Berechnungslogik vor UI mit Referenztests implementieren,
- Projektmigration und PDF nicht nachgelagert improvisieren,
- Regression des Moduls `rainwater` bleibt Pflicht.
