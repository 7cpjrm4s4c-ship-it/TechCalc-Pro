# F-Gases Check – Regelmatrix

Status: Fachliche Implementierungsreferenz für Version 1.5.0  
Stand: 2026-08-27  
Geltungsbereich: Regulatorische Bewertung des Moduls `f-gases-check`

## Zweck

Diese Matrix überführt die für Version 1.5.0 bereitgestellten Rechts- und Fachdokumente in nachvollziehbare, atomare Prüfthemen. Sie ist fachliche Referenz für `js/utils/refrigerants/regulations.js` und die spätere Auswertung über `refrigerant-service.js`.

Die Matrix enthält keine Programmlogik. Bei Abweichungen zwischen dieser Referenz und einer Rechtsquelle ist die Rechtsquelle maßgeblich.

## Quellenstand

| Kürzel | Quelle | Stand |
|---|---|---|
| EU-FGAS | Verordnung (EU) 2024/573 des Europäischen Parlaments und des Rates vom 7. Februar 2024 über fluorierte Treibhausgase | ABl. L vom 20.2.2024 |
| DE-CHEMG | Fünftes Gesetz zur Änderung des Chemikaliengesetzes vom 29. März 2026 | BGBl. 2026 I Nr. 86 |
| DE-CHEMKLIMA | Chemikalien-Klimaschutzverordnung vom 14. April 2026 | BGBl. 2026 I Nr. 100 |
| UBA-GWP | UBA-Liste der Treibhauspotentiale mit AR4-, AR5- und VO-2024/573-Werten | Stand März 2026 |

## Implementierungsreferenz

Die Kernregeln FG-010 bis FG-080 und die vollständige atomare Zerlegung von Anhang IV AIV-001 bis AIV-021 sind im Rechtsdatenbestand `js/utils/refrigerants/regulations.js` mit Rechtsquelle, Datenversion, Gültigkeitsdatum, Kategorien, deklarativen Bedingungen und Meldungsschlüssel hinterlegt.

Die vollständige fachliche Auswertung bleibt Aufgabe der Service-/Fachlogik; `regulations.js` enthält ausschließlich Daten.

## Verifikation Anhang IV Nr. 7d

Die bereitgestellte amtliche deutsche Fassung wurde erneut geprüft. Der Wortlaut lautet für ortsfeste Kühler mit einer Nennleistung von über 12 kW ausdrücklich „fluorierte Treibhausgase mit einem GWP von 750“ und enthält weder „oder mehr“ noch einen anderen Vergleichsoperator.

Der Wortlaut ist damit verifiziert, der für eine automatische Schwellenprüfung erforderliche Vergleichsoperator jedoch aus der bereitgestellten Quelle **nicht eindeutig ableitbar**. AIV-007D wird deshalb in `regulations.js` mit `automationStatus: 'manual-review'` und `operator: 'source-wording-only'` geführt. Eine automatische Verbotsentscheidung aus dieser Regel ist unzulässig, bis eine eindeutige Rechtsgrundlage vorliegt.

## Anhang-IV-Kernscope des Moduls

Für das Modul `f-gases-check` werden die Anhang-IV-Nummern 2 bis 10 fachlich unterstützt. Die Nummern 11 bis 21 sind Bestandteil des vollständigen Rechtsdatenbestands, werden aber als `platform-only` gekennzeichnet und nicht als unterstützte Kälte-/Klima-/Wärmepumpen-Anlagenarten angeboten.

## Eingabeanforderungen

Für eine spätere automatische Auswertung werden abhängig von der Regel insbesondere benötigt:

- Produkt-/Anlagenkategorie,
- Anlagenart und Aufstellung,
- Bauform,
- Nennleistung,
- Stoffgruppe/Anhangszuordnung,
- GWP,
- Füllmenge,
- Bewertungsdatum,
- Datum des erstmaligen Inverkehrbringens,
- Herkunft des Servicekältemittels,
- Leckage-Erkennungssystem,
- hermetischer Status und Kennzeichnung,
- Kühlung unter -50 °C,
- Standort- bzw. nationale Sicherheitsanforderungen,
- Kaskaden-Primärkreislauf,
- spezifischer Kältemittelverlust,
- Sachkunde- und Unternehmenszertifizierungsstatus.

Einzelne vollständige Anhang-IV-Regeln benötigen zusätzlich Merkmale, die im Kernscope derzeit nicht in der UI vorhanden sind. Diese bleiben Rechtsdaten und werden erst dann als Moduleingaben ergänzt, wenn sie für den vereinbarten Modulumfang tatsächlich erforderlich sind.

## Datenversion

Rechtsdaten-Version: `1.0.0`  
Aktualisierungsdatum: `2026-08-27`
