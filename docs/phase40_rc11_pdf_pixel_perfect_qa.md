# TechCalc Pro 1.3.1 RC.11 – PDF Engine Pixel Perfect QA

## Scope

RC.11 stabilisiert die bestehende PDF Engine. Es wurden keine neuen Fachfunktionen ergänzt.

## Änderungen

- Tabellenabschnitte werden seitenweise segmentiert, wenn die berechnete Tabellenhöhe eine PDF-Seite überschreiten würde.
- Abschnittstitel werden nicht mehr isoliert am Seitenende platziert.
- Leitungsabschnitt-Blöcke erhalten denselben Segmentierungsmechanismus für lange gespeicherte Berechnungen.
- Projekt- und Corporate-Blöcke verwenden dynamische Höhen für lange Projekt-, Firmen- und Freigabetexte.
- Technische Sonderzeichen werden vor der WinAnsi-PDF-Ausgabe robuster normalisiert.
- Neuer RC.11-Regressionsguard prüft PDF-Koordinaten, Rechteckgrenzen, Textgrenzen, Sonderzeichen-Normalisierung und mehrseitige Reports.

## Validierung

- `npm test` bestanden.
- `npm run test:integration` bestanden.
- Service-Worker-Precache ist auf `1.3.1-rc.11.1` synchronisiert.
