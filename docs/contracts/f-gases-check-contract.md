# F-Gases Check Contract

Status: Verbindliche Implementierungsgrundlage für Version 1.5.0  
Stand: 2026-08-27

## Scope
Das Modul bewertet regulatorische Anforderungen für Kälte-, Klima- und Wärmepumpenanlagen. EN-378-Sicherheitsbewertungen bleiben ausgeschlossen.

## State-Contract
Schema-Version 4 ergänzt `mobileEquipmentType` für den Anwendungsbereich mobiler Einrichtungen nach Art. 5 Abs. 3 VO (EU) 2024/573 und `installedAtSiteDate` für die deutschen Grenzwerte des spezifischen Kältemittelverlusts nach § 2 ChemKlimaschutzV. Das Datum des erstmaligen Inverkehrbringens bleibt davon getrennt.

## Regulatorische Auswertung
Die Rule-Engine liefert mindestens:
- Inverkehrbringungsprüfung einschließlich Anhang-IV-Verbotsdatum und Altprodukt-Nachweis,
- Serviceprüfung,
- Dichtheitskontrollpflicht und Intervall,
- Pflicht eines Leckage-Erkennungssystems,
- Dokumentationspflichten,
- Zertifizierung,
- deutsche Betreiberpflichten einschließlich spezifischem Kältemittelverlust.

Fehlende rechtlich notwendige Eingaben führen zu `incomplete`/`unresolved`, niemals zu einer unterstellten Freigabe. AIV-007D bleibt wegen des nicht eindeutigen Vergleichsoperators `manual-review`.

## Dichtheitskontrolle
Art. 5 Abs. 1 wird für Anhang-I-Gase ab 5 t CO2-Äquivalent und Anhang-II-Gruppe-1-Gase ab 1 kg ausgewertet. Die gekennzeichnete hermetische Ausnahme (<10 t CO2-Äquivalent bzw. <2 kg) wird berücksichtigt. Intervalle nach Art. 5 Abs. 6 und die Verdopplung bei vorhandenem Leckage-Erkennungssystem werden berechnet. Für mobile Einrichtungen nach Art. 5 Abs. 3 Buchst. b und c gilt die Übergangsregel bis einschließlich 12.03.2027.

## Dokumentation
Bei Dichtheitskontrollpflicht wird die Aufzeichnungspflicht nach Art. 7 mit fünfjähriger Aufbewahrung ausgewiesen. Für rechtmäßig vor dem jeweiligen Anhang-IV-Verbotsdatum in Verkehr gebrachte Altprodukte wird der Nachweis nach Art. 11 Abs. 1 erst ab einem Jahr nach dem einschlägigen Verbotsdatum ausgewiesen. Die deutsche Erklärungspflicht nach § 12i Abs. 2 ChemG wird separat ausgewiesen.

## Betreiberpflichten Deutschland
§ 2 ChemKlimaschutzV wird anhand Anlagenart, Aufstellung, Füllmenge, Errichtungsdatum am Aufstellungsort und hermetischem Status ausgewertet. Für in sich geschlossene Kälteanlagen ab 3 kg gilt 1 %. Im Übrigen gelten die zeit- und füllmengenabhängigen Staffeln. § 14 wird für Dichtheitskontrollen, Rückgewinnung und übertragene Tätigkeiten über die vorhandenen Zertifizierungsstatus berücksichtigt. Die Zugangspflicht zu lösbaren Verbindungen wird als Pflicht ausgewiesen, soweit sie technisch möglich und zumutbar ist.

## Plattform
Kältemittel-, GWP- und Rechtsdaten werden ausschließlich über `js/utils/refrigerants/refrigerant-service.js` bzw. `index.js` genutzt. Snapshot-, Persistenz-, PDF- und Modul-Runtime-Infrastruktur bleiben unverändert und werden wiederverwendet.
