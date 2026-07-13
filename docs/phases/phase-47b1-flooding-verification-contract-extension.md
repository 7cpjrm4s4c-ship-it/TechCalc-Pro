# Phase 47B.1 – Contract Extension Überflutungsnachweis

Version: 1.4.0-dev.2  
Status: abgeschlossen  
Datum: 2026-07-13

## Ziel

Vor Beginn der Implementierungsphase 47C wurde der Contract des Moduls auf die nachgereichten fachlichen Grundlagen und die verbindlichen Anforderungen an den Behördenexport angepasst.

## Geprüfte Grundlagen

- bereitgestelltes Merkblatt zum Überflutungsnachweis,
- bereitgestellte Auszüge der DIN 1986-100 mit Gleichungen (20), (21) und Tabelle A.5,
- DWA-A 117, Ausgabe Dezember 2013,
- bestehende Modul-, State-, Save-, Render-, Keyboard-, Theme-, PDF- und Projektverträge,
- bestehende Architektur des Regenwassermoduls als Datenquelle für einen Snapshot-Import.

## Contract-Änderungen

### Fachlicher Scope

Der Vertrag umfasst nun:

- Überflutungsnachweis nach Gleichungen (20) und (21),
- Leitungsprüfung und Leitungsdimensionierung anhand Tabelle A.5,
- manuellen Vollfüllungsabfluss,
- behördliche Einleitungsbegrenzung,
- einfaches Verfahren nach DWA-A 117,
- detaillierten, prüffähigen Behörden-PDF-Nachweis.

### Flächenimport

Der Nutzer kann Flächen aus dem Regenwassermodul explizit abrufen oder vollständig manuell erfassen. Der Import ist ein validierter Deep-Copy-Snapshot. Übernommene Flächen sind lokal bearbeitbar; Änderungen werden weder automatisch synchronisiert noch zurückgeschrieben.

Erneute Importe besitzen eine explizite Konfliktstrategie für Ersetzen, Ergänzen und selektive Aktualisierung. Stilles Überschreiben ist ausgeschlossen.

### Fachdatentabelle und Abflussmodi

Tabelle A.5 wird als zentrale Fachdatentabelle vorgesehen. Abflusswerte werden nach ihrer tatsächlichen Herkunft getrennt gespeichert und dokumentiert. Die behördliche Einleitungsbegrenzung wird nicht als `Qvoll` bezeichnet.

### DWA-A 117

Das einfache Verfahren wird einschließlich `Au`, `qDr,R,u`, `fz`, `fA`, Dauerstufenvergleich und maßgebendem Volumen in den Scope aufgenommen. Der Contract enthält verbindliche Gültigkeitsprüfungen und den Status `Langzeitsimulation erforderlich` bei Überschreitung.

### DWA-A 118

Da keine aktuelle vollständige Fassung vorliegt, wird ausschließlich die in DIN 1986-100 wiedergegebene Regendauerzuordnung umgesetzt und entsprechend bezeichnet. Eine weitergehende Konformitätsaussage ist ausgeschlossen.

### PDF

Der Export ist ein eigenes Abnahmekriterium. UI und PDF basieren auf demselben Calculation Report Model. Der PDF-Vertrag verlangt einen vollständigen Rechenweg, Datenherkunft, Tabellenfundstellen, manuelle Overrides, Anwendungsprüfungen und alle maßgebenden Ergebnisse.

## Architekturprüfung

Die Erweiterungen sind mit der bestehenden Modularchitektur vereinbar, sofern Phase 47C folgende Reihenfolge einhält:

1. Transfermodell und Snapshot-Adapter,
2. zentrale Fachdatentabellen,
3. reine Berechnungslogik und Referenztests,
4. Calculation Report Model,
5. State, Schema und UI,
6. Persistenz und Migration,
7. PDF,
8. vollständige Regression.

Direkte Laufzeitabhängigkeiten zwischen den UI-Komponenten der Module bleiben untersagt.

## Dokumentationsänderungen

- `docs/contracts/flooding-verification-contract.md` vollständig überarbeitet,
- `docs/adr/ADR-0008-phase47b1-flooding-verification-contract-extension.md` ergänzt,
- diese Phasendokumentation ergänzt,
- Dokumentationsindex, Release Notes und Entwicklungshinweise aktualisiert.

## Implementierungsfreigabe

Phase 47C ist nur gegen den Contract-Stand aus Phase 47B.1 freigegeben. Fachliche Abkürzungen, stiller Datenaustausch, parallele PDF-Berechnungen und unmarkierte Werte außerhalb der Regelwerksgrenzen sind nicht zulässig.
