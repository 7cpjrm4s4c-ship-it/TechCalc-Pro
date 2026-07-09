# Phase 45A – Analyse Modulsplitting WRG/Mischluft

## Status

- Version: `1.3.3-dev.1`
- Basis: `1.3.2-rc.1`
- Phase: Analyse
- Implementierungsstatus: keine funktionalen Änderungen
- Zielversion: `1.3.3` – Modulsplitting

## Arbeitsstandard ab Version 1.3.3

Alle weiteren Phasen folgen verbindlich diesem Ablauf:

1. Analyse – bestehende Dokumentation, Architekturverträge, Modulgrenzen und Referenzen prüfen.
2. Design Review – Zielbild, Datenmodell, Modulverträge und Referenzverhalten festlegen.
3. Implementierung – kleine, nachvollziehbare Änderungen mit klarer Rückbaubarkeit.
4. Regression – gezielte Tests gegen Referenzmodule, bestehende Projekte und Plattformgates.
5. Dokumentation – Contracts, ADRs, Phasendokumente und Release Notes aktualisieren.

## Analysegegenstand

Das bestehende Modul `js/modules/heat-recovery` vereint aktuell zwei fachlich eigenständige Berechnungsbereiche:

- Wärmerückgewinnung / WRG
- Mischluft

Das Modul ist in der Navigation als `WRG / Mischluft` geführt und nutzt intern den Modus `mode: 'wrg' | 'mixing'`.

## Aktuelle Modulstruktur

Das Modul besteht aus folgenden Kernbestandteilen:

- `config.js` – Modulidentität `heat-recovery`, Titel, Gruppe, Accent und Capabilities.
- `state.js` – gemeinsamer State für WRG- und Mischluft-Eingaben.
- `schema.js` – gemeinsames Schema mit Segmentfeld `mode` und getrennten Feldgruppen.
- `logic.js` – gemeinsame Berechnungsdatei mit `calculateWrg`, `calculateMixing` und Dispatcher `calculate`.
- `viewModel.js` – gemeinsames ViewModel mit `wrgInputGroups` und `mixingInputGroups`.
- `view.js` – gemeinsame Oberfläche mit Moduskarte, Eingabe- und Ausgabebereichen.
- `dynamicRenderer.js` – gemeinsame dynamische Inseln und Live-Update-Felder.
- `results.js` – gemeinsame Ergebnis-, Summary- und gespeicherte-Datensatz-Struktur.
- `controller.js` – gemeinsame Actions, Vorzeichenumschaltung und gespeicherte RLT-Geräte.
- `index.js` – Plattformmodul-Adapter.

## Import- und Registrierungsgraph

Der zentrale Einstieg liegt in `js/core/app.js`:

- Import von `../modules/heat-recovery/config.js`
- Lazy-Modulpfad `../modules/heat-recovery/index.js`

Die Persistenz nutzt `js/core/projectStorage.js`:

- Import von `../modules/heat-recovery/state.js`
- Import von `rltDeviceController` aus `../modules/heat-recovery/controller.js`
- Speicherung unter `modules['heat-recovery']`
- Normalisierung bestehender Projektdateien über `normalizeHeatRecoveryProjectModule`

Damit ist der kritischste Bereich für ein Splitting nicht die reine UI, sondern die Rückwärtskompatibilität bestehender `.tcproj`-Dateien.

## Fachlicher Trennschnitt

### Zielmodul 1: Wärmerückgewinnung

Geplanter Modulschlüssel: `heat-recovery` oder optional neuer Alias `wrg` nach Design Review.

Fachlicher Umfang:

- Außenluft / Abluft / Zuluft / Fortluft
- WRG-Wirkungsgrad
- Bypass-Anteil
- sensible Luftzustände
- WRG-Leistung
- bestehende RLT-Geräte-Speicherung, sofern fachlich WRG-bezogen

### Zielmodul 2: Mischluft

Geplanter Modulschlüssel: `mixed-air`.

Fachlicher Umfang:

- Außenluftstrom
- Umluftstrom
- Mischtemperatur
- Mischfeuchte
- Mischungsverhältnis
- Kondensationsprüfung
- Mischluft-Zuluftzustand

## Gemeinsame Bestandteile

Folgende Bestandteile sollten nicht dupliziert werden, sondern in Shared Utilities verbleiben oder aus dem bestehenden Modul extrahiert werden:

- psychrometrische Hilfsfunktionen wie Sättigungsdampfdruck, Feuchtegehalt und Luftpunktmodell
- Formatierungs-/Summary-Helfer, sofern sie nicht modulspezifisch sind
- gemeinsame UI-Bausteine für Luftzustandskarten
- ggf. gespeicherte-RLT-Datensatzstruktur, falls WRG und Mischluft diese weiterhin gemeinsam verwenden sollen

## Risikobewertung

| Bereich | Risiko | Bewertung | Maßnahme |
|---|---:|---|---|
| Berechnungslogik | Mittel | WRG und Mischluft liegen in einer Datei, teilen Luftzustands-Helfer und Dispatcher. | Erst Shared-Extraktion definieren, dann Module trennen. |
| Persistenz / Migration | Hoch | Bestehende Projekte speichern Daten unter `modules['heat-recovery']`. | Migrationsvertrag für Altprojekte zwingend in 45B festlegen. |
| PDF / Export | Mittel | Ergebnis- und Summary-Strukturen sind gekoppelt. | PDF-Contract für beide Zielmodule separat prüfen. |
| Saved Records | Mittel | RLT-Geräte liegen aktuell am Kombimodul. | Fachliche Zuordnung WRG/Mischluft vor Implementierung entscheiden. |
| Navigation / UI | Niedrig bis Mittel | Neues Modul muss in Navigation, Responsive Layout und PWA sauber erscheinen. | Modulreihenfolge und Sichtbarkeit im Design Review festlegen. |
| Tests | Mittel | Bestehende Tests erwarten ggf. `heat-recovery`. | Referenztests für Alt- und Zielverhalten definieren. |

## Aufwandseinschätzung

- Analyse und Design Review: 1–2 Tage
- Shared-Extraktion und Modulaufbau: 1–2 Tage
- Projektmigration und Import-/Export-Kompatibilität: 1 Tag
- PDF-/Saved-Records-/UI-Anpassung: 1–2 Tage
- Regression über Zielplattformen: 1 Tag

Gesamtkorridor: 4–7 Personentage.

## Entscheidung für Phase 45A

Das Modulsplitting ist fachlich sinnvoll und technisch machbar, darf aber nicht als reines Verschieben von Dateien umgesetzt werden. Die nächste Phase muss zuerst den Zielvertrag festlegen:

- finale Modul-IDs
- Shared-Library-Schnitt
- Projektmigrationsstrategie
- PDF-/Export-Verhalten
- Saved-Records-Zuordnung
- Regressionreferenzen

## Nächste Phase

Phase 45B – Design Review.

Nicht freigegeben für 45B ohne explizite Entscheidung:

- Änderung der Persistenzstruktur
- Änderung der Navigation
- Änderung bestehender Berechnungsformeln
- Entfernung des bisherigen `heat-recovery`-Projektpfades ohne Migration
