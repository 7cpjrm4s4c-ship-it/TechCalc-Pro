# F-Gases Check – Regelmatrix

Status: Fachliche Implementierungsreferenz für Version 1.5.0  
Stand: 2026-08-26  
Geltungsbereich: Regulatorische Bewertung des Moduls `f-gases-check`

## Zweck

Diese Matrix überführt die für Version 1.5.0 bereitgestellten Rechts- und Fachdokumente in nachvollziehbare, atomare Prüfthemen. Sie ist fachliche Referenz für die spätere Befüllung von `js/utils/refrigerants/regulations.js` und für die Auswertung über `refrigerant-service.js`.

Die Matrix enthält keine Programmlogik. Bei Abweichungen zwischen dieser Referenz und einer Rechtsquelle ist die Rechtsquelle maßgeblich. Nicht verifizierte Inhalte dürfen nicht als produktive Regel übernommen werden.

## Quellenstand

| Kürzel | Quelle | Stand |
|---|---|---|
| EU-FGAS | Verordnung (EU) 2024/573 des Europäischen Parlaments und des Rates vom 7. Februar 2024 über fluorierte Treibhausgase | ABl. L vom 20.2.2024 |
| DE-CHEMG | Fünftes Gesetz zur Änderung des Chemikaliengesetzes vom 29. März 2026 | BGBl. 2026 I Nr. 86 |
| DE-CHEMKLIMA | Chemikalien-Klimaschutzverordnung vom 14. April 2026 | BGBl. 2026 I Nr. 100 |
| UBA-GWP | UBA-Liste der Treibhauspotentiale mit AR4-, AR5- und VO-2024/573-Werten | Stand März 2026 |

## Kernregelmatrix

| ID | Thema | Rechtsreferenz | Atomare Bedingung / Wirkung |
|---|---|---|---|
| FG-001 | GWP-Datenbasis | EU-FGAS Anhänge I/II/VI; UBA-GWP | Regulatorisch maßgeblichen GWP-Wert getrennt von AR4/AR5 führen. |
| FG-002 | GWP von Gemischen | EU-FGAS Anhang VI | GWP eines Gemischs nach den in Anhang VI festgelegten Anteilen und Referenzwerten bestimmen. |
| FG-003 | CO2-Äquivalent | EU-FGAS, Definitionen und mengenbezogene Schwellen | Füllmenge und regulatorischer GWP bilden die Grundlage für CO2-Äquivalent-Prüfungen. |
| FG-010 | Dichtheitskontrolle Grundpflicht | EU-FGAS Art. 5 Abs. 1 | Anhang-I-Gase ab 5 t CO2-Äquivalent; Anhang-II-Gruppe-1 ab 1 kg. |
| FG-011 | Hermetische Ausnahme Dichtheitskontrolle | EU-FGAS Art. 5 Abs. 1 | Bei ordnungsgemäß gekennzeichneten hermetisch geschlossenen Einrichtungen gelten die dort genannten höheren Freigrenzen. |
| FG-012 | Dichtheitsintervall niedrig | EU-FGAS Art. 5 Abs. 6 Buchst. a | Unter 50 t CO2-Äquivalent bzw. unter 10 kg: 12 Monate, mit Leckage-Erkennungssystem 24 Monate. |
| FG-013 | Dichtheitsintervall mittel | EU-FGAS Art. 5 Abs. 6 Buchst. b | 50 bis unter 500 t CO2-Äquivalent bzw. 10 bis unter 100 kg: 6 Monate, mit Leckage-Erkennungssystem 12 Monate. |
| FG-014 | Dichtheitsintervall hoch | EU-FGAS Art. 5 Abs. 6 Buchst. c | Ab 500 t CO2-Äquivalent bzw. ab 100 kg: 3 Monate, mit Leckage-Erkennungssystem 6 Monate. |
| FG-015 | Betroffene Einrichtungen | EU-FGAS Art. 5 Abs. 2 und 3 | Anlagenart und stationär/mobil bestimmen die Anwendbarkeit. |
| FG-016 | Leckage-Erkennungssystem | EU-FGAS Art. 6 Abs. 1 | Für die erfassten ortsfesten Einrichtungen ab 500 t CO2-Äquivalent Anhang I bzw. 100 kg Anhang-II-Gruppe-1. |
| FG-017 | Prüfung Leckage-Erkennungssystem | EU-FGAS Art. 6 Abs. 3 | Für die erfassten Anlagen mindestens alle 12 Monate. |
| FG-020 | Anlagenaufzeichnungen | EU-FGAS Art. 7 | Bei dichtheitskontrollpflichtigen Einrichtungen Aufzeichnungen führen und grundsätzlich fünf Jahre aufbewahren. |
| FG-030 | Serviceverbot Kälte | EU-FGAS Art. 13 Abs. 3 | Ab 1.1.2025 F-Gase mit GWP >= 2500 zur Wartung/Instandhaltung von Kälteanlagen grundsätzlich verboten. |
| FG-031 | Serviceausnahmen Kälte | EU-FGAS Art. 13 Abs. 3 | Bis 1.1.2030 gelten definierte Ausnahmen für aufgearbeitete bzw. recycelte Gase; Herkunft und Kennzeichnung sind regelrelevant. |
| FG-032 | Serviceverbot Klima/Wärmepumpe | EU-FGAS Art. 13 Abs. 4 | Ab 1.1.2026 Anhang-I-Gase mit GWP >= 2500 zur Wartung/Instandhaltung von Klimaanlagen und Wärmepumpen grundsätzlich verboten. |
| FG-033 | Serviceausnahmen Klima/Wärmepumpe | EU-FGAS Art. 13 Abs. 4 | Bis 1.1.2032 gelten definierte Ausnahmen für aufgearbeitete bzw. recycelte Gase; Herkunft und Kennzeichnung sind regelrelevant. |
| FG-040 | Inverkehrbringen | EU-FGAS Art. 11 Abs. 1 i. V. m. Anhang IV | Produkt-/Anlagenkategorie, Gasgruppe, GWP, Leistung, Datum und Ausnahmen bestimmen das Verbot. |
| FG-045 | Nachweis Altprodukt | EU-FGAS Art. 11 Abs. 1 Unterabs. 3 | Ein Jahr nach dem jeweiligen Verbotsdatum ist bei weiterer Lieferung/Bereitstellung der Nachweis des rechtmäßigen früheren Inverkehrbringens erforderlich. |
| FG-046 | Deutsche Altprodukt-Erklärung | DE-CHEMG § 12i Abs. 2 | Bei Abgabe eines rechtmäßig vor dem Verbotsdatum in Verkehr gebrachten Produkts Erklärung mit Abgeber, Bestätigung und Identifikationsmerkmalen übermitteln. |
| FG-047 | Erwerb unzulässig in Verkehr gebrachter Produkte | DE-CHEMG § 12i Abs. 1 | Erwerb solcher Produkte/Einrichtungen verboten; für betroffene Behälter zusätzlich Lager-/Entleerungsverbot, ausgenommen Rückgabe/Entsorgung. |
| FG-050 | Sachkunde natürliche Person | EU-FGAS Art. 10; DE-CHEMKLIMA § 5 | Tätigkeitsbezogene Sachkunde ist regelrelevant. |
| FG-051 | Unternehmenszertifikat | EU-FGAS Art. 10; DE-CHEMKLIMA § 10 | Für erfasste Unternehmen ist das entsprechende Unternehmenszertifikat regelrelevant. |
| FG-052 | Betreiberprüfung Auftragnehmer | DE-CHEMKLIMA § 14 Abs. 1 | Betreiber muss erforderliche Sachkunde bzw. Unternehmenszertifizierung des beauftragten Unternehmens sicherstellen. |
| FG-053 | Qualifikation Dichtheitskontrolle | DE-CHEMKLIMA § 14 Abs. 2 | Dichtheitskontrolle und dort referenzierte Prüfung nur durch entsprechend sachkundige natürliche Person. |
| FG-054 | Qualifikation Rückgewinnung | DE-CHEMKLIMA § 14 Abs. 3 | Rückgewinnung nur durch entsprechend sachkundige natürliche Person. |
| FG-055 | Verkauf/Kauf F-Gase | DE-CHEMKLIMA § 15 | Verkauf für die erfassten Zwecke nur an sachkundige Personen bzw. Unternehmen mit sachkundigem Personal. |
| FG-060 | Spezifischer Kältemittelverlust DE | DE-CHEMKLIMA § 2 Abs. 1 | Grenzwert hängt von Bau-/Errichtungszeitraum, Füllmenge und Anlagenart ab. |
| FG-061 | In sich geschlossene Kälteanlage DE | DE-CHEMKLIMA § 2 Abs. 1 Nr. 1 | Ab 3 kg Füllmenge maximal 1 % spezifischer Kältemittelverlust. |
| FG-062 | Hermetische Ausnahme DE | DE-CHEMKLIMA § 2 Abs. 3 | § 2 Abs. 1 und 2 gelten nicht für entsprechend gekennzeichnete hermetisch geschlossene Einrichtungen. |
| FG-063 | Zugang lösbare Verbindungen DE | DE-CHEMKLIMA § 2 Abs. 2 | Betreiber muss Zugang sicherstellen, soweit technisch möglich und zumutbar. |
| FG-070 | Vorbefüllte Einrichtungen | EU-FGAS Art. 19; DE-CHEMG § 12k | Quotenabdeckung und Konformitätsanforderungen sind für vorbefüllte Einrichtungen gesondert zu bewerten. |
| FG-071 | Quotenrechtmäßigkeit HFKW | EU-FGAS Kap. IV; DE-CHEMG § 12j | Unter Verstoß gegen die Quotenregeln in Verkehr gebrachte HFKW dürfen nicht entsprechend bereitgestellt, abgegeben oder erworben werden. |
| FG-080 | Rechtsstand / Bewertungsdatum | EU-FGAS Art. 37 und 38 | Jede zeitabhängige Regel benötigt ein Bewertungsdatum und einen nachvollziehbaren Gültigkeitsstand. |

## Anhang IV – vollständige atomare Zerlegung

Rechtsbasis für alle nachfolgenden Regeln ist EU-FGAS Art. 11 Abs. 1 i. V. m. Anhang IV. Die Seitenangaben beziehen sich auf die bereitgestellte Amtsblattfassung, Seiten 54–57 von 67.

### Allgemeine Wirkungen von Artikel 11

- Das Inverkehrbringen der in Anhang IV erfassten Erzeugnisse und Einrichtungen einschließlich Teilen ist ab dem jeweiligen Datum verboten; Militärausrüstung ist ausgenommen.
- Reparatur- und Wartungsteile für bestehende, in Anhang IV erfasste Einrichtungen dürfen in Verkehr gebracht werden, sofern dadurch weder Leistung noch F-Gas-Menge erhöht noch auf ein Gas mit höherem GWP gewechselt wird.
- Rechtswidrig nach dem Verbotsdatum in Verkehr gebrachte Produkte dürfen anschließend grundsätzlich weder verwendet noch geliefert/bereitgestellt noch ausgeführt werden; die Verordnung enthält geregelte Sonderfälle für Wiederausfuhr und Entsorgung.
- Ein Jahr nach dem jeweiligen Verbotsdatum ist die weitere Lieferung/Bereitstellung rechtmäßig vor dem Verbot in Verkehr gebrachter Produkte nur mit Nachweis des früheren rechtmäßigen Inverkehrbringens zulässig.
- Artikel 11 Abs. 2 enthält eine gesonderte Ökodesign-Ausnahme.
- Artikel 13 Abs. 19 erweitert für bestimmte Anhang-IV-Positionen die Wirkung auf Inbetriebnahme oder Verwendung nach dem Verbotsdatum, sofern nicht die dort geregelten Nachweise greifen.

### Atomare Verbotsregeln

| Rule-ID | Anhang IV | Kategorie | Bedingung | Verbotsdatum | Ausnahme / Besonderheit | Relevanz 1.5.0 |
|---|---|---|---|---|---|---|
| AIV-001 | 1 | Nicht wieder auffüllbare Behälter | Anhang-I-F-Gase; Einsatz für Wartung/Instandhaltung/Befüllung von Kälte, Klima, WP, Brandschutz, Schaltanlagen oder als Lösungsmittel | 2007-07-04 | Definition nicht wieder auffüllbarer Behälter in Fußnote; Art. 11 Abs. 3 erweitert Verbot | Kernregel |
| AIV-002A | 2a | Haushaltskühl-/gefriergeräte | HFKW, GWP >= 150 | 2015-01-01 | keine Anhang-IV-Ausnahme genannt | Kernregel Kälte |
| AIV-002B | 2b | Haushaltskühl-/gefriergeräte | fluorierte Treibhausgase | 2026-01-01 | Standort-Sicherheitsanforderung | Kernregel Kälte |
| AIV-003A | 3a | Gewerbliche Kühl-/Gefriergeräte, in sich geschlossen | HFKW, GWP >= 2500 | 2020-01-01 | keine Anhang-IV-Ausnahme genannt | Kernregel Kälte |
| AIV-003B | 3b | Gewerbliche Kühl-/Gefriergeräte, in sich geschlossen | HFKW, GWP >= 150 | 2022-01-01 | keine Anhang-IV-Ausnahme genannt | Kernregel Kälte |
| AIV-003C | 3c | Gewerbliche Kühl-/Gefriergeräte, in sich geschlossen | andere fluorierte Treibhausgase, GWP >= 150 | 2025-01-01 | Stoffgruppe ist ausdrücklich „andere“ F-Gase | Kernregel Kälte |
| AIV-004 | 4 | In sich geschlossene Kälteanlagen außer Kühler | fluorierte Treibhausgase, GWP >= 150 | 2025-01-01 | Standort-Sicherheitsanforderung | Kernregel Kälte |
| AIV-005A | 5a | Sonstige Kälteanlagen außer Kühler/Nr. 4/Nr. 6 | HFKW, GWP >= 2500 | 2020-01-01 | Kühlung von Erzeugnissen unter -50 °C ausgenommen | Kernregel Kälte |
| AIV-005B | 5b | Sonstige Kälteanlagen außer Kühler/Nr. 4/Nr. 6 | fluorierte Treibhausgase, GWP >= 2500 | 2025-01-01 | Kühlung von Erzeugnissen unter -50 °C ausgenommen | Kernregel Kälte |
| AIV-005C | 5c | Sonstige Kälteanlagen außer Kühler/Nr. 4/Nr. 6 | fluorierte Treibhausgase, GWP >= 150 | 2030-01-01 | Standort-Sicherheitsanforderung | Kernregel Kälte |
| AIV-006 | 6 | Mehrteilige zentralisierte gewerbliche Kälteanlage | Nennleistung >= 40 kW; Anhang-I-F-Gase, GWP >= 150 | 2022-01-01 | Primärer Kältemittelkreislauf eines Kaskadensystems: F-Gase mit GWP < 1500 zulässig | Kernregel Kälte |
| AIV-007A | 7a | Ortsfeste Kühler | HFKW, GWP >= 2500 | 2020-01-01 | Kühlung von Produkten unter -50 °C ausgenommen | Kernregel Kälte |
| AIV-007B | 7b | Ortsfeste Kühler | Nennleistung <= 12 kW; F-Gase, GWP >= 150 | 2027-01-01 | Standort-Sicherheitsanforderung | Kernregel Kälte |
| AIV-007C | 7c | Ortsfeste Kühler | Nennleistung <= 12 kW; fluorierte Treibhausgase | 2032-01-01 | Standort-Sicherheitsanforderung | Kernregel Kälte |
| AIV-007D | 7d | Ortsfeste Kühler | Nennleistung > 12 kW; F-Gase; Quelltext: „GWP von 750“ | 2027-01-01 | Standort-Sicherheitsanforderung; Vergleichsoperator vor produktiver Kodierung erneut anhand amtlicher Fassung verifizieren | Kernregel Kälte |
| AIV-008A | 8a | In sich geschlossene Klima-/WP-Systeme außer Kühler | portable/steckerfertige Raumklimageräte; HFKW, GWP >= 150 | 2020-01-01 | keine Anhang-IV-Ausnahme genannt | Kernregel Klima |
| AIV-008B | 8b | In sich geschlossene Klima-/WP-Systeme außer Kühler | steckerfertig/Monoblock/andere in sich geschlossene Systeme; Nennleistung <= 12 kW; F-Gase, GWP >= 150 | 2027-01-01 | Standort-Sicherheit; wenn GWP < 150 sicherheitstechnisch nicht zulässig, GWP-Höchstwert 750 | Kernregel Klima/WP |
| AIV-008C | 8c | In sich geschlossene Klima-/WP-Systeme außer Kühler | steckerfertig/Monoblock/andere in sich geschlossene Systeme; Nennleistung <= 12 kW; F-Gase | 2032-01-01 | Standort-Sicherheit; wenn Alternativen zu F-Gasen nicht zulässig, GWP-Höchstwert 750 | Kernregel Klima/WP |
| AIV-008D | 8d | Monoblock/andere in sich geschlossene Klima-/WP-Systeme | Nennleistung > 12 kW und <= 50 kW; F-Gase, GWP >= 150 | 2027-01-01 | Standort-Sicherheit; wenn GWP < 150 nicht zulässig, GWP-Höchstwert 750 | Kernregel Klima/WP |
| AIV-008E | 8e | Andere in sich geschlossene Klima-/WP-Systeme | F-Gase, GWP >= 150 | 2030-01-01 | Standort-Sicherheit; wenn GWP < 150 nicht zulässig, GWP-Höchstwert 750 | Kernregel Klima/WP |
| AIV-009A | 9a | Split-Klima-/Split-WP | Mono-Split; Anhang-I-F-Gase, GWP >= 750; Füllmenge < 3 kg | 2025-01-01 | keine Anhang-IV-Ausnahme genannt | Kernregel Klima/WP |
| AIV-009B | 9b | Split-Klima-/Split-WP | Luft-Wasser; Nennleistung <= 12 kW; F-Gase, GWP >= 150 | 2027-01-01 | Standort-Sicherheitsanforderung | Kernregel Klima/WP |
| AIV-009C | 9c | Split-Klima-/Split-WP | Luft-Luft; Nennleistung <= 12 kW; F-Gase, GWP >= 150 | 2029-01-01 | Sicherheitsnormen am Standort | Kernregel Klima/WP |
| AIV-009D | 9d | Split-Klima-/Split-WP | Nennleistung <= 12 kW; fluorierte Treibhausgase | 2035-01-01 | Standort-Sicherheitsanforderung | Kernregel Klima/WP |
| AIV-009E | 9e | Split-Klima-/Split-WP | Nennleistung > 12 kW; F-Gase, GWP >= 750 | 2029-01-01 | Standort-Sicherheitsanforderung | Kernregel Klima/WP |
| AIV-009F | 9f | Split-Klima-/Split-WP | Nennleistung > 12 kW; F-Gase, GWP >= 150 | 2033-01-01 | Standort-Sicherheitsanforderung | Kernregel Klima/WP |
| AIV-010 | 10 | Nichtgeschlossene Direktverdampfungssysteme | HFKW oder FKW als Kältemittel | 2007-07-04 | keine Anhang-IV-Ausnahme genannt | Kernregel Kälte |
| AIV-011A | 11a | Brandschutzeinrichtungen | FKW enthalten | 2007-07-04 | keine Anhang-IV-Ausnahme genannt | Plattformregel, außerhalb Modul-Kernscope |
| AIV-011B | 11b | Brandschutzeinrichtungen | HFKW-23 enthalten | 2016-01-01 | keine Anhang-IV-Ausnahme genannt | Plattformregel, außerhalb Modul-Kernscope |
| AIV-011C | 11c | Brandschutzeinrichtungen | Anhang-I-F-Gase enthalten/benötigen | 2025-01-01 | Standort-Sicherheitsanforderung | Plattformregel, außerhalb Modul-Kernscope |
| AIV-012 | 12 | Wohnhausfenster | Anhang-I-F-Gase enthalten | 2007-07-04 | keine Anhang-IV-Ausnahme genannt | Plattformregel, außerhalb Modul-Kernscope |
| AIV-013 | 13 | Sonstige Fenster | Anhang-I-F-Gase enthalten | 2008-07-04 | keine Anhang-IV-Ausnahme genannt | Plattformregel, außerhalb Modul-Kernscope |
| AIV-014 | 14 | Fußbekleidung | Anhang-I-F-Gase enthalten | 2006-07-04 | keine Anhang-IV-Ausnahme genannt | Plattformregel, außerhalb Modul-Kernscope |
| AIV-015 | 15 | Reifen | Anhang-I-F-Gase enthalten | 2007-07-04 | keine Anhang-IV-Ausnahme genannt | Plattformregel, außerhalb Modul-Kernscope |
| AIV-016 | 16 | Einkomponentenschäume | Anhang-I-F-Gase, GWP >= 150 | 2008-07-04 | nationale Sicherheitsnormen | Plattformregel, außerhalb Modul-Kernscope |
| AIV-017A | 17a | Schäume – XPS | HFKW, GWP >= 150 | 2020-01-01 | nationale Sicherheitsnormen | Plattformregel, außerhalb Modul-Kernscope |
| AIV-017B | 17b | Schäume – nicht XPS | HFKW, GWP >= 150 | 2023-01-01 | nationale Sicherheitsnormen | Plattformregel, außerhalb Modul-Kernscope |
| AIV-017C | 17c | Schäume | fluorierte Treibhausgase | 2033-01-01 | Sicherheitsanforderungen | Plattformregel, außerhalb Modul-Kernscope |
| AIV-018 | 18 | Unterhaltungs-/Dekorationsaerosole und Signalhörner | erfasste Aerosolgeneratoren/Signalhörner; HFKW, GWP >= 150 | 2009-07-04 | Bezug auf Anhang XVII Ziff. 40 VO (EG) Nr. 1907/2006 | Plattformregel, außerhalb Modul-Kernscope |
| AIV-019A | 19a | Technische Aerosole | HFKW, GWP >= 150 | 2018-01-01 | nationale Sicherheitsstandards oder medizinische Anwendung | Plattformregel, außerhalb Modul-Kernscope |
| AIV-019B | 19b | Technische Aerosole | fluorierte Treibhausgase | 2030-01-01 | Sicherheitsanforderungen oder medizinische Zwecke | Plattformregel, außerhalb Modul-Kernscope |
| AIV-020 | 20 | Körperpflegeprodukte | fluorierte Treibhausgase enthalten | 2025-01-01 | keine Anhang-IV-Ausnahme genannt | Plattformregel, außerhalb Modul-Kernscope |
| AIV-021 | 21 | Hautkühlungseinrichtungen | F-Gase, GWP >= 150, enthalten/benötigen | 2025-01-01 | medizinische Zwecke | Plattformregel, außerhalb Modul-Kernscope |

### Fußnote zu Kategorie 9

Ortsfeste Zweikanal-Wärmepumpen und -Klimaanlagen gelten für die Verordnung als Splitsysteme und unterliegen den Anforderungen der Nummer 9.

## Querverknüpfungen und Ausnahmen

### Sicherheitsausnahmen und Kennzeichnung

Artikel 12 Abs. 15 nennt ausdrücklich die Anhang-IV-Positionen 2b, 4, 5c, 7b–d, 8b–e, 9b–f, 11c, 16, 17a–c und 19a–b für eine Kennzeichnung im Zusammenhang mit Sicherheitsanforderungen bzw. nationalen Sicherheitsnormen. Nummern 19 und 21 besitzen zusätzlich medizinische Anwendungsbezüge.

Für das Datenmodell folgt daraus: Eine Ausnahme darf nicht als generisches `isException` gespeichert werden. Mindestens der Ausnahmetyp (`siteSafety`, `nationalSafetyStandard`, `medicalUse`, `belowMinus50C`, `cascadePrimaryCircuit`, `ecodesign`, `preBanPlacedOnMarket`) und der erforderliche Nachweis müssen unterscheidbar sein.

### Inbetriebnahme / Verwendung nach Verbotsdatum

Artikel 13 Abs. 19 erfasst ausdrücklich die Positionen 2b, 4, 5c, 7b–d, 8b–e, 9b–f, 11c, 17c und 19b. Nach dem jeweiligen Verbotsdatum ist dort auch die Inbetriebnahme oder Verwendung verboten, sofern der Betreiber nicht nachweist, dass niedrigere GWP-Werte wegen einschlägiger Standort-Sicherheitsanforderungen nicht zulässig sind oder dass die Einrichtung vor dem Verbotsdatum in Verkehr gebracht wurde. Nachweise sind nach Art. 13 Abs. 20 mindestens fünf Jahre aufzubewahren.

### Deutsche Ergänzung

DE-CHEMG § 12i ergänzt die unionsrechtliche Anhang-IV-Systematik für Deutschland insbesondere um das Erwerbsverbot für rechtswidrig in Verkehr gebrachte Erzeugnisse/Einrichtungen und um die Erklärungspflicht bei Weitergabe rechtmäßig vor dem Verbotsdatum in Verkehr gebrachter Altprodukte.

## Auswertung für Version 1.5.0

Die Anhang-IV-Regeln können nicht korrekt allein aus `refrigerant + gwp + chargeKg + date` ausgewertet werden. Für die Kernkategorien Kälte, Klima und Wärmepumpe sind mindestens folgende fachliche Merkmale erforderlich:

- konkrete Anhang-IV-Anlagenkategorie und Unterkategorie,
- Bauform: in sich geschlossen / Split / Mono-Split / Monoblock / zentralisiert / Kaskade,
- Nennleistung in kW,
- Kältemittel-Stoffgruppe bzw. Anhangszuordnung,
- regulatorischer GWP,
- Füllmenge in kg, soweit eine Regel sie verwendet,
- Bewertungsdatum,
- Datum des erstmaligen Inverkehrbringens,
- Anwendung zur Kühlung von Erzeugnissen unter -50 °C,
- Standort-Sicherheitsanforderung bzw. nationale Sicherheitsnorm einschließlich Nachweisstatus,
- medizinischer Verwendungszweck, sofern die Produktkategorie dies zulässt,
- Kaskaden-Primärkreislauf, soweit Nummer 6 betroffen ist.

Die Regeln 1–10 sind für den fachlichen Kern des F-Gase-Checks unmittelbar relevant. Die Nummern 11–21 gehören vollständig zum Rechtsdatenbestand von Anhang IV, liegen aber außerhalb des im Modulvertrag beschriebenen Kälte-/Klima-/Wärmepumpen-Kernscopes. Sie dürfen deshalb nicht stillschweigend über die UI als unterstützte Anlagenarten angeboten werden. Ihre Ablage als Rechtsdaten ist von ihrer tatsächlichen Auswertung im Modul zu trennen.

## Anforderungen an die spätere Datenrepräsentation

Jede atomare Anhang-IV-Regel benötigt mindestens:

- stabile Regel-ID,
- Rechtsquelle und Fundstelle,
- Rechtsdaten-Version,
- Verbotsdatum,
- Kategorie und Unterkategorie,
- betroffene Stoffgruppe,
- optionalen GWP-Vergleich,
- optionalen Leistungsbereich,
- optionalen Füllmengenbereich,
- optionale Ausnahmetatbestände,
- Wirkungsart (`placingOnMarket`, ggf. zusätzlich `commissioningOrUse`),
- Meldungsschlüssel.

Die konkrete Objektstruktur in `regulations.js` wird erst festgelegt, nachdem sie gegen bestehende Service- und Contract-Muster im Repository geprüft wurde. Diese Matrix erfindet daher keine neue öffentliche API.

## Offener Verifikationspunkt

Anhang IV Nr. 7d wird in der bereitgestellten deutschen Fassung als „fluorierte Treibhausgase mit einem GWP von 750 bei Kühlern mit einer Nennleistung von über 12 kW“ wiedergegeben. Anders als zahlreiche Nachbarregeln enthält der extrahierte Wortlaut kein „oder mehr“. Vor der produktiven Kodierung des Vergleichsoperators ist diese Stelle nochmals direkt gegen die amtliche Fassung zu verifizieren. Bis dahin gilt der Operator für AIV-007D als **nicht freigegeben**.

## Implementierungsfreigabe

Diese Dokumentation referenziert die fachlichen Regeln. Sie ist noch keine Freigabe zur Befüllung von `regulations.js`. Vor der Implementierung sind insbesondere der offene Punkt AIV-007D sowie die endgültigen Eingabefelder/Contracts gegen den aktuellen Repository-Stand zu prüfen.
