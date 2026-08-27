# F-Gases Check Contract

Status: Verbindliche Implementierungsgrundlage für Version 1.5.0  
Datum: 2026-08-27

## Ziel

Das Modul `f-gases-check` unterstützt eine schnelle, praxisnahe regulatorische Bewertung von Kälte-, Klima- und Wärmepumpenanlagen. Es ersetzt kein vollständiges Planungs- oder Rechtsinformationssystem.

## Modulgrenze

Enthalten sind ausschließlich regulatorische Themen des F-Gase-Checks:

- Anlagenart
- Bauform
- Leistungsbereich
- Kältemittel
- GWP
- Füllmenge
- CO2-Äquivalent
- Inverkehrbringungsprüfung
- Serviceprüfung
- Dichtheitskontrolle
- Dokumentationspflicht
- Zertifizierung
- Betreiberpflichten
- Ergebnisbericht
- PDF-Ausgabe
- Snapshot-Speicherung

Nicht enthalten sind EN-378-Berechnungen, zulässige Füllmengen nach EN 378, Raum- oder Aufstellbedingungen, Lüftungsanforderungen, Gaswarnsysteme, Maschinenraumprüfungen oder sonstige sicherheitstechnische Bewertungen.

## Plattformanbindung

1. Das Modul wird über die bestehende zentrale Modulregistrierung eingebunden.
2. Es verwendet die bestehende `createPlatformModule`-Runtime und die vorhandenen State-, Render-, Save-/Load- und PDF-Contracts.
3. Der Modulzustand bleibt serialisierbar und gehört ausschließlich dem Modul.
4. Fachlogik bleibt von der UI getrennt.
5. Es werden keine direkten Zugriffe auf interne Zustände anderer Fachmodule eingeführt.

## Eingabe- und State-Modell

Der fachliche Modulzustand ist ab Schema-Version 3 auf die Regelmatrix `docs/engineering/f-gases-rule-matrix.md` ausgerichtet. Er enthält nur Eingaben, die für mindestens eine der dort dokumentierten Prüfgruppen erforderlich sind.

Zusätzlich zu den bisherigen Eingaben werden `splitType` für die Unterscheidung Luft-Wasser/Luft-Luft nach Anhang IV Nummer 9 und `preChargedStatus` für die Prüfung vorbefüllter Einrichtungen nach Artikel 19 beziehungsweise § 12k ChemG geführt.

Von der Rule-Engine abgeleitete Werte wie GWP, Stoffklassifikation, CO2-Äquivalent, Dichtheitskontrollpflicht und Anhang-IV-Konformität werden nicht als redundante Benutzereingaben gespeichert.

Rechtlich relevante Ja-/Nein-Eigenschaften verwenden einen dreistufigen Zustand (`yes`, `no`, nicht angegeben), damit fehlende Informationen nicht implizit als `false` bewertet werden.

Die State-Version ist unabhängig von den Datenversionen für Kältemittel, GWP und Rechtsdaten. Änderungen am fachlichen State-Contract erhöhen die Schema-Version; Änderungen an Rechts- oder Stoffdaten erhöhen ausschließlich deren jeweilige Datenversion.

## Kältemittelplattform

Die gemeinsame Plattformkomponente liegt unter `js/utils/refrigerants/` und besteht aus:

- `refrigerants.js`: Stammdaten und Referenzen, keine Berechnungen
- `gwp.js`: GWP-Werte einschließlich Quelle, Versionsstand und Aktualisierungsdatum
- `safety-classes.js`: Sicherheitsklassen A1, A2L, A2, A3, B1, B2L, B2 und B3 einschließlich Beschreibung
- `regulations.js`: deklarative regulatorische Regeln ohne Programmablauflogik
- `refrigerant-service.js`: einzige öffentliche Service-API für Fachmodule
- `index.js`: zentraler Einstiegspunkt

Direkte Imports von `refrigerants.js`, `gwp.js`, `safety-classes.js` oder `regulations.js` aus einem Fachmodul sind unzulässig.

Der Stoff HFKW-32 wird mit der gebräuchlichen Kältemittelbezeichnung `R32` beziehungsweise `R-32` als Alias geführt. Es entsteht kein redundanter zweiter Stoffdatensatz; Alias-Auflösung erfolgt ausschließlich über die öffentliche Service-API.

## Regeldaten

Jede regulatorische Regel besitzt mindestens ID, Rechtsquelle, Versionsstand, Gültigkeitsdatum, Kategorien, Bedingungen und Meldungsschlüssel. Regeldefinitionen bleiben datengetrieben. Programmlogik wertet die Regeln aus, erfindet jedoch keine regulatorischen Inhalte.

Die fachliche Regelreferenz für Version 1.5.0 ist in `docs/engineering/f-gases-rule-matrix.md` dokumentiert. Nicht als verifiziert/freigegeben markierte Vergleichsoperatoren oder Rechtsdetails dürfen nicht in Produktivregeln übernommen werden.

## Datenversionierung

Mindestens Kältemitteldaten, GWP-Daten und Rechtsdaten besitzen einen eigenständigen Versionsstand. Gespeicherte Anlagen-Snapshots enthalten die verwendeten Datenversionen.

## Snapshot-Vertrag

Der F-Gase-Check erzeugt einen versionierten, serialisierbaren Anlagen-Snapshot. Der Snapshot ist eine unabhängige Kopie. Nachträgliche Änderungen im F-Gase-Check dürfen bereits erzeugte Snapshots nicht rückwirkend verändern. Ein späterer EN-378-Sicherheitscheck darf ausschließlich den Snapshot importieren und nicht auf den internen State von `f-gases-check` zugreifen.

## PDF-Vertrag

Der Ergebnisbericht nutzt die bestehende zentrale PDF-Infrastruktur. Eine zweite PDF-Engine oder ein paralleler Exportpfad wird nicht eingeführt.

## Persistenz

Saved Records und Projektpersistenz verwenden die bestehende Plattforminfrastruktur. Neue modulbezogene Speicherpfade außerhalb dieser Contracts sind unzulässig.

## Qualitäts- und Testanforderungen

Vor Freigabe müssen mindestens `npm test`, `npm run test:integration`, `npm run build`, relevante E2E-/manuelle Prüfungen, Modul-Contract- und Architekturprüfungen sowie Regressionen erfolgreich sein.

## Referenzen

- `docs/contracts/module-contract.md`
- `docs/contracts/state-contract.md`
- `docs/contracts/save-contract.md`
- `docs/contracts/render-contract.md`
- `docs/contracts/pdf-contract.md`
- `docs/adr/ADR-0009-f-gases-refrigerant-platform.md`
- `docs/engineering/f-gases-rule-matrix.md`
- `docs/engineering/f-gases-refrigerant-data.md`
