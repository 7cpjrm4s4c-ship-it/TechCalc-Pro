# F-Gases Check Contract

Status: Verbindliche Implementierungsgrundlage für Version 1.5.0  
Datum: 2026-08-26

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

Der fachliche Modulzustand ist ab Schema-Version 2 auf die Regelmatrix `docs/engineering/f-gases-rule-matrix.md` ausgerichtet. Er enthält nur Eingaben, die für mindestens eine der dort dokumentierten Prüfgruppen erforderlich sind.

Mindestens erfasst werden:

- Anlagenart und Aufstellung,
- konkrete Produkt-/Anlagenkategorie aus dem Kälte-/Klima-/Wärmepumpen-Kernscope von Anhang IV,
- Bauform und Nennleistung,
- Kältemittel und Füllmenge,
- Bewertungsdatum und Datum des erstmaligen Inverkehrbringens,
- zu prüfende Tätigkeit und Herkunft des Servicekältemittels,
- Status des Leckage-Erkennungssystems,
- hermetischer Verschluss und zugehörige Kennzeichnung,
- Kühlung von Erzeugnissen unter -50 °C,
- Standort- bzw. nationale Sicherheitsanforderung,
- Kaskaden-Primärkreislauf,
- spezifischer Kältemittelverlust,
- Sachkunde- und Unternehmenszertifizierungsstatus.

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

## Regeldaten

Jede regulatorische Regel besitzt mindestens:

- ID
- Rechtsquelle
- Versionsstand
- Gültigkeitsdatum
- Kategorien
- Bedingungen
- Meldungsschlüssel

Regeldefinitionen bleiben datengetrieben. Programmlogik wertet die Regeln aus, erfindet jedoch keine regulatorischen Inhalte.

Die fachliche Regelreferenz für Version 1.5.0 ist in `docs/engineering/f-gases-rule-matrix.md` dokumentiert. Die dortige vollständige Zerlegung von Anhang IV der Verordnung (EU) 2024/573 ist vor der produktiven Befüllung von `regulations.js` zu berücksichtigen. Nicht als verifiziert/freigegeben markierte Vergleichsoperatoren oder Rechtsdetails dürfen nicht in Produktivregeln übernommen werden.

## Datenversionierung

Mindestens folgende Datenbestände besitzen einen eigenständigen Versionsstand:

- Kältemitteldaten
- GWP-Daten
- Rechtsdaten

Gespeicherte Anlagen-Snapshots enthalten die verwendeten Datenversionen.

## Snapshot-Vertrag

Der F-Gase-Check erzeugt einen versionierten, serialisierbaren Anlagen-Snapshot. Dieser enthält mindestens die für die spätere Übergabe benötigten Anlagendaten, Kältemittel, Füllmenge und die verwendeten Datenversionen.

Der Snapshot ist eine unabhängige Kopie. Nachträgliche Änderungen im F-Gase-Check dürfen bereits erzeugte Snapshots nicht rückwirkend verändern. Ein späterer EN-378-Sicherheitscheck darf ausschließlich den Snapshot importieren und nicht auf den internen State von `f-gases-check` zugreifen.

## PDF-Vertrag

Der Ergebnisbericht nutzt die bestehende zentrale PDF-Infrastruktur. Modulbezogene PDF-Ausgabe wird über den vorhandenen Report-/PDF-Contract angebunden; eine zweite PDF-Engine oder ein paralleler Exportpfad wird nicht eingeführt.

## Persistenz

Saved Records und Projektpersistenz verwenden die bestehende Plattforminfrastruktur. Neue modulbezogene Speicherpfade außerhalb dieser Contracts sind unzulässig.

## Qualitäts- und Testanforderungen

Vor Freigabe müssen mindestens erfolgreich sein:

- `npm test`
- `npm run test:integration`
- `npm run build`
- relevante E2E- beziehungsweise manuelle Prüfungen für PWA, Mobile Input, Keyboard, PDF und Layout
- Modul-Contract- und Architekturprüfungen
- Regression der bestehenden Module

Zusätzlich sind Referenztests für CO2-Äquivalent, Regelbewertung, Datenversionierung, Snapshot-Unabhängigkeit und PDF-Reportmodell erforderlich.

## Fachliche Datenfreigabe

Die konkrete Befüllung von `gwp.js` und `regulations.js` ist erst zulässig, wenn die verwendeten Werte, Rechtsquellen, Gültigkeitsstände und Aktualisierungsdaten nachvollziehbar belegt und für Version 1.5.0 freigegeben sind.

Bis dahin gilt für nicht belegte fachliche Inhalte: Nicht spezifiziert.

## Referenzen

- `docs/contracts/module-contract.md`
- `docs/contracts/state-contract.md`
- `docs/contracts/save-contract.md`
- `docs/contracts/render-contract.md`
- `docs/contracts/pdf-contract.md`
- `docs/adr/ADR-0009-f-gases-refrigerant-platform.md`
- `docs/engineering/f-gases-rule-matrix.md`
- `js/core/registry.js`
- `js/core/app.js`
- `js/platform/moduleRuntime/index.js`
- `js/platform/savedRecordModel/index.js`
- `js/shared/rainwaterSurfaceSnapshot.js`
