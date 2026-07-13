# ADR-0007: Architektur des Moduls Überflutungsnachweis

Status: Angenommen  
Datum: 2026-07-11  
Phase: 47B

## Kontext

Version 1.4.0 erweitert TechCalc Pro um den Überflutungsnachweis. Ein Grundstück kann aus mehreren Dach- und Grundstücksflächen mit unterschiedlichen Flächenarten und Spitzenabflussbeiwerten bestehen. Die Berechnung benötigt zwei normbezogene Berechnungswege, mehrere Regendauern und eine nachvollziehbare PDF-Dokumentation.

## Entscheidung

1. Das Modul wird unter der stabilen ID `flooding-verification` als eigenständiges Schema-Modul registriert.
2. Mehrere Teilflächen werden als kanonische Collection im Modulstate gespeichert.
3. Dach- und Grundstücksflächen erscheinen in einer gemeinsamen Card mit zwei fachlichen Gruppen.
4. Flächensummen und Berechnungsergebnisse werden aus dem State abgeleitet und nicht als konkurrierende Persistenzstruktur geführt.
5. Die reine Fachlogik wird in `logic.js` gekapselt; `viewModel.js` übernimmt Formatierung, Labels, Warnungen und Ergebnispriorisierung.
6. Der bestehende KOSTRA-Link und ein gemeinsamer Flächenkatalog werden über eine Shared-Schicht wiederverwendet. Es gibt keinen direkten State-Zugriff auf `rainwater`.
7. Projektpersistenz erhält einen eigenen Modulschlüssel. Bestehende Projekte werden durch eine additive, idempotente Migration kompatibel gehalten.
8. Die erste Ausbaustufe verwendet `Qvoll` als Eingabe. Hydraulische Rohrdimensionierung und DWA-A-117-Berechnung bleiben außerhalb des Scopes.

## Begründung

Ein Collection-Modell bildet heterogene Grundstücke verlustfrei ab und verhindert fehleranfällige Durchschnittsbeiwerte. Eine gemeinsame Card begrenzt die visuelle Komplexität auf mobilen Geräten. Die Trennung vom Regenwassermodul schützt Modulgrenzen, während Shared-Daten Duplikate vermeiden. Die additive Projektmigration minimiert das Risiko für Bestandsprojekte.

## Konsequenzen

- Das Standard-Schema muss Collection-Felder beziehungsweise einen bestehenden zentralen Collection-Renderer verwenden; keine modulspezifische parallele Formularengine.
- Der Flächenkatalog benötigt eindeutige IDs, Gruppen, Vorbelegungen und die Kennzeichnung `isSealed` für die Regendauerableitung.
- Gleichung 21 erfordert Regenspenden für 5, 10 und 15 Minuten.
- PDF- und Regressionstests müssen lange Flächenlisten abdecken.
- Eine spätere Verknüpfung mit Regenwasser oder Rohrdimensionierung benötigt einen neuen Contract-Review.
